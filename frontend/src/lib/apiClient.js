import axios from "axios";

const getBaseURL = () => {
	if (import.meta.env.PROD) {
		const envUrl = import.meta.env.VITE_API_URL;
		if (envUrl && envUrl !== "undefined" && envUrl.startsWith("http")) {
			return `${envUrl}/api`;
		}
	}
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
		if (token && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor: handle 401 with silent token refresh
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// If error is 401 and we haven't retried yet and it's not a login/signup/refresh request itself
		const isAuthRequest = originalRequest.url.includes("/auth/login") ||
			originalRequest.url.includes("/auth/signup") ||
			originalRequest.url.includes("/auth/refresh");

		if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
			originalRequest._retry = true;

			try {
				// Call refresh endpoint directly using axios to avoiding interceptor loop
				const res = await axios.post(
					`${apiClient.defaults.baseURL}/auth/refresh`,
					{},
					{ withCredentials: true }
				);

				const { token } = res.data;
				localStorage.setItem("genchat-token", token);

				// Update Authorization header and retry original request
				originalRequest.headers.Authorization = `Bearer ${token}`;
				return apiClient(originalRequest);
			} catch (refreshError) {
				console.error("Session expired. Please log in again.");

				// Clear auth state
				localStorage.removeItem("genchat-token");
				// Dynamically import useAuthStore to avoid circular dependencies
				import("../store/useAuthStore.js").then(({ useAuthStore }) => {
					useAuthStore.setState({ authUser: null });
				});
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default apiClient;