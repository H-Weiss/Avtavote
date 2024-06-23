import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export const login = (username, password) => api.post('/login', { username, password });
export const register = (username, password) => api.post('/register', { username, password });
export const getSurveys = () => api.get('/surveys');
export const vote = (surveyId, optionId) => api.post('/vote', { survey_id: surveyId, option_id: optionId });
export const createSurvey = (title, description, options) => api.post('/survey', { title, description, options });
export const getResults = () => api.get('/results');
export const exportResults = () => api.get('/export');

export default api;