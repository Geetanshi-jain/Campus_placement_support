import api from './client'

export const uploadSheet = (formData) =>
  api.post('/admin-panel/upload-sheet/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getStats = () => api.get('/admin-panel/stats/')
export const getPlacementSummary = () => api.get('/admin-panel/placement-summary/')

export const adminUpdateExperience = (id, data) => api.put(`/experiences/${id}/`, data)
export const adminDeleteExperience = (id) => api.delete(`/experiences/${id}/`)

