<script setup>
defineProps({
  title: {
    type: String,
    default: '地圖需要 WebGL2',
  },
  description: {
    type: String,
    default: '目前的瀏覽器沒有開啟 WebGL2，互動地圖暫時無法顯示。你仍然可以輸入座標、設定範圍並完成分析。',
  },
})
</script>

<template>
  <div class="map-fallback">
    <div class="map-fallback-grid" aria-hidden="true"></div>
    <span class="map-fallback-ring map-fallback-ring--one" aria-hidden="true"></span>
    <span class="map-fallback-ring map-fallback-ring--two" aria-hidden="true"></span>
    <span class="map-fallback-ring map-fallback-ring--three" aria-hidden="true"></span>
    <div class="map-fallback-content">
      <span class="map-fallback-stone" aria-hidden="true"></span>
      <p class="map-fallback-kicker">MAP / 地圖</p>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <small>ENABLE WEBGL2 TO SEE THE BOARD</small>
    </div>
  </div>
</template>

<style scoped>
.map-fallback {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 48%, rgba(217, 183, 124, 0.2), transparent 34%),
    var(--paper-2);
  color: var(--ink);
}

.map-fallback-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(20, 21, 15, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 21, 15, 0.07) 1px, transparent 1px);
  background-size: 11.111% 11.111%;
}

.map-fallback-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px dashed rgba(20, 21, 15, 0.26);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.map-fallback-ring--one {
  width: 22vmin;
  height: 22vmin;
}

.map-fallback-ring--two {
  width: 42vmin;
  height: 42vmin;
}

.map-fallback-ring--three {
  width: 64vmin;
  height: 64vmin;
}

.map-fallback-content {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(78%, 340px);
  padding: 24px;
  border: 1px solid var(--line-strong);
  background: rgba(252, 249, 241, 0.9);
  box-shadow: var(--shadow-card);
  text-align: center;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(6px);
}

.map-fallback-stone {
  display: block;
  width: 24px;
  height: 24px;
  margin: 0 auto 14px;
  border: 1px solid rgba(246, 241, 230, 0.2);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 26%, #6b6d5e 0%, #2b2d24 38%, #0f100a 100%);
  box-shadow: 0 6px 14px rgba(20, 21, 15, 0.3);
}

.map-fallback-kicker {
  color: var(--vermilion);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.18em;
}

.map-fallback h3 {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.map-fallback p:not(.map-fallback-kicker) {
  margin-top: 7px;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.75;
}

.map-fallback small {
  display: block;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  color: var(--muted-2);
  font-family: var(--font-mono);
  font-size: 7.5px;
  letter-spacing: 0.12em;
}
</style>
