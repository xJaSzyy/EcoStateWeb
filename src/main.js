import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';

import Main from './components/Main.vue';
import Login from './components/Login.vue';
import Registration from './components/Registration.vue';
import Map from './components/Map.vue';

const routes = [
    { path: '/', component: Main },
    { path: '/login', component: Login },
    { path: '/registration', component: Registration },
    { path: '/map', component: Map }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
  });

const app = createApp(App)
app.use(router)
app.mount('#app')