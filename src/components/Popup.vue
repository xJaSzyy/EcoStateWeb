<template>
  <div id="popup" v-if="show" :style="{ top: y + 'px', left: x + 'px' }">
    <h3>{{ title }}</h3>

    <div class="popup-content">
      <div v-if="featureInfo">
        <div class="popup-row"><b>Название:</b> {{ featureInfo.name }}</div>
        <div class="popup-row"><b>Диаметр источника:</b> {{ featureInfo.diameterSource }} м</div>
        <div class="popup-row"><b>Высота источника:</b> {{ featureInfo.heightSource }} м</div>
      </div>

      <div v-if="chartData">
        <LineChart :data="chartData" />
      </div>
    </div>

    <button class="change-btn" @click="$emit('change')">Изменить</button>
    <button class="close-btn" @click="$emit('close')">Закрыть</button>
  </div>
</template>

<script>
import LineChart from "@/components/LineChart.vue";

export default {
  name: "Popup",
  components: { LineChart },
  props: {
    show: Boolean,
    title: String,
    x: Number,
    y: Number,
    featureInfo: Object, 
    chartData: Object 
  }
};
</script>

<style>
#popup {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1;
  text-align: left;
  transform: translate(-50%, -100%);
}

.popup-row {
  font-size: 14px;
  margin-bottom: 4px;
}

.close-btn {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.close-btn:hover {
  background: #cc0000;
}

.change-btn {
  background: #4d91ff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.change-btn:hover {
  background: #0e55c8;
}
</style>
