// Enhanced Storage Service for Notes and User Preferences

class StorageService {
  constructor() {
    this.NOTES_KEY = 'notes_app_notes';
    this.PREFERENCES_KEY = 'notes_app_preferences';
    this.ENCRYPTED_NOTES_KEY = 'notes_app_encrypted';
    
    // Default preferences - removed showWordCount toggle, statistics always shown
    this.defaultPreferences = {
      theme: 'light',
      fontSize: '16',
      fontFamily: 'system',
      autoSave: true,
      autoSaveInterval: 300, // Reduced for better data persistence
      enableSpellCheck: true,
      sidebarWidth: 320,
      lastOpenedNote: null,
      recentNotes: [],
      maxRecentNotes: 10
    };
  }

  // Notes Management
  saveNotes(notes) {
    try {
      const notesData = {
        notes: notes,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.NOTES_KEY, JSON.stringify(notesData));
      console.log('Notes saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save notes:', error);
      return false;
    }
  }

  loadNotes() {
    try {
      const data = localStorage.getItem(this.NOTES_KEY);
      if (!data) return [];

      const notesData = JSON.parse(data);
      
      // Handle legacy format
      if (Array.isArray(notesData)) {
        return notesData;
      }
      
      return notesData.notes || [];
    } catch (error) {
      console.error('Failed to load notes:', error);
      return [];
    }
  }

  // User Preferences Management
  savePreferences(preferences) {
    try {
      const prefsData = {
        ...this.defaultPreferences,
        ...preferences,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(prefsData));
      console.log('Preferences saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  }

  loadPreferences() {
    try {
      const data = localStorage.getItem(this.PREFERENCES_KEY);
      if (!data) return this.defaultPreferences;

      const preferences = JSON.parse(data);
      return { ...this.defaultPreferences, ...preferences };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return this.defaultPreferences;
    }
  }

  updatePreference(key, value) {
    const preferences = this.loadPreferences();
    preferences[key] = value;
    return this.savePreferences(preferences);
  }

  // Recent Notes Management
  addToRecentNotes(noteId, noteTitle) {
    const preferences = this.loadPreferences();
    let recentNotes = preferences.recentNotes || [];
    
    // Remove if already exists
    recentNotes = recentNotes.filter(note => note.id !== noteId);
    
    // Add to beginning
    recentNotes.unshift({
      id: noteId,
      title: noteTitle,
      accessedAt: new Date().toISOString()
    });
    
    // Limit to max recent notes
    recentNotes = recentNotes.slice(0, preferences.maxRecentNotes);
    
    preferences.recentNotes = recentNotes;
    this.savePreferences(preferences);
  }

  getRecentNotes() {
    const preferences = this.loadPreferences();
    return preferences.recentNotes || [];
  }

  // Backup and Restore
  exportData() {
    try {
      const notes = this.loadNotes();
      const preferences = this.loadPreferences();
      const encryptedNotes = this.loadEncryptedNotes();
      
      const exportData = {
        notes,
        preferences,
        encryptedNotes: encryptedNotes.map(note => ({
          ...note,
          content: '[ENCRYPTED]' // Don't export actual encrypted content
        })),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.notes) {
        this.saveNotes(data.notes);
      }
      
      if (data.preferences) {
        this.savePreferences(data.preferences);
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Encrypted Notes Management
  saveEncryptedNote(noteData) {
    try {
      const encryptedNotes = this.loadEncryptedNotes();
      const existingIndex = encryptedNotes.findIndex(note => note.id === noteData.id);
      
      if (existingIndex >= 0) {
        encryptedNotes[existingIndex] = noteData;
      } else {
        encryptedNotes.push(noteData);
      }
      
      localStorage.setItem(this.ENCRYPTED_NOTES_KEY, JSON.stringify(encryptedNotes));
      return true;
    } catch (error) {
      console.error('Failed to save encrypted note:', error);
      return false;
    }
  }

  loadEncryptedNotes() {
    try {
      const data = localStorage.getItem(this.ENCRYPTED_NOTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load encrypted notes:', error);
      return [];
    }
  }

  deleteEncryptedNote(noteId) {
    try {
      const encryptedNotes = this.loadEncryptedNotes();
      const filteredNotes = encryptedNotes.filter(note => note.id !== noteId);
      localStorage.setItem(this.ENCRYPTED_NOTES_KEY, JSON.stringify(filteredNotes));
      return true;
    } catch (error) {
      console.error('Failed to delete encrypted note:', error);
      return false;
    }
  }

  // Storage Statistics
  getStorageStats() {
    try {
      const notes = this.loadNotes();
      const preferences = this.loadPreferences();
      const encryptedNotes = this.loadEncryptedNotes();
      
      const notesSize = new Blob([JSON.stringify(notes)]).size;
      const prefsSize = new Blob([JSON.stringify(preferences)]).size;
      const encryptedSize = new Blob([JSON.stringify(encryptedNotes)]).size;
      
      return {
        totalNotes: notes.length,
        encryptedNotes: encryptedNotes.length,
        storageUsed: notesSize + prefsSize + encryptedSize,
        lastSaved: preferences.lastUpdated || 'Never'
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalNotes: 0,
        encryptedNotes: 0,
        storageUsed: 0,
        lastSaved: 'Error'
      };
    }
  }

  // Clear all data
  clearAllData() {
    try {
      localStorage.removeItem(this.NOTES_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.ENCRYPTED_NOTES_KEY);
      console.log('All data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
}

export default new StorageService();