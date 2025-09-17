import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('username')
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else {
      ElMessage.error(error.response?.data?.error || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username, password) => api.post('/login', { username, password }),
  register: (username, password) => api.post('/register', { username, password })
}

export const practiceAPI = {
  getWords: (page = 1) => api.get(`/api/words?page=${page}`),
  getArticles: (page = 1) => api.get(`/api/articles?page=${page}`),
  saveProgress: (type, page) => api.post('/api/progress', { type, page }),
  getProgress: (type) => api.get(`/api/progress/${type}`)
}

export const adminAPI = {
  // 用户管理
  getUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // 词语管理
  getAllWords: (page = 1) => api.get(`/admin/words?page=${page}`),
  addWord: (word, pinyin) => api.post('/admin/words', { word, pinyin }),
  updateWord: (id, word, pinyin) => api.put(`/admin/words/${id}`, { word, pinyin }),
  deleteWord: (id) => api.delete(`/admin/words/${id}`),
  
  // 文章管理
  getAllArticles: (page = 1) => api.get(`/admin/articles?page=${page}`),
  addArticle: (title, content, pinyin) => api.post('/admin/articles', { title, content, pinyin }),
  updateArticle: (id, title, content, pinyin) => api.put(`/admin/articles/${id}`, { title, content, pinyin }),
  deleteArticle: (id) => api.delete(`/admin/articles/${id}`)
}

export default api
