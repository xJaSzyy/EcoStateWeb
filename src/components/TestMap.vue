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
      enterprisesData: [
        {
          name: "Азот",
          lon: 85.995976,
          lat: 55.350685,
          radius: 500,
          diameter: 7,
          dangerZoneLength: 0,
          dangerZoneHalfWidth: 0,
          gradientColors: ["#ff0000", "#ffff00", "#00ff00"],
        },
        {
          name: "test boiler 2",
          lon: 86.069663,
          lat: 55.359522,
          radius: 750,
          diameter: 3,
          dangerZoneLength: 0,
          dangerZoneHalfWidth: 0,
          gradientColors: ["#ff0000", "#ffff00", "#00ff00"],
        },
      ],
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
      this.drawTriangles();
      this.drawPoints();
    },
    async fetchAllCirclesData() {
      const promises = this.enterprisesData.map((_, index) =>
        this.fetchMathData(index)
      );
      await Promise.all(promises);
    },
    drawCircles() {
      this.enterprisesData.forEach((circle) => {
        const steps = 16;
        const stepRadius = circle.radius / steps;

        for (let i = 0; i < steps; i++) {
          let fraction = i / steps;
          let interpolatedColor;

          if (fraction < 0.5) {
            interpolatedColor = this.interpolateColor(
              circle.gradientColors[0],
              circle.gradientColors[1],
              fraction * 2
            );
          } else {
            interpolatedColor = this.interpolateColor(
              circle.gradientColors[1],
              circle.gradientColors[2],
              (fraction - 0.5) * 2
            );
          }

          const feature = new Feature({
            geometry: new CircleGeom(
              fromLonLat([circle.lon, circle.lat]),
              circle.radius - i * stepRadius
            ),
          });

          const circleStyle = new Style({
            fill: new Fill({
              color: `rgba(${this.hexToRgb(interpolatedColor)}, 0.2)`,
            }),
          });

          feature.setStyle(circleStyle);
          this.vectorSource.addFeature(feature);
        }
      });
    },
    drawTriangles() {
      this.enterprisesData.forEach((circle) => {
        const baseRadius = circle.radius * 2;
        const heightRadius = circle.radius * 3;
        const center = fromLonLat([circle.lon, circle.lat]);

        const windAngleRad =
          0.5 * Math.PI - (this.windDirection * Math.PI) / 180;
        const halfBaseAngle = Math.PI / 12;

        const gradientSteps = 12;
        for (let i = 0; i < gradientSteps; i++) {
          const fraction = i / gradientSteps;
          let interpolatedColor;

          if (fraction < 0.5) {
            interpolatedColor = this.interpolateColor(
              circle.gradientColors[0],
              circle.gradientColors[1],
              fraction * 2
            );
          } else {
            interpolatedColor = this.interpolateColor(
              circle.gradientColors[1],
              circle.gradientColors[2],
              (fraction - 0.5) * 2
            );
          }

          const scaledRadius = baseRadius * (1 - fraction);
          const scaledHeightRadius = heightRadius * (1 - fraction);

          const scaledBaseVertex1 = [
            center[0] + scaledRadius * Math.cos(windAngleRad - halfBaseAngle),
            center[1] + scaledRadius * Math.sin(windAngleRad - halfBaseAngle),
          ];
          const scaledBaseVertex2 = [
            center[0] + scaledRadius * Math.cos(windAngleRad + halfBaseAngle),
            center[1] + scaledRadius * Math.sin(windAngleRad + halfBaseAngle),
          ];

          const triangleCoordinates = [
            center,
            scaledBaseVertex1,
            scaledBaseVertex2,
            center,
          ];

          const triangleFeature = new Feature({
            geometry: new Polygon([triangleCoordinates]),
          });

          const triangleStyle = new Style({
            fill: new Fill({
              color: `rgba(${this.hexToRgb(interpolatedColor)}, 0.25)`,
            }),
          });

          triangleFeature.setStyle(triangleStyle);
          this.vectorSource.addFeature(triangleFeature);
        }
      });
    },
    updateWindDirection(newDirection) {
      this.vectorSource.clear();
      this.windDirection = newDirection;
      this.drawTriangles();
      this.drawPoints();
      this.drawEllipse();
      //this.drawCircles();
    },
    async fetchMathData(index) {
      try {
        const response = await fetch(API_BASE_URL + "/concentration-rnd");
        const data = await response.json();

        this.enterprisesData[index].dangerZoneLength = data.content.dangerZoneLength;
        this.enterprisesData[index].dangerZoneHalfWidth = data.content.dangerZoneHalfWidth;

        /*this.saveMathData({
          name: this.enterprisesData[index].name,
          sp: data.sp,
          so2: data.so2,
          no: data.no,
          no2: data.no2,
          co2: data.co2,
        });*/
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
    async saveMathData(weatherData) {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/save_math_boiler/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(weatherData),
          }
        );
        const result = await response.json();
        console.log("Результат сохранения данных:", result);
      } catch (error) {
        console.error("Ошибка при сохранении данных:", error);
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
          circle.radius / 3.5,
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
                <span>Pipe diameter: ${featureInfo.diameter}</span>
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
        const coeff = 0.65; // коэффицент регулирующий ширину
        const semiMajor = circle.dangerZoneLength; // Длина по направлению ветра
        const semiMinor = circle.dangerZoneHalfWidth * 2 * coeff; // Ширина

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
      for (let i = 0; i < 360; i += 10) {
        const theta = (i * Math.PI) / 180;
        const x = semiMajor * Math.cos(theta);
        const y = semiMinor * Math.sin(theta);

        const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
        const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);

        // Добавляем точки с учетом смещенного центра
        points.push([shiftedCenter[0] + rotatedX, shiftedCenter[1] + rotatedY]);
      }

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
