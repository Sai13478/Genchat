import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PhoneOff } from 'lucide-react';

const CallFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Provide a default reason if none is passed in the navigation state
  const reason = location.state?.reason || 'The call could not be completed.';

  // Automatically navigate back to the home page after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    // Cleanup the timer if the component unmounts (e.g., user clicks the button)
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4 w-full">
      <div className="bg-base-200 p-8 rounded-lg shadow-xl max-w-md w-full text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-red-500/20 p-4 rounded-full">
            <PhoneOff className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Call Failed</h1>
        <p className="text-base-content/70 mb-6">{reason}</p>
        
        {/* IMPROVEMENT: Add a button for immediate navigation */}
        <button 
          onClick={handleGoHome}
          className="btn btn-primary w-full mb-4"
        >
          Go to Home
        </button>

        <p className="text-sm text-base-content/50">
          You will be redirected automatically in 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default CallFailedPage;