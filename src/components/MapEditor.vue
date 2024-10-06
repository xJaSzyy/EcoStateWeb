<template>
  <div class="map-container">
    <div id="map" class="map"></div>
    <div class="button-container">
      <button @click="addLayer">Добавить слой</button>
      <button @click="drawPolygon">Рисовать полигон</button>
      <button @click="saveLayer">Сохранить текущий слой</button>
      <button @click="loadLayer(selectedLayerId)">Загрузить слой</button>
      <input type="number" v-model="selectedLayerId" placeholder="Введите ID слоя" />
      <button v-for="(layer, index) in layers" :key="index" @click="toggleLayer(index)">
        Показать слой {{ index + 1 }}
      </button>
    </div>
    <div id="popup" class="ol-popup" v-if="popupContent">
      <div id="popup-content">{{ popupContent }}</div>
      <button @click="closePopup">Закрыть</button>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import GeoJSON from 'ol/format/GeoJSON';

export default {
  data() {
    return {
      map: null,
      draw: null,
      isDrawingPolygon: false,
      layers: [], // Массив для хранения всех слоев
      activeLayerIndex: null, // Индекс активного слоя
      selectedLayerId: null,
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const initialLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.2)',
          }),
        }),
      });

      this.map = new Map({
        target: 'map',
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          initialLayer,
        ],
        view: new View({
          center: [0, 0], // Координаты центра карты (можно изменить)
          zoom: 2,
        }),
      });

      this.layers.push(initialLayer); // Добавляем начальный слой в массив
      this.activeLayerIndex = 0; // Устанавливаем первый слой активным по умолчанию

      // Добавляем Overlay для всплывающего окна
      this.overlay = new Overlay({
        element: document.getElementById('popup'),
        positioning: 'bottom-center',
        stopEvent: false,
      });
      this.map.addOverlay(this.overlay);

      // Добавляем обработчик кликов на карте для отображения всплывающего окна
      this.map.on('click', (event) => {
        this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
          const coordinates = feature.getGeometry().getCoordinates();
          const radius = feature.get('radius');
          this.showPopup(coordinates, `Радиус точки: ${radius} м`);
        });
      });
    },
    drawPolygon() {
      if (this.isDrawingPolygon) {
        this.map.removeInteraction(this.draw);
        this.isDrawingPolygon = false;
      } else {
        this.startPolygonDraw();
        this.isDrawingPolygon = true;
      }
    },
    startPolygonDraw() {
      const activeLayer = this.layers[this.activeLayerIndex];
      this.draw = new Draw({
        source: activeLayer.getSource(),
        type: 'Polygon',
      });
      this.map.addInteraction(this.draw);
    },
    toggleLayer(index) {
      this.layers.forEach((layer, i) => {
        layer.setVisible(i === index);
      });
      this.activeLayerIndex = index;
    },
    addLayer() {
      const newLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
          stroke: new Stroke({
            color: 'green',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(0, 255, 0, 0.2)',
          }),
        }),
      });
      this.map.addLayer(newLayer);
      this.layers.push(newLayer);
    },
    saveLayer() {
      const activeLayer = this.layers[this.activeLayerIndex];
    const features = activeLayer.getSource().getFeatures().map(feature => {
        return {
            type: 'Feature',  // Обязательно укажите тип 'Feature'
            geometry: {
                type: feature.getGeometry().getType(),  // Тип геометрии, например 'Polygon'
                coordinates: feature.getGeometry().getCoordinates(),  // Координаты
            },
            properties: feature.getProperties(),  // Свойства
        };
    });

    const layerData = {
        id: this.activeLayerIndex,
        features: features,
    };

    fetch("http://127.0.0.1:8000/save/layer", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(layerData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Layer saved:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
},
loadLayer(layerId) {
    fetch(`http://127.0.0.1:8000/load/layer/${layerId}`)
        .then(response => response.json())
        .then(data => {
            const newLayer = new VectorLayer({
                source: new VectorSource({
                    features: new GeoJSON().readFeatures(data.features), // Предполагается, что вы передаете данные в формате GeoJSON
                }),
                style: new Style({
                    stroke: new Stroke({
                        color: 'red',
                        width: 2,
                    }),
                    fill: new Fill({
                        color: 'rgba(255, 0, 0, 0.2)',
                    }),
                }),
            });
            this.map.addLayer(newLayer);
            this.layers.push(newLayer);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
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
