import axios from "axios";

const isProduction = import.meta.env.MODE === 'production' || process.env.NODE_ENV === 'production';

const API_URL_PROD = "https://genchat-vi93.onrender.com/api";
const API_URL_DEV = "http://localhost:3000/api"; // Your local backend URL

const baseURL = isProduction ? API_URL_PROD : API_URL_DEV;

console.log(`API is running in ${isProduction ? 'production' : 'development'} mode. Base URL: ${baseURL}`);

const apiClient = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("API Error: 401 Unauthorized. The user's token is likely invalid or expired.");
     
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
