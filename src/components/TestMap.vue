<template>
  <Header :showButtons="false" :isTransparent="true" />
  <WeatherInfo />
  <div id="map" class="map"></div>
</template>

<script>
import Header from "./Header.vue";
import WeatherInfo from "./WeatherInfo.vue";

import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleGeom } from 'ol/geom';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { Style, Fill } from 'ol/style';

export default {
  name: 'MapComponent',
  components: {
    Header,
    WeatherInfo
  },
  data() {
    return {
      circlesData: [
        { lon: 85.995976, lat: 55.350685, radius: 0, gradientColors: ['#ff0000', '#ffff00', '#00ff00'] },
        { lon: 86.069663, lat: 55.359522, radius: 0, gradientColors: ['#ff0000', '#ffff00', '#00ff00'] },
      ],
      map: null,
      vectorSource: new VectorSource(),
    };
  },
  async mounted() {
    await this.fetchAllCirclesData();

    this.initializeMap();
    this.drawCircles();
  },
  methods: {
    initializeMap() {
      this.map = new Map({
        target: 'map',
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
    async fetchAllCirclesData() {
      const promises = this.circlesData.map((_, index) => this.fetchMathData(index));
      await Promise.all(promises); 
    },
    drawCircles() {
      this.circlesData.forEach((circle) => {
        const steps = 16; 
        const stepRadius = circle.radius / steps;

        for (let i = 0; i < steps; i++) {
          let fraction = i / steps;
          let interpolatedColor;

          if (fraction < 0.5) {
            interpolatedColor = this.interpolateColor(circle.gradientColors[0], circle.gradientColors[1], fraction * 2);
          } else {
            interpolatedColor = this.interpolateColor(circle.gradientColors[1], circle.gradientColors[2], (fraction - 0.5) * 2);
          }

          const feature = new Feature({
            geometry: new CircleGeom(fromLonLat([circle.lon, circle.lat]), circle.radius - i * stepRadius),
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
    async fetchMathData(index) {
      try {
        const response = await fetch("https://localhost:7017/api/concentration/random");
        const data = await response.json();

        const maxElement = Math.max(...data.sp);
        const maxConcentrationDistance = data.sp.indexOf(maxElement) * 5;

        this.circlesData[index].radius = maxConcentrationDistance;
        console.log(maxConcentrationDistance);
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
    interpolateColor(color1, color2, factor) {
      const result = color1.slice(1).match(/.{2}/g).map((hex, i) => {
        const c1 = parseInt(hex, 16);
        const c2 = parseInt(color2.slice(1).match(/.{2}/g)[i], 16);
        const mix = Math.round(c1 + (c2 - c1) * factor);
        return mix.toString(16).padStart(2, '0');
      });
      return `#${result.join('')}`;
    },
    hexToRgb(hex) {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
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
