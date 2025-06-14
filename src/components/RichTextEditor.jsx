import React, { useState, useRef, useEffect } from 'react';
import TextFormatToolbar from './TextFormatToolbar';
import SafeGlossaryHighlighter from './SafeGlossaryHighlighter';

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
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const currentNoteId = useRef(note.id);
  const hasUnsavedChanges = useRef(false);

  // Only update when note actually changes (different note selected)
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
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={saveChanges}
            className="text-2xl font-bold text-gray-800 bg-transparent border-none outline-none placeholder-gray-400 flex-1 mr-4"
            placeholder="Note title..."
          />
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button
              onClick={saveChanges}
              className={`p-2 rounded-lg transition-colors ${
                hasUnsavedChanges.current 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-400'
              }`}
              title="Save changes (Ctrl+S)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
            
            {/* Encryption Button */}
            <button
              onClick={note.isEncrypted ? onDecryptNote : onEncryptNote}
              className={`p-2 rounded-lg transition-colors ${
                note.isEncrypted 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
              title={note.isEncrypted ? 'Decrypt note' : 'Encrypt note'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {note.isEncrypted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Note Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Last updated: {formatDate(note.updatedAt)}</span>
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
          
          {/* Statistics - Always Shown */}
          <div className="flex items-center gap-4 text-xs">
            <span>{getWordCount()} words</span>
            <span>{getCharacterCount()} characters</span>
            <span>{getReadingTime()} min read</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <TextFormatToolbar onApplyFormat={applyFormat} editorRef={editorRef} />

      {/* Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        {note.isEncrypted ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Note is Encrypted</h3>
              <p className="text-gray-500 mb-4">This note is password protected. Click the decrypt button to view its contents.</p>
              <button
                onClick={onDecryptNote}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Decrypt Note
              </button>
            </div>
          </div>
        ) : (
          <SafeGlossaryHighlighter>
            <div
              ref={editorRef}
              contentEditable
              className={`min-h-full w-full outline-none text-gray-700 leading-relaxed ${
                preferences.fontFamily === 'serif' ? 'font-serif' : 
                preferences.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
              }`}
              style={{ 
                minHeight: '400px',
                fontSize: `${preferences.fontSize || 16}px`
              }}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              suppressContentEditableWarning={true}
              placeholder="Start writing your note..."
              spellCheck={preferences.enableSpellCheck !== false}
            />
          </SafeGlossaryHighlighter>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;