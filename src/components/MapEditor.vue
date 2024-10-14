<template>
  <div class="map-container">
    <div id="map" class="map"></div>
    <div class="button-container">
      <button @click="drawPolygon">Рисовать полигон</button>
      <button @click="saveLayer">Сохранить текущий слой</button>
      <button @click="loadLayer">Загрузить слой</button>
    </div>
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Draw } from "ol/interaction";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";

export default {
  data() {
    return {
      map: null,
      draw: null,
      isDrawingPolygon: false,
    };
  },
  mounted() {
    this.initMap();

    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    handleKeydown(event) {
      if (event.key === "Escape" && this.isDrawingPolygon) {
        this.map.removeInteraction(this.draw);
        this.isDrawingPolygon = false;
      }
    },
    initMap() {
      const initialLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          stroke: new Stroke({
            color: "blue",
            width: 2,
          }),
          fill: new Fill({
            color: "rgba(0, 0, 255, 0.2)",
          }),
        }),
      });

      this.map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          initialLayer,
        ],
        view: new View({
          center: fromLonLat([86.087314, 55.354968]),
          zoom: 12,
        }),
      });

      // Сохраняем слой для добавления новых фигур
      this.vectorLayer = initialLayer;
    },

    drawPolygon() {
      if (this.isDrawingPolygon) {
        this.map.removeInteraction(this.draw);
        this.isDrawingPolygon = false;
        return;
      }

      this.draw = new Draw({
        source: this.vectorLayer.getSource(),
        type: "Polygon",
      });

      this.map.addInteraction(this.draw);
      this.isDrawingPolygon = true;
    },

    saveLayer() {
      
    },

    loadLayer() {
      
    },
  },
};
</script>

<style scoped>
.map-container {
  position: relative;
}
.map {
  width: 100%;
  height: 100vh;
}
.button-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}
button {
  background-color: white;
  border: 1px solid black;
  padding: 5px;
  margin-bottom: 5px;
}
.ol-popup {
  position: absolute;
  background-color: white;
  padding: 10px;
  border: 1px solid black;
  bottom: 12px;
  left: 50px;
  z-index: 100;
}
</style>
