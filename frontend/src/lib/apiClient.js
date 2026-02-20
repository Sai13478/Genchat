import axios from "axios";

// In dev: use relative URL "/api" → Vite proxy forwards to http://localhost:3000/api
// In prod: use VITE_API_URL from env
const apiClient = axios.create({
	baseURL: import.meta.env.PROD
		? `${import.meta.env.VITE_API_URL}/api`
		: "/api",
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

export default apiClient;