import axios from "axios";

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

// Request interceptor: add Bearer token from localStorage to every request
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("genchat-token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Global interceptor: if any request returns 401, clear auth state silently.
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("genchat-token");
			// Dynamically import to avoid circular dependency
			import("../store/useAuthStore.js").then(({ useAuthStore }) => {
				const { authUser } = useAuthStore.getState();
				if (authUser) {
					useAuthStore.setState({ authUser: null });
				}
			});
		}
		return Promise.reject(error);
	}
);

export default apiClient;