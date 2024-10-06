<template>
  <div id="map" class="map"></div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleGeom } from 'ol/geom';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';

export default {
  name: 'MapComponent',
  data() {
    return {
        circlesData: [
          { lon: 85.995976, lat: 55.350685, radius: 250, gradientColors: ['#ff0000', '#ffff00', '#00ff00'] },
          { lon: 86.069663, lat: 55.359522, radius: 725, gradientColors: ['#ff0000', '#ffff00', '#00ff00'] },
          // Можно добавить больше кругов
        ],
    };
  },
  mounted() {
    const map = new Map({
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
    });

    const vectorSource = new VectorSource();

    this.circlesData.forEach(circle => {
      const steps = 16; // Количество шагов для градиента
      const stepRadius = circle.radius / steps;

      for (let i = 0; i < steps; i++) {
        let fraction = i / steps;
        let interpolatedColor;

        // Если fraction < 0.5, интерполируем между первым и вторым цветом
        if (fraction < 0.5) {
          interpolatedColor = this.interpolateColor(circle.gradientColors[0], circle.gradientColors[1], fraction * 2);
        } 
        // Иначе интерполируем между вторым и третьим цветом
        else {
          interpolatedColor = this.interpolateColor(circle.gradientColors[1], circle.gradientColors[2], (fraction - 0.5) * 2);
        }

        const feature = new Feature({
          geometry: new CircleGeom(fromLonLat([circle.lon, circle.lat]), circle.radius - i * stepRadius),
        });

        const circleStyle = new Style({
          fill: new Fill({
            color: interpolatedColor,
          })
        });

        feature.setStyle(circleStyle);
        vectorSource.addFeature(feature);
      }
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    map.addLayer(vectorLayer);
  },
  methods: {
    // Функция для интерполяции цветов между двумя цветами
    interpolateColor(color1, color2, factor) {
      const result = color1.slice(1).match(/.{2}/g).map((hex, i) => {
        const c1 = parseInt(hex, 16);
        const c2 = parseInt(color2.slice(1).match(/.{2}/g)[i], 16);
        const mix = Math.round(c1 + (c2 - c1) * factor);
        return mix.toString(16).padStart(2, '0');
      });
      return `#${result.join('')}`;
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
