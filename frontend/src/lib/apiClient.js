import axios from "axios";

const apiClient = axios.create({
	// Construct the base URL by appending '/api' to the VITE_API_URL
	baseURL: `${import.meta.env.VITE_API_URL}/api`,
	withCredentials: true, // Important for sending cookies
	headers: { "Content-Type": "application/json" },
});

export default apiClient;