import api from './client'

export const getExperiences = (params) => api.get('/experiences/', { params })
export const getExperience = (id) => api.get(`/experiences/${id}/`)
export const createExperience = (data) => api.post('/experiences/', data)
export const updateExperience = (id, data) => api.put(`/experiences/${id}/`, data)
export const deleteExperience = (id) => api.delete(`/experiences/${id}/`)
export const getCompanies = (params) => api.get('/companies/', { params })
