import axios from "axios";

// In dev: use relative URL "/api" → Vite proxy forwards to http://localhost:3000/api
// In prod: use VITE_API_URL from env
const getBaseURL = () => {
	const envUrl = import.meta.env.VITE_API_URL;
	if (envUrl && envUrl !== "undefined" && envUrl.startsWith("http")) {
		return `${envUrl}/api`;
	}
	return "/api";
};

const apiClient = axios.create({
	baseURL: getBaseURL(),
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

export default apiClient;