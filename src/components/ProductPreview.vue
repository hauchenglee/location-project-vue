<script setup>
const metrics = [
  { key: 'business', label: '商業', value: 94 },
  { key: 'population', label: '人口', value: 89 },
  { key: 'people', label: '人潮', value: 92 },
  { key: 'transit', label: '交通', value: 91 },
]

const areas = [
  { label: '生活圈 01', value: 92, active: true },
  { label: '生活圈 02', value: 87 },
  { label: '生活圈 03', value: 79 },
]
</script>

<template>
  <div class="app-preview">
    <div class="app-preview__bar">
      <span class="app-preview__dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="app-preview__url">luozi / 區位分析</span>
      <span class="app-preview__status"><i aria-hidden="true"></i> 分析完成</span>
    </div>

    <div class="app-preview__body">
      <div class="app-preview__map" aria-hidden="true">
        <span class="map-road map-road--a"></span>
        <span class="map-road map-road--b"></span>
        <span class="map-road map-road--c"></span>
        <span class="map-block map-block--a"></span>
        <span class="map-block map-block--b"></span>
        <span class="map-block map-block--c"></span>
        <span class="map-ring"></span>
        <span class="map-pin map-pin--one">1</span>
        <span class="map-pin map-pin--two">2</span>
        <span class="map-pin map-pin--three">3</span>
        <span class="map-area-label">台北市 · 大安區</span>
        <span class="map-scale">500 m</span>
      </div>

      <aside class="app-preview__panel">
        <div class="app-preview__score">
          <span>綜合評分</span>
          <b>92</b>
          <small>/ 100</small>
        </div>

        <div class="app-preview__metrics">
          <div v-for="metric in metrics" :key="metric.key" class="app-preview__metric">
            <div>
              <span>{{ metric.label }}</span>
              <b>{{ metric.value }}</b>
            </div>
            <i :style="{ width: `${metric.value}%` }"></i>
          </div>
        </div>

        <div class="app-preview__list-head">
          <span>候選生活圈</span>
          <small>5</small>
        </div>
        <div class="app-preview__list">
          <div
            v-for="area in areas"
            :key="area.label"
            class="app-preview__area"
            :class="{ active: area.active }"
          >
            <span>{{ area.label }}</span>
            <b>{{ area.value }}</b>
          </div>
        </div>
      </aside>
    </div>

    <div class="app-preview__foot">
      <span>示意資料</span>
      <span>5 個生活圈</span>
      <strong>查看完整分析 →</strong>
    </div>
  </div>
</template>

<style scoped>
.app-preview {
  width: min(100%, 640px);
  overflow: hidden;
  border: 1px solid rgba(20, 21, 15, 0.18);
  border-radius: 16px;
  background: #fcf9f1;
  color: var(--ink);
  box-shadow:
    0 50px 90px -40px rgba(0, 0, 0, 0.72),
    0 0 0 1px rgba(246, 241, 230, 0.08);
}

.app-preview__bar {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line);
  background: #f6f1e6;
}

.app-preview__dots {
  display: flex;
  gap: 4px;
}

.app-preview__dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c9c2b2;
}

.app-preview__url {
  flex: 1;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.04em;
}

.app-preview__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--jade);
  font-family: var(--font-sans);
  font-size: 7.5px;
  letter-spacing: 0.04em;
}

.app-preview__status i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--jade);
}

.app-preview__body {
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(190px, 0.78fr);
  min-height: 350px;
}

.app-preview__map {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(rgba(20, 21, 15, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 21, 15, 0.045) 1px, transparent 1px),
    #eee6d6;
  background-size: 34px 34px;
}

.map-road {
  position: absolute;
  background: #fbf7ee;
  box-shadow: 0 0 0 1px rgba(20, 21, 15, 0.07);
}

.map-road--a {
  top: 8%;
  left: -20%;
  width: 150%;
  height: 9px;
  transform: rotate(-18deg);
}

.map-road--b {
  top: 52%;
  left: -20%;
  width: 150%;
  height: 12px;
  transform: rotate(8deg);
}

