<template>
  <Header :showButtons="false" :isTransparent="true" />
  <WeatherInfo @windDirectionChanged="updateWindDirection" />
  <Popup v-if="isPopupVisible" />
  <div id="map" class="map"></div>
</template>

<script>
import Header from "./Header.vue";
import WeatherInfo from "./WeatherInfo.vue";
import Popup from "./Popup.vue";

import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleGeom } from "ol/geom";
import Feature from "ol/Feature";
import { fromLonLat } from "ol/proj";
import { Style, Fill } from "ol/style";
import { Polygon } from "ol/geom";
import { API_BASE_URL } from "../api/config";

export default {
  name: "MapComponent",
  components: {
    Header,
    WeatherInfo,
    Popup,
  },
  data() {
    return {
      enterprisesData: [],
      map: null,
      vectorSource: new VectorSource(),
      windDirection: 0,
      isPopupVisible: false,
    };
  },
  async mounted() {
    this.initializeMap();
    this.addMapClickHandler();
    this.addCursorPointerHandler();

    await this.fetchAllCirclesData();

    setInterval(async () => {
      await this.fetchAndUpdateData();
    }, 3600000);

    this.drawPoints();
  },
  methods: {
    initializeMap() {
      this.map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([86.087314, 55.354968]),
          zoom: 12,
        }),
        controls: [],
      });

      const vectorLayer = new VectorLayer({
        source: this.vectorSource,
      });
      this.map.addLayer(vectorLayer);
    },
    async fetchAndUpdateData() {
      await this.fetchAllCirclesData();
      this.vectorSource.clear();
      this.drawPoints();
      this.drawEllipse();
    },
    async fetchAllCirclesData() {
      const response = await fetch(API_BASE_URL + "/enterprise-getAll");
      const data = await response.json();
      this.enterprisesData = data;

      const promises = this.enterprisesData.map((_, index) =>
        this.fetchMathData(index)
      );
      await Promise.all(promises);
    },
    updateWindDirection(newDirection) {
      this.vectorSource.clear();
      this.windDirection = newDirection;
      this.drawPoints();
      this.drawEllipse();
    },
    async fetchMathData(index) {
      try {
        const response = await fetch(API_BASE_URL + "/concentration-rnd");
        const data = await response.json();

        this.enterprisesData[index].dangerZoneLength = data.dangerZoneLength;
        this.enterprisesData[index].dangerZoneWidth = data.dangerZoneWidth;
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
    interpolateColor(color1, color2, factor) {
      const result = color1
        .slice(1)
        .match(/.{2}/g)
        .map((hex, i) => {
          const c1 = parseInt(hex, 16);
          const c2 = parseInt(color2.slice(1).match(/.{2}/g)[i], 16);
          const mix = Math.round(c1 + (c2 - c1) * factor);
          return mix.toString(16).padStart(2, "0");
        });
      return `#${result.join("")}`;
    },
    hexToRgb(hex) {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    },
    drawPoints() {
      this.enterprisesData.forEach((circle) => {
        this.addPointWithPopup(
          circle.lon,
          circle.lat,
          150,
          circle
        );
      });
    },
    addMapClickHandler() {
      this.map.on("click", (event) => {
        let clickedOnFeature = false;

        this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
          const featureInfo = feature.get("info");
          if (featureInfo) {
            clickedOnFeature = true;

            const popupInfo = `
              <div class="popup-row">
                <span>Name: ${featureInfo.name}</span>
              </div>
              <div class="popup-row">
                <span>Diameter Source: ${featureInfo.diameterSource}</span>
              </div>
              `;

            const popupElement = document.getElementById("popup");
            if (popupElement) {
              popupElement.innerHTML = popupInfo;
            }

            this.isPopupVisible = true;

            this.$nextTick(() => {
              const popupElement = document.getElementById("popup");
              if (popupElement) {
                popupElement.innerHTML = popupInfo;
              }
            });
          }
        });
        if (!clickedOnFeature) {
          this.isPopupVisible = false;
        }
      });
    },
    addPointWithPopup(lon, lat, radius, info) {
      const pointFeature = new Feature({
        geometry: new CircleGeom(fromLonLat([lon, lat]), radius),
      });

      pointFeature.setProperties({
        info: info,
      });

      const pointStyle = new Style({
        fill: new Fill({
          color: "rgba(72, 84, 198, .8)",
        }),
      });
      pointFeature.setStyle(pointStyle);
      this.vectorSource.addFeature(pointFeature);
    },
    addCursorPointerHandler() {
      this.map.on("pointermove", (event) => {
        const pixel = this.map.getEventPixel(event.originalEvent);
        const hit = this.map.hasFeatureAtPixel(pixel);

        if (hit) {
          this.map.getTargetElement().style.cursor = "pointer";
        } else {
          this.map.getTargetElement().style.cursor = "";
        }
      });
    },
    drawEllipse() {
      this.enterprisesData.forEach((circle) => {
        const semiMajor = circle.dangerZoneLength; // Длина по направлению ветра
        const semiMinor = circle.dangerZoneWidth; // Ширина

        // Центр (примерные координаты)
        const center = fromLonLat([circle.lon, circle.lat]);

        // Угол поворота в радианах
        const angle = 0.5 * Math.PI - (this.windDirection * Math.PI) / 180;

        const points = [];

        // Сдвиг в метрах вдоль направления ветра
        const offsetX = (semiMajor / 1.25) * Math.cos(angle);
        const offsetY = (semiMajor / 1.25) * Math.sin(angle);

        // Изменяем центр с учетом смещения
        const shiftedCenter = [center[0] + offsetX, center[1] + offsetY];

        // Генерируем точки эллипса
        for (let i = 360; i >= 0; i -= 10) {
          const theta = (i * Math.PI) / 180;
          const x = semiMajor * Math.cos(theta);
          const y = semiMinor * Math.sin(theta);

          const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
          const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);

          // Добавляем точки с учетом смещенного центра
          points.push([
            shiftedCenter[0] + rotatedX,
            shiftedCenter[1] + rotatedY,
          ]);
        }
        points.push(points[0]);

        // Создаем полигон из точек эллипса
        const ellipse = new Feature({
          geometry: new Polygon([points]),
        });

        this.vectorSource.addFeature(ellipse);
      });
    },
  },
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 100vh;
}
</style>
