import React, { useState, useRef, useEffect } from 'react';
import RichTextEditor from './components/RichTextEditor';
import NotesList from './components/NotesList';
import { generateId } from './utils/helpers';

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
      if (parsedNotes.length > 0) {
        setCurrentNote(parsedNotes[0]);
      }
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

  const createNewNote = () => {
    const newNote = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setNotes(prev => [newNote, ...prev]);
    setCurrentNote(newNote);
    setIsCreatingNew(true);
  };

  const updateNote = (noteId, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    ));
    
    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    }
  };

  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    if (currentNote && currentNote.id === noteId) {
      const remainingNotes = notes.filter(note => note.id !== noteId);
      setCurrentNote(remainingNotes.length > 0 ? remainingNotes[0] : null);
    }
  };

  const togglePinNote = (noteId) => {
    const noteToPin = notes.find(note => note.id === noteId);
    if (!noteToPin) return;

    const updatedNote = { ...noteToPin, isPinned: !noteToPin.isPinned };
    
    setNotes(prev => {
      const otherNotes = prev.filter(note => note.id !== noteId);
      
      if (updatedNote.isPinned) {
        // Add to beginning of pinned notes
        const pinnedNotes = otherNotes.filter(note => note.isPinned);
        const unpinnedNotes = otherNotes.filter(note => !note.isPinned);
        return [updatedNote, ...pinnedNotes, ...unpinnedNotes];
      } else {
        // Add to beginning of unpinned notes
        const pinnedNotes = otherNotes.filter(note => note.isPinned);
        const unpinnedNotes = otherNotes.filter(note => !note.isPinned);
        return [...pinnedNotes, updatedNote, ...unpinnedNotes];
      }
    });

    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(updatedNote);
    }
  };

  const selectNote = (note) => {
    setCurrentNote(note);
    setIsCreatingNew(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Notes</h1>
            <button
              onClick={createNewNote}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Note
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          <NotesList
            notes={notes}
            currentNote={currentNote}
            onSelectNote={selectNote}
            onDeleteNote={deleteNote}
            onTogglePin={togglePinNote}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentNote ? (
          <RichTextEditor
            note={currentNote}
            onUpdateNote={updateNote}
            isCreatingNew={isCreatingNew}
            onFinishCreating={() => setIsCreatingNew(false)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Note Selected</h2>
              <p className="text-gray-500 mb-6">Select a note from the sidebar or create a new one to get started.</p>
              <button
                onClick={createNewNote}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Create Your First Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;