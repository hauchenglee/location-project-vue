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
    const [scoreResponse, overviewResponse, sameIndustryResponse, competitionResponse] = await Promise.all([
      apiClient.post('/api/cluster/business/score/get', payload),
      apiClient.post('/api/cluster/business/overview/get', payload),
      apiClient.post('/api/cluster/business/same-industry/get', payload),
      apiClient.post('/api/cluster/business/competition/get', payload),
    ])

    return {
      businessScoreVo: unwrapResponse(scoreResponse),
      businessOverviewVo: unwrapResponse(overviewResponse),
      sameIndustryStructureVo: unwrapResponse(sameIndustryResponse),
      targetIndustryCompetitionVo: unwrapResponse(competitionResponse),
    }
  },

  async getPopulation(payload) {
    const [scoreResponse, overviewResponse, ageResponse] = await Promise.all([
      apiClient.post('/api/cluster/population/score/get', payload),
      apiClient.post('/api/cluster/population/overview/get', payload),
      apiClient.post('/api/cluster/population/age/get', payload),
    ])

    return {
      ...unwrapResponse(scoreResponse),
      ...unwrapResponse(overviewResponse),
      ...unwrapResponse(ageResponse),
    }
  },

  async getPeople(payload) {
    const response = await apiClient.post('/api/cluster/people/get', payload)
    return unwrapResponse(response)
  },

  async getTransit(payload) {
    const response = await apiClient.post('/api/cluster/transit/get', payload)
    return unwrapResponse(response)
  },

  async submitAnalysis(payload) {
    const response = await apiClient.post('/api/analysis/submit', payload)
    return unwrapResponse(response)
  },

  async listAdminAreas() {
    const response = await apiClient.post('/api/reference/admin-county/list')
    return unwrapResponse(response) || []
  },

  async listBusinessIndustryCodes() {
    const response = await apiClient.post('/api/reference/business-industry-code/list')
    return unwrapResponse(response) || []
  },
}
