<template>
  <Header :showButtons="false" :isTransparent="true" @layerChanged="updateLayer" />
  <EnterpriseRating />
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
import EnterpriseRating from "./EnterpriseRating.vue";

import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { fromLonLat } from "ol/proj";
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { Polygon } from "ol/geom";
import { API_BASE_URL } from "../api/config";
import { Point } from 'ol/geom';

import logoImage from "@/assets/IconClicker.png";


export default {
  name: "MapComponent",
  components: {
    Header,
    WeatherInfo,
    Popup,
    EnterpriseRating,
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
      showButtons: false,
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
      this.$emit("layerChanged", this.selectedLayer);
    },
    async fetchAndUpdateData() {
      this.vectorSource.clear();
      await this.fetchAllCirclesData();
      this.drawPoints();
      this.drawEllipse();
    },
    async fetchAllCirclesData() {
      const response = await fetch(API_BASE_URL + "/enterprise");
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
    },
    async fetchMathData(enterpriseIndex) {
      try {
        const promises = [];
        if (this.selectedLayer === "smallParticles") {
          this.enterprisesData[enterpriseIndex].emissionSources.forEach(
            (_, sourceIndex) => {
              promises.push(
                this.fetchConcentrationCalculate(enterpriseIndex, sourceIndex)
              );
            }
          );
          await Promise.all(promises);
        } else {
          this.enterprisesData[enterpriseIndex].emissionSources.forEach(
            (_, sourceIndex) => {
              promises.push(
                this.fetchEmissionCalculate(enterpriseIndex, sourceIndex)
              );
            }
          );
          await Promise.all(promises);
        }
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
    async fetchConcentrationCalculate(enterpriseIndex, sourceIndex) {
      const enterprise = this.enterprisesData[enterpriseIndex];
      const params = new URLSearchParams({
        EjectedTemp: enterprise.emissionSources[sourceIndex].ejectedTemp,
        AirTemp: this.airTemp,
        AvgExitSpeed: enterprise.emissionSources[sourceIndex].avgExitSpeed,
        HeightSource: enterprise.emissionSources[sourceIndex].heightSource,
        DiameterSource: enterprise.emissionSources[sourceIndex].diameterSource,
        TempStratificationRatio: enterprise.tempStratificationRatio,
        SedimentationRateRatio: enterprise.sedimentationRateRatio,
        WindSpeed: this.windSpeed,
        EmissionSourceId: enterprise.emissionSources[sourceIndex].id,
        concentration: 5,
      });

      const response = await fetch(
        API_BASE_URL + "/concentration/calculate?" + params.toString(),
        {
          method: "GET",
          headers: {
            Accept: "*/*",
          },
        }
      );

      const result = await response.json();

      this.enterprisesData[enterpriseIndex].emissionSources[
        sourceIndex
      ].dangerZoneLength = result.dangerZoneLength;
      this.enterprisesData[enterpriseIndex].emissionSources[
        sourceIndex
      ].dangerZoneWidth = result.dangerZoneWidth;
      this.enterprisesData[enterpriseIndex].emissionSources[
        sourceIndex
      ].dangerZoneColorHex = result.dangerZoneColorHex;
      this.enterprisesData[enterpriseIndex].emissionSources[
        sourceIndex
      ].dangerZoneAngle = result.dangerZoneAngle;
      this.enterprisesData[enterpriseIndex].emissionSources[
        sourceIndex
      ].lastConcentration = result.averageConcentration;
    },
    async fetchEmissionCalculate(enterpriseIndex, sourceIndex) {
      const params = new URLSearchParams({
        EjectedTemp:
          this.enterprisesData[enterpriseIndex].emissionSources[sourceIndex]
            .ejectedTemp,
        AirTemp: this.airTemp,
        AvgExitSpeed:
          this.enterprisesData[enterpriseIndex].emissionSources[sourceIndex]
            .avgExitSpeed,
        HeightSource:
          this.enterprisesData[enterpriseIndex].emissionSources[sourceIndex]
            .heightSource,
        DiameterSource:
          this.enterprisesData[enterpriseIndex].emissionSources[sourceIndex]
            .diameterSource,
        TempStratificationRatio:
          this.enterprisesData[enterpriseIndex].tempStratificationRatio,
        SedimentationRateRatio:
          this.enterprisesData[enterpriseIndex].sedimentationRateRatio,
        WindSpeed: this.windSpeed,
      });

      const response = await fetch(
        API_BASE_URL + "/emission/calculate?" + params.toString(),
        {
          method: "GET",
          headers: {
            Accept: "*/*",
          },
        }
      );

      const result = await response.json();

      this.enterprisesData[enterpriseIndex].emissionSources[
        sourceIndex
      ].concentrations = result.concentrations;
    },
    drawPoints() {
      this.enterprisesData.forEach((enterprise) => {
        enterprise.emissionSources.forEach(
          (source) => {
            this.addPointWithPopup(enterprise, source, 200);
          }
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


    addPointWithPopup(enterprise, source) {
      const pointFeature = new Feature({
        geometry: new Point(fromLonLat([source.lon, source.lat])),
      });

      const info = source;
      info.name = enterprise.name;
      pointFeature.setProperties({
        info: source,
      });

      const pointStyle = new Style({
        image: new Icon({
          src: logoImage,
          imgSize: [24, 24],
          scale: 0.06,
          anchor: [0.5, 1],
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
        this.enterprisesData.forEach((enterprise) => {
          enterprise.emissionSources.forEach((source) => {
            this.drawCircle(source, source);
          });
        });
      } else {
        this.enterprisesData.forEach((enterprise) => {
          enterprise.emissionSources.forEach((source) => {
            source.concentrations.forEach((concentration) => {
              this.drawCircle(concentration, source);
            });
          });
        });
      }
    },
    drawCircle(source, coords) {
      const semiMajor = source.dangerZoneLength;
      const semiMinor = source.dangerZoneWidth;

      const center = fromLonLat([coords.lon, coords.lat]);

      const angle =
        0.5 * Math.PI -
        ((this.windDirection + source.dangerZoneAngle) * Math.PI) / 180;

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

      const colorRgba = this.hexToRgbA(source.dangerZoneColorHex);

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
  top: 88px;
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
