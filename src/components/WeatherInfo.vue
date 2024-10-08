<template>
  <div id="weather-info" class="weather-panel">Loading data...</div>
</template>

<script>
import arrowIcon from "../assets/arrow.png";

export default {
  name: "WeatherInfo",
  data() {
      return {
        arrowIcon: arrowIcon
      }
  },
  mounted() {
    console.log("test")
    this.fetchWeatherData();

    setInterval(this.fetchWeatherData, 60000);
  },
  methods: {
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
  },
};
</script>

<style>
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
  z-index: 1000;
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
