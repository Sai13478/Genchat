import { useState, useEffect } from 'react';
import { useCallStore } from '../store/useCallStore';

const useCallTimer = () => {
  const { callStartTime, callState } = useCallStore();
  const [timer, setTimer] = useState('00:00');

  useEffect(() => {
    if (callState !== 'connected' || !callStartTime) {
      setTimer('00:00');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - callStartTime) / 1000);
      
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimer(formattedTime);
    }, 1000);

    // Cleanup the interval when the component unmounts or the call ends
    return () => clearInterval(interval);
  }, [callStartTime, callState]);

  return timer;
};

export default useCallTimer;