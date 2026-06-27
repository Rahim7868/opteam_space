import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opteam_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('opteam_token')
      localStorage.removeItem('opteam_user')
    }
    return Promise.reject(error)
  },
)

export function getApiError(error) {
  if (!error.response) {
    return "Impossible de joindre l'API Laravel. Vérifie le backend."
  }

  if (error.response?.data?.message) {
    return error.response.data.message
  }

  const errors = error.response?.data?.errors
  if (errors) {
    return Object.values(errors).flat().join(' ')
  }

  return 'Une erreur est survenue.'
}

export default api