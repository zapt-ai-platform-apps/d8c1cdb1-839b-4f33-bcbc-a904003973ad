import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  DocumentIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { eventBus, events } from '../events';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    // Subscribe to sidebar toggle events
    const unsubscribe = eventBus.subscribe(events.UI_SIDEBAR_TOGGLE, ({ isOpen }) => {
      setSidebarOpen(isOpen);
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Companies', href: '/companies', icon: BuildingOfficeIcon },
    { name: 'Resources', href: '/resources', icon: DocumentIcon },
  ];
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  const toggleSidebar = (value) => {
    setSidebarOpen(value);
    eventBus.publish(events.UI_SIDEBAR_TOGGLE, { isOpen: value });
  };
  
  return (
    <div className="h-full flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-4">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => toggleSidebar(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => toggleSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transition-transform transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:z-0`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-800">GMFEIP CRM</h1>
            <button 
              type="button" 
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => toggleSidebar(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Sidebar navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Hopwood Hall College
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;