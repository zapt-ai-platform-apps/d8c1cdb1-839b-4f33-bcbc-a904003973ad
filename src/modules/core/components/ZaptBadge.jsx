import React from 'react';

export const ZaptBadge = () => {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <a 
        href="https://www.zapt.ai" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center text-xs text-gray-500 hover:text-gray-700"
      >
        Made on ZAPT
      </a>
    </div>
  );
};