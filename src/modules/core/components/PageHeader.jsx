import React from 'react';
import { Link } from 'react-router-dom';

const PageHeader = ({ 
  title, 
  description, 
  actionLabel, 
  actionLink, 
  actionIcon: ActionIcon,
  children 
}) => {
  return (
    <div className="mb-6 sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      
      <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-3">
        {children}
        
        {actionLabel && actionLink && (
          <Link to={actionLink} className="btn-primary inline-flex items-center">
            {ActionIcon && <ActionIcon className="mr-2 h-5 w-5" />}
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default PageHeader;