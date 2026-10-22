<script setup>
import { computed, ref, watch } from 'vue'
import {
  findAdminDistrictByCode,
  flattenAdminDistricts,
  formatAdminDistrict,
} from '@/utils/adminAreas'

const props = defineProps({
  counties: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

const districts = computed(() => flattenAdminDistricts(props.counties))
const selectedDistrict = computed(() =>
  findAdminDistrictByCode(districts.value, props.modelValue),
)
const districtLabel = computed(() => formatAdminDistrict(selectedDistrict.value))
const selectedCountyCode = ref('')
const selectedCounty = computed(() => props.counties.find(
  (county) => String(county.countyCode) === selectedCountyCode.value,
))
const countyDistricts = computed(() => flattenAdminDistricts(selectedCounty.value ? [selectedCounty.value] : []))

// Map picks, quick spots and form resets backfill both fields without running
// the user-only county-change handler or replacing the district with its first.
watch(selectedDistrict, (district) => {
  selectedCountyCode.value = district ? String(district.countyCode) : ''
}, { immediate: true })

const handleCountyChange = (event) => {
  const code = event.target.value
  if (code === selectedCountyCode.value) return
  selectedCountyCode.value = code
  const district = countyDistricts.value[0]
  // Let the existing parent handler compare the point's current district before
  // updating modelValue, so selecting the same district keeps its exact point.
  if (district) emit('select', district)
}

const handleChange = (event) => {
  const code = event?.target?.value || ''
  const district = findAdminDistrictByCode(countyDistricts.value, code)
  if (district) emit('select', district)
}
</script>

<template>
  <div class="locator-card">
    <div class="locator-head">
      <div class="locator-title">
        <span class="locator-pin" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 21s7-6.05 7-11a7 7 0 1 0-14 0c0 4.95 7 11 7 11Z" stroke="currentColor" stroke-width="1.5" />
            <circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </span>
        <span>
          <small>POINT NAME</small>
          <strong>行政區快速定位</strong>
        </span>
      </div>
      <span class="locator-scope">雙向同步</span>
    </div>

    <div class="locator-fields">
      <div class="field locator-field">
        <label for="adminCounty">縣市</label>
        <select
          id="adminCounty"
          :value="selectedCountyCode"
          :disabled="loading || !counties.length"
          @change="handleCountyChange"
        >
          <option value="" disabled>{{ loading ? '載入縣市…' : '選擇縣市' }}</option>
          <option
            v-for="county in counties"
            :key="county.countyCode"
            :value="String(county.countyCode)"
          >
            {{ county.countyName }}
          </option>
        </select>
      </div>
      <div class="field locator-field">
        <label for="adminDistrict">行政區</label>
        <select
          id="adminDistrict"
          :value="String(modelValue || '')"
          :disabled="loading || !selectedCounty || !countyDistricts.length"
          @change="handleChange"
        >
          <option value="" disabled>{{ loading ? '載入行政區…' : selectedCounty ? '選擇行政區' : '請先選擇縣市' }}</option>
          <option
            v-for="district in countyDistricts"
            :key="district.townCode"
            :value="String(district.townCode)"
          >
            {{ district.townName }}
          </option>
        </select>
      </div>
    </div>
    <div class="field-note locator-note">切換縣市會選取該縣市的第一個行政區；選不同區會移到代表點，同區保留目前位置。</div>

    <div class="locator-status" :class="{ 'is-selected': selectedDistrict }">
      <span class="locator-status-dot" aria-hidden="true"></span>
      <div class="locator-status-copy">
        <strong>{{ districtLabel || '未對應行政區' }}</strong>
        <p v-if="selectedDistrict">名稱會跟著右側中心點更新；拖拽地圖標記可微調位置。</p>
        <p v-else>目前中心點不在雙北資料範圍內，或行政區資料尚未載入。</p>
      </div>
    </div>

    <p v-if="error" class="locator-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.locator-card {
  position: relative;
  margin-top: 2px;
  padding: 15px 15px 13px;
  border: 1px solid var(--line-strong);
  border-left: 2px solid rgba(138, 106, 58, 0.55);
  border-radius: var(--radius);
  background-color: rgba(252, 249, 241, 0.82);
  background-image: radial-gradient(rgba(20, 21, 15, 0.045) 0.6px, transparent 0.6px);
  background-size: 12px 12px;
}

.locator-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.locator-title {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.locator-title > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.locator-title small {
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.18em;
  line-height: 1.2;
}

.locator-title strong {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.locator-pin {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(138, 106, 58, 0.28);
  border-radius: 50%;
  background: rgba(138, 106, 58, 0.08);
  color: var(--gold);
}

.locator-pin svg {
  width: 14px;
  height: 14px;
}

.locator-scope {
  flex: 0 0 auto;
  margin-top: 2px;
  padding: 3px 7px;
  border: 1px solid rgba(138, 106, 58, 0.28);
  border-radius: 999px;
  background: rgba(138, 106, 58, 0.08);
  color: var(--gold);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.locator-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.locator-field { min-width: 0; }

.locator-field label {
  color: var(--muted);
  font-size: 10px;
}

.locator-field select {
  min-height: 42px;
  background-color: rgba(255, 253, 248, 0.9);
  font-size: 13px;
}

.locator-note {
  margin-top: 5px;
}

@media (max-width: 480px) {
  .locator-fields { grid-template-columns: 1fr; }
}

.locator-status {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px dashed var(--line);
}

.locator-status-dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  margin-top: 5px;
  border: 1px solid var(--muted-2);
  border-radius: 50%;
  background: transparent;
}

.locator-status.is-selected .locator-status-dot {
  border-color: var(--gold);
  background: var(--gold);
  box-shadow: 0 0 0 3px rgba(138, 106, 58, 0.12);
}

.locator-status-copy {
  min-width: 0;
}

.locator-status-copy strong {
  display: block;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.locator-status-copy p {
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}

.locator-error {
  margin-top: 9px;
  color: var(--warning);
  font-size: 9.5px;
  line-height: 1.55;
}
</style>
