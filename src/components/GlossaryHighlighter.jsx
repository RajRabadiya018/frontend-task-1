import React, { useEffect, useRef, useState } from 'react';
import { glossaryTerms } from '../data/glossaryTerms';

const GlossaryHighlighter = ({ children }) => {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const isUserTyping = useRef(false);
  const typingTimer = useRef(null);
  const highlightTimer = useRef(null);

  useEffect(() => {
    const highlightTerms = () => {
      if (!containerRef.current || isUserTyping.current) return;

      const editorElement = containerRef.current.querySelector('[contenteditable]');
      if (!editorElement) return;

      // Don't highlight if editor is focused (user is actively editing)
      if (document.activeElement === editorElement) return;

      const textContent = editorElement.textContent || '';
      if (!textContent.trim()) return;

      // Get current HTML and remove existing highlights
      let htmlContent = editorElement.innerHTML;
      const cleanHtml = htmlContent.replace(/<span class="glossary-term"[^>]*>([^<]+)<\/span>/gi, '$1');
      
      // Sort terms by length (longest first) to avoid partial matches
      const sortedTerms = Object.keys(glossaryTerms).sort((a, b) => b.length - a.length);

      let modifiedHtml = cleanHtml;
      let hasChanges = false;

      // Highlight each term
      sortedTerms.forEach(term => {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const newHtml = modifiedHtml.replace(regex, (match) => {
          hasChanges = true;
          return `<span class="glossary-term" data-term="${term}">${match}</span>`;
        });
        modifiedHtml = newHtml;
      });

      // Only update if there are changes and editor is not focused
      if (hasChanges && modifiedHtml !== editorElement.innerHTML && document.activeElement !== editorElement) {
        editorElement.innerHTML = modifiedHtml;
      }
    };

    const handleUserInput = () => {
      isUserTyping.current = true;
      
      // Clear existing timers
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      
      // Remove highlights while typing to prevent cursor issues
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement) {
        const htmlContent = editorElement.innerHTML;
        const cleanHtml = htmlContent.replace(/<span class="glossary-term"[^>]*>([^<]+)<\/span>/gi, '$1');
        if (cleanHtml !== htmlContent) {
          editorElement.innerHTML = cleanHtml;
        }
      }
      
      // Set timer to stop typing detection
      typingTimer.current = setTimeout(() => {
        isUserTyping.current = false;
      }, 1000);
    };

    const handleBlur = () => {
      isUserTyping.current = false;
      
      // Highlight terms after user stops editing
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(highlightTerms, 500);
    };

    const handleFocus = () => {
      // Remove highlights when user starts editing
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement) {
        const htmlContent = editorElement.innerHTML;
        const cleanHtml = htmlContent.replace(/<span class="glossary-term"[^>]*>([^<]+)<\/span>/gi, '$1');
        if (cleanHtml !== htmlContent) {
          editorElement.innerHTML = cleanHtml;
        }
      }
    };

    const handleMouseOver = (e) => {
      if (e.target.classList.contains('glossary-term')) {
        const term = e.target.getAttribute('data-term');
        const definition = glossaryTerms[term];
        
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
      if (e.target.classList.contains('glossary-term')) {
        setTooltip({ show: false, content: '', x: 0, y: 0 });
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
        
        // Initial highlight after a delay (only if editor is not focused)
        setTimeout(() => {
          if (document.activeElement !== editorElement) {
            highlightTerms();
          }
        }, 2000);

        return () => {
          container.removeEventListener('mouseover', handleMouseOver);
          container.removeEventListener('mouseout', handleMouseOut);
          editorElement.removeEventListener('input', handleUserInput);
          editorElement.removeEventListener('keydown', handleUserInput);
          editorElement.removeEventListener('blur', handleBlur);
          editorElement.removeEventListener('focus', handleFocus);
          
          if (typingTimer.current) clearTimeout(typingTimer.current);
          if (highlightTimer.current) clearTimeout(highlightTimer.current);
        };
      }
    }
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 max-w-xs p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none tooltip-animate"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold mb-1 text-yellow-300">{tooltip.term}</div>
          <div className="leading-relaxed">{tooltip.content}</div>
          
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
    </div>
  );
};

export default GlossaryHighlighter;