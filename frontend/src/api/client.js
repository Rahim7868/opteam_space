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
    const status = error.response?.status

    // Token expiré ou invalide → déconnexion automatique
    if (status === 401) {
      localStorage.removeItem('opteam_token')
      localStorage.removeItem('opteam_user')
      // Redirige vers login si pas déjà dessus
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export function getApiError(error) {
  if (!error.response) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion."
  }

  const status = error.response?.status

  // ✅ Trop de tentatives
  if (status === 429) {
    const retryAfter = error.response?.headers?.['retry-after']
    if (retryAfter) {
      return `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`
    }
    return 'Trop de tentatives de connexion. Veuillez patienter 1 minute.'
  }

  // ✅ Accès refusé
  if (status === 403) {
    return error.response?.data?.message
      ?? "Vous n'avez pas la permission d'effectuer cette action."
  }

  // ✅ Non trouvé
  if (status === 404) {
    return 'La ressource demandée est introuvable.'
  }

  // ✅ Erreur serveur
  if (status === 500) {
    return 'Une erreur serveur est survenue. Veuillez réessayer.'
  }

  // ✅ Message de validation Laravel
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // ✅ Erreurs de validation multiples
  const errors = error.response?.data?.errors
  if (errors) {
    return Object.values(errors).flat().join(' ')
  }

  return 'Une erreur est survenue.'
}

export default api