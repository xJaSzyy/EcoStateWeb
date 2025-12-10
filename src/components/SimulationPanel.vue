<template>
  <div class="panel-container">
    <div class="panel-header">
      <h3>Параметры моделирования</h3>
      <button class="close-button" @click="emitClose" aria-label="Закрыть панель">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    
    <div class="sliders">
      <div class="slider-row">
        <label>Температура выбрасываемой ГВС:</label>
        <input
          v-model.number="formData.ejectedTemp"
          type="range"
          min="235"
          max="265"
          step="1"
        />
        <span>{{ formData.ejectedTemp }}°C</span>
      </div>

      <div class="slider-row">
        <label>Температура атмосферного воздуха:</label>
        <input
          v-model.number="formData.airTemp"
          type="range"
          min="-40"
          max="40"
          step="1"
        />
        <span>{{ formData.airTemp }}°C</span>
      </div>

      <div class="slider-row">
        <label>Средняя скорость выхода ГВС:</label>
        <input
          v-model.number="formData.avgExitSpeed"
          type="range"
          min="15"
          max="31"
          step="1"
        />
        <span>{{ formData.avgExitSpeed }} м/с</span>
      </div>

      <div class="slider-row">
        <label>Высота источника выброса:</label>
        <input
          v-model.number="formData.heightSource"
          type="range"
          min="15"
          max="150"
          step="1"
        />
        <span>{{ formData.heightSource }} м</span>
      </div>

      <div class="slider-row">
        <label>Диаметр устья источника:</label>
        <input
          v-model.number="formData.diameterSource"
          type="range"
          min="1"
          max="11"
          step="1"
        />
        <span>{{ formData.diameterSource }} м</span>
      </div>

      <div class="slider-row">
        <label>Скорость ветра:</label>
        <input
          v-model.number="formData.windSpeed"
          type="range"
          min="0"
          max="30"
          step="1"
        />
        <span>{{ formData.windSpeed }} м/с</span>
      </div>

      <div class="slider-row">
        <label>Направление ветра:</label>
        <input
            v-model.number="formData.windDirection"
            type="range"
            min="0"
            max="360"
            step="15"
            @input="updateWindDirection"
        />
        <span>{{ formData.windDirection }}°</span>
      </div>

      <div class="wind-direction-display">
        <div class="compass">
          <div class="compass-rose">
            <div class="compass-point" v-for="(point, index) in compassPoints"
                 :key="index" :style="{ transform: `rotate(${point.deg}deg)` }">
              {{ point.label }}
            </div>
            <div class="wind-arrow" :style="{ transform: `rotate(${formData.windDirection}deg)` }">
              ↑
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

const emit = defineEmits(["buildSimulation", "close"]); 

const props = defineProps({
  startData: Object,
});

const formData = reactive({
  ejectedTemp: 250,
  airTemp: 0,
  avgExitSpeed: 23,
  heightSource: 82.5,
  diameterSource: 6,
  windSpeed: 15,
  windDirection: 0
});

watch(
  () => props.startData,
  (newData) => {
    if (newData) {
      Object.assign(formData, newData);
    }
  },
  { immediate: true }
);

watch(
  formData,
  () => {
    emitSimulationData();
  },
  { deep: true }
);

const emitSimulationData = () => {
  emit("buildSimulation", {
    ...formData,
    heightSource: parseFloat(formData.heightSource),
    diameterSource: parseFloat(formData.diameterSource),
  });
};

const emitClose = () => {
  emit("close");
};
</script>


<style scoped>
.panel-container {
  position: fixed;
  right: 0;
  top: 64px;
  height: calc(100vh - 64px);
  width: 380px;
  padding: 20px;
  background: #ffffff;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  overflow-y: auto;
  border-left: 1px solid #e0e0e0;
  transition: transform 0.3s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 8px;
  line-height: 1;
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover, .close-button:focus {
  color: #333;
  background-color: #f0f0f0;
  outline: none;
}

.close-button svg {
  pointer-events: none;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 0;
  flex-grow: 1;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.slider-row label {
  width: 220px;
  font-weight: 500;
  font-size: 14px;
  color: #444;
}

.slider-row input[type="range"] {
  flex-grow: 1;
  min-width: 0;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
}

.slider-row span {
  min-width: 60px;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.build-button {
  margin-top: auto;
  margin-bottom: 32px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  transition: all 0.3s ease;
  align-self: flex-start;
  width: 100%;
}

.build-button:hover {
  background-color: #0056b3;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}
</style>