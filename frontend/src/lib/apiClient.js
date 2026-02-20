import axios from "axios";

// In dev: use relative URL "/api" → Vite proxy forwards to http://localhost:3000/api
// In prod: use VITE_API_URL from env
const apiClient = axios.create({
<<<<<<< HEAD
	baseURL: import.meta.env.PROD
		? `${import.meta.env.VITE_API_URL}/api`
		: "/api",
	withCredentials: true,
=======
	// Construct the base URL by appending '/api' to the VITE_API_URL
	
	baseURL: `${import.meta.env.VITE_API_URL}/api`,
	withCredentials: true, // Important for sending cookies
>>>>>>> ba34a9c1988a43f2cfab4f9fc5544819108a81a2
	headers: { "Content-Type": "application/json" },
});

export default apiClient;