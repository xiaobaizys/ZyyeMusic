class HistoryManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.history = [];
    this.maxHistorySize = 100;
    this.listeners = [];
    this.loadHistory();
  }

  loadHistory() {
    try {
      const savedHistory = this.storage.get(this.storage.storageKeys.HISTORY, []);
      this.history = Array.isArray(savedHistory) ? savedHistory : [];
      this.notifyListeners('loaded', this.history);
    } catch (error) {
      console.error('Load history error:', error);
      this.history = [];
    }
  }

  saveHistory() {
    try {
      const result = this.storage.set(this.storage.storageKeys.HISTORY, this.history);
      if (result.success) {
        this.notifyListeners('saved', this.history);
      }
      return result;
    } catch (error) {
      console.error('Save history error:', error);
      return { success: false, error: error.message };
    }
  }

  addToHistory(song, playDuration = 0) {
    try {
      if (!song || !song.id) {
        return { success: false, error: 'Invalid song data' };
      }

      const historyItem = {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        cover: song.cover,
        duration: song.duration,
        playedAt: new Date().toISOString(),
        playDuration: playDuration,
        completed: playDuration >= song.duration
      };

      const existingIndex = this.history.findIndex(
        item => item.songId === song.id
      );

      if (existingIndex !== -1) {
        this.history.splice(existingIndex, 1);
      }

      this.history.unshift(historyItem);

      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(0, this.maxHistorySize);
      }

      const saveResult = this.saveHistory();

      if (saveResult.success) {
        this.notifyListeners('added', historyItem);
      }

      return { 
        success: saveResult.success, 
        item: historyItem,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Add to history error:', error);
      return { success: false, error: error.message };
    }
  }

  removeFromHistory(songId) {
    try {
      const index = this.history.findIndex(item => item.songId === songId);
      
      if (index === -1) {
        return { success: false, error: 'Song not found in history' };
      }

      const removedItem = this.history.splice(index, 1)[0];
      const saveResult = this.saveHistory();

      if (saveResult.success) {
        this.notifyListeners('removed', removedItem);
      }

      return { 
        success: saveResult.success, 
        removed: removedItem,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Remove from history error:', error);
      return { success: false, error: error.message };
    }
  }

  clearHistory() {
    try {
      const cleared = [...this.history];
      this.history = [];
      const saveResult = this.saveHistory();

      if (saveResult.success) {
        this.notifyListeners('cleared', cleared);
      }

      return { 
        success: saveResult.success, 
        cleared: cleared,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Clear history error:', error);
      return { success: false, error: error.message };
    }
  }

  clearOldHistory(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const removed = this.history.filter(item => 
        new Date(item.playedAt) < cutoffDate
      );

      this.history = this.history.filter(item => 
        new Date(item.playedAt) >= cutoffDate
      );

      const saveResult = this.saveHistory();

      if (saveResult.success) {
        this.notifyListeners('oldCleared', removed);
      }

      return { 
        success: saveResult.success, 
        cleared: removed.length,
        items: removed,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Clear old history error:', error);
      return { success: false, error: error.message };
    }
  }

  getHistory() {
    return [...this.history];
  }

  getHistoryItem(songId) {
    return this.history.find(item => item.songId === songId);
  }

  getRecentHistory(count = 10) {
    return this.history.slice(0, count);
  }

  getHistoryByDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const filtered = this.history.filter(item => {
        const playedDate = new Date(item.playedAt);
        return playedDate >= start && playedDate <= end;
      });

      return { success: true, results: filtered };
    } catch (error) {
      console.error('Get history by date range error:', error);
      return { success: false, error: error.message };
    }
  }

  getHistoryBySong(songId) {
    return this.history.filter(item => item.songId === songId);
  }

  getHistoryByArtist(artist) {
    try {
      const lowerArtist = artist.toLowerCase();
      const results = this.history.filter(item => 
        item.artist.toLowerCase().includes(lowerArtist)
      );

      return { success: true, results: results };
    } catch (error) {
      console.error('Get history by artist error:', error);
      return { success: false, error: error.message };
    }
  }

  searchHistory(query) {
    try {
      const lowerQuery = query.toLowerCase();
      const results = this.history.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.artist.toLowerCase().includes(lowerQuery) ||
        item.album.toLowerCase().includes(lowerQuery)
      );

      return { success: true, results: results };
    } catch (error) {
      console.error('Search history error:', error);
      return { success: false, error: error.message };
    }
  }

  getMostPlayedSongs(count = 10) {
    try {
      const songCounts = new Map();

      this.history.forEach(item => {
        const currentCount = songCounts.get(item.songId) || 0;
        songCounts.set(item.songId, currentCount + 1);
      });

      const sorted = Array.from(songCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([songId, playCount]) => {
          const historyItem = this.history.find(item => item.songId === songId);
          return {
            ...historyItem,
            playCount: playCount
          };
        });

      return { success: true, results: sorted };
    } catch (error) {
      console.error('Get most played songs error:', error);
      return { success: false, error: error.message };
    }
  }

  getRecentlyPlayed(count = 20) {
    try {
      const uniqueSongs = new Map();

      this.history.forEach(item => {
        if (!uniqueSongs.has(item.songId)) {
          uniqueSongs.set(item.songId, item);
        }
      });

      const results = Array.from(uniqueSongs.values())
        .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt))
        .slice(0, count);

      return { success: true, results: results };
    } catch (error) {
      console.error('Get recently played error:', error);
      return { success: false, error: error.message };
    }
  }

  getListeningStatistics() {
    try {
      const stats = {
        totalPlays: this.history.length,
        uniqueSongs: new Set(this.history.map(item => item.songId)).size,
        totalPlayTime: 0,
        averagePlayDuration: 0,
        mostPlayedSong: null,
        mostPlayedArtist: null,
        mostPlayedAlbum: null,
        dailyPlays: {},
        hourlyPlays: {},
        artistStats: {},
        albumStats: {}
      };

      const songPlayCounts = new Map();
      const artistPlayCounts = new Map();
      const albumPlayCounts = new Map();

      this.history.forEach(item => {
        stats.totalPlayTime += item.playDuration || 0;

        const songCount = songPlayCounts.get(item.songId) || 0;
        songPlayCounts.set(item.songId, songCount + 1);

        const artistCount = artistPlayCounts.get(item.artist) || 0;
        artistPlayCounts.set(item.artist, artistCount + 1);

        const albumCount = albumPlayCounts.get(item.album) || 0;
        albumPlayCounts.set(item.album, albumCount + 1);

        const date = new Date(item.playedAt);
        const dateKey = date.toISOString().split('T')[0];
        stats.dailyPlays[dateKey] = (stats.dailyPlays[dateKey] || 0) + 1;

        const hourKey = date.getHours();
        stats.hourlyPlays[hourKey] = (stats.hourlyPlays[hourKey] || 0) + 1;

        stats.artistStats[item.artist] = (stats.artistStats[item.artist] || 0) + 1;
        stats.albumStats[item.album] = (stats.albumStats[item.album] || 0) + 1;
      });

      if (this.history.length > 0) {
        stats.averagePlayDuration = stats.totalPlayTime / this.history.length;

        const mostPlayedSongId = Array.from(songPlayCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        stats.mostPlayedSong = this.history.find(item => item.songId === mostPlayedSongId[0]);
        stats.mostPlayedSong.playCount = mostPlayedSongId[1];

        const mostPlayedArtist = Array.from(artistPlayCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        stats.mostPlayedArtist = {
          name: mostPlayedArtist[0],
          playCount: mostPlayedArtist[1]
        };

        const mostPlayedAlbum = Array.from(albumPlayCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        stats.mostPlayedAlbum = {
          name: mostPlayedAlbum[0],
          playCount: mostPlayedAlbum[1]
        };
      }

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get listening statistics error:', error);
      return { success: false, error: error.message };
    }
  }

  getListeningTrends(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayHistory = this.history.filter(item => 
          item.playedAt.startsWith(dateKey)
        );

        trends.push({
          date: dateKey,
          plays: dayHistory.length,
          uniqueSongs: new Set(dayHistory.map(item => item.songId)).size,
          totalPlayTime: dayHistory.reduce((sum, item) => sum + (item.playDuration || 0), 0)
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return { success: true, trends: trends };
    } catch (error) {
      console.error('Get listening trends error:', error);
      return { success: false, error: error.message };
    }
  }

  setMaxHistorySize(size) {
    try {
      if (size < 1) {
        return { success: false, error: 'Size must be at least 1' };
      }

      this.maxHistorySize = size;

      if (this.history.length > size) {
        this.history = this.history.slice(0, size);
        const saveResult = this.saveHistory();

        return { 
          success: saveResult.success, 
          trimmed: true,
          error: saveResult.error 
        };
      }

      return { success: true, trimmed: false };
    } catch (error) {
      console.error('Set max history size error:', error);
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

  exportHistory() {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: this.history.length,
        maxHistorySize: this.maxHistorySize,
        history: this.history
      };

      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      console.error('Export history error:', error);
      return { success: false, error: error.message };
    }
  }

  importHistory(importString, merge = true) {
    try {
      const importData = JSON.parse(importString);
      
      if (!importData.history || !Array.isArray(importData.history)) {
        return { success: false, error: 'Invalid import data format' };
      }

      let addedCount = 0;

      if (merge) {
        const existingIds = new Set(this.history.map(item => item.songId));
        
        importData.history.forEach(item => {
          if (!existingIds.has(item.songId)) {
            this.history.push(item);
            addedCount++;
          }
        });
      } else {
        this.history = importData.history;
        addedCount = importData.history.length;
      }

      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(0, this.maxHistorySize);
      }

      const saveResult = this.saveHistory();

      return { 
        success: saveResult.success, 
        added: addedCount,
        total: this.history.length,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Import history error:', error);
      return { success: false, error: error.message };
    }
  }
}