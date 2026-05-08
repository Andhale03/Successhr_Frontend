import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/authSlice'

export const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_ROOT}/api`
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const assetUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_ROOT}${url}`
}

export default api
