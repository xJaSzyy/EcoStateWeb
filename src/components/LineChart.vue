<template>
    <div>
      <Line :data="data" :options="chartOptions" />
    </div>
  </template>
  
  <script>
  import { defineComponent } from "vue";
  import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from "chart.js";
  import { Line } from "vue-chartjs";
  
  ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);
  
  export default defineComponent({
    name: "LineChart",
    components: { Line },
    props: { data: Object },
    setup() {
      return {
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: "Уровень выбросов PM2.5" }
          },
          scales: {
            x: { title: { display: true, text: "Время" } },
            y: { title: { display: true, text: "Концентрация (мкг/м³)" }, beginAtZero: true }
          }
        }
      };
    }
  });
  </script>
  