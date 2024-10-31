<template>
    <div id="map" ref="mapContainer" style="width: 100%; height: 100%;"></div>
  </template>
  
  <script>
  import 'ol/ol.css';
  import { Map, View } from 'ol';
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
  import { OSM } from 'ol/source';
  import { Vector as VectorSource } from 'ol/source';
  import { Style, Fill, Stroke } from 'ol/style';
  import { Feature } from 'ol';
  import { Point } from 'ol/geom';
  import { fromLonLat } from 'ol/proj';
  import { Circle as CircleStyle } from 'ol/style';
  import { Polygon } from 'ol/geom';
  
  export default {
    props: {
      windDirection: {
        type: Number,
        required: true,
      },
    },
    mounted() {
      this.initMap();
    },
    watch: {
      windDirection: 'drawEllipse',
    },
    methods: {
      initMap() {
        this.vectorSource = new VectorSource();
        this.vectorLayer = new VectorLayer({
          source: this.vectorSource,
          style: new Style({
            fill: new Fill({ color: 'rgba(255, 0, 0, 0.3)' }),
            stroke: new Stroke({ color: 'red', width: 2 }),
          }),
        });
  
        this.map = new Map({
          target: this.$refs.mapContainer,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            this.vectorLayer,
          ],
          view: new View({
            center: fromLonLat([37.6173, 55.7558]), // Центрируем карту на Москве
            zoom: 12,
          }),
        });
  
        this.drawEllipse();
      },
      drawEllipse() {
        // Удаляем старые фигуры
        this.vectorSource.clear();
  
        // Радиусы эллипса в метрах
        const semiMajor = 3000; // Длина по направлению ветра
        const semiMinor = 1000; // Ширина
  
        // Центр (примерные координаты)
        const center = fromLonLat([37.6173, 55.7558]);
  
        // Угол поворота в радианах
        const angle = (this.windDirection * Math.PI) / 180;
  
        // Генерируем точки эллипса
        const points = [];
        for (let i = 0; i < 360; i += 10) {
          const theta = (i * Math.PI) / 180;
          const x = semiMajor * Math.cos(theta);
          const y = semiMinor * Math.sin(theta);
  
          const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
          const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
  
          points.push([center[0] + rotatedX, center[1] + rotatedY]);
        }
  
        // Создаем полигон из точек эллипса
        const ellipse = new Feature({
          geometry: new Polygon([points]),
        });
  
        this.vectorSource.addFeature(ellipse);
      },
    },
  };
  </script>
  
  <style scoped>
  #map {
    width: 100%;
    height: 100%;
  }
  </style>
  