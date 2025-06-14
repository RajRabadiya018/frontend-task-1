import React, { useState, useEffect } from 'react';

const ResponsiveLayout = ({ children, sidebar, onToggleSidebar }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile when screen size changes
      if (width < 768) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    onToggleSidebar?.(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">Notes</h1>
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-20' : 'relative'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'w-80' : isTablet ? 'w-72' : 'w-80'}
        bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${isMobile ? 'pt-16' : ''}
      `}>
        {sidebar}
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-white bg-opacity-50 z-10"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col
        ${isMobile ? 'pt-16' : ''}
      `}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveLayout;