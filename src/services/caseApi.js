import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

const unwrapResponse = (response) => {
  const body = response.data

  if (body?.code && String(body.code) !== '200') {
    throw new Error(body.message || 'API request failed')
  }

  return body?.data
}

export const caseApi = {
  async listAnalyses() {
    const response = await apiClient.post('/api/analysis/list')
    return unwrapResponse(response) || []
  },

  async getAnalysis(payload) {
    const response = await apiClient.post('/api/analysis/get', payload)
    return unwrapResponse(response)
  },

  async listMetricClusters(payload) {
    const response = await apiClient.post('/api/cluster/cluster/list', payload)
    return unwrapResponse(response) || []
  },

  async getMetricCluster(payload) {
    const response = await apiClient.post('/api/cluster/cluster/get', payload)
    return unwrapResponse(response)
  },

  async getBusiness(payload) {
    const response = await apiClient.post('/api/cluster/business/get', payload)
    return unwrapResponse(response)
  },

  async getPopulation(payload) {
    const response = await apiClient.post('/api/cluster/population/get', payload)
    return unwrapResponse(response)
  },

  async getPeople(payload) {
    const response = await apiClient.post('/api/cluster/people/get', payload)
    return unwrapResponse(response)
  },

  async getTransit(payload) {
    const response = await apiClient.post('/api/cluster/transit/get', payload)
    return unwrapResponse(response)
  },

  async listMetricCells(payload) {
    const response = await apiClient.post('/api/cell/list', payload)
    return unwrapResponse(response) || []
  },

  async submitAnalysis(payload) {
    const response = await apiClient.post('/api/analysis/submit', payload)
    return unwrapResponse(response)
  },
}
