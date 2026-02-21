import axios from "axios";
``
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