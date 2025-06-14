import React, { useState, useRef, useEffect } from 'react';
import TextFormatToolbar from './TextFormatToolbar';
import GlossaryHighlighter from './GlossaryHighlighter';

const RichTextEditor = ({ note, onUpdateNote, isCreatingNew, onFinishCreating }) => {
  const [title, setTitle] = useState(note.title);
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(note.content);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    setTitle(note.title);
    
    // Only update editor content if it's different from what we have
    if (editorRef.current && note.content !== contentRef.current) {
      contentRef.current = note.content;
      editorRef.current.innerHTML = note.content;
    }
  }, [note]);

  useEffect(() => {
    if (isCreatingNew && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isCreatingNew]);

  // Initialize editor content on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = note.content || '';
      contentRef.current = note.content || '';
    }
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdateNote(note.id, { title: newTitle });
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      contentRef.current = newContent;
      
      // Debounce the note update to reduce frequency
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        onUpdateNote(note.id, { content: newContent });
      }, 500);
    }
  };

  const handleInput = (e) => {
    handleContentChange();
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editorRef.current) {
        editorRef.current.focus();
      }
      if (isCreatingNew) {
        onFinishCreating();
      }
    }
  };

  const applyFormat = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleContentChange();
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
        default:
          break;
      }
    }
  };

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          className="text-2xl font-bold text-gray-800 w-full bg-transparent border-none outline-none placeholder-gray-400"
          placeholder="Note title..."
        />
        <div className="text-sm text-gray-500 mt-2">
          Last updated: {formatDate(note.updatedAt)}
        </div>
      </div>

      {/* Toolbar */}
      <TextFormatToolbar onApplyFormat={applyFormat} editorRef={editorRef} />

      {/* Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        <GlossaryHighlighter>
          <div
            ref={editorRef}
            contentEditable
            className="min-h-full w-full outline-none text-gray-700 leading-relaxed"
            style={{ minHeight: '400px' }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleContentChange}
            suppressContentEditableWarning={true}
            placeholder="Start writing your note..."
          />
        </GlossaryHighlighter>
      </div>
    </div>
  );
};

export default RichTextEditor;