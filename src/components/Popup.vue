<template>
  <div id="popup" v-if="show" :style="{ top: y + 'px', left: x + 'px' }">
    <h3>{{ title }}</h3>
    <div class="popup-content">
      <slot></slot>
    </div>
    <button class="close-btn" @click="$emit('close')">Закрыть</button>
  </div>
</template>

<script>
export default {
  name: "Popup",
  props: {
    show: Boolean,
    title: String,
    x: Number,
    y: Number
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
  z-index: 1000;
  text-align: center;
  transform: translate(-50%, -100%); /* Чтобы окно не закрывало точку */
}

.close-btn {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.close-btn:hover {
  background: #cc0000;
}
</style>
