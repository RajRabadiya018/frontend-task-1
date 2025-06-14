import React from 'react';

// Simple wrapper that doesn't interfere with the editor
const SimpleGlossaryHighlighter = ({ children }) => {
  return (
    <div className="relative">
      {children}
    </div>
  );
};

export default SimpleGlossaryHighlighter;