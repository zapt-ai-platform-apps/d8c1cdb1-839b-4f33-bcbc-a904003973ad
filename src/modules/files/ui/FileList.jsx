import React, { useState } from 'react';
import { 
  TrashIcon, 
  DocumentIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  LinkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { api as filesApi } from '../api';
import * as Sentry from '@sentry/browser';

const FileList = ({ files, onRefresh }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      await filesApi.deleteFile(fileId);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert('Failed to delete file');
      Sentry.captureException(error, {
        extra: {
          component: 'FileList',
          action: 'deleteFile',
          fileId
        }
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getFileIcon = (type) => {
    const iconType = filesApi.getFileIconType(type);
    
    switch (iconType) {
      case 'pdf':
        return DocumentTextIcon;
      case 'image':
        return PhotoIcon;
      case 'link':
        return LinkIcon;
      default:
        return DocumentIcon;
    }
  };
  
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No files or links have been added yet</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map(file => {
        const FileIcon = getFileIcon(file.type);
        const isLink = filesApi.getFileIconType(file.type) === 'link';
        
        return (
          <div key={file.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-red-600 cursor-pointer"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                {isLink ? 'Open Link' : 'View File'}
                <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FileList;