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
      windSpeed: 0,
      airTemp: 0,
      currentTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  },
  watch: {
    windSpeed(newVal) {
      this.emitWeatherData();
    },
    airTemp(newVal) {
      this.emitWeatherData();
    },
    windDirection(newVal) {
      this.emitWeatherData();
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
            <span>${data.temperature}°C</span>
            <img src="${data.iconUrl}" style="width: 48px; height: 48px;">
          </div>
          <div class="weather-row">
            <span>${data.windSpeed} м/с</span>
            <img src="${this.arrowIcon}" style="width: 24px; height: 24px; transform: rotate(${data.windDirection}deg)">
          </div>
          <div class="weather-time">
            ${this.currentTime}
          </div>
          `;

          this.windDirection = data.windDirection;
          this.windSpeed = data.windSpeed;
          this.airTemp = data.temperature;

          this.$nextTick(() => {
            this.emitWeatherData();
          });

          const weatherElement = document.getElementById("weather-info");
          if (weatherElement) {
            weatherElement.innerHTML = weatherInfo;
          }
        })
        .catch((error) => console.error("Error weather request", error));
    },
    emitWeatherData() {
      this.$emit("weatherDataUpdated", {
        windSpeed: this.windSpeed,
        airTemp: this.airTemp,
        windDirection: this.windDirection,
      });
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
  top: 108px; 
  right: 24px;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  width: 120px;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 999;
  text-align: left;
}


.weather-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.weather-time {
  font-size: 16px;
  margin-top: 6px;
  margin-left: 2px;
}

.weather-icon {
  width: 24px;
  height: 24px;
}

.wind-icon {
  width: 16px;
  height: 16px;
}
</style>


