import axios from "axios";

// Base URL is taken from Vite env variable
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true, // Important to send cookies cross-origin
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Interceptors to handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! User is not logged in.");
      // Optional: redirect to login page or show a toast
    }
    return Promise.reject(error);
  }
);

export default apiClient;
