import './assets/main.css';
import 'leaflet/dist/leaflet.css';

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';

import About from './components/Main.vue';
import Login from './components/Login.vue';
import Registration from './components/Registration.vue';
import Map from './components/TestMap.vue';

const routes = [
    { path: '/', component: Map },
    { path: '/login', component: Login },
    { path: '/register', component: Registration },
    { path: '/about', component: About }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
  });

const app = createApp(App)
app.use(router)
app.mount('#app')