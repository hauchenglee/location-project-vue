const delay = (value, ms = 180) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms)
  })

const cases = [
  {
    id: 'CA-20260730-001',
    owner: 'Chris Huang',
    name: '手搖飲展店分析',
    note: '台北市商圈初步評估',
    type: '餐飲',
    locationMode: '行政區模式',
    location: '台北市 / 大安區',
    createdAt: '2026/07/30 10:24',
    updatedAt: '2026/07/30 11:05',
    status: '已完成',
    actions: ['查看', '複製'],
  },
  {
    id: 'CA-20260729-014',
    owner: 'Chris Huang',
    name: '早餐加盟評估',
    note: '住宅區通勤動線觀察',
    type: '餐飲',
    locationMode: '圖釘模式',
    location: '25.0330, 121.5654',
    createdAt: '2026/07/29 16:42',
    updatedAt: '2026/07/29 17:18',
    status: '分析中',
    actions: ['查看', '複製'],
  },
  {
    id: 'CA-20260728-009',
    owner: 'Chris Huang',
    name: '超商新點評估',
    note: '夜間客流與交通便利性',
    type: '零售',
    locationMode: '行政區模式',
    location: '新北市 / 板橋區',
    createdAt: '2026/07/28 13:10',
    updatedAt: '2026/07/28 13:10',
    status: '草稿',
    actions: ['查看', '編輯'],
  },
  {
    id: 'CA-20260727-021',
    owner: 'Chris Huang',
    name: '藥妝店商圈分析',
    note: '捷運出口周邊候選點比較',
    type: '零售',
    locationMode: '圖釘模式',
    location: '25.0478, 121.5170',
    createdAt: '2026/07/27 09:36',
    updatedAt: '2026/07/27 10:02',
    status: '已完成',
    actions: ['查看', '匯出'],
  },
  {
    id: 'CA-20260726-005',
    owner: 'Chris Huang',
    name: '健身工作室選址',
    note: '目標客群與租金條件比較',
    type: '服務',
    locationMode: '行政區模式',
    location: '台中市 / 西屯區',
    createdAt: '2026/07/26 14:08',
    updatedAt: '2026/07/26 15:21',
    status: '分析中',
    actions: ['查看', '複製'],
  },
]

export const caseApi = {
  async searchCases(filters = {}) {
    const result = cases.filter((caseItem) => {
      const matchesId = !filters.caseId || caseItem.id.includes(filters.caseId)
      const matchesName = !filters.productName || caseItem.name.includes(filters.productName)
      const matchesType = !filters.productType || filters.productType === '全部類型' || caseItem.type === filters.productType
      const matchesStatus = !filters.status || filters.status === '全部狀態' || caseItem.status === filters.status

      return matchesId && matchesName && matchesType && matchesStatus
    })

    return delay({
      items: result,
      total: 12,
      page: 1,
      pageSize: 5,
    })
  },

  async createCase(payload) {
    return delay({
      id: 'CA-20260731-001',
      status: '草稿',
      ...payload,
    })
  },
}
