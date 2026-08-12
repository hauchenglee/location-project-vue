import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

const unwrapResponse = (response) => {
  const body = response.data

  if (body?.code && body.code !== '200') {
    throw new Error(body.message || 'API request failed')
  }

  return body?.data
}

export const caseApi = {
  async listAnalyses() {
    const response = await apiClient.post('/api/analysis/list')
    return unwrapResponse(response) || []
  },

  async submitAnalysis(payload) {
    const response = await apiClient.post('/api/analysis/submit', payload)
    return unwrapResponse(response)
  },
}
