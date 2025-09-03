import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import useGetCallLogs from "../hooks/useGetCallLogs";
import { useAuthStore } from "../store/useAuthStore";

const CallLogsPage = () => {
	const { loading, callLogs } = useGetCallLogs();
	const { authUser } = useAuthStore();

	if (loading) return <p>Loading call logs...</p>;

	return (
		<div className='p-4'>
			<h1 className='text-2xl font-bold mb-4'>Call Logs</h1>
			<div className='space-y-4'>
				{callLogs.map((log) => {
					const isOutgoing = log.caller._id === authUser._id;
					const otherUser = isOutgoing ? log.callee : log.caller;

					return (
						<div key={log._id} className='flex items-center justify-between p-2 rounded-lg bg-base-200'>
							<div className='flex items-center gap-3'>
								{isOutgoing ? <PhoneOutgoing className='text-blue-500' /> : <PhoneIncoming className='text-green-500' />}
								<div className='avatar'>
									<div className='w-12 rounded-full'>
										<img src={otherUser.profilePic || "/avatar.png"} alt='avatar' />
									</div>
								</div>
								<div>
									<p className='font-bold'>{otherUser.fullName}</p>
									<p className='text-xs text-gray-400'>{new Date(log.createdAt).toLocaleString()}</p>
								</div>
							</div>
							<div className='flex items-center gap-2'>
								{log.status === "missed" && <PhoneMissed className='text-red-500' />}
								{log.callType === "video" ? <Video /> : <Phone />}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default CallLogsPage;