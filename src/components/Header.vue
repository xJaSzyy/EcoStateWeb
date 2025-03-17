<template>
  <header class="header">
    <div class="logo" @click="goToMain">
      <svg class="logo_img" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <image :href="logoImage" width="48" height="48" />
      </svg>
      <span>EcoState</span>
    </div>
    <nav class="nav">
      <button class="nav-btn" v-on:click="goToAbout">О нас</button>
      <button class="nav-btn" v-on:click="goToLogin">Вход</button>
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
    },
    goToLogin() {
      this.$router.push("/login");
    },
    goToRegister() {
      this.$router.push("/registration");
    },
    goToAbout() {
      this.$router.push("/about");
    }
  }
};
</script>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 24px;
  background-color: white;
  height: 64px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo span {
  color: #4BA9FF;
  font-size: 20px;
  font-weight: 400;
  font-family: 'Montserrat', sans-serif; 
  font-style: normal;
  margin-left: 16px;
}

.nav {
  display: flex;
  position: relative;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 20px;
  font-weight: 400;
  font-family: 'Montserrat', sans-serif; 
  font-style: normal;
  color: #4BA9FF;
  width: 192px;
  height: 64px;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.nav-btn::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0px;
  bottom: 0px;
  transform: translateX(-50%);
  width: 16px;
  height: 64px;
  background-color: transparent;
  transition: background-color 0.3s, width 0.3s;
  z-index: -1;
}

.nav-btn:hover {
  color: white;
}

.nav-btn:hover::before {
  background-color: rgba(75, 169, 255, 1);
  width: 100%;
  height: 100%;
}
</style>