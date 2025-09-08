import axios from "axios";

const BASE_URL = "https://genchat-vi93.onrender.com/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

console.log("Axios base URL:", BASE_URL);
