import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneOff } from 'lucide-react';

const CallFailedPage = ({ reason = 'User is currently offline' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full">
            <PhoneOff className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Call Failed</h1>
        <p className="text-gray-600 mb-6">{reason}</p>
        <p className="text-sm text-gray-500">
          Redirecting to home page in 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default CallFailedPage;
