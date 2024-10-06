<template>
  <Header />
  <div id="map" style="height: 100vh; width: 100%"></div>
  <div id="weather-info" class="weather-panel">Loading data...</div>
  <svg width="0" height="0" id="gradients">
    <defs></defs>
  </svg>
</template>

<script>
import Header from "./Header.vue";
import L from "leaflet";
import arrowIcon from "../assets/arrow.png";

export default {
  name: "Map",
  components: {
    Header,
  },
  data() {
    return {
      arrowIcon: arrowIcon,
      circlesData: [
        {
          id: 1,
          coords: [55.350685, 85.995976],
          radius: 250,
          info: "Азот",
          centerColor: "rgba(255, 0, 0, 0.5)", // Красный в центре
          edgeColor: "rgba(255, 255, 0, 0.5)", // Желтый на краях
        },
        {
          id: 2,
          coords: [55.359522, 86.069663],
          radius: 250,
          info: "СКЭК",
          centerColor: "rgba(0, 255, 0, 0.5)", // Зеленый в центре
          edgeColor: "rgba(0, 0, 255, 0.5)", // Синий на краях
        },
        {
          id: 3,
          coords: [55.343786, 86.093681],
          radius: 250,
          info: "Кузнецкая проектная компания",
          centerColor: "rgba(0, 0, 255, 0.5)", // Синий в центре
          edgeColor: "rgba(255, 0, 255, 0.5)", // Фиолетовый на краях
        },
      ],
    };
  },
  mounted() {
    this.fetchWeatherData();

    setInterval(this.fetchWeatherData, 60000);
    const coord = [55.355198, 86.086847];

    const map = L.map("map", {
      zoomControl: false,
    }).setView(coord, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    this.circlesData.forEach((data, index) => {
      // Для каждой точки делаем запрос на данные
      this.fetchMathData(data.coords, data.centerColor, data.info, map);
    });
  },
  methods: {
    createGradient(centerColor, edgeColor, id, map, data) {
      const gradientId = `gradient-${id}`;

      const defs = document.getElementById("gradients").querySelector("defs");
      const gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient"
      );
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y2", "100%");

      const stop1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("style", `stop-color:${centerColor}; stop-opacity:1`);
      gradient.appendChild(stop1);

      const stop2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("style", `stop-color:${edgeColor}; stop-opacity:1`);
      gradient.appendChild(stop2);

      defs.appendChild(gradient);

      // Используем координаты из circlesData
      const circle = L.circle(data.coords, {
        // Замените на data.coords
        color: "transparent",
        fillColor: `url(#${gradientId})`,
        fillOpacity: 1,
        radius: data.radius,
      }).addTo(map);

      circle.bindPopup(`<b>${data.info}</b><br>Радиус: ${data.radius} метров`);
    },
    async fetchWeatherData() {
      fetch("http://127.0.0.1:8000/weather?city=Kemerovo")
        .then((response) => response.json())
        .then((data) => {
          const currentTime = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const weatherInfo = `
          <div class="weather-row">
            <span>${data.temperature}°C</span>
            <img src="https://openweathermap.org/img/wn/${data.icon}@2x.png" style="width: 48px; height: 48px;">
          </div>
          <div class="weather-row">
            <span>${data.wind_speed} м/с</span>
            <img src="${this.arrowIcon}" style="width: 24px; height: 24px; transform: rotate(${data.wind_direction}deg)">
          </div>
          <div class="weather-time">
            ${currentTime}
          </div>
          `;

          const weatherElement = document.getElementById("weather-info");
          if (weatherElement) {
            weatherElement.innerHTML = weatherInfo;
            console.log(new Date().toLocaleTimeString());
          } else {
            console.log("Элемент для отображения погоды не найден");
          }
        })
        .catch((error) => console.error("Ошибка при запросе погоды:", error));
    },
    async fetchMathData(coords, color, info, map) {
      try {
        const response = await fetch(
          "https://localhost:7017/api/concentration/random"
        );
        const data = await response.json();

        const maxElement = Math.max(...data.sp);
        const maxConcentrationDistance = data.sp.indexOf(maxElement) * 5;

        const circle = L.circle(coords, {
          color: "transparent",
          fillColor: color, 
          fillOpacity: 1,
          radius: maxConcentrationDistance,
        }).addTo(map);

        circle.bindPopup(
          `<b>${info}</b><br>Радиус: ${maxConcentrationDistance} метров`
        );
      } catch (error) {
        console.error("Ошибка при запросе данных:", error);
      }
    },
  },
};
</script>

<style>
#map {
  height: 100%;
  position: absolute;
  overflow: hidden;
}

#weather-info {
  z-index: 1000;
}

body {
  height: 100%;
  width: 100%;
  position: absolute;
}

.leaflet-control-attribution {
  display: none;
}

.leaflet-top.leaflet-right {
  top: 50%;
  transform: translateY(-50%);
  right: 10px;
}

header {
  background-color: rgba(0, 0, 0, 0);
}

header .buttons button {
  background-color: rgba(0, 0, 0, 0);
}

#weather-info {
  position: absolute;
  top: 20%;
  right: 20px;
  transform: translateY(-50%);

  background-color: rgba(212, 212, 212, 0.8);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: 128px;
  font-family: Arial, sans-serif;

  display: flex;
  flex-direction: column;
  gap: 0px;
}

.weather-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0px;
  margin: 0px 12px;
}

.weather-time {
  margin-top: 16px;
  margin-right: 12px;
  margin-left: 10px;
  margin-bottom: 8px;
}
</style>
