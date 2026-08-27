<script setup>
import { computed } from 'vue'

const props = defineProps({
  industry: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
  expandedCodes: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select', 'toggle'])

const hasChildren = computed(() => Boolean(props.industry.children?.length))
const isExpanded = computed(() => props.expandedCodes.has(props.industry.industryCode))
const optionStyle = computed(() => ({
  paddingLeft: `${12 + Math.max(props.industry.levelNo - 1, 0) * 18}px`,
}))

const handleOptionClick = () => {
  if (hasChildren.value) {
    emit('toggle', props.industry.industryCode)
    return
  }

  emit('select', props.industry.industryCode)
}
</script>

<template>
  <div>
    <div class="industry-tree-row" :style="optionStyle">
      <button
        v-if="hasChildren"
        class="industry-toggle"
        type="button"
        :aria-label="isExpanded ? '收合產業類別' : '展開產業類別'"
        @click="emit('toggle', industry.industryCode)"
      >
        {{ isExpanded ? '-' : '+' }}
      </button>
      <span v-else class="industry-toggle-spacer"></span>

      <button
        class="industry-option tree"
        type="button"
        :class="{
          selected: !hasChildren && industry.industryCode === modelValue,
          parent: hasChildren,
        }"
        @click="handleOptionClick"
      >
        <span class="industry-option-main">
          <span class="industry-code">{{ industry.industryCode }}</span>
          <span class="industry-name">{{ industry.name }}</span>
        </span>
      </button>
    </div>

    <template v-if="hasChildren && isExpanded">
      <IndustryCodeNode
        v-for="child in industry.children"
        :key="child.industryCode"
        :industry="child"
        :model-value="modelValue"
        :expanded-codes="expandedCodes"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </template>
  </div>
</template>
