class RemoteSyncManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.syncInterval = 5 * 60 * 1000;
    this.syncTimer = null;
    this.isSyncing = false;
    this.listeners = [];
    this.syncQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  startAutoSync() {
    if (this.syncTimer) {
      this.stopAutoSync();
    }

    this.syncTimer = setInterval(() => {
      this.performSync();
    }, this.syncInterval);

    this.notifyListeners('autoSyncStarted', { interval: this.syncInterval });
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      this.notifyListeners('autoSyncStopped', {});
    }
  }

  async performSync() {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notifyListeners('syncStarted', {});

    try {
      const result = await this.syncWithRetry();
      
      this.notifyListeners('syncCompleted', result);
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners('syncError', { error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  async syncWithRetry() {
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.executeSync();
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Sync attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  async executeSync() {
    try {
      const localData = this.getLocalData();
      const remoteData = await this.fetchRemoteData();

      if (!remoteData) {
        return { success: true, message: 'No remote data to sync' };
      }

      const mergedData = this.mergeData(localData, remoteData);
      await this.saveMergedData(mergedData);

      return { 
        success: true, 
        message: 'Sync completed successfully',
        merged: true 
      };
    } catch (error) {
      throw error;
    }
  }

  getLocalData() {
    try {
      return {
        favorites: this.storage.get(this.storage.storageKeys.FAVORITES, []),
        playlists: this.storage.get(this.storage.storageKeys.PLAYLISTS, []),
        history: this.storage.get(this.storage.storageKeys.HISTORY, []),
        settings: this.storage.get(this.storage.storageKeys.SETTINGS, {}),
        preferences: this.storage.get(this.storage.storageKeys.USER_PREFERENCES, {})
      };
    } catch (error) {
      console.error('Get local data error:', error);
      throw error;
    }
  }

  async fetchRemoteData() {
    try {
      const remoteUrl = this.storage.get('remote_sync_url', null);
      
      if (!remoteUrl) {
        return null;
      }

      const response = await fetch(remoteUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch remote data error:', error);
      throw error;
    }
  }

  mergeData(localData, remoteData) {
    try {
      const merged = { ...localData };

      Object.keys(remoteData).forEach(key => {
        if (remoteData[key] && Array.isArray(remoteData[key])) {
          merged[key] = this.mergeArrays(localData[key] || [], remoteData[key]);
        } else if (remoteData[key] && typeof remoteData[key] === 'object') {
          merged[key] = { ...localData[key], ...remoteData[key] };
        } else {
          merged[key] = remoteData[key];
        }
      });

      return merged;
    } catch (error) {
      console.error('Merge data error:', error);
      throw error;
    }
  }

  mergeArrays(localArray, remoteArray) {
    try {
      const merged = [...localArray];
      const localIds = new Set(localArray.map(item => item.id || item.songId));

      remoteArray.forEach(item => {
        const itemId = item.id || item.songId;
        if (!localIds.has(itemId)) {
          merged.push(item);
        }
      });

      return merged;
    } catch (error) {
      console.error('Merge arrays error:', error);
      throw error;
    }
  }

  async saveMergedData(mergedData) {
    try {
      const results = [];

      if (mergedData.favorites) {
        results.push(this.storage.set(this.storage.storageKeys.FAVORITES, mergedData.favorites));
      }

      if (mergedData.playlists) {
        results.push(this.storage.set(this.storage.storageKeys.PLAYLISTS, mergedData.playlists));
      }

      if (mergedData.history) {
        results.push(this.storage.set(this.storage.storageKeys.HISTORY, mergedData.history));
      }

      if (mergedData.settings) {
        results.push(this.storage.set(this.storage.storageKeys.SETTINGS, mergedData.settings));
      }

      if (mergedData.preferences) {
        results.push(this.storage.set(this.storage.storageKeys.USER_PREFERENCES, mergedData.preferences));
      }

      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        throw new Error(`Failed to save ${failed.length} data items`);
      }

      return { success: true };
    } catch (error) {
      console.error('Save merged data error:', error);
      throw error;
    }
  }

  async pushToRemote() {
    try {
      const localData = this.getLocalData();
      const remoteUrl = this.storage.get('remote_sync_url', null);

      if (!remoteUrl) {
        return { success: false, error: 'No remote sync URL configured' };
      }

      const response = await fetch(remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.notifyListeners('pushCompleted', { success: true });

      return { success: true };
    } catch (error) {
      console.error('Push to remote error:', error);
      this.notifyListeners('pushError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  setSyncUrl(url) {
    try {
      this.storage.set('remote_sync_url', url);
      return { success: true };
    } catch (error) {
      console.error('Set sync URL error:', error);
      return { success: false, error: error.message };
    }
  }

  getSyncUrl() {
    return this.storage.get('remote_sync_url', null);
  }

  setSyncInterval(interval) {
    try {
      this.syncInterval = interval;
      
      if (this.syncTimer) {
        this.startAutoSync();
      }

      return { success: true };
    } catch (error) {
      console.error('Set sync interval error:', error);
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ErrorHandler {
  constructor(storageManager) {
    this.storage = storageManager;
    this.errorLog = [];
    this.maxErrorLogSize = 100;
    this.listeners = [];
    this.loadErrorLog();
  }

  loadErrorLog() {
    try {
      const saved = this.storage.get('error_log', []);
      this.errorLog = Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error('Load error log error:', error);
      this.errorLog = [];
    }
  }

  saveErrorLog() {
    try {
      this.storage.set('error_log', this.errorLog);
    } catch (error) {
      console.error('Save error log error:', error);
    }
  }

  logError(error, context = {}) {
    try {
      const errorEntry = {
        id: Date.now().toString(),
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        context: context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.errorLog.unshift(errorEntry);

      if (this.errorLog.length > this.maxErrorLogSize) {
        this.errorLog = this.errorLog.slice(0, this.maxErrorLogSize);
      }

      this.saveErrorLog();
      this.notifyListeners('errorLogged', errorEntry);

      return { success: true, errorId: errorEntry.id };
    } catch (error) {
      console.error('Log error error:', error);
      return { success: false, error: error.message };
    }
  }

  getErrorLog() {
    return [...this.errorLog];
  }

  getErrorById(errorId) {
    return this.errorLog.find(e => e.id === errorId);
  }

  getErrorsByType(type) {
    return this.errorLog.filter(e => e.context.type === type);
  }

  getRecentErrors(count = 10) {
    return this.errorLog.slice(0, count);
  }

  clearErrorLog() {
    try {
      this.errorLog = [];
      this.storage.remove('error_log');
      this.notifyListeners('errorLogCleared', {});
      return { success: true };
    } catch (error) {
      console.error('Clear error log error:', error);
      return { success: false, error: error.message };
    }
  }

  getErrorStatistics() {
    try {
      const stats = {
        total: this.errorLog.length,
        byType: {},
        byTime: {},
        recent: this.getRecentErrors(5)
      };

      this.errorLog.forEach(error => {
        const type = error.context.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        const date = error.timestamp.split('T')[0];
        stats.byTime[date] = (stats.byTime[date] || 0) + 1;
      });

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get error statistics error:', error);
      return { success: false, error: error.message };
    }
  }

  exportErrorLog() {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: this.errorLog.length,
        errors: this.errorLog
      };

      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      console.error('Export error log error:', error);
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

class DataPersistenceSystem {
  constructor() {
    this.storage = hybridStorageManager;
    this.favorites = new FavoritesManager(this.storage);
    this.playlists = new PlaylistManager(this.storage);
    this.history = new HistoryManager(this.storage);
    this.fileUploadManager = new FileUploadManager(this.storage);
    this.dataManager = new DataManager(
      this.storage,
      this.favorites,
      this.playlists,
      this.history
    );
    this.syncManager = new RemoteSyncManager(this.storage);
    this.dataSyncManager = null;
    this.errorHandler = new ErrorHandler(this.storage);
    this.isInitialized = false;
  }

  setDataSyncManager(manager) {
    this.dataSyncManager = manager;
  }

  async initialize() {
    try {
      await this.loadAllData();
      this.setupEventListeners();
      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      this.errorHandler.logError(error, { type: 'initialization' });
      return { success: false, error: error.message };
    }
  }

  async loadAllData() {
    try {
      this.favorites.loadFavorites();
      this.playlists.loadPlaylists();
      this.playlists.loadCurrentPlaylist();
      this.history.loadHistory();
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  setupEventListeners() {
    window.addEventListener('beforeunload', () => {
      this.saveAllData();
    });

    window.addEventListener('online', () => {
      this.syncManager.performSync();
    });

    this.favorites.addListener((event, data) => {
      this.errorHandler.logError(
        new Error(`Favorites event: ${event}`),
        { type: 'favorites', event, data }
      );
    });

    this.playlists.addListener((event, data) => {
      this.errorHandler.logError(
        new Error(`Playlists event: ${event}`),
        { type: 'playlists', event, data }
      );
    });

    this.history.addListener((event, data) => {
      this.errorHandler.logError(
        new Error(`History event: ${event}`),
        { type: 'history', event, data }
      );
    });
  }

  async saveAllData() {
    try {
      this.favorites.saveFavorites();
      this.playlists.savePlaylists();
      this.playlists.saveCurrentPlaylist();
      this.history.saveHistory();
      return { success: true };
    } catch (error) {
      this.errorHandler.logError(error, { type: 'save' });
      return { success: false, error: error.message };
    }
  }

  getStorage() {
    return this.storage;
  }

  getFavorites() {
    return this.favorites;
  }

  getPlaylists() {
    return this.playlists;
  }

  getHistory() {
    return this.history;
  }

  getDataManager() {
    return this.dataManager;
  }

  getSyncManager() {
    return this.syncManager;
  }

  getDataSyncManager() {
    return this.dataSyncManager;
  }

  getErrorHandler() {
    return this.errorHandler;
  }

  getFileUploadManager() {
    return this.fileUploadManager;
  }

  isReady() {
    return this.isInitialized;
  }
}

const dataPersistenceSystem = new DataPersistenceSystem();