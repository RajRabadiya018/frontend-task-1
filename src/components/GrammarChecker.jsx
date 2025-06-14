import React, { useEffect, useRef, useState } from 'react';
import grammarService from '../services/grammarService';

const GrammarChecker = ({ children, isEnabled = true }) => {
  const containerRef = useRef(null);
  const [grammarErrors, setGrammarErrors] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, error: null });
  const checkTimeoutRef = useRef(null);
  const lastCheckedText = useRef('');

  useEffect(() => {
    if (!isEnabled) {
      removeGrammarHighlights();
      setGrammarErrors([]);
      return;
    }

    const handleTextChange = () => {
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (!editorElement) return;

      const textContent = editorElement.textContent || '';
      
      // Debounce grammar checking
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(() => {
        if (textContent !== lastCheckedText.current && textContent.length > 10) {
          checkGrammar(textContent);
        }
      }, 2000);
    };

    const handleBlur = () => {
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (!editorElement) return;

      const textContent = editorElement.textContent || '';
      if (textContent !== lastCheckedText.current && textContent.length > 10) {
        checkGrammar(textContent);
      }
    };

    const handleMouseOver = (e) => {
      if (e.target.classList.contains('grammar-error')) {
        const errorId = e.target.getAttribute('data-error-id');
        const error = grammarErrors.find(err => err.id === errorId);
        
        if (error) {
          const rect = e.target.getBoundingClientRect();
          setTooltip({
            show: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            error: error
          });
        }
      }
    };

    const handleMouseOut = (e) => {
      if (e.target.classList.contains('grammar-error')) {
        setTooltip({ show: false, x: 0, y: 0, error: null });
      }
    };

    const handleClick = (e) => {
      if (e.target.classList.contains('grammar-error')) {
        const errorId = e.target.getAttribute('data-error-id');
        const error = grammarErrors.find(err => err.id === errorId);
        setSelectedError(error);
      }
    };

    const container = containerRef.current;
    if (container) {
      const editorElement = container.querySelector('[contenteditable]');
      
      if (editorElement) {
        editorElement.addEventListener('input', handleTextChange);
        editorElement.addEventListener('blur', handleBlur);
        container.addEventListener('mouseover', handleMouseOver);
        container.addEventListener('mouseout', handleMouseOut);
        container.addEventListener('click', handleClick);

        return () => {
          editorElement.removeEventListener('input', handleTextChange);
          editorElement.removeEventListener('blur', handleBlur);
          container.removeEventListener('mouseover', handleMouseOver);
          container.removeEventListener('mouseout', handleMouseOut);
          container.removeEventListener('click', handleClick);
          
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
        };
      }
    }
  }, [isEnabled, grammarErrors]);

  const checkGrammar = async (text) => {
    if (!text || text.length < 10) return;

    setIsChecking(true);
    try {
      const result = await grammarService.checkGrammar(text);
      const errorsWithIds = result.errors.map((error, index) => ({
        ...error,
        id: `error-${index}-${Date.now()}`
      }));
      
      setGrammarErrors(errorsWithIds);
      lastCheckedText.current = text;
      
      // Apply highlights after a short delay to ensure DOM is ready
      setTimeout(() => {
        applyGrammarHighlights(errorsWithIds);
      }, 100);
    } catch (error) {
      console.warn('Grammar check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const applyGrammarHighlights = (errors) => {
    const editorElement = containerRef.current?.querySelector('[contenteditable]');
    if (!editorElement || document.activeElement === editorElement) return;

    // Remove existing highlights
    removeGrammarHighlights();

    if (errors.length === 0) return;

    let htmlContent = editorElement.innerHTML;
    
    // Sort errors by position (descending) to avoid index shifting
    const sortedErrors = [...errors].sort((a, b) => b.start - a.start);
    
    // Get text content for position mapping
    const textContent = editorElement.textContent || '';
    
    sortedErrors.forEach(error => {
      if (error.start >= 0 && error.end <= textContent.length) {
        const errorClass = `grammar-error grammar-${error.type} grammar-${error.severity}`;
        const beforeText = textContent.substring(0, error.start);
        const errorText = textContent.substring(error.start, error.end);
        const afterText = textContent.substring(error.end);
        
        // Find the position in HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const currentText = tempDiv.textContent || '';
        
        if (currentText.includes(errorText)) {
          const regex = new RegExp(errorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          htmlContent = htmlContent.replace(regex, 
            `<span class="${errorClass}" data-error-id="${error.id}" title="${error.message}">${errorText}</span>`
          );
        }
      }
    });

    editorElement.innerHTML = htmlContent;
  };

  const removeGrammarHighlights = () => {
    const editorElement = containerRef.current?.querySelector('[contenteditable]');
    if (!editorElement) return;

    const htmlContent = editorElement.innerHTML;
    const cleanHtml = htmlContent.replace(/<span class="grammar-error[^"]*"[^>]*>([^<]+)<\/span>/gi, '$1');
    
    if (cleanHtml !== htmlContent) {
      editorElement.innerHTML = cleanHtml;
    }
  };

  const applySuggestion = (error) => {
    const editorElement = containerRef.current?.querySelector('[contenteditable]');
    if (!editorElement || !error.suggestion) return;

    const textContent = editorElement.textContent || '';
    const correctedText = grammarService.applyCorrection(textContent, error);
    
    // Update the editor content
    editorElement.textContent = correctedText;
    
    // Trigger input event to update the note
    const event = new Event('input', { bubbles: true });
    editorElement.dispatchEvent(event);
    
    // Remove the error from the list
    setGrammarErrors(prev => prev.filter(err => err.id !== error.id));
    setSelectedError(null);
    
    // Re-check grammar after applying correction
    setTimeout(() => {
      checkGrammar(correctedText);
    }, 500);
  };

  const dismissError = (error) => {
    setGrammarErrors(prev => prev.filter(err => err.id !== error.id));
    setSelectedError(null);
    removeGrammarHighlights();
    
    // Re-apply highlights without the dismissed error
    const remainingErrors = grammarErrors.filter(err => err.id !== error.id);
    setTimeout(() => {
      applyGrammarHighlights(remainingErrors);
    }, 100);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* Grammar Check Indicator */}
      {isChecking && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg z-10">
          <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          Checking Grammar...
        </div>
      )}

      {/* Grammar Error Count */}
      {grammarErrors.length > 0 && !isChecking && (
        <div className="absolute top-2 right-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs shadow-lg z-10">
          {grammarErrors.length} grammar {grammarErrors.length === 1 ? 'issue' : 'issues'}
        </div>
      )}

      {/* Error Tooltip */}
      {tooltip.show && tooltip.error && (
        <div
          className="fixed z-50 max-w-xs p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold text-red-300 mb-1 capitalize">{tooltip.error.type} Error</div>
          <div className="text-gray-100">{tooltip.error.message}</div>
          {tooltip.error.suggestion && (
            <div className="text-green-300 mt-1">
              Suggestion: "{tooltip.error.suggestion}"
            </div>
          )}
          
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1f2937'
            }}
          />
        </div>
      )}

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {selectedError.type} Error
              </h3>
              <button
                onClick={() => setSelectedError(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`p-3 rounded-lg border-l-4 mb-4 ${getSeverityColor(selectedError.severity)}`}>
              <p className="text-gray-800 font-medium">"{selectedError.original}"</p>
              <p className="text-gray-600 text-sm mt-1">{selectedError.message}</p>
            </div>

            {selectedError.suggestion && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Suggested correction:</p>
                <p className="bg-green-50 border border-green-200 rounded p-2 text-green-800 font-medium">
                  "{selectedError.suggestion}"
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => dismissError(selectedError)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
              {selectedError.suggestion && (
                <button
                  onClick={() => applySuggestion(selectedError)}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply Fix
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarChecker;