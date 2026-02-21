import axios from "axios";
``
const getBaseURL = () => {
	// In production, we use the environment variable
	if (import.meta.env.PROD) {
		const envUrl = import.meta.env.VITE_API_URL;
		if (envUrl && envUrl !== "undefined" && envUrl.startsWith("http")) {
			return `${envUrl}/api`;
		}
	}
	// In development, use relative path for Vite proxy
	return "/api";
};

const apiClient = axios.create({
	baseURL: getBaseURL(),
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

export default apiClient;