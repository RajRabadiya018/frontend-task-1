import React, { useState, useRef, useEffect } from 'react';
import TextFormatToolbar from './TextFormatToolbar';
import AIGlossaryHighlighter from './AIGlossaryHighlighter';

const RichTextEditor = ({ 
  note, 
  onUpdateNote, 
  isCreatingNew, 
  onFinishCreating, 
  preferences = {},
  onUpdatePreference,
  onEncryptNote,
  onDecryptNote
}) => {
  const [title, setTitle] = useState(note.title);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const currentNoteId = useRef(note.id);
  const hasUnsavedChanges = useRef(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmallMobile(width < 480);
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

  // Only update when note actually changes 
  useEffect(() => {
    if (note.id !== currentNoteId.current) {
      // Save previous note if there were unsaved changes
      if (hasUnsavedChanges.current && editorRef.current && currentNoteId.current) {
        const content = editorRef.current.innerHTML;
        onUpdateNote(currentNoteId.current, { content });
      }
      
      // Switch to new note
      currentNoteId.current = note.id;
      setTitle(note.title);
      hasUnsavedChanges.current = false;
      
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content || '';
      }
    }
  }, [note.id, note.title, note.content, onUpdateNote]);

  // Initialize editor content on first mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = note.content || '';
    }
  }, []);

  // Focus handling for new notes
  useEffect(() => {
    if (isCreatingNew && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isCreatingNew]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    hasUnsavedChanges.current = true;
  };

  const handleInput = (e) => {
    hasUnsavedChanges.current = true;
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChanges();
      if (editorRef.current) {
        editorRef.current.focus();
      }
      if (isCreatingNew) {
        onFinishCreating();
      }
    }
  };

  const saveChanges = () => {
    if (hasUnsavedChanges.current) {
      const content = editorRef.current ? editorRef.current.innerHTML : '';
      onUpdateNote(note.id, { 
        title: title,
        content: content 
      });
      hasUnsavedChanges.current = false;
    }
  };

  const applyFormat = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      hasUnsavedChanges.current = true;
    }
  };

  const handleKeyDown = (e) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault(); 
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('underline');
          break;
        case 's':
          e.preventDefault();
          saveChanges();
          break;
        default:
          break;
      }
    }
  };

  const handleBlur = () => {
    // Save when user clicks away from editor
    saveChanges();
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges.current && editorRef.current) {
        const content = editorRef.current.innerHTML;
        onUpdateNote(note.id, { 
          title: title,
          content: content 
        });
      }
    };
  }, [note.id, title, onUpdateNote]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWordCount = () => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.textContent || '';
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    if (!editorRef.current) return 0;
    return (editorRef.current.textContent || '').length;
  };

  const getReadingTime = () => {
    const words = getWordCount();
    return Math.ceil(words / 200); // 200 words per minute average
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className={`border-b border-gray-200 bg-white ${isMobile ? 'p-4 pt-6' : 'p-4'}`}>
        {/* Title Section */}
        <div className={`${isMobile ? 'mb-5' : 'mb-3'}`}>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={saveChanges}
            className={`
              ${isMobile ? 'text-xl w-full text-center' : 'text-2xl w-full'} 
              font-bold text-gray-800 bg-transparent border-none outline-none placeholder-gray-400
              ${isMobile ? 'py-2' : 'py-1'}
            `}
            placeholder="Note title..."
            style={{ fontSize: isMobile ? '18px' : undefined }} // Prevent zoom on iOS
          />
        </div>
        
        {/* Action Buttons */}
        <div className={`${isMobile ? 'mb-5' : 'mb-3'}`}>
          <div className={`flex items-center ${isMobile ? 'justify-center gap-4' : 'justify-end gap-2'}`}>
            {/* AI Button */}
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`
                ${isMobile ? 'px-4 py-3 min-h-[48px] min-w-[48px]' : 'p-2'} 
                rounded-lg transition-colors flex items-center justify-center gap-2
                ${aiEnabled 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:bg-purple-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                }
                ${isMobile ? 'shadow-sm' : ''}
              `}
              title={aiEnabled ? 'Disable AI glossary highlighting' : 'Enable AI glossary highlighting'}
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {isMobile && <span className="text-sm font-medium">AI</span>}
            </button>

            
            
            {/* Encryption Button */}
            <button
              onClick={note.isEncrypted ? onDecryptNote : onEncryptNote}
              className={`
                ${isMobile ? 'px-4 py-3 min-h-[48px] min-w-[48px]' : 'p-2'} 
                rounded-lg transition-colors flex items-center justify-center gap-2
                ${note.isEncrypted 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300' 
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 active:bg-yellow-300'
                }
                ${isMobile ? 'shadow-sm' : ''}
              `}
              title={note.isEncrypted ? 'Decrypt note' : 'Encrypt note'}
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {note.isEncrypted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                )}
              </svg>
              {isMobile && <span className="text-sm font-medium">{note.isEncrypted ? 'Decrypt' : 'Encrypt'}</span>}
            </button>
          </div>
        </div>

        {/* Note Info */}
        <div className={`flex items-center justify-between text-sm text-gray-500 ${isMobile ? 'flex-col gap-3' : ''}`}>
          <div className={`flex items-center ${isMobile ? 'flex-wrap justify-center gap-2' : 'gap-4'}`}>
            <span className={`${isSmallMobile ? 'text-xs' : 'text-sm'} ${isMobile ? 'text-center' : ''}`}>
              {isMobile ? 'Updated' : 'Last updated'}: {formatDate(note.updatedAt)}
            </span>
            {hasUnsavedChanges.current && (
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
                Unsaved changes
              </span>
            )}
            {note.isEncrypted && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                🔒 Encrypted
              </span>
            )}
          </div>
          
          {/* Statistics */}
          <div className={`flex items-center text-xs ${isMobile ? 'justify-center gap-3' : 'gap-4'}`}>
            <span>{getWordCount()} words</span>
            <span>{getCharacterCount()} chars</span>
            <span>{getReadingTime()} min read</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <TextFormatToolbar onApplyFormat={applyFormat} editorRef={editorRef} />

      {/* Editor */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'}`}>
        {note.isEncrypted ? (
          <div className="flex items-center justify-center h-full">
            <div className={`text-center ${isMobile ? 'px-4' : ''}`}>
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center`}>
                <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-700 mb-2`}>
                Note is Encrypted
              </h3>
              <p className={`text-gray-500 mb-4 ${isMobile ? 'text-sm' : ''}`}>
                This note is password protected. Click the decrypt button to view its contents.
              </p>
              <button
                onClick={onDecryptNote}
                className={`
                  bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-colors
                  ${isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-6 py-2'}
                `}
              >
                Decrypt Note
              </button>
            </div>
          </div>
        ) : (
          <AIGlossaryHighlighter isEnabled={aiEnabled} onToggle={setAiEnabled}>
            <div
              ref={editorRef}
              contentEditable
              className={`
                min-h-full w-full outline-none text-gray-700 leading-relaxed
                ${preferences.fontFamily === 'serif' ? 'font-serif' : 
                  preferences.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
                }
                ${isMobile ? 'touch-manipulation' : ''}
              `}
              style={{ 
                minHeight: isMobile ? '300px' : '400px',
                fontSize: `${preferences.fontSize || (isMobile ? 16 : 16)}px`,
                lineHeight: isMobile ? '1.6' : '1.5',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'text',
                userSelect: 'text'
              }}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              suppressContentEditableWarning={true}
              placeholder="Start writing your note..."
              spellCheck={preferences.enableSpellCheck !== false}
            />
          </AIGlossaryHighlighter>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;