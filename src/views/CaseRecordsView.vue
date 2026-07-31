<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { caseApi } from '@/services/caseApi'

const isLoading = ref(false)
const cases = ref([])
const total = ref(12)

const filters = reactive({
  caseId: '',
  productName: '',
  productType: '全部類型',
  status: '全部狀態',
})

const statusClassMap = {
  已完成: 'done',
  分析中: 'run',
  草稿: 'draft',
}

const paginationText = computed(() => `顯示第 1 - ${cases.value.length} 筆，共 ${total.value} 筆資料`)

const loadCases = async () => {
  isLoading.value = true
  const response = await caseApi.searchCases({ ...filters })
  cases.value = response.items
  total.value = response.total
  isLoading.value = false
}

const resetFilters = () => {
  Object.assign(filters, {
    caseId: '',
    productName: '',
    productType: '全部類型',
    status: '全部狀態',
  })
  loadCases()
}

onMounted(loadCases)
</script>

<template>
  <main class="main records-layout">
    <div class="content-scroll">
      <div class="content-shell">
        <div class="page-title">
          <h2>案件紀錄</h2>
          <p>透過查詢條件快速篩選案件，並檢視建立時間、區域設定與目前處理狀態。</p>
        </div>

        <section class="section">
          <div class="section-header">
            <h3>搜尋條件</h3>
            <p>可依案件編號、商品名稱、商品類型與案件狀態進行查詢。</p>
          </div>

          <div class="grid-4">
            <div class="field">
              <label for="caseId">案件編號</label>
              <input id="caseId" v-model="filters.caseId" type="text" placeholder="例如：CA-20260730-001" />
            </div>
            <div class="field">
              <label for="productNameFilter">商品名稱</label>
              <input id="productNameFilter" v-model="filters.productName" type="text" placeholder="例如：手搖飲、早午餐、超商" />
            </div>
            <div class="field">
              <label for="productTypeFilter">商品類型</label>
              <select id="productTypeFilter" v-model="filters.productType">
                <option>全部類型</option>
                <option>餐飲</option>
                <option>零售</option>
                <option>服務</option>
              </select>
            </div>
            <div class="field">
              <label for="statusFilter">案件狀態</label>
              <select id="statusFilter" v-model="filters.status">
                <option>全部狀態</option>
                <option>已完成</option>
                <option>分析中</option>
                <option>草稿</option>
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="btn" type="button" @click="resetFilters">清除條件</button>
            <button class="btn primary" type="button" :disabled="isLoading" @click="loadCases">搜尋案件</button>
          </div>
        </section>

        <section class="section">
          <div class="section-header">
            <h3>搜尋結果</h3>
            <p>以下列表顯示符合條件的案件資料。</p>
          </div>

          <div class="toolbar">
            <div class="toolbar-left">
              <span class="count">共 12 筆案件</span>
              <span class="pill">最近更新優先</span>
              <span class="pill">可橫向捲動查看完整欄位</span>
            </div>
            <div>
              <button class="btn" type="button">匯出清單</button>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>案件編號</th>
                  <th>商品名稱</th>
                  <th>商品類型</th>
                  <th>區域設定</th>
                  <th>建立時間</th>
                  <th>最後更新</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="caseItem in cases" :key="caseItem.id">
                  <td>
                    <span class="case-id">{{ caseItem.id }}</span>
                    <span class="sub">建立人員：{{ caseItem.owner }}</span>
                  </td>
                  <td>
                    {{ caseItem.name }}
                    <span class="sub">{{ caseItem.note }}</span>
                  </td>
                  <td><span class="badge type">{{ caseItem.type }}</span></td>
                  <td>
                    {{ caseItem.locationMode }}
                    <span class="sub">{{ caseItem.location }}</span>
                  </td>
                  <td>{{ caseItem.createdAt }}</td>
                  <td>{{ caseItem.updatedAt }}</td>
                  <td><span class="badge" :class="statusClassMap[caseItem.status]">{{ caseItem.status }}</span></td>
                  <td>
                    <div class="row-actions">
                      <button v-for="action in caseItem.actions" :key="action" class="btn-sm" type="button">
                        {{ action }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <div class="pagination-info">{{ paginationText }}</div>
            <div class="pagination-actions">
              <button class="btn-sm" type="button">上一頁</button>
              <button class="btn-sm" type="button">1</button>
              <button class="btn-sm" type="button">2</button>
              <button class="btn-sm" type="button">3</button>
              <button class="btn-sm" type="button">下一頁</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
