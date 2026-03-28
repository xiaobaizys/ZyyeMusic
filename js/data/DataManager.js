class DataManager {
  constructor(storageManager, favoritesManager, playlistManager, historyManager) {
    this.storage = storageManager;
    this.favorites = favoritesManager;
    this.playlists = playlistManager;
    this.history = historyManager;
    this.listeners = [];
  }

  exportAllData() {
    try {
      const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        application: 'Music Website',
        data: {
          favorites: this.favorites.getFavorites(),
          playlists: this.playlists.getPlaylists(),
          history: this.history.getHistory(),
          settings: this.storage.get(this.storage.storageKeys.SETTINGS, {}),
          preferences: this.storage.get(this.storage.storageKeys.USER_PREFERENCES, {})
        },
        statistics: {
          favoritesCount: this.favorites.getFavoritesCount(),
          playlistsCount: this.playlists.getPlaylists().length,
          historyCount: this.history.getHistory().length
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      this.notifyListeners('exported', { success: true, size: jsonString.length });

      return { 
        success: true, 
        data: jsonString,
        size: jsonString.length,
        sizeFormatted: this.storage.formatSize(jsonString.length)
      };
    } catch (error) {
      console.error('Export all data error:', error);
      this.notifyListeners('exportError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  exportSelectiveData(options = {}) {
    try {
      const {
        includeFavorites = true,
        includePlaylists = true,
        includeHistory = true,
        includeSettings = true,
        includePreferences = true
      } = options;

      const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        application: 'Music Website',
        data: {}
      };

      if (includeFavorites) {
        exportData.data.favorites = this.favorites.getFavorites();
      }

      if (includePlaylists) {
        exportData.data.playlists = this.playlists.getPlaylists();
      }

      if (includeHistory) {
        exportData.data.history = this.history.getHistory();
      }

      if (includeSettings) {
        exportData.data.settings = this.storage.get(this.storage.storageKeys.SETTINGS, {});
      }

      if (includePreferences) {
        exportData.data.preferences = this.storage.get(this.storage.storageKeys.USER_PREFERENCES, {});
      }

      const jsonString = JSON.stringify(exportData, null, 2);

      this.notifyListeners('exported', { success: true, size: jsonString.length });

      return { 
        success: true, 
        data: jsonString,
        size: jsonString.length,
        sizeFormatted: this.storage.formatSize(jsonString.length)
      };
    } catch (error) {
      console.error('Export selective data error:', error);
      this.notifyListeners('exportError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  importAllData(importString, options = {}) {
    try {
      const {
        merge = true,
        clearExisting = false,
        validate = true
      } = options;

      const importData = JSON.parse(importString);

      if (validate && !this.validateImportData(importData)) {
        return { success: false, error: 'Invalid import data format' };
      }

      const results = {
        favorites: { imported: 0, errors: [] },
        playlists: { imported: 0, errors: [] },
        history: { imported: 0, errors: [] },
        settings: { imported: 0, errors: [] },
        preferences: { imported: 0, errors: [] }
      };

      if (clearExisting) {
        this.favorites.clearFavorites();
        this.playlists.playlists.forEach(pl => this.playlists.deletePlaylist(pl.id));
        this.history.clearHistory();
      }

      if (importData.data.favorites) {
        const favResult = this.importFavorites(importData.data.favorites, merge);
        results.favorites.imported = favResult.added || 0;
        if (!favResult.success) {
          results.favorites.errors.push(favResult.error);
        }
      }

      if (importData.data.playlists) {
        const plResult = this.importPlaylists(importData.data.playlists, merge);
        results.playlists.imported = plResult.added || 0;
        if (!plResult.success) {
          results.playlists.errors.push(plResult.error);
        }
      }

      if (importData.data.history) {
        const histResult = this.importHistory(importData.data.history, merge);
        results.history.imported = histResult.added || 0;
        if (!histResult.success) {
          results.history.errors.push(histResult.error);
        }
      }

      if (importData.data.settings) {
        const setResult = this.storage.set(
          this.storage.storageKeys.SETTINGS,
          importData.data.settings
        );
        if (setResult.success) {
          results.settings.imported = 1;
        } else {
          results.settings.errors.push(setResult.error);
        }
      }

      if (importData.data.preferences) {
        const prefResult = this.storage.set(
          this.storage.storageKeys.USER_PREFERENCES,
          importData.data.preferences
        );
        if (prefResult.success) {
          results.preferences.imported = 1;
        } else {
          results.preferences.errors.push(prefResult.error);
        }
      }

      const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
      const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

      this.notifyListeners('imported', { 
        success: totalErrors === 0, 
        results,
        totalImported,
        totalErrors
      });

      return { 
        success: totalErrors === 0, 
        results,
        totalImported,
        totalErrors
      };
    } catch (error) {
      console.error('Import all data error:', error);
      this.notifyListeners('importError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  importFavorites(favoritesData, merge = true) {
    try {
      if (!Array.isArray(favoritesData)) {
        return { success: false, error: 'Invalid favorites data' };
      }

      let addedCount = 0;
      const existing = this.favorites.getFavorites();

      favoritesData.forEach(fav => {
        if (!merge || !existing.some(e => e.songId === fav.songId)) {
          this.favorites.favorites.push(fav);
          addedCount++;
        }
      });

      const saveResult = this.favorites.saveFavorites();

      return { 
        success: saveResult.success, 
        added: addedCount,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Import favorites error:', error);
      return { success: false, error: error.message };
    }
  }

  importPlaylists(playlistsData, merge = true) {
    try {
      if (!Array.isArray(playlistsData)) {
        return { success: false, error: 'Invalid playlists data' };
      }

      let addedCount = 0;
      const existing = this.playlists.getPlaylists();

      playlistsData.forEach(pl => {
        if (!merge || !existing.some(e => e.id === pl.id)) {
          this.playlists.playlists.push(pl);
          addedCount++;
        }
      });

      const saveResult = this.playlists.savePlaylists();

      return { 
        success: saveResult.success, 
        added: addedCount,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Import playlists error:', error);
      return { success: false, error: error.message };
    }
  }

  importHistory(historyData, merge = true) {
    try {
      if (!Array.isArray(historyData)) {
        return { success: false, error: 'Invalid history data' };
      }

      let addedCount = 0;
      const existing = this.history.getHistory();

      historyData.forEach(item => {
        if (!merge || !existing.some(e => e.songId === item.songId && e.playedAt === item.playedAt)) {
          this.history.history.push(item);
          addedCount++;
        }
      });

      if (this.history.history.length > this.history.maxHistorySize) {
        this.history.history = this.history.history.slice(0, this.history.maxHistorySize);
      }

      const saveResult = this.history.saveHistory();

      return { 
        success: saveResult.success, 
        added: addedCount,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Import history error:', error);
      return { success: false, error: error.message };
    }
  }

  validateImportData(importData) {
    try {
      if (!importData || typeof importData !== 'object') {
        return false;
      }

      if (!importData.version || !importData.data) {
        return false;
      }

      if (typeof importData.data !== 'object') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Validate import data error:', error);
      return false;
    }
  }

  downloadExportFile(filename = 'music-website-backup.json') {
    try {
      const exportResult = this.exportAllData();
      
      if (!exportResult.success) {
        return exportResult;
      }

      const blob = new Blob([exportResult.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.notifyListeners('downloaded', { filename, size: exportResult.size });

      return { success: true, filename };
    } catch (error) {
      console.error('Download export file error:', error);
      return { success: false, error: error.message };
    }
  }

  downloadSelectiveExportFile(options, filename = 'music-website-backup.json') {
    try {
      const exportResult = this.exportSelectiveData(options);
      
      if (!exportResult.success) {
        return exportResult;
      }

      const blob = new Blob([exportResult.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.notifyListeners('downloaded', { filename, size: exportResult.size });

      return { success: true, filename };
    } catch (error) {
      console.error('Download selective export file error:', error);
      return { success: false, error: error.message };
    }
  }

  importFromFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const importResult = this.importAllData(event.target.result, options);
            resolve(importResult);
          } catch (error) {
            reject({ success: false, error: error.message });
          }
        };

        reader.onerror = () => {
          reject({ success: false, error: 'File read error' });
        };

        reader.readAsText(file);
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `music-website-backup-${timestamp}.json`;
      
      return this.downloadExportFile(filename);
    } catch (error) {
      console.error('Create backup error:', error);
      return { success: false, error: error.message };
    }
  }

  restoreBackup(file, options = {}) {
    return this.importFromFile(file, options);
  }

  syncData(remoteData) {
    try {
      const syncResult = this.storage.syncWithRemote(remoteData);
      
      this.notifyListeners('synced', { success: syncResult.success });

      return syncResult;
    } catch (error) {
      console.error('Sync data error:', error);
      this.notifyListeners('syncError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  getDataSummary() {
    try {
      const summary = {
        favorites: {
          count: this.favorites.getFavoritesCount(),
          statistics: this.favorites.getStatistics().statistics
        },
        playlists: {
          count: this.playlists.getPlaylists().length,
          statistics: this.playlists.getStatistics().statistics
        },
        history: {
          count: this.history.getHistory().length,
          statistics: this.history.getListeningStatistics().statistics
        },
        storage: this.storage.getStorageInfo()
      };

      return { success: true, summary };
    } catch (error) {
      console.error('Get data summary error:', error);
      return { success: false, error: error.message };
    }
  }

  clearAllData() {
    try {
      const results = {
        favorites: this.favorites.clearFavorites(),
        playlists: this.playlists.playlists.map(pl => this.playlists.deletePlaylist(pl.id)),
        history: this.history.clearHistory(),
        settings: this.storage.remove(this.storage.storageKeys.SETTINGS),
        preferences: this.storage.remove(this.storage.storageKeys.USER_PREFERENCES)
      };

      this.notifyListeners('cleared', results);

      return { success: true, results };
    } catch (error) {
      console.error('Clear all data error:', error);
      return { success: false, error: error.message };
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }
}