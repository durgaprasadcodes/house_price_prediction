import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// console.log(API_BASE_URL)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export const predictPrice = async (payload) => {
  try {
    const response = await apiClient.post('/predict', payload);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      (error.request
        ? `Server unavailable: Unable to reach prediction service at ${API_BASE_URL}`
        : error.message);
    throw new Error(message);
  }
};

export default apiClient;
