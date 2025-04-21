// Create a custom error handler in your API client
// api/index.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: "https://platform-hub.onrender.com"
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;