<template>
  <Header
    :showButtons="false"
    :isTransparent="true"
    @layerChanged="updateLayer"
  />
  <EnterpriseRating />
  <WeatherInfo @weatherDataUpdated="updateWeatherData" />
  <Popup
    :show="showPopup"
    :x="popupX"
    :y="popupY"
    :title="popupTitle"
    :featureInfo="popupFeatureInfo"
    :chartData="popupChartData"
    @close="showPopup = false"
    @change="setSimulationStartData"
  />
  <SimulationPanel
    :startData="simulationStartData"
    v-if="showSimulationPanel"
    @buildSimulation="handleSimulationStart"
    @close="showSimulationPanel = false"
  />
  <div id="map" class="map"></div>
  <div class="tools" v-if="!showButtons">
    <teleport to="body">
      <div class="control-panel">
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="selectedLayer"
              value="smallParticles"
              @change="updateLayer"
            />
            Мелкие частицы
          </label>
          <label>
            <input
              type="radio"
              v-model="selectedLayer"
              value="otherParticles"
              @change="updateLayer"
            />
            Другие частицы
          </label>
        </div>
        <div class="checkbox-container">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="isChecked"
              @change="handleCheckboxChange"
            />
            Показать сетку
          </label>
        </div>
      </div>
    </teleport>
  </div>
  <div
    class="map-legend"
    v-if="selectedLayer === 'smallParticles'"
  >
    <div class="legend-title">Уровень концентрации (мкг/м³)</div>
    <div class="gradient-bar"></div>
    <div class="legend-labels">
      <span>0</span>
      <span>35</span>
      <span>55</span>
      <span>125</span>
      <span>225+</span>
    </div>
  </div>
</template>

<script>
import Header from "./Header.vue";
import WeatherInfo from "./WeatherInfo.vue";
import Popup from "./Popup.vue";
import EnterpriseRating from "./EnterpriseRating.vue";
import SimulationPanel from "./SimulationPanel.vue";

import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { fromLonLat } from "ol/proj";
import { Style, Icon, Fill } from "ol/style";
import { Polygon } from "ol/geom";
import { API_BASE_URL } from "../api/config";
import { Point } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { fromExtent } from "ol/geom/Polygon";
import { getCenter } from "ol/extent";
import Text from "ol/style/Text";

import sourceImage from "@/assets/emission_source.png";

