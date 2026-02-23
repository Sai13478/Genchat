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

// Global interceptor: if any request returns 401, clear auth state silently.
// This handles mid-session token expiry without error popups.
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Dynamically import to avoid circular dependency
			import("../store/useAuthStore.js").then(({ useAuthStore }) => {
				const { authUser } = useAuthStore.getState();
				if (authUser) {
					// Only reset if user was previously logged in (session expired mid-use)
					useAuthStore.setState({ authUser: null });
				}
			});
		}
		return Promise.reject(error);
	}
);

export default apiClient;