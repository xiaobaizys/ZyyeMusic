class HybridStorageManager {
  constructor() {
    this.prefix = 'music_website_';
    this.compressionEnabled = false;
    this.backupEnabled = false;
    this.maxBackups = 2;
    this.useServer = true;
    this.serverAvailable = false;
    this.storageKeys = {
      FAVORITES: 'favorites',
      PLAYLISTS: 'playlists',
      HISTORY: 'history',
      SETTINGS: 'settings',
      CURRENT_PLAYLIST: 'current_playlist',
      USER_PREFERENCES: 'user_preferences',
      USER_SONGS: 'user_songs',
      UPLOADED_FILES: 'uploaded_files'
    };
    this.init();
  }

  init() {
    const hostname = window.location.hostname;
    const isGitHubPages = hostname.includes('github.io');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (window.location.protocol === 'file:' || isGitHubPages) {
      console.log('检测到静态托管环境（file:// 或 GitHub Pages），仅使用 LocalStorage');
      this.serverAvailable = false;
      this.useServer = false;
      return;
    }

    if (isLocalhost) {
      try {
        fetch('/api/load-data/test', { method: 'GET' })
          .then(response => {
            this.serverAvailable = response.ok;
            console.log('服务器存储可用:', this.serverAvailable);
          })
          .catch(error => {
            console.log('服务器存储不可用，使用 LocalStorage');
            this.serverAvailable = false;
          });
      } catch (error) {
        console.log('服务器存储不可用，使用 LocalStorage');
        this.serverAvailable = false;
      }
    }
  }

  getStorageKey(key) {
    return this.prefix + key;
  }

  set(key, value, options = {}) {
    const result = this.setLocal(key, value, options);
    
    if (this.serverAvailable && this.useServer) {
      this.setServer(key, value, options).catch(error => {
        console.error('后台同步到服务器失败:', error);
      });
    }
    
    return result;
  }

  setLocal(key, value, options = {}) {
    try {
      const storageKey = this.getStorageKey(key);
      const data = {
        value: value,
        timestamp: Date.now(),
        version: options.version || '1.0'
      };

      let serialized = JSON.stringify(data);
      
      if (this.compressionEnabled && serialized.length > 1024) {
        data.compressed = true;
        data.value = this.compress(serialized);
        serialized = JSON.stringify(data);
      }

      try {
        localStorage.setItem(storageKey, serialized);
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError' || 
            storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            storageError.code === 22) {
          
          console.warn('LocalStorage 容量超限，尝试清理旧数据...');
          
          const cleanupResult = this.cleanupOldData();
          
          if (cleanupResult.success) {
            try {
              localStorage.setItem(storageKey, serialized);
              console.log('旧数据清理后保存成功');
            } catch (retryError) {
              console.error('清理后仍然失败:', retryError);
              return { 
                success: false, 
                error: '存储空间不足，即使清理旧数据后仍无法保存',
                code: 'QUOTA_EXCEEDED'
              };
            }
          } else {
            return { 
              success: false, 
              error: '存储空间不足，请手动清理一些数据',
              code: 'QUOTA_EXCEEDED'
            };
          }
        } else {
          throw storageError;
        }
      }

      if (this.backupEnabled) {
        this.createBackup(key, data);
      }

      return { success: true, key: storageKey };
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return { success: false, error: error.message };
    }
  }

  cleanupOldData() {
    try {
      const keys = Object.keys(localStorage);
      const ourKeys = keys.filter(key => key.startsWith(this.prefix));
      
      const keyInfo = ourKeys.map(key => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return null;
          
          const data = JSON.parse(item);
          return {
            key: key,
            timestamp: data.timestamp || 0,
            size: item.length,
            isBackup: key.includes('_backup_')
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      keyInfo.sort((a, b) => a.timestamp - b.timestamp);

      let removedCount = 0;
      let freedSpace = 0;

      for (const info of keyInfo) {
        if (info.isBackup || info.timestamp < Date.now() - 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(info.key);
          removedCount++;
          freedSpace += info.size;
          console.log(`清理旧数据: ${info.key}, 释放 ${this.formatSize(info.size)}`);
        }
      }

      console.log(`清理完成: 移除 ${removedCount} 个项目，释放 ${this.formatSize(freedSpace)}`);
      
      return { 
        success: true, 
        removedCount, 
        freedSpace 
      };
    } catch (error) {
      console.error('清理旧数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  getStorageInfo() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      const usageDetails = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          const size = new Blob([value]).size;
          totalSize += size;
          itemCount++;
          
          usageDetails.push({
            key: key.replace(this.prefix, ''),
            size: this.formatSize(size)
          });
        }
      }
      
      return {
        success: true,
        totalSize,
        itemCount,
        totalSizeFormatted: this.formatSize(totalSize),
        usageDetails
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  async setServer(key, value, options = {}) {
    try {
      const response = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: value })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('服务器存储错误:', error);
      return { success: false, error: error.message };
    }
  }

  get(key, defaultValue = null) {
    return this.getLocal(key, defaultValue);
  }

  getLocal(key, defaultValue = null) {
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
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  }

  async getServer(key, defaultValue = null) {
    try {
      const response = await fetch(`/api/load-data/${key}`);
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      return defaultValue;
    } catch (error) {
      console.error('服务器加载错误:', error);
      return defaultValue;
    }
  }

  async remove(key) {
    if (this.serverAvailable && this.useServer) {
      try {
        await this.setServer(key, null);
      } catch (error) {
        console.error('服务器删除失败:', error);
      }
    }
    
    return this.removeLocal(key);
  }

  removeLocal(key) {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      return { success: true };
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return { success: false, error: error.message };
    }
  }

  async clear() {
    if (this.serverAvailable && this.useServer) {
      const keys = Object.values(this.storageKeys);
      for (const key of keys) {
        try {
          await this.setServer(key, null);
        } catch (error) {
          console.error(`清除服务器数据失败 ${key}:`, error);
        }
      }
    }
    
    return this.clearLocal();
  }

  clearLocal() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return { success: true };
    } catch (error) {
      console.error('LocalStorage clear error:', error);
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

  async uploadFileToServer(type, base64Data, extension) {
    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, base64Data, extension })
      });
      return await response.json();
    } catch (error) {
      console.error('文件上传到服务器失败:', error);
      return { success: false, error: error.message };
    }
  }

  exportData(keys = null) {
    try {
      const exportKeys = keys || Object.values(this.storageKeys);
      const data = {};

      exportKeys.forEach(key => {
        const value = this.getLocal(key);
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
        this.setLocal(key, data[key]);
      });

      return { success: true, importedKeys: Object.keys(data) };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const hybridStorageManager = new HybridStorageManager();
