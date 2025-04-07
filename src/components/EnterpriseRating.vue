<template>
    <div class="enterprise-rating">
      <h3>Рейтинг предприятий</h3>
      <label>
        Сортировать по:
        <select v-model="sortBy">
          <option value="place">Месту</option>
          <option value="name">Названию</option>
          <option value="city">Городу</option>
        </select>
      </label>
      <ul>
        <li v-for="enterprise in sortedEnterprises" :key="enterprise.id">
          <strong>{{ enterprise.place }}.</strong>
          {{ enterprise.name }} <br />
          <span class="city">{{ enterprise.city }}</span>
        </li>
      </ul>
    </div>
  </template>
  

  <script setup>
  import { ref, onMounted, computed } from "vue";
  import axios from "axios";
  import { API_BASE_URL } from "../api/config";
  
  const enterprises = ref([]);
  const sortBy = ref("place"); // выбранный способ сортировки
  
  onMounted(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enterprise/rating/5`);
      enterprises.value = response.data;
    } catch (error) {
      console.error("Ошибка при загрузке рейтинга предприятий:", error);
    }
  });
  
  const sortedEnterprises = computed(() => {
    return [...enterprises.value].sort((a, b) => {
      const key = sortBy.value;
      if (key === "place") return a.place - b.place;
      return a[key].localeCompare(b[key], "ru", { sensitivity: "base" });
    });
  });
  </script>
  

<style scoped>
.enterprise-rating {
  position: absolute;
  top: 88px;
  left: 24px;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  width: 120px;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 999;
  text-align: left;
}

.enterprise-rating h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.enterprise-rating ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.enterprise-rating li {
  margin-bottom: 8px;
  line-height: 1.4;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.enterprise-rating .city {
  color: #555;
  font-size: 13px;
}

.enterprise-rating label {
    font-size: 13px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .enterprise-rating select {
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 13px;
  }
  
</style>
