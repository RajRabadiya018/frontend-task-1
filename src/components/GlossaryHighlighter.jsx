import React, { useEffect, useRef, useState } from 'react';
import aiService from '../services/aiService';

const GlossaryHighlighter = ({ children }) => {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const [aiTerms, setAiTerms] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const isUserTyping = useRef(false);
  const typingTimer = useRef(null);
  const highlightTimer = useRef(null);
  const lastProcessedText = useRef('');

  useEffect(() => {
    const highlightTerms = async () => {
      if (!containerRef.current || isUserTyping.current) return;

      const editorElement = containerRef.current.querySelector('[contenteditable]');
      if (!editorElement) return;

      // Don't highlight if editor is focused (user is actively editing)
      if (document.activeElement === editorElement) return;

      const textContent = editorElement.textContent || '';
      if (!textContent.trim() || textContent.length < 20) return;

      // Get current HTML and remove existing highlights
      let htmlContent = editorElement.innerHTML;
      const cleanHtml = htmlContent.replace(/<span class="ai-glossary-term"[^>]*>([^<]+)<\/span>/gi, '$1');
      
      // Check if we need to process with AI
      const shouldProcessAI = textContent !== lastProcessedText.current && textContent.length > 30;

      if (shouldProcessAI) {
        await processWithAI(textContent);
      }

      // Only highlight if we have AI terms
      if (Object.keys(aiTerms).length === 0) {
        lastProcessedText.current = textContent;
        return;
      }

      // Sort terms by length (longest first) to avoid partial matches
      const sortedTerms = Object.keys(aiTerms).sort((a, b) => b.length - a.length);

      let modifiedHtml = cleanHtml;
      let hasChanges = false;

      // Highlight each AI term
      sortedTerms.forEach(term => {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const newHtml = modifiedHtml.replace(regex, (match) => {
          hasChanges = true;
          return `<span class="ai-glossary-term" data-term="${term}">${match}</span>`;
        });
        modifiedHtml = newHtml;
      });

      // Only update if there are changes and editor is not focused
      if (hasChanges && modifiedHtml !== editorElement.innerHTML && document.activeElement !== editorElement) {
        editorElement.innerHTML = modifiedHtml;
      }

      lastProcessedText.current = textContent;
    };

    const processWithAI = async (text) => {
      if (isProcessing || !text || text.length < 20) return;
      
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

    const handleUserInput = () => {
      isUserTyping.current = true;
      
      // Clear existing timers
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      
      // Remove highlights while typing to prevent cursor issues
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement) {
        const htmlContent = editorElement.innerHTML;
        const cleanHtml = htmlContent.replace(/<span class="ai-glossary-term"[^>]*>([^<]+)<\/span>/gi, '$1');
        if (cleanHtml !== htmlContent) {
          editorElement.innerHTML = cleanHtml;
        }
      }
      
      // Set timer to stop typing detection
      typingTimer.current = setTimeout(() => {
        isUserTyping.current = false;
      }, 2000);
    };

    const handleBlur = () => {
      isUserTyping.current = false;
      
      // Highlight terms after user stops editing
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(highlightTerms, 1000);
    };

    const handleFocus = () => {
      // Remove highlights when user starts editing
      const editorElement = containerRef.current?.querySelector('[contenteditable]');
      if (editorElement) {
        const htmlContent = editorElement.innerHTML;
        const cleanHtml = htmlContent.replace(/<span class="ai-glossary-term"[^>]*>([^<]+)<\/span>/gi, '$1');
        if (cleanHtml !== htmlContent) {
          editorElement.innerHTML = cleanHtml;
        }
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
        
        // Initial highlight after a delay
        setTimeout(() => {
          if (document.activeElement !== editorElement) {
            highlightTerms();
          }
        }, 1500);

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
  }, [aiTerms, isProcessing]);

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* AI Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg z-10 animate-pulse">
          <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          AI Analyzing...
        </div>
      )}
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 max-w-sm p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="font-semibold text-blue-300 mb-2">{tooltip.term}</div>
          <div className="leading-relaxed text-gray-100">{tooltip.content}</div>
          
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

export default GlossaryHighlighter;