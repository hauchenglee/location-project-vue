<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IndustryCodeNode from '@/components/IndustryCodeNode.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '請選擇產業類別',
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const normalizeIndustryCodeForApi = (industryCode) => String(industryCode || '').replace(/[^0-9A-Za-z]/g, '')

const rootEl = ref(null)
const searchInput = ref(null)
const isOpen = ref(false)
const keyword = ref('')
const expandedCodes = ref(new Set())

const normalizeOption = (option) => {
  const industryCode = String(option.industryCode || '').trim()
  const levelNo = Number(option.levelNo ?? option.level_no ?? 0)

  return {
    ...option,
    industryCode,
    apiIndustryCode: normalizeIndustryCodeForApi(industryCode),
    name: option.name || '',
    definition: option.definition || '',
    sectionCode: option.sectionCode || option.section_code || '',
    levelNo,
    children: [],
  }
}

const findParentCode = (industry, codeMap) => {
  const code = industry.industryCode
  if (!code || industry.levelNo <= 1) return ''

  if (industry.levelNo === 2) {
    const parentCode = industry.sectionCode
    return parentCode && codeMap.has(parentCode) ? parentCode : ''
  }

  if (industry.levelNo === 3) {
    const parentCode = code.slice(0, 2)
    if (codeMap.has(parentCode)) return parentCode

    const codePrefix = Number.parseInt(parentCode, 10)
    const rangeParent = [...codeMap.values()].find((option) => {
      if (option.levelNo !== 2 || !/^\d{2}-\d{2}$/.test(option.industryCode)) return false

      const [start, end] = option.industryCode.split('-').map((value) => Number.parseInt(value, 10))
      return codePrefix >= start && codePrefix <= end
    })

    return rangeParent?.industryCode || ''
  }

  if (industry.levelNo === 4) {
    const parentCode = code.slice(0, 3)
    return codeMap.has(parentCode) ? parentCode : ''
  }

  if (industry.levelNo === 5 && code.includes('-')) {
    const parentCode = code.split('-')[0]
    return codeMap.has(parentCode) ? parentCode : ''
  }

  return ''
}

const sortedOptions = computed(() =>
  props.options
    .map(normalizeOption)
    .filter((option) => option.industryCode)
    .sort((left, right) => {
      const sectionCompare = left.sectionCode.localeCompare(right.sectionCode)
      if (sectionCompare) return sectionCompare
      return left.industryCode.localeCompare(right.industryCode, 'zh-Hant')
    }),
)

const optionMap = computed(() => new Map(sortedOptions.value.map((option) => [option.industryCode, option])))
const apiOptionMap = computed(() => new Map(sortedOptions.value.map((option) => [option.apiIndustryCode, option])))

