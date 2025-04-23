import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { checkAndRecordLogin, refreshSession } from '@/shared/services/supabaseClient';

const Layout = ({ children }) => {
  const location = useLocation();

  // Ensure authentication on route changes
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAndRecordLogin();
      await refreshSession();
    };
    
    verifyAuth();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              GMFEIP CRM
            </Link>
          </div>
          <nav className="flex space-x-6">
            <Link to="/" className={`text-gray-700 hover:text-blue-600 ${location.pathname === '/' ? 'font-medium' : ''}`}>
              Dashboard
            </Link>
            <Link to="/companies" className={`text-gray-700 hover:text-blue-600 ${location.pathname.startsWith('/companies') ? 'font-medium' : ''}`}>
              Companies
            </Link>
            <Link to="/resources" className={`text-gray-700 hover:text-blue-600 ${location.pathname.startsWith('/resources') ? 'font-medium' : ''}`}>
              Resources
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} GMFEIP CRM. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;