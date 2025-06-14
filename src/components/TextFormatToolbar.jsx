import React, { useState, useEffect } from 'react';

const TextFormatToolbar = ({ onApplyFormat, editorRef }) => {
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: true,
    justifyCenter: false,
    justifyRight: false
  });

  const [fontSize, setFontSize] = useState('16');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmallMobile(width < 480);
      setIsMobile(width < 768);
      
      // Auto-collapse on small screens
      if (width < 640) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
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

  useEffect(() => {
    const updateActiveFormats = () => {
      if (editorRef.current && document.activeElement === editorRef.current) {
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight')
        });
      }
    };

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editorRef]);

  const handleFormat = (command, value = null) => {
    onApplyFormat(command, value);
    
    // Update active formats after a short delay to allow the command to execute
    setTimeout(() => {
      if (editorRef.current) {
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight')
        });
      }
    }, 10);
  };

  const handleFontSizeChange = (e) => {
    const newSize = e.target.value;
    setFontSize(newSize);
    
    if (!editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    try {
      if (!range.collapsed) {
        // There's selected text - apply font size to selection
        const selectedContent = range.extractContents();
        
        // Create a span with the new font size
        const span = document.createElement('span');
        span.style.fontSize = newSize + 'px';
        span.appendChild(selectedContent);
        
        // Insert the span back into the range
        range.insertNode(span);
        
        // Clear selection and place cursor after the span
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        selection.addRange(newRange);
        
      } else {
        // No selection - set font size for future typing
        // Insert a span with the font size at cursor position
        const span = document.createElement('span');
        span.style.fontSize = newSize + 'px';
        
        // Insert a zero-width space to make the span selectable
        span.appendChild(document.createTextNode('\u200B'));
        
        range.insertNode(span);
        
        // Place cursor inside the span after the zero-width space
        const newRange = document.createRange();
        newRange.setStart(span.firstChild, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Trigger content change event
      setTimeout(() => {
        if (editorRef.current) {
          const event = new Event('input', { bubbles: true });
          editorRef.current.dispatchEvent(event);
        }
      }, 10);
      
    } catch (error) {
      console.warn('Font size application failed:', error);
      
      // Fallback: use document.execCommand
      try {
        // Map pixel sizes to HTML font sizes (1-7)
        const fontSizeMap = {
          '12': '1',
          '14': '2', 
          '16': '3',
          '18': '4',
          '20': '5',
          '24': '6',
          '28': '7',
          '32': '7'
        };
        
        const htmlSize = fontSizeMap[newSize] || '3';
        document.execCommand('fontSize', false, htmlSize);
        
        // Apply CSS font size to override HTML font size
        setTimeout(() => {
          if (editorRef.current) {
            const fontElements = editorRef.current.querySelectorAll('font[size]');
            fontElements.forEach(font => {
              font.style.fontSize = newSize + 'px';
              font.removeAttribute('size');
            });
          }
        }, 10);
        
      } catch (fallbackError) {
        console.warn('Fallback font size application also failed:', fallbackError);
      }
    }
  };

  const ToolbarButton = ({ onClick, isActive, children, title, className = "" }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        ${isMobile ? 'p-3 min-h-[44px] min-w-[44px]' : 'p-2'} 
        rounded-md transition-colors duration-200 
        flex items-center justify-center
        ${isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Mobile Toolbar Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Format</span>
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar Content */}
      <div className={`
        ${isMobile && isCollapsed ? 'hidden' : 'block'}
        ${isMobile ? 'p-2' : 'p-3'}
      `}>
        {isMobile ? (
          // Mobile Layout - Scrollable horizontal toolbar
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-2">
              {/* Essential formatting buttons for mobile */}
              <div className="flex items-center gap-1">
                <ToolbarButton
                  onClick={() => handleFormat('bold')}
                  isActive={activeFormats.bold}
                  title="Bold"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h8a4 4 0 0 1 4 4 3.5 3.5 0 0 1-1.5 2.9A4 4 0 0 1 14 20H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 2v5h5a2 2 0 1 0 0-4H8zm0 7v5h6a2 2 0 1 0 0-4H8z"/>
                  </svg>
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => handleFormat('italic')}
                  isActive={activeFormats.italic}
                  title="Italic"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.5 5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-1.25l-3.5 12H13a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h1.25l3.5-12H12.5a1 1 0 0 1-1-1z"/>
                  </svg>
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => handleFormat('underline')}
                  isActive={activeFormats.underline}
                  title="Underline"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </ToolbarButton>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-1"></div>

              {/* Alignment */}
              <div className="flex items-center gap-1">
                <ToolbarButton
                  onClick={() => handleFormat('justifyLeft')}
                  isActive={activeFormats.justifyLeft}
                  title="Left"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => handleFormat('justifyCenter')}
                  isActive={activeFormats.justifyCenter}
                  title="Center"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm2 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm-2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm2 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => handleFormat('justifyRight')}
                  isActive={activeFormats.justifyRight}
                  title="Right"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm-4 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </ToolbarButton>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-1"></div>

              {/* Font Size - Compact for mobile */}
              <div className="flex items-center gap-2">
                <select
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] bg-white"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                </select>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-1"></div>

              {/* Clear Formatting */}
              <ToolbarButton
                onClick={() => handleFormat('removeFormat')}
                isActive={false}
                title="Clear"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </ToolbarButton>
            </div>
          </div>
        ) : (
          // Desktop Layout - Original layout with improvements
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 mr-4">
              <ToolbarButton
                onClick={() => handleFormat('bold')}
                isActive={activeFormats.bold}
                title="Bold (Ctrl+B)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h8a4 4 0 0 1 4 4 3.5 3.5 0 0 1-1.5 2.9A4 4 0 0 1 14 20H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 2v5h5a2 2 0 1 0 0-4H8zm0 7v5h6a2 2 0 1 0 0-4H8z"/>
                </svg>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => handleFormat('italic')}
                isActive={activeFormats.italic}
                title="Italic (Ctrl+I)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.5 5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-1.25l-3.5 12H13a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h1.25l3.5-12H12.5a1 1 0 0 1-1-1z"/>
                </svg>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => handleFormat('underline')}
                isActive={activeFormats.underline}
                title="Underline (Ctrl+U)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </ToolbarButton>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mr-4"></div>

            {/* Alignment */}
            <div className="flex items-center gap-1 mr-4">
              <ToolbarButton
                onClick={() => handleFormat('justifyLeft')}
                isActive={activeFormats.justifyLeft}
                title="Align Left"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => handleFormat('justifyCenter')}
                isActive={activeFormats.justifyCenter}
                title="Align Center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm2 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm-2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm2 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </ToolbarButton>

              <ToolbarButton
                onClick={() => handleFormat('justifyRight')}
                isActive={activeFormats.justifyRight}
                title="Align Right"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm-4 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </ToolbarButton>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mr-4"></div>

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Size:</label>
              <select
                value={fontSize}
                onChange={handleFontSizeChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
              </select>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-4"></div>

            {/* Additional Actions */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => handleFormat('removeFormat')}
                isActive={false}
                title="Clear Formatting"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </ToolbarButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextFormatToolbar;