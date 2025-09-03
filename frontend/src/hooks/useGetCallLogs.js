import { useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const useGetCallLogs = () => {
	const [loading, setLoading] = useState(false);
	const [callLogs, setCallLogs] = useState([]);
	const { authUser } = useAuthStore();

	useEffect(() => {
		const getLogs = async () => {
			setLoading(true);
			try {
				const res = await apiClient.get("/calls");
				setCallLogs(res.data);
			} catch (error) {
				toast.error(error.response?.data?.error || "Failed to get call logs");
			} finally {
				setLoading(false);
			}
		};

		if (authUser) getLogs();
	}, [authUser]);

	return { loading, callLogs };
};

export default useGetCallLogs;