import React, { useState } from 'react';

const NotesList = ({ notes, currentNote, onSelectNote, onDeleteNote, onTogglePin }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteClick = (e, noteId) => {
    e.stopPropagation();
    setShowDeleteConfirm(noteId);
  };

  const confirmDelete = (e, noteId) => {
    e.stopPropagation();
    onDeleteNote(noteId);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(null);
  };

  const handlePinClick = (e, noteId) => {
    e.stopPropagation();
    onTogglePin(noteId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Set both dates to start of day for accurate day comparison
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowStart - dateStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `${diffDays} days ago`;
    } else if (diffDays > 7) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } else {
      // Handle future dates (negative diffDays)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getPreviewText = (htmlContent) => {
    if (!htmlContent) return 'No additional text';
    
    // Create a temporary div to strip HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Return first 100 characters
    return textContent.length > 100 
      ? textContent.substring(0, 100) + '...'
      : textContent || 'No additional text';
  };

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter(note => note.isPinned);
  const unpinnedNotes = notes.filter(note => !note.isPinned);

  const NoteItem = ({ note, isPinned = false }) => (
    <div
      key={note.id}
      onClick={() => onSelectNote(note)}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
        currentNote && currentNote.id === note.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isPinned && (
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4a1 1 0 0 0-.5-.87L12 1 8.5 3.13A1 1 0 0 0 8 4v8H5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h6v5a1 1 0 0 0 2 0v-5h6a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-3z"/>
            </svg>
          )}
          <h3 className="font-medium text-gray-800 truncate flex-1">
            {note.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => handlePinClick(e, note.id)}
            className={`p-1 rounded hover:bg-gray-200 transition-colors duration-200 ${
              note.isPinned ? 'text-amber-500' : 'text-gray-400'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4a1 1 0 0 0-.5-.87L12 1 8.5 3.13A1 1 0 0 0 8 4v8H5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h6v5a1 1 0 0 0 2 0v-5h6a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-3z"/>
            </svg>
          </button>
          
          {showDeleteConfirm === note.id ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => confirmDelete(e, note.id)}
                className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                title="Confirm delete"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={cancelDelete}
                className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                title="Cancel delete"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => handleDeleteClick(e, note.id)}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
              title="Delete note"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
        {getPreviewText(note.content)}
      </p>
      
      <div className="text-xs text-gray-400">
        {formatDate(note.updatedAt)}
      </div>
    </div>
  );

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No notes yet</p>
          <p className="text-gray-400 text-xs mt-1">Create your first note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4a1 1 0 0 0-.5-.87L12 1 8.5 3.13A1 1 0 0 0 8 4v8H5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h6v5a1 1 0 0 0 2 0v-5h6a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-3z"/>
              </svg>
              <span className="text-sm font-medium text-amber-800">Pinned</span>
            </div>
          </div>
          {pinnedNotes.map(note => (
            <NoteItem key={note.id} note={note} isPinned={true} />
          ))}
        </div>
      )}

      {/* Regular Notes */}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Notes</span>
            </div>
          )}
          {unpinnedNotes.map(note => (
            <NoteItem key={note.id} note={note} isPinned={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;