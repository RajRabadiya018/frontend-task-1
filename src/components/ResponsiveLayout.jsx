import React, { useState, useEffect } from 'react';

const ResponsiveLayout = ({ children, sidebar, onToggleSidebar, sidebarOpen = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      setIsSmallMobile(width < 480);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile when screen size changes
      if (width < 768) {
        onToggleSidebar?.(false);
      } else {
        // Auto-open sidebar on desktop
        onToggleSidebar?.(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    onToggleSidebar?.(newState);
  };

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        onToggleSidebar?.(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, sidebarOpen, onToggleSidebar]);

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-3 py-2 sm:px-4 sm:py-3 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors touch-target min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className={`font-bold text-gray-800 truncate px-2 ${isSmallMobile ? 'text-base' : 'text-lg'}`}>
              Notes
            </h1>
            <div className="w-[44px]"></div> {/* Spacer for centering */}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-20' : 'relative'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${
          isSmallMobile ? 'w-full' : 
          isMobile ? 'w-80 max-w-[85vw]' : 
          isTablet ? 'w-72' : 
          'w-80 max-w-[400px]'
        }
        bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${isMobile ? 'pt-14 sm:pt-16' : ''}
        flex flex-col
        ${isMobile ? 'safe-area-inset-top' : ''}
      `}>
        {sidebar}
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-white bg-opacity-50 z-10 backdrop-blur-sm"
          onClick={toggleSidebar}
          onTouchStart={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${isMobile ? 'pt-14 sm:pt-16' : ''}
        ${isMobile ? 'safe-area-inset-top' : ''}
      `}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveLayout;