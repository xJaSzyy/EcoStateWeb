<template>
    <div class="panel-container">
      <div class="sliders">
        <!-- Добавляем v-model для каждого ползунка -->
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
  
        <!-- Аналогично для остальных ползунков -->
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
      </div>
  
      <button 
        class="build-button" 
        @click="emitSimulationData"
      >
        Построить
      </button>
    </div>
  </template>
  
  <script setup>
  import { reactive } from 'vue'
  
  const emit = defineEmits(['buildSimulation'])
  
  // Инициализируем данные формы
  const formData = reactive({
    ejectedTemp: 250,
    airTemp: 0,
    avgExitSpeed: 23,
    heightSource: 82.5,
    diameterSource: 6,
    windSpeed: 15
  })
  
  const emitSimulationData = () => {
    emit('buildSimulation', {
      ...formData,
      // Можно добавить преобразования данных
      heightSource: parseFloat(formData.heightSource),
      diameterSource: parseFloat(formData.diameterSource)
    })
  }
  </script>

<style scoped>
.panel-container {
  position: fixed;
  right: 0;
  top: 64px; 
  height: calc(100vh - 64px);
  width: 350px;
  padding: 20px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  overflow-y: auto;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.slider-row {
  display: flex;
  align-items: center;
}

.slider-row label {
  width: 250px;
  margin-right: 12px;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
}

.slider-row input[type="range"] {
  flex-grow: 1;
  min-width: 0;
}

.build-button {
  margin-top: 0; 
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  transition: background-color 0.3s ease;
  position: sticky;
  align-self: flex-start; 
}

.build-button:hover {
  background-color: #0056b3;
}
</style>
