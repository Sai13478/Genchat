import { useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
	const { authUser } = useAuthStore();

	useEffect(() => {
		const getConversations = async () => {
			setLoading(true);
			try {
				const res = await apiClient.get("/messages/conversations");
				setConversations(res.data);
			} catch (error) {
				// Don't show a toast for 401 errors, as they are handled by the auth flow.
				if (error.response?.status !== 401) {
					toast.error(error.response?.data?.error || "Failed to get conversations");
				}
			} finally {
				setLoading(false);
			}
		};

		// Only fetch conversations if there is an authenticated user.
		if (authUser) {
			getConversations();
		}
	}, [authUser]);

	return { loading, conversations };
};
export default useGetConversations;