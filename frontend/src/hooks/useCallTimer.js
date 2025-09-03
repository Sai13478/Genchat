import { useState, useEffect } from "react";
import useCallStore from "../store/useCallStore";

const useCallTimer = () => {
	const { callStartTime } = useCallStore();
	const [duration, setDuration] = useState(0);

	useEffect(() => {
		if (!callStartTime) {
			setDuration(0);
			return;
		}

		const interval = setInterval(() => {
			setDuration(Math.floor((Date.now() - callStartTime) / 1000));
		}, 1000);

		return () => clearInterval(interval);
	}, [callStartTime]);

	const formatTime = (totalSeconds) => {
		const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
		const seconds = (totalSeconds % 60).toString().padStart(2, "0");
		return `${minutes}:${seconds}`;
	};

	return formatTime(duration);
};

export default useCallTimer;