const treeOptions = computed(() => {
  const nodes = sortedOptions.value.map((option) => ({ ...option, children: [] }))
  const nodeMap = new Map(nodes.map((node) => [node.industryCode, node]))
  const roots = []

  nodes.forEach((node) => {
    const parentCode = findParentCode(node, nodeMap)
    const parent = parentCode ? nodeMap.get(parentCode) : null

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
})

const selectedOption = computed(() => apiOptionMap.value.get(props.modelValue) || null)

const displayValue = computed(() => {
  if (!props.modelValue) return props.emptyLabel || props.placeholder
  if (!selectedOption.value) return props.modelValue
  return `${selectedOption.value.industryCode} - ${selectedOption.value.name}`
})

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const hasSearch = computed(() => Boolean(normalizedKeyword.value))

const optionMatchesKeyword = (option, value) =>
  [option.industryCode, option.apiIndustryCode, option.name, option.definition]
    .filter(Boolean)
    .some((text) => String(text).toLowerCase().includes(value))

const filterTreeByKeyword = (nodes, value) =>
  nodes
    .map((node) => {
      const children = filterTreeByKeyword(node.children || [], value)
      const isMatched = optionMatchesKeyword(node, value)

      if (!isMatched && !children.length) return null
      return { ...node, children }
    })
    .filter(Boolean)

const displayedTreeOptions = computed(() => {
  const value = normalizedKeyword.value
  if (!value) return treeOptions.value
  return filterTreeByKeyword(treeOptions.value, value)
})

const hasDisplayedTreeOptions = computed(() => Boolean(displayedTreeOptions.value.length))

const collectExpandableCodes = (nodes, codes = []) => {
  nodes.forEach((node) => {
    if (node.children?.length) {
      codes.push(node.industryCode)
      collectExpandableCodes(node.children, codes)
    }
  })

  return codes
}

const getAncestorCodes = (industryCode) => {
  const ancestors = []
  let current = apiOptionMap.value.get(industryCode)

  while (current) {
    const parentCode = findParentCode(current, optionMap.value)
    if (!parentCode) break
    ancestors.push(parentCode)
    current = optionMap.value.get(parentCode)
  }

  return ancestors
}

const openDropdown = async () => {
  if (props.disabled) return

  isOpen.value = true
  getAncestorCodes(props.modelValue).forEach((code) => expandedCodes.value.add(code))
  await nextTick()
  searchInput.value?.focus()
}

const closeDropdown = () => {
  isOpen.value = false
  keyword.value = ''
}

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const toggleExpanded = (industryCode) => {
  const nextExpandedCodes = new Set(expandedCodes.value)

  if (nextExpandedCodes.has(industryCode)) {
    nextExpandedCodes.delete(industryCode)
  } else {
    nextExpandedCodes.add(industryCode)
  }

  expandedCodes.value = nextExpandedCodes
}

const selectValue = (industryCode) => {
  emit('update:modelValue', industryCode)
  closeDropdown()
}

const handleDocumentClick = (event) => {
  if (!rootEl.value?.contains(event.target)) {
    closeDropdown()
  }
}

const handleEscape = (event) => {
  if (event.key === 'Escape') closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})

watch(
  () => props.options,
  () => {
    if (!apiOptionMap.value.has(props.modelValue) && props.modelValue) {
      expandedCodes.value = new Set()
    }
  },
)

watch(normalizedKeyword, (value) => {
  if (!value) return

  const nextExpandedCodes = new Set(expandedCodes.value)
  collectExpandableCodes(displayedTreeOptions.value).forEach((code) => nextExpandedCodes.add(code))
  expandedCodes.value = nextExpandedCodes
})
</script>

<template>
  <div ref="rootEl" class="industry-select" :class="{ open: isOpen, disabled }">
    <button class="industry-select-trigger" type="button" :disabled="disabled" @click="toggleDropdown">
      <span :class="{ placeholder: !modelValue }">{{ displayValue }}</span>
      <span class="industry-select-arrow">⌄</span>
    </button>

    <div v-if="isOpen" class="industry-select-menu">
      <div class="industry-select-search">
        <input
          ref="searchInput"
          v-model="keyword"
          type="search"
          placeholder="搜尋代碼、名稱或定義"
        />
      </div>

      <div class="industry-select-list">
        <button
          v-if="emptyLabel"
          class="industry-option empty"
          type="button"
          :class="{ selected: !modelValue }"
          @click="selectValue('')"
        >
          {{ emptyLabel }}
        </button>

        <template v-if="hasDisplayedTreeOptions">
          <IndustryCodeNode
            v-for="industry in displayedTreeOptions"
            :key="industry.industryCode"
            :industry="industry"
            :model-value="modelValue"
            :expanded-codes="expandedCodes"
            @select="selectValue"
            @toggle="toggleExpanded"
          />
        </template>

        <div v-else class="industry-empty">
          {{ hasSearch ? '沒有符合的產業類別。' : '目前沒有可選擇的產業類別。' }}
        </div>
      </div>
    </div>
  </div>
</template>
