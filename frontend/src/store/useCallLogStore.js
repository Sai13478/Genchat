import { create } from "zustand";

export const useCallLogStore = create((set) => ({
	callLogs: [],
	setCallLogs: (logs) => set({ callLogs: logs }),
	addCallLog: (log) => {
		set((state) => {
			const logExists = state.callLogs.some((l) => l._id === log._id);
			if (logExists) {
				// If a log with the same ID exists, update it. This is useful for status changes (e.g., missed -> answered).
				return { callLogs: state.callLogs.map((l) => (l._id === log._id ? log : l)) };
			}
			// If it's a new log, add it to the top of the list.
			return { callLogs: [log, ...state.callLogs] };
		});
	},
}));