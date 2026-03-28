class StorageManager {
  constructor() {
    this.prefix = 'music_website_';
    this.compressionEnabled = true;
    this.backupEnabled = true;
    this.maxBackups = 5;
    this.storageKeys = {
      FAVORITES: 'favorites',
      PLAYLISTS: 'playlists',
      HISTORY: 'history',
      SETTINGS: 'settings',
      CURRENT_PLAYLIST: 'current_playlist',
      USER_PREFERENCES: 'user_preferences'
    };
  }

  getStorageKey(key) {
    return this.prefix + key;
  }

  set(key, value, options = {}) {
    try {
      const storageKey = this.getStorageKey(key);
      const data = {
        value: value,
        timestamp: Date.now(),
        version: options.version || '1.0'
      };

      const serialized = JSON.stringify(data);
      
      if (this.compressionEnabled && serialized.length > 1024) {
        data.compressed = true;
        data.value = this.compress(serialized);
      }

      localStorage.setItem(storageKey, JSON.stringify(data));

      if (this.backupEnabled) {
        this.createBackup(key, data);
      }

      return { success: true, key: storageKey };
    } catch (error) {
      console.error('Storage set error:', error);
      return { success: false, error: error.message };
    }
  }

  get(key, defaultValue = null) {
    try {
      const storageKey = this.getStorageKey(key);
      const item = localStorage.getItem(storageKey);

      if (!item) {
        return defaultValue;
      }

      const data = JSON.parse(item);

      if (data.compressed) {
        return JSON.parse(this.decompress(data.value));
      }

      return data.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  remove(key) {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      return { success: true };
    } catch (error) {
      console.error('Storage remove error:', error);
      return { success: false, error: error.message };
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Storage clear error:', error);
      return { success: false, error: error.message };
    }
  }

  compress(data) {
    return btoa(encodeURIComponent(data));
  }

  decompress(data) {
    return decodeURIComponent(atob(data));
  }

  createBackup(key, data) {
    try {
      const backupKey = this.getStorageKey(key + '_backup_' + Date.now());
      localStorage.setItem(backupKey, JSON.stringify(data));
      this.cleanOldBackups(key);
    } catch (error) {
      console.error('Backup creation error:', error);
    }
  }

  cleanOldBackups(key) {
    try {
      const keys = Object.keys(localStorage);
      const backupKeys = keys.filter(k => 
        k.startsWith(this.getStorageKey(key + '_backup_'))
      );

      if (backupKeys.length > this.maxBackups) {
        const sortedKeys = backupKeys.sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop());
          const timestampB = parseInt(b.split('_').pop());
          return timestampA - timestampB;
        });

        const keysToRemove = sortedKeys.slice(0, sortedKeys.length - this.maxBackups);
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.error('Backup cleanup error:', error);
    }
  }

  restoreFromBackup(key) {
    try {
      const keys = Object.keys(localStorage);
      const backupKeys = keys.filter(k => 
        k.startsWith(this.getStorageKey(key + '_backup_'))
      );

      if (backupKeys.length === 0) {
        return { success: false, error: 'No backups found' };
      }

      const sortedKeys = backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop());
        const timestampB = parseInt(b.split('_').pop());
        return timestampB - timestampA;
      });

      const latestBackup = sortedKeys[0];
      const backupData = JSON.parse(localStorage.getItem(latestBackup));
      
      this.set(key, backupData.value);
      
      return { success: true, restored: true, timestamp: backupData.timestamp };
    } catch (error) {
      console.error('Backup restore error:', error);
      return { success: false, error: error.message };
    }
  }

  getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return total;
  }

  getStorageInfo() {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(k => k.startsWith(this.prefix));
    
    let totalSize = 0;
    const keyDetails = appKeys.map(key => {
      const size = localStorage[key].length;
      totalSize += size;
      return {
        key: key.replace(this.prefix, ''),
        size: size,
        sizeFormatted: this.formatSize(size)
      };
    });

    return {
      totalSize: totalSize,
      totalSizeFormatted: this.formatSize(totalSize),
      keys: keyDetails,
      keyCount: appKeys.length
    };
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  exportData(keys = null) {
    try {
      const exportKeys = keys || Object.values(this.storageKeys);
      const data = {};

      exportKeys.forEach(key => {
        const value = this.get(key);
        if (value !== null) {
          data[key] = value;
        }
      });

      const exportString = JSON.stringify(data, null, 2);
      return { success: true, data: exportString };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error.message };
    }
  }

  importData(importString) {
    try {
      const data = JSON.parse(importString);
      
      Object.keys(data).forEach(key => {
        this.set(key, data[key]);
      });

      return { success: true, importedKeys: Object.keys(data) };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  }

  syncWithRemote(remoteData) {
    try {
      const localData = this.exportData().data;
      const parsedRemote = JSON.parse(remoteData);
      const mergedData = { ...JSON.parse(localData), ...parsedRemote };
      
      Object.keys(mergedData).forEach(key => {
        this.set(key, mergedData[key]);
      });

      return { success: true, merged: true };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

const storageManager = new StorageManager();