export default {
  name: "MapComponent",
  components: {
    Header,
    WeatherInfo,
    Popup,
    EnterpriseRating,
    SimulationPanel,
  },
  data() {
    return {
      enterprisesData: [],
      map: null,
      vectorSource: new VectorSource(),
      tileGridSource: new VectorSource(),
      windDirection: 0,
      windSpeed: 0,
      airTemp: 0,
      showPopup: false,
      showSimulationPanel: false,
      popupTitle: "",
      popupData: "",
      selectedLayer: "smallParticles",
      popupX: 0,
      popupY: 0,
      popupFeatureInfo: null,
      popupChartData: null,
      showRadio: false,
      showButtons: false,
      fixedCoordinates: null,
      updatePopupInterval: null,
      drawnCircles: [],
      pointFeatures: [],
      isChecked: false,
      currentEnterprise: null,
      currentSource: null,
      simulationStartData: null,
      showSimulationPanel: false,
    };
  },
  watch: {
    selectedLayer() {
      if (this.isChecked) {
        this.vectorSource.clear();
        this.tileGridSource.clear();
        this.fetchAllDistricts();
      }
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
      const tileLayer = new VectorLayer({
        source: this.tileGridSource,
      });

      this.map.addLayer(tileLayer);
      this.map.addLayer(vectorLayer);
    },
    updateLayer() {
      this.$emit("layerChanged", this.selectedLayer);
    },
    fetchAllDistricts() {
      const districts = [
        "Заводский",
        "Кировский",
        "Ленинский",
        "Рудничный",
        "Центральный",
      ];

      districts.map((name) => {
        return fetch(`${name}.geojson`)
          .then((res) => res.json())
          .then((data) => {
            const features = new GeoJSON().readFeatures(data, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });

            const districtFeature = features[0];

            this.drawTileGrid(districtFeature, this.tileGridSource, 1500, name);
          })
          .catch((error) =>
            console.error(`Ошибка загрузки ${name}.geojson:`, error)
          );
      });
    },
    drawTileGrid(
      polygonFeature,
      vectorSource,
      tileSize = 1500,
      regionName = ""
    ) {
      const polygon = polygonFeature.getGeometry();
      const extent = polygon.getExtent();

      const globalStartX = Math.floor(extent[0] / tileSize) * tileSize;
      const globalStartY = Math.floor(extent[1] / tileSize) * tileSize;

      for (let x = globalStartX; x < extent[2]; x += tileSize) {
        for (let y = globalStartY; y < extent[3]; y += tileSize) {
          const tileExtent = [x, y, x + tileSize, y + tileSize];

          if (polygon.intersectsExtent(tileExtent)) {
            const tileFeature = new Feature({
              geometry: fromExtent(tileExtent),
            });

            tileFeature.setStyle(
              new Style({
                fill: new Fill({
                  color: `rgba(255, 255, 255, 0.6)`,
                }),
              })
            );

            vectorSource.addFeature(tileFeature);
          }
        }
      }

      if (regionName) {
        const center = getCenter(extent);
        const labelFeature = new Feature({
          geometry: new Point(center),
        });
        labelFeature.setStyle(
          new Style({
            text: new Text({
              text: regionName,
              font: "bold 12px sans-serif",
              fill: new Fill({ color: "#000" }),
            }),
            zIndex: 1000,
          })
        );

        this.vectorSource.addFeature(labelFeature);
      }
    },
    getRandomColorWithAlpha(alpha = 0.5) {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    async fetchConcentrationCalculateSimulation(
      enterpriseIndex,
      sourceIndex,
      data
    ) {
      const enterprise = this.enterprisesData[enterpriseIndex];
      const params = new URLSearchParams({
        EjectedTemp: data.ejectedTemp,
        AirTemp: data.airTemp,
        AvgExitSpeed: data.avgExitSpeed,
        HeightSource: data.heightSource,
        DiameterSource: data.diameterSource,
        TempStratificationRatio: enterprise.tempStratificationRatio,
        SedimentationRateRatio: enterprise.sedimentationRateRatio,
        WindSpeed: data.windSpeed,
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

      this.vectorSource.clear();
      this.drawPoints();
      this.drawEllipse();
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
        enterprise.emissionSources.forEach((source) => {
          this.addPointWithPopup(enterprise, source, 200);
        });
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
            //this.popupChartData = this.generateChartData(featureInfo);
            this.currentEnterprise = featureInfo.enterprise;
            this.currentSource = featureInfo.source;

            this.popupX = pixel[0];
            this.popupY = pixel[1];
            this.showPopup = true;

            this.fixedCoordinates = coordinate;
            this.startPopupUpdate();
          }
        });

        if (!clickedOnFeature) {
          this.showPopup = false;
          this.showSimulationPanel = false;
        }
      });
    },
    startPopupUpdate() {
      if (this.updatePopupInterval) {
        clearInterval(this.updatePopupInterval);
      }

      this.updatePopupInterval = setInterval(() => {
        if (this.fixedCoordinates) {
          const pixel = this.map.getPixelFromCoordinate(this.fixedCoordinates);
          this.popupX = pixel[0];
          this.popupY = pixel[1];
        }
      }, 0.1);
    },
    stopPopupUpdate() {
      if (this.updatePopupInterval) {
        clearInterval(this.updatePopupInterval);
        this.updatePopupInterval = null;
      }
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
            data: [12, 19, 8, 15, 25, 30, 18, 22],
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
      info.enterprise = enterprise;
      info.source = source;
      pointFeature.setProperties({
        info: info,
      });

      const pointStyle = new Style({
        image: new Icon({
          src: sourceImage,
          imgSize: [24, 24],
          scale: 0.06,
          anchor: [0.5, 1],
        }),
      });

      pointFeature.setStyle(pointStyle);
      pointFeature.set("selectable", true);

      this.vectorSource.addFeature(pointFeature);

      this.pointFeatures.push(pointFeature);
    },
    addCursorPointerHandler() {
      this.map.on("pointermove", (event) => {
        const pixel = this.map.getEventPixel(event.originalEvent);
        const features = [];

        this.map.forEachFeatureAtPixel(pixel, (feature, layer) => {
          if (feature.get("selectable")) {
            features.push(feature);
          }
        });

        if (features.length > 0) {
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

      this.drawnCircles.push(ellipse);

      const highlightColor =
        this.isChecked && this.selectedLayer === "smallParticles"
          ? colorRgba
          : "rgba(255, 0, 0, 0.5)";

      if (this.isChecked) {
        this.highlightTilesInsideEllipse(ellipse.getGeometry(), highlightColor);
      }
    },
    highlightTilesInsideEllipse(ellipseGeometry, colorRgba) {
      const tileFeatures = this.tileGridSource.getFeatures();

      tileFeatures.forEach((tile) => {
        const tileGeometry = tile.getGeometry();
        const isIntersecting = ellipseGeometry.intersectsExtent(
          tileGeometry.getExtent()
        );

        if (isIntersecting) {
          tile.set("isDanger", true);
          tile.setStyle(
            new Style({
              fill: new Fill({
                color: colorRgba,
              }),
            })
          );
        } else if (!tile.get("isDanger")) {
            tile.setStyle(
              new Style({
                fill: new Fill({
                  color: `rgba(171, 209, 98, 0.6)`,
                }),
              })
            );
          }
      });

      this.clearDrawnCircles();
      this.removeAllPoints();
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
    clearDrawnCircles() {
      this.drawnCircles.forEach((ellipse) => {
        this.vectorSource.removeFeature(ellipse);
      });

      this.drawnCircles = [];
    },
    removeAllPoints() {
      this.pointFeatures.forEach((feature) => {
        this.vectorSource.removeFeature(feature);
      });

      this.pointFeatures = [];
    },
    handleCheckboxChange() {
      this.vectorSource.clear();
      this.tileGridSource.clear();

      if (this.isChecked) {
        this.fetchAllDistricts();
        this.fetchAndUpdateData();
      } else {
        this.fetchAndUpdateData();
      }
    },
    handleSimulationStart(data) {
      try {
        const enterpriseIndex = this.enterprisesData.indexOf(
          this.currentEnterprise
        );
        const sourceIndex = this.enterprisesData[
          enterpriseIndex
        ].emissionSources.indexOf(this.currentSource);
        this.fetchConcentrationCalculateSimulation(
          enterpriseIndex,
          sourceIndex,
          data
        );
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
    setSimulationStartData() {
      this.simulationStartData = {
        ejectedTemp: this.currentSource.ejectedTemp,
        airTemp: this.airTemp,
        avgExitSpeed: this.currentSource.avgExitSpeed,
        heightSource: this.currentSource.heightSource,
        diameterSource: this.currentSource.diameterSource,
        windSpeed: this.windSpeed,
      };

      this.showSimulationPanel = true;
      this.showPopup = false;
    },
  },
};
</script>

<style scoped>
#map {
  width: 100%;
  height: 100vh;
}

.control-panel {
  position: fixed;
  top: 88px;
  right: 24px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: max-content;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-container {
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 0;
  margin: 0;
}

.checkbox-label:hover {
  color: #007bff;
}

.checkbox-label input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked {
  background-color: #007bff;
  border-color: #007bff;
}

.checkbox-label input[type="checkbox"]:checked::after {
  position: absolute;
  color: white;
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.map-legend {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-family: Arial, sans-serif;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}

.gradient-bar {
  height: 20px;
  width: 200px;
  background: linear-gradient(
    to right,
    #abd162,
    #f8d461,
    #fb9956,
    #f6686a,
    #a47db8
  );
  border-radius: 4px;
  margin-bottom: 5px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
</style>
