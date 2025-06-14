import React, { useState, useRef, useEffect, useCallback } from 'react';
import RichTextEditor from './components/RichTextEditor';
import NotesList from './components/NotesList';
import ResponsiveLayout from './components/ResponsiveLayout';
import EncryptionModal from './components/EncryptionModal';
import { generateId } from './utils/helpers';
import storageService from './services/storageService';
import encryptionService from './services/encryptionService';

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [encryptionModal, setEncryptionModal] = useState({ 
    isOpen: false, 
    mode: 'encrypt', 
    noteId: null 
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Load preferences first
        const savedPreferences = storageService.loadPreferences();
        setPreferences(savedPreferences);

        // Load notes
        const savedNotes = storageService.loadNotes();
        if (savedNotes && savedNotes.length > 0) {
          setNotes(savedNotes);

          // Set current note based on preferences
          const lastOpenedId = savedPreferences.lastOpenedNote;
          const lastOpenedNote = savedNotes.find(note => note.id === lastOpenedId);
          setCurrentNote(lastOpenedNote || savedNotes[0]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Initialize with empty state if loading fails
        setNotes([]);
        setCurrentNote(null);
        setPreferences(storageService.defaultPreferences);
      }
    };

    loadData();
  }, []);

  // Save to storage whenever notes change (but not auto-save during editing)
  useEffect(() => {
    if (notes.length > 0) {
      try {
        storageService.saveNotes(notes);
      } catch (error) {
        console.error('Failed to save notes:', error);
      }
    }
  }, [notes]);

  // Save preferences when they change
  useEffect(() => {
    if (Object.keys(preferences).length > 0) {
      try {
        storageService.savePreferences(preferences);
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
  }, [preferences]);

  const createNewNote = () => {
    const newNote = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      isPinned: false,
      isEncrypted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0
    };
    
    setNotes(prev => [newNote, ...prev]);
    setCurrentNote(newNote);
    setIsCreatingNew(true);
    
    // Close sidebar on mobile after creating note
    setSidebarOpen(false);
  };

  // Simple updateNote function - no auto-save conflicts
  const updateNote = useCallback((noteId, updates) => {
    // Calculate word and character count if content is updated
    if (updates.content !== undefined) {
      const textContent = updates.content.replace(/<[^>]*>/g, ''); // Strip HTML
      updates.wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      updates.characterCount = textContent.length;
    }

    const updatedNote = { ...updates, updatedAt: new Date().toISOString() };

    // Update notes array
    setNotes(prev => {
      return prev.map(note => 
        note.id === noteId 
          ? { ...note, ...updatedNote }
          : note
      );
    });
    
    // Update currentNote if it's the same note
    setCurrentNote(prev => {
      if (prev && prev.id === noteId) {
        return { ...prev, ...updatedNote };
      }
      return prev;
    });
    
    // Update preferences for last opened note
    if (updates.title) {
      setPreferences(prev => ({ ...prev, lastOpenedNote: noteId }));
      storageService.addToRecentNotes(noteId, updates.title);
    }
  }, []);

  const deleteNote = (noteId) => {
    // Also delete from encrypted storage if it's encrypted
    const noteToDelete = notes.find(note => note.id === noteId);
    if (noteToDelete?.isEncrypted) {
      storageService.deleteEncryptedNote(noteId);
    }

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
      
      let newNotesOrder;
      if (updatedNote.isPinned) {
        const pinnedNotes = otherNotes.filter(note => note.isPinned);
        const unpinnedNotes = otherNotes.filter(note => !note.isPinned);
        newNotesOrder = [updatedNote, ...pinnedNotes, ...unpinnedNotes];
      } else {
        const pinnedNotes = otherNotes.filter(note => note.isPinned);
        const unpinnedNotes = otherNotes.filter(note => !note.isPinned);
        newNotesOrder = [...pinnedNotes, updatedNote, ...unpinnedNotes];
      }
      
      return newNotesOrder;
    });

    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(updatedNote);
    }
  };

  const selectNote = (note) => {
    setCurrentNote(note);
    setIsCreatingNew(false);
    
    // Update preferences
    setPreferences(prev => ({ ...prev, lastOpenedNote: note.id }));
    
    // Add to recent notes
    storageService.addToRecentNotes(note.id, note.title);
    
    // Close sidebar on mobile after selecting note
    setSidebarOpen(false);
  };

  // Encryption functions
  const handleEncryptNote = async (password) => {
    if (!currentNote) return;

    try {
      const encryptedData = await encryptionService.encryptNote(currentNote.content, password);
      
      // Save encrypted note to separate storage
      const encryptedNote = {
        id: currentNote.id,
        title: currentNote.title,
        encryptedContent: encryptedData.encryptedContent,
        encryptedAt: encryptedData.encryptedAt,
        createdAt: currentNote.createdAt,
        updatedAt: new Date().toISOString(),
        isPinned: currentNote.isPinned
      };
      
      storageService.saveEncryptedNote(encryptedNote);
      
      // Update note to mark as encrypted and clear content
      updateNote(currentNote.id, {
        content: '',
        isEncrypted: true,
        encryptedAt: encryptedData.encryptedAt
      });
      
      console.log('Note encrypted successfully');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  };

  const handleDecryptNote = async (password) => {
    if (!currentNote || !currentNote.isEncrypted) return;

    try {
      // Load encrypted note
      const encryptedNotes = storageService.loadEncryptedNotes();
      const encryptedNote = encryptedNotes.find(note => note.id === currentNote.id);
      
      if (!encryptedNote) {
        throw new Error('Encrypted note not found');
      }

      // Decrypt content
      const decryptedData = await encryptionService.decryptNote(
        encryptedNote.encryptedContent, 
        password
      );
      
      if (!decryptedData.success) {
        throw new Error(decryptedData.error || 'Decryption failed');
      }

      // Update note with decrypted content
      updateNote(currentNote.id, {
        content: decryptedData.content,
        isEncrypted: false,
        encryptedAt: null
      });
      
      // Remove from encrypted storage
      storageService.deleteEncryptedNote(currentNote.id);
      
      console.log('Note decrypted successfully');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  };

  const openEncryptionModal = (mode, noteId = null) => {
    setEncryptionModal({
      isOpen: true,
      mode,
      noteId: noteId || currentNote?.id
    });
  };

  const closeEncryptionModal = () => {
    setEncryptionModal({
      isOpen: false,
      mode: 'encrypt',
      noteId: null
    });
  };

  // Update preferences
  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Notes</h1>
          <button
            onClick={createNewNote}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 min-h-[44px] touch-manipulation"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline sm:inline">New Note</span>
          </button>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
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
          onEncryptNote={(noteId) => {
            const note = notes.find(n => n.id === noteId);
            if (note?.isEncrypted) {
              setCurrentNote(note);
              openEncryptionModal('decrypt', noteId);
            } else {
              setCurrentNote(note);
              openEncryptionModal('encrypt', noteId);
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden">
      <ResponsiveLayout
        sidebar={sidebar}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      >
        {currentNote ? (
          <RichTextEditor
            key={currentNote.id} // Force re-mount when note changes
            note={currentNote}
            onUpdateNote={updateNote}
            isCreatingNew={isCreatingNew}
            onFinishCreating={() => setIsCreatingNew(false)}
            preferences={preferences}
            onUpdatePreference={updatePreference}
            onEncryptNote={() => openEncryptionModal('encrypt')}
            onDecryptNote={() => openEncryptionModal('decrypt')}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-md">
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
      </ResponsiveLayout>

      {/* Encryption Modal */}
      <EncryptionModal
        isOpen={encryptionModal.isOpen}
        mode={encryptionModal.mode}
        noteTitle={currentNote?.title}
        onClose={closeEncryptionModal}
        onEncrypt={handleEncryptNote}
        onDecrypt={handleDecryptNote}
      />
    </div>
  );
}

export default App;