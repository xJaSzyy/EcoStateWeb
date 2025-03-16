<template>
  <Header :showButtons="false" :isTransparent="true" @layerChanged="updateLayer" />
  <WeatherInfo @weatherDataUpdated="updateWeatherData" />
  <Popup :show="showPopup" :x="popupX" :y="popupY" :title="popupTitle" :featureInfo="popupFeatureInfo"
    :chartData="popupChartData" @close="showPopup = false" />
  <div id="map" class="map"></div>
  <div class="tools" v-if="!showButtons">
    <teleport to="body">
      <div class="radio-group">
        <label>
          <input type="radio" v-model="selectedLayer" value="smallParticles" @change="updateLayer" />
          Мелкие частицы
        </label>
        <label>
          <input type="radio" v-model="selectedLayer" value="otherParticles" @change="updateLayer" />
          Другие частицы
        </label>
      </div>
    </teleport>
  </div>
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
      windSpeed: 0,
      airTemp: 0,
      showPopup: false,
      popupTitle: "",
      popupData: "",
      selectedLayer: "smallParticles",
      popupX: 0,
      popupY: 0,
      popupFeatureInfo: null,
      popupChartData: null,
      showRadio: false,
    };
  },
  watch: {
    selectedLayer() {
      this.fetchAndUpdateData();
    },
  },

  async mounted() {
    this.initializeMap();
    this.addMapClickHandler();
    this.addCursorPointerHandler();
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
    updateLayer() {
      this.$emit("layerChanged", this.selectedLayer); // Отправляем выбранный слой вверх
    },

    async fetchAndUpdateData() {
      this.vectorSource.clear();
      await this.fetchAllCirclesData();
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
    async updateWeatherData(data) {
      this.vectorSource.clear();
      this.windSpeed = data.windSpeed;
      this.airTemp = data.airTemp;
      this.windDirection = data.windDirection;

      await this.fetchAllCirclesData();

      this.drawPoints();
      this.drawEllipse();

      const date = new Date().toLocaleString();
    },

    async fetchMathData(index) {
      try {
        if (this.selectedLayer === "smallParticles") {
          const params = new URLSearchParams({
            EjectedTemp: this.enterprisesData[index].ejectedTemp,
            AirTemp: this.airTemp,
            AvgExitSpeed: this.enterprisesData[index].avgExitSpeed,
            HeightSource: this.enterprisesData[index].heightSource,
            DiameterSource: this.enterprisesData[index].diameterSource,
            TempStratificationRatio:
              this.enterprisesData[index].tempStratificationRatio,
            SedimentationRateRatio:
              this.enterprisesData[index].sedimentationRateRatio,
            WindSpeed: this.windSpeed,
            concentration: 5,
          });

          const response = await fetch(
            API_BASE_URL + "/concentraion-calc?" + params.toString(),
            {
              method: "GET",
              headers: {
                Accept: "*/*",
              },
            }
          );

          const result = await response.json();

          this.enterprisesData[index].dangerZoneLength =
            result.dangerZoneLength;
          this.enterprisesData[index].dangerZoneWidth = result.dangerZoneWidth;
          this.enterprisesData[index].dangerZoneColorHex =
            result.dangerZoneColorHex;
          this.enterprisesData[index].dangerZoneAngle = result.dangerZoneAngle;
        } else {
          const params = new URLSearchParams({
            EjectedTemp: this.enterprisesData[index].ejectedTemp,
            AirTemp: this.airTemp,
            AvgExitSpeed: this.enterprisesData[index].avgExitSpeed,
            HeightSource: this.enterprisesData[index].heightSource,
            DiameterSource: this.enterprisesData[index].diameterSource,
            TempStratificationRatio:
              this.enterprisesData[index].tempStratificationRatio,
            SedimentationRateRatio:
              this.enterprisesData[index].sedimentationRateRatio,
            WindSpeed: this.windSpeed,
          });

          const response = await fetch(
            API_BASE_URL + "/emission-calc?" + params.toString(),
            {
              method: "GET",
              headers: {
                Accept: "*/*",
              },
            }
          );

          const result = await response.json();

          this.enterprisesData[index].concentrations = result.concentrations;
        }
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
    drawPoints() {
      this.enterprisesData.forEach((circle) => {
        this.addPointWithPopup(circle.lon, circle.lat, 150, circle);
      });
    },
    addMapClickHandler() {
      this.map.on("click", (event) => {
        let clickedOnFeature = false;

        this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
          const featureInfo = feature.get("info");
          if (featureInfo) {
            clickedOnFeature = true;

            const coordinate = event.coordinate;
            const pixel = this.map.getPixelFromCoordinate(coordinate);

            this.popupTitle = "Информация об объекте";
            this.popupFeatureInfo = featureInfo;
            this.popupChartData = this.generateChartData(featureInfo);

            this.popupX = pixel[0];
            this.popupY = pixel[1];
            this.showPopup = true;
          }
        });

        if (!clickedOnFeature) {
          this.showPopup = false;
        }
      });
    },
    generateChartData(featureInfo) {
      return {
        labels: [
          "00:00",
          "03:00",
          "06:00",
          "09:00",
          "12:00",
          "15:00",
          "18:00",
          "21:00",
        ],
        datasets: [
          {
            label: `PM2.5 (${featureInfo.name})`,
            data: [12, 19, 8, 15, 25, 30, 18, 22], // Тестовые данные
            borderColor: "red",
            borderWidth: 2,
          },
        ],
      };
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
          color: "rgba(72, 84, 198, 0.8)",
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
      if (this.selectedLayer === "smallParticles") {
        this.enterprisesData.forEach((circle) => {
          this.drawCircle(circle, circle);
        });
      } else {
        this.enterprisesData.forEach((circle) => {
          circle.concentrations.forEach((concentration) => {
            this.drawCircle(concentration, circle);
          });
        });
      }
    },
    drawCircle(circle, other) {
      const semiMajor = circle.dangerZoneLength;
      const semiMinor = circle.dangerZoneWidth;

      const center = fromLonLat([other.lon, other.lat]);

      const angle =
        0.5 * Math.PI -
        ((this.windDirection + circle.dangerZoneAngle) * Math.PI) / 180;

      const points = [];

      const offsetX = (semiMajor / 1.25) * Math.cos(angle);
      const offsetY = (semiMajor / 1.25) * Math.sin(angle);

      const shiftedCenter = [center[0] + offsetX, center[1] + offsetY];

      for (let i = 360; i >= 0; i -= 15) {
        const theta = (i * Math.PI) / 180;
        const x = semiMajor * Math.cos(theta);
        const y = semiMinor * Math.sin(theta);

        const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
        const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);

        points.push([shiftedCenter[0] + rotatedX, shiftedCenter[1] + rotatedY]);
      }
      points.push(points[0]);

      const ellipse = new Feature({
        geometry: new Polygon([points]),
      });

      const colorRgba = this.hexToRgbA(circle.dangerZoneColorHex);

      ellipse.setStyle(
        new Style({
          fill: new Fill({
            color: colorRgba,
          }),
        })
      );
      this.vectorSource.addFeature(ellipse);
    },
    hexToRgbA(hex) {
      var c;
      if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split("");
        if (c.length == 3) {
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = "0x" + c.join("");
        return (
          "rgba(" +
          [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
          ", 0.8)"
        );
      }
      throw new Error("Bad Hex");
    },
  },
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 100vh;
}

.radio-group {
  position: fixed;
  top: 109px;
  right: 24px;
  background: white;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: max-content;
  z-index: 1000;
}

label {
  display: block;
  padding: 5px 10px;
  cursor: pointer;
}

input[type="radio"] {
  margin-right: 8px;
}
</style>
