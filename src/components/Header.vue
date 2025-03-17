<template>
  <header class="header">
    <div class="logo" @click="goToMain">
      <svg class="logo_img" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <image :href="logoImage" width="64" height="64" />
      </svg>
      <span>EcoState</span>
    </div>
    <nav class="nav">
      <button class="nav-btn">О нас</button>
      <button class="nav-btn">Вход</button>
    </nav>
  </header>
</template>

<script>
import logoImage from "@/assets/LogoBlue.png";
import "@/assets/main.css";

export default {
  name: "Header",
  data() {
    return {
      logoImage
    };
  },
  methods: {
    goToMain() {
      this.$router.push("/");
    }
  }
};
</script>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 64px;
  background-color: white;
  border-top: 4px solid #333;
  height: 80px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15); /* Усиленная тень */
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo span {
  color: #007bff;
  font-size: 24px;
  font-weight: bold;
  margin-left: 16px;
}

.nav {
  display: flex;
  gap: 124px;
  position: relative;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 20px; 
  font-weight: 600; 
  font-family: 'Montserrat', sans-serif; 
  color: #007bff;
  cursor: pointer;
  position: relative;
  padding: 32px 0;
  transition: color 0.3s;
}

.nav-btn::before {
  content: "";
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 62px;
  height: 96px; 
  background-color: transparent;
  transition: background-color 0.3s, width 0.3s;
  z-index: -1;
}

.nav-btn:hover {
  color: white;
}

.nav-btn:hover::before {
  background-color: rgba(75, 169, 255, 1);
  width: 180px; 
}
</style>