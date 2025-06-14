import React, { useEffect, useRef, useState } from 'react';
import aiService from '../services/aiService';

const AIGlossaryHighlighter = ({ children, isEnabled = false, onToggle }) => {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const [aiTerms, setAiTerms] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isUserTyping = useRef(false);
  const typingTimer = useRef(null);
  const highlightTimer = useRef(null);
  const lastProcessedText = useRef('');
  const isHighlighting = useRef(false);
  const editorObserver = useRef(null);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
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
    const processWithAI = async (text) => {
      if (isProcessing || !text || text.length < 30 || !isEnabled) return;
      
      setIsProcessing(true);
      try {
        console.log('Processing text with AI:', text.substring(0, 50) + '...');
        const newTerms = await aiService.extractAndDefineTerms(text);
        
        if (newTerms && Object.keys(newTerms).length > 0) {
          console.log('AI found terms:', Object.keys(newTerms));
          setAiTerms(newTerms);
        } else {
          console.log('No AI terms found');
          setAiTerms({});
        }
      } catch (error) {
        console.warn('AI processing failed:', error);
        setAiTerms({});
      } finally {
        setIsProcessing(false);
      }
    };

    const highlightTerms = async () => {
      // Don't highlight if not enabled, user is typing, or already highlighting
      if (!isEnabled || isUserTyping.current || isHighlighting.current) return;
      
      if (!containerRef.current) return;

      const editorElement = containerRef.current.querySelector('[contenteditable]');
      if (!editorElement) return;

      // Don't highlight if editor is focused (user is actively editing)
      if (document.activeElement === editorElement) return;

      const textContent = editorElement.textContent || '';
      if (!textContent.trim() || textContent.length < 30) return;

      // Check if we need to process with AI
      const shouldProcessAI = textContent !== lastProcessedText.current && textContent.length > 50;

      if (shouldProcessAI && !isProcessing) {
        await processWithAI(textContent);
      }

      // Only highlight if we have AI terms and user is not typing
      if (Object.keys(aiTerms).length === 0 || isUserTyping.current) {
        lastProcessedText.current = textContent;
        return;
      }

      // Set highlighting flag to prevent interference
      isHighlighting.current = true;

      try {
        // Get current HTML and check if it already has highlights
        let htmlContent = editorElement.innerHTML;
        const hasHighlights = htmlContent.includes('ai-glossary-term');
        
        // If already highlighted, don't re-highlight
        if (hasHighlights) {
          lastProcessedText.current = textContent;
          return;
        }

        // Sort terms by length (longest first) to avoid partial matches
        const sortedTerms = Object.keys(aiTerms).sort((a, b) => b.length - a.length);

        let modifiedHtml = htmlContent;
        let hasChanges = false;

        // Highlight each AI term
        sortedTerms.forEach(term => {
          const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const newHtml = modifiedHtml.replace(regex, (match) => {
            hasChanges = true;
            return `<span class="ai-glossary-term newly-highlighted" data-term="${term}">${match}</span>`;
          });
          modifiedHtml = newHtml;
        });

        // Only update if there are changes, editor is not focused, and user is not typing
        if (hasChanges && 
            modifiedHtml !== editorElement.innerHTML && 
            document.activeElement !== editorElement && 
            !isUserTyping.current) {
          
          // Save cursor position before modifying
          const selection = window.getSelection();
          const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          
          editorElement.innerHTML = modifiedHtml;
          
          // Restore cursor position if it was saved
          if (range && document.activeElement !== editorElement) {
            try {
              selection.removeAllRanges();
              selection.addRange(range);
            } catch (e) {
              // Ignore cursor restoration errors
            }
          }
        }

        lastProcessedText.current = textContent;
      } finally {
        isHighlighting.current = false;
      }
    };

    const removeHighlights = () => {
      if (!containerRef.current) return;
      
      const editorElement = containerRef.current.querySelector('[contenteditable]');
      if (!editorElement || isHighlighting.current) return;
      
      const htmlContent = editorElement.innerHTML;
      const cleanHtml = htmlContent.replace(/<span class="ai-glossary-term[^"]*"[^>]*>([^<]+)<\/span>/gi, '$1');
      if (cleanHtml !== htmlContent) {
        editorElement.innerHTML = cleanHtml;
      }
    };

    const handleUserInput = () => {
      // Mark user as typing
      isUserTyping.current = true;
      
      // Clear existing timers
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      
      // Remove highlights while typing to prevent cursor issues
      if (isEnabled) {
        removeHighlights();
      }
      
      // Set timer to stop typing detection
      typingTimer.current = setTimeout(() => {
        isUserTyping.current = false;
        // Schedule highlighting after user stops typing (only if enabled)
        if (isEnabled) {
          highlightTimer.current = setTimeout(highlightTerms, 3000);
        }
      }, 2000);
    };

    const handleBlur = () => {
      isUserTyping.current = false;
      
      // Highlight terms after user stops editing (with delay, only if enabled)
      if (isEnabled) {
        if (highlightTimer.current) clearTimeout(highlightTimer.current);
        highlightTimer.current = setTimeout(highlightTerms, 2000);
      }
    };

    const handleFocus = () => {
      // Mark as typing when user focuses
      isUserTyping.current = true;
      
      // Clear any pending highlights
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      
      // Remove highlights when user starts editing (only if enabled)
      if (isEnabled) {
        removeHighlights();
      }
    };

    const handleMouseOver = (e) => {
      if (e.target.classList.contains('ai-glossary-term')) {
        const term = e.target.getAttribute('data-term');
        const definition = aiTerms[term];
        
        if (definition) {
          const rect = e.target.getBoundingClientRect();
          setTooltip({
            show: true,
            content: definition,
            term: term,
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
        }
      }
    };

    const handleMouseOut = (e) => {
      if (e.target.classList.contains('ai-glossary-term')) {
        setTooltip({ show: false, content: '', x: 0, y: 0 });
      }
    };

    // Set up mutation observer to detect when editor content changes
    const setupObserver = () => {
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement && !editorObserver.current) {
        editorObserver.current = new MutationObserver((mutations) => {
          // Only react to mutations that aren't from our highlighting
          const isFromHighlighting = mutations.some(mutation => 
            mutation.type === 'childList' && 
            Array.from(mutation.addedNodes).some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              node.classList?.contains('ai-glossary-term')
            )
          );
          
          if (!isFromHighlighting && !isUserTyping.current && !isHighlighting.current && isEnabled) {
            // Content changed from outside, schedule highlighting
            if (highlightTimer.current) clearTimeout(highlightTimer.current);
            highlightTimer.current = setTimeout(highlightTerms, 1000);
          }
        });
        
        editorObserver.current.observe(editorElement, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      const editorElement = container.querySelector('[contenteditable]');
      
      if (editorElement) {
        // Add event listeners
        container.addEventListener('mouseover', handleMouseOver);
        container.addEventListener('mouseout', handleMouseOut);
        editorElement.addEventListener('input', handleUserInput);
        editorElement.addEventListener('keydown', handleUserInput);
        editorElement.addEventListener('blur', handleBlur);
        editorElement.addEventListener('focus', handleFocus);
        
        // Set up mutation observer
        setupObserver();
        
        // Initial highlight after a delay to ensure editor is ready (only if enabled)
        if (isEnabled) {
          setTimeout(() => {
            if (document.activeElement !== editorElement && !isUserTyping.current) {
              highlightTerms();
            }
          }, 1000);
        }

        return () => {
          container.removeEventListener('mouseover', handleMouseOver);
          container.removeEventListener('mouseout', handleMouseOut);
          editorElement.removeEventListener('input', handleUserInput);
          editorElement.removeEventListener('keydown', handleUserInput);
          editorElement.removeEventListener('blur', handleBlur);
          editorElement.removeEventListener('focus', handleFocus);
          
          if (typingTimer.current) clearTimeout(typingTimer.current);
          if (highlightTimer.current) clearTimeout(highlightTimer.current);
          if (editorObserver.current) {
            editorObserver.current.disconnect();
            editorObserver.current = null;
          }
        };
      }
    }
  }, [aiTerms, isProcessing, isEnabled]);

  // Effect to handle enabling/disabling
  useEffect(() => {
    if (!isEnabled) {
      // Clear highlights when disabled
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement && !isHighlighting.current) {
        const htmlContent = editorElement.innerHTML;
        const cleanHtml = htmlContent.replace(/<span class="ai-glossary-term[^"]*"[^>]*>([^<]+)<\/span>/gi, '$1');
        if (cleanHtml !== htmlContent) {
          editorElement.innerHTML = cleanHtml;
        }
      }
      // Clear AI terms
      setAiTerms({});
      // Hide tooltip
      setTooltip({ show: false, content: '', x: 0, y: 0 });
    } else {
      // Trigger highlighting when enabled
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement && !isUserTyping.current) {
        const textContent = editorElement.textContent || '';
        if (textContent.trim() && textContent.length > 30) {
          setTimeout(() => {
            if (document.activeElement !== editorElement && !isUserTyping.current) {
              const processWithAI = async () => {
                if (isProcessing) return;
                
                setIsProcessing(true);
                try {
                  const newTerms = await aiService.extractAndDefineTerms(textContent);
                  if (newTerms && Object.keys(newTerms).length > 0) {
                    setAiTerms(newTerms);
                  }
                } catch (error) {
                  console.warn('AI processing failed:', error);
                } finally {
                  setIsProcessing(false);
                }
              };
              processWithAI();
            }
          }, 500);
        }
      }
    }
  }, [isEnabled]);

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* AI Processing Indicator */}
      {isProcessing && isEnabled && (
        <div className={`
          absolute top-2 right-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs 
          flex items-center gap-2 shadow-lg z-10 animate-pulse
          ${isMobile ? 'top-1 right-1 px-2 py-1 text-xs' : ''}
        `}>
          <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          <span className={isMobile ? 'hidden' : ''}>AI Analyzing...</span>
          <span className={isMobile ? '' : 'hidden'}>AI</span>
        </div>
      )}
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className={`
            fixed z-50 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none
            ${isMobile ? 'max-w-xs p-3 text-xs' : 'max-w-sm'}
          `}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: isMobile ? 'translate(-50%, -120%)' : 'translate(-50%, -100%)',
            animation: 'tooltipFadeIn 0.2s ease-out'
          }}
        >
          <div className={`font-semibold text-blue-300 mb-2 ${isMobile ? 'text-xs' : ''}`}>
            {tooltip.term}
          </div>
          <div className={`leading-relaxed text-gray-100 ${isMobile ? 'text-xs leading-tight' : ''}`}>
            {tooltip.content}
          </div>
          
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #1f2937'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AIGlossaryHighlighter;