<template>
  <div id="weather-info" class="weather-panel">Loading data...</div>
</template>

<script>
import arrowIcon from "../assets/arrow.png";
import { API_BASE_URL } from "../api/config";

export default {
  name: "WeatherInfo",
  data() {
    return {
      arrowIcon: arrowIcon,
      windDirection: 0,
      currentTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  },
  watch: {
    windDirection(newVal) {
      this.$emit("windDirectionChanged", newVal);
    },
  },
  mounted() {
    this.fetchWeatherData();
    this.updateTime();

    setInterval(this.updateTime, 1000);

    setInterval(this.fetchWeatherData, 600000);
  },
  methods: {
    async fetchWeatherData() {
      fetch(API_BASE_URL + "/currentWeather-get?city=Kemerovo")
        .then((response) => response.json())
        .then((data) => {
          const weatherInfo = `
          <div class="weather-row">
            <span>${data.content.temperature}°C</span>
            <img src="${data.content.iconUrl}" style="width: 48px; height: 48px;">
          </div>
          <div class="weather-row">
            <span>${data.content.windSpeed} м/с</span>
            <img src="${this.arrowIcon}" style="width: 24px; height: 24px; transform: rotate(${data.content.windDirection}deg)">
          </div>
          <div class="weather-time">
            ${this.currentTime}
          </div>
          `;

          this.windDirection = data.content.windDirection;

          const weatherElement = document.getElementById("weather-info");
          if (weatherElement) {
            weatherElement.innerHTML = weatherInfo;
          }

          /*this.saveWeatherData({
            temperature: data.temperature,
            wind_speed: data.wind_speed,
            wind_direction: data.wind_direction,
          });*/
        })
        .catch((error) => console.error("Error weather request", error));
    },
    async saveWeatherData(weatherData) {
      try {
        const response = await fetch("http://127.0.0.1:8000/save_weather/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(weatherData),
        });
        const result = await response.json();
        console.log("Результат сохранения данных:", result);
      } catch (error) {
        console.error("Ошибка при сохранении данных:", error);
      }
    },
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const weatherElement = document.getElementById("weather-info");
      if (weatherElement) {
        const timeElement = weatherElement.querySelector(".weather-time");
        if (timeElement) {
          timeElement.textContent = this.currentTime;
        }
      }
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
