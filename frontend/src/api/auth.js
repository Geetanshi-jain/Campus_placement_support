import api from './client'

export const studentRegister = (data) => api.post('/auth/student/register/', data)
export const studentLogin = (data) => api.post('/auth/student/login/', data)
export const adminLogin = (data) => api.post('/auth/admin/login/', data)
export const getMe = () => api.get('/auth/me/')
export const logout = (refresh) => api.post('/auth/logout/', { refresh })
