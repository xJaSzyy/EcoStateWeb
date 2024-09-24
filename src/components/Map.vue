<template>
  <div id="map" style="height: 100vh; width: 100%"></div>
</template>

<script>
import L from "leaflet";

export default {
  name: "Map",
  mounted() {
    const coord = [55.355198, 86.086847];

    const map = L.map("map").setView(coord, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const circlesData = [
      {
        coords: [55.350685, 85.995976],
        radius: 250,
        info: "Азот",
        color: "red",
      },
      {
        coords: [55.359522, 86.069663],
        radius: 250,
        info: "СКЭК",
        color: "green",
      },
      {
        coords: [55.343786, 86.093681],
        radius: 250,
        info: "Кузнецкая проектная компания",
        color: "orange",
      },
    ];

    circlesData.forEach(function (data) {
      const circle = L.circle(data.coords, {
        color: data.color,
        fillColor: data.color,
        fillOpacity: 0.5,
        radius: data.radius,
      }).addTo(map);

      circle.bindPopup(`<b>${data.info}</b><br>Радиус: ${data.radius} метров`);
    });
  }
};
</script>

<style>
#map {
  height: 100%;
  position: absolute;
  overflow: hidden;
}

body {
  height: 100%;
  width: 100%;
  position: absolute;
}

.leaflet-control-attribution {
  display: none;
}
</style>
