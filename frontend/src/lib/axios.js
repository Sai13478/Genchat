import axios from "axios";

// In dev: use relative URL "/api" → Vite proxy forwards to http://localhost:3000/api
// In prod: use VITE_API_URL from env
const BASE_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

console.log("Axios base URL:", BASE_URL);
