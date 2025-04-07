import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4',
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-t-transparent border-blue-600 rounded-full animate-spin`}
      ></div>
      {message && <p className="mt-2 text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;