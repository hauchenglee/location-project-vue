<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 32,
  },
  tone: {
    type: String,
    default: 'ink',
  },
})
</script>

<template>
  <span class="brand-mark" :class="`brand-mark--${tone}`" :style="{ '--mark-size': `${size}px` }" aria-hidden="true">
    <svg viewBox="0 0 40 40" role="img">
      <g class="brand-mark__rings">
        <circle cx="20" cy="20" r="15" />
        <circle cx="20" cy="20" r="9.2" />
      </g>
      <g class="brand-mark__axes">
        <path d="M20 2v8M20 30v8M2 20h8M30 20h8" />
      </g>
      <circle class="brand-mark__core" cx="20" cy="20" r="3.1" />
      <circle class="brand-mark__node" cx="31" cy="9" r="3" />
    </svg>
  </span>
</template>

<style scoped>
.brand-mark {
  width: var(--mark-size);
  height: var(--mark-size);
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--ink, #14150f);
}

.brand-mark svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.brand-mark__rings,
.brand-mark__axes {
  fill: none;
  stroke: currentColor;
}

.brand-mark__rings circle:first-child {
  opacity: 0.34;
  stroke-width: 1;
}

.brand-mark__rings circle:last-child {
  opacity: 0.58;
  stroke-width: 1.1;
}

.brand-mark__axes {
  opacity: 0.72;
  stroke-width: 1.1;
}

.brand-mark__core {
  fill: currentColor;
}

.brand-mark__node {
  fill: var(--vermilion, #c3472c);
}

.brand-mark--paper {
  color: var(--paper, #f6f1e6);
}
</style>
