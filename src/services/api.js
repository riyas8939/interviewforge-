import axios from 'axios';

// Create API caller pointing to backend server
const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 90000,
});

// Interceptor to inject JWT tokens dynamically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  register: (email, password, fullName) => 
    API.post('/api/auth/register', { email, password, full_name: fullName }),
  
  login: (email, password) => 
    API.post('/api/auth/login', { email, password }),
  
  getProfile: () => 
    API.get('/api/auth/me'),
};

export const interviewAPI = {
  start: (config) => 
    API.post('/api/interview/start', config),
  
  generateQuestion: (interviewId, orderNum) => {
    const formData = new FormData();
    formData.append('interview_id', interviewId);
    formData.append('order_num', orderNum);
    return API.post('/api/question/generate', formData);
  },
  
  submitAnswer: (questionId, answerText) => {
    const formData = new FormData();
    formData.append('question_id', questionId);
    formData.append('answer_text', answerText);
    return API.post('/api/answer/evaluate', formData);
  },
  
  getHistory: () => 
    API.get('/api/interview/history'),
  
  downloadPdfUrl: (interviewId) => 
    `http://localhost:8000/api/report/${interviewId}`,
  
  parseResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/api/resume/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  matchJd: (resumeText, jdText) => {
    const formData = new FormData();
    formData.append('resume_text', resumeText);
    formData.append('jd_text', jdText);
    return API.post('/api/jd/match', formData);
  }
};

export const codingAPI = {
  runCode: (code, language, questionId = null) => {
    const formData = new FormData();
    formData.append('code', code);
    formData.append('language', language);
    if (questionId) {
      formData.append('question_id', questionId);
    }
    return API.post('/api/coding/run', formData);
  }
};

export const trainingAPI = {
  getHint: (interviewId, questionId, level = 1) =>
    API.get(`/training/${interviewId}/hint/${questionId}?level=${level}`),

  getProgress: (interviewId) =>
    API.get(`/training/${interviewId}/progress`),

  getExplanation: (interviewId, questionId) =>
    API.get(`/training/${interviewId}/explanation/${questionId}`),
};

export default API;
