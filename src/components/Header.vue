<script>
import logoImage from "@/assets/logo.png";

export default {
  name: 'Header',
  props: {
    showButtons: {
      type: Boolean,
      default: true
    },
    isTransparent: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedLayer: "smallParticles",
      showRadio: false,
      logoImage
    };
  },
  methods: {
    goToMain() {
      this.$router.push('/');
    },
    goToLogin() {
      this.$router.push('/login');
    },
    goToRegistration() {
      this.$router.push('/registration');
    },
    updateLayer() {
      this.$emit("layerChanged", this.selectedLayer); // Отправляем выбранный слой вверх
    },
  }
}
</script>

<template>
  <header :class="{ transparent: isTransparent }">
    <a @click="goToMain" class="logo">
      <svg class="logo_img" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <image :href="logoImage" width="64" height="64" />
      </svg>
      <span>EcoState</span>
    </a>
    <div class="tools" v-if="!showButtons">
      <teleport to="body">
        <div class="radio-group">
          <label>
            <input type="radio" v-model="selectedLayer" value="smallParticles" @change="updateLayer" />
            Мелкие частицы
          </label>
          <label>
            <input type="radio" v-model="selectedLayer" value="otherParticles" @change="updateLayer" />
            Другие частицы
          </label>
        </div>
      </teleport>
    </div>
  </header>
</template>

<style>
header,
.logo {
  display: flex;
  align-items: center;
  padding: 10px;
}

header.transparent {
  background-color: transparent;
}

header .logo {
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 24px;
}


header .logo span {
  color: #76A34F;
  font-size: 32px;
  display: inline-block;
  vertical-align: middle;
  font-family: 'MS PGothic';
}

header .buttons,
.tools {
  display: inline-block;
  vertical-align: middle;
  margin-left: auto;
  margin-right: 8px;
}

header .buttons button {
  background-color: white;
  border-radius: 100px;
  height: 36px;
  padding: 8px 16px;
  font-size: 16px;
  margin-right: 16px;
  cursor: pointer;
  border: 2px solid black;
  font-weight: bolder;
}

header .buttons button:hover {
  border-color: #76A34F;
  color: #76A34F;
}

header .buttons button:last-child {
  margin-right: 0;
}

.layer-toggle {
  position: relative;
  width: 50px;
  height: 50px;
}

.toggle-button {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-group {
  position: fixed;
  top: 24px; 
  right: 24px; 
  background: white;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: max-content;
  z-index: 1000; 
}



label {
  display: block;
  padding: 5px 10px;
  cursor: pointer;
}

input[type="radio"] {
  margin-right: 8px;
}

.icon-style {
  width: 24px;
  height: 24px;
}
</style>