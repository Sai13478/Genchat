import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // important for cookies
  headers: { "Content-Type": "application/json" },
});

console.log("Axios base URL:", BASE_URL);
export default apiClient;
