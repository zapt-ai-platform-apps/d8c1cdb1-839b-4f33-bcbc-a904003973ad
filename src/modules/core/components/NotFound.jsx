import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl text-gray-700 mb-8">Page Not Found</h2>
      <p className="text-gray-500 mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">
        Go Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;