.map-road--c {
  top: -20%;
  left: 62%;
  width: 8px;
  height: 150%;
  transform: rotate(9deg);
}

.map-block {
  position: absolute;
  border: 1px solid rgba(20, 21, 15, 0.05);
  background: rgba(252, 249, 241, 0.58);
}

.map-block--a {
  top: 16%;
  left: 10%;
  width: 24%;
  height: 22%;
}

.map-block--b {
  right: 8%;
  bottom: 15%;
  width: 30%;
  height: 26%;
}

.map-block--c {
  top: 30%;
  right: 26%;
  width: 15%;
  height: 17%;
}

.map-ring {
  position: absolute;
  top: 47%;
  left: 52%;
  width: 150px;
  height: 150px;
  border: 1px dashed rgba(195, 71, 44, 0.48);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.map-pin {
  position: absolute;
  z-index: 2;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 2px solid #fcf9f1;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-mono);
  font-size: 8px;
  box-shadow: 0 4px 12px rgba(20, 21, 15, 0.25);
}

.map-pin--one {
  top: 47%;
  left: 52%;
  background: var(--vermilion);
  transform: translate(-50%, -50%);
}

.map-pin--two {
  top: 25%;
  left: 76%;
}

.map-pin--three {
  top: 67%;
  left: 24%;
}

.map-area-label {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 7px;
  border: 1px solid rgba(20, 21, 15, 0.1);
  background: rgba(252, 249, 241, 0.88);
  color: var(--ink-2);
  font-family: var(--font-sans);
  font-size: 7.5px;
}

.map-scale {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding-left: 14px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 7px;
}

.map-scale::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 10px;
  height: 1px;
  background: var(--muted);
}

.app-preview__panel {
  min-width: 0;
  padding: 16px 15px;
  border-left: 1px solid var(--line);
  background: #fffdf8;
}

.app-preview__score {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.app-preview__score span {
  align-self: flex-start;
  margin-right: auto;
  padding-top: 4px;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 7.5px;
  letter-spacing: 0.04em;
}

.app-preview__score b {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
}

.app-preview__score small {
  color: var(--muted-2);
  font-family: var(--font-mono);
  font-size: 7px;
}

.app-preview__metrics {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}

.app-preview__metric > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.app-preview__metric span {
  color: var(--muted);
  font-size: 8.5px;
}

.app-preview__metric b {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-weight: 500;
}

.app-preview__metric i {
  display: block;
  height: 2px;
  margin-top: 3px;
  background: var(--vermilion);
}

.app-preview__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 8px;
}

.app-preview__list-head small {
  font-family: var(--font-mono);
  font-size: 7.5px;
}

.app-preview__list {
  display: grid;
  gap: 4px;
  margin-top: 7px;
}

.app-preview__area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 7px;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 7.5px;
}

.app-preview__area b {
  color: var(--ink-2);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}

.app-preview__area.active {
  background: var(--vermilion-2);
  color: rgba(255, 248, 234, 0.7);
}

.app-preview__area.active b {
  color: #fff8ea;
}

.app-preview__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 10px 14px;
  border-top: 1px solid var(--line);
  background: #f6f1e6;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 7.5px;
}

.app-preview__foot strong {
  margin-left: auto;
  color: var(--vermilion-2);
  font-family: var(--font-sans);
  font-size: 8.5px;
  font-weight: 700;
}

@media (max-width: 560px) {
  .app-preview__body {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .app-preview__map {
    min-height: 190px;
  }

  .app-preview__panel {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .app-preview__score b {
    font-size: 34px;
  }

  .app-preview__metrics {
    grid-template-columns: 1fr 1fr;
    gap: 8px 14px;
  }

  .app-preview__list {
    grid-template-columns: repeat(3, 1fr);
  }

  .app-preview__area {
    align-items: flex-start;
    flex-direction: column;
    gap: 1px;
    padding: 6px;
    border: 1px solid var(--line);
  }

  .app-preview__foot span:nth-child(2) {
    display: none;
  }
}
</style>
