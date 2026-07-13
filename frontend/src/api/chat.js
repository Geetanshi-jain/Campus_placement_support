import api from './client'

export const askQuestion = (data) => api.post('/chat/ask/', data)
export const getHRBrief = (data) => api.post('/chat/hr-brief/', data)
