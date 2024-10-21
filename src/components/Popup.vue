<template>
  <div id="popup"></div>
</template>

<script>
export default {
  name: "Popup",
};
</script>

<style>
#popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  background-color: rgba(212, 212, 212, 0.8);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: auto;
  font-family: Arial, sans-serif;

  display: flex;
  flex-direction: column;
  gap: 0px;
  z-index: 1000;
}

.popup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0px;
  margin: 0px 12px;
}
</style>
