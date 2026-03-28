class FavoritesManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.favorites = [];
    this.listeners = [];
    this.loadFavorites();
  }

  loadFavorites() {
    try {
      const savedFavorites = this.storage.get(this.storage.storageKeys.FAVORITES, []);
      this.favorites = Array.isArray(savedFavorites) ? savedFavorites : [];
      this.notifyListeners('loaded', this.favorites);
    } catch (error) {
      console.error('Load favorites error:', error);
      this.favorites = [];
    }
  }

  saveFavorites() {
    try {
      const result = this.storage.set(this.storage.storageKeys.FAVORITES, this.favorites);
      if (result.success) {
        this.notifyListeners('saved', this.favorites);
      }
      return result;
    } catch (error) {
      console.error('Save favorites error:', error);
      return { success: false, error: error.message };
    }
  }

  addFavorite(song) {
    try {
      if (!song || !song.id) {
        return { success: false, error: 'Invalid song data' };
      }

      const existingIndex = this.favorites.findIndex(fav => fav.songId === song.id);
      
      if (existingIndex !== -1) {
        return { success: false, error: 'Song already in favorites', alreadyExists: true };
      }

      const favoriteItem = {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        cover: song.cover && !song.cover.startsWith('data:') ? song.cover : 'assets/images/default-cover.svg',
        duration: song.duration,
        addedAt: new Date().toISOString(),
        playCount: 0
      };

      this.favorites.push(favoriteItem);
      const saveResult = this.saveFavorites();

      if (saveResult.success) {
        this.notifyListeners('added', favoriteItem);
      }

      return { 
        success: saveResult.success, 
        favorite: favoriteItem,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Add favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  removeFavorite(songId) {
    try {
      const index = this.favorites.findIndex(fav => fav.songId === songId);
      
      if (index === -1) {
        return { success: false, error: 'Song not found in favorites' };
      }

      const removedItem = this.favorites.splice(index, 1)[0];
      const saveResult = this.saveFavorites();

      if (saveResult.success) {
        this.notifyListeners('removed', removedItem);
      }

      return { 
        success: saveResult.success, 
        removed: removedItem,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Remove favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  toggleFavorite(song) {
    try {
      const exists = this.isFavorite(song.id);
      
      if (exists) {
        return this.removeFavorite(song.id);
      } else {
        return this.addFavorite(song);
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  isFavorite(songId) {
    return this.favorites.some(fav => fav.songId === songId);
  }

  getFavorites() {
    return [...this.favorites];
  }

  getFavorite(songId) {
    return this.favorites.find(fav => fav.songId === songId);
  }

  getFavoritesCount() {
    return this.favorites.length;
  }

  updateFavorite(songId, updates) {
    try {
      const index = this.favorites.findIndex(fav => fav.songId === songId);
      
      if (index === -1) {
        return { success: false, error: 'Song not found in favorites' };
      }

      this.favorites[index] = { ...this.favorites[index], ...updates };
      const saveResult = this.saveFavorites();

      if (saveResult.success) {
        this.notifyListeners('updated', this.favorites[index]);
      }

      return { 
        success: saveResult.success, 
        updated: this.favorites[index],
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Update favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  incrementPlayCount(songId) {
    try {
      const favorite = this.getFavorite(songId);
      if (favorite) {
        return this.updateFavorite(songId, { 
          playCount: (favorite.playCount || 0) + 1,
          lastPlayedAt: new Date().toISOString()
        });
      }
      return { success: false, error: 'Song not found in favorites' };
    } catch (error) {
      console.error('Increment play count error:', error);
      return { success: false, error: error.message };
    }
  }

  sortFavorites(sortBy = 'addedAt', order = 'desc') {
    try {
      const sorted = [...this.favorites].sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'artist':
            comparison = a.artist.localeCompare(b.artist);
            break;
          case 'addedAt':
            comparison = new Date(a.addedAt) - new Date(b.addedAt);
            break;
          case 'playCount':
            comparison = (a.playCount || 0) - (b.playCount || 0);
            break;
          case 'lastPlayedAt':
            if (!a.lastPlayedAt) comparison = 1;
            else if (!b.lastPlayedAt) comparison = -1;
            else comparison = new Date(a.lastPlayedAt) - new Date(b.lastPlayedAt);
            break;
          default:
            comparison = 0;
        }

        return order === 'asc' ? comparison : -comparison;
      });

      this.favorites = sorted;
      const saveResult = this.saveFavorites();

      if (saveResult.success) {
        this.notifyListeners('sorted', this.favorites);
      }

      return { 
        success: saveResult.success, 
        sorted: this.favorites,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Sort favorites error:', error);
      return { success: false, error: error.message };
    }
  }

  searchFavorites(query) {
    try {
      const lowerQuery = query.toLowerCase();
      const results = this.favorites.filter(fav => 
        fav.title.toLowerCase().includes(lowerQuery) ||
        fav.artist.toLowerCase().includes(lowerQuery) ||
        fav.album.toLowerCase().includes(lowerQuery)
      );

      return { success: true, results: results };
    } catch (error) {
      console.error('Search favorites error:', error);
      return { success: false, error: error.message };
    }
  }

  clearFavorites() {
    try {
      const cleared = [...this.favorites];
      this.favorites = [];
      const saveResult = this.saveFavorites();

      if (saveResult.success) {
        this.notifyListeners('cleared', cleared);
      }

      return { 
        success: saveResult.success, 
        cleared: cleared,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Clear favorites error:', error);
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

  exportFavorites() {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: this.favorites.length,
        favorites: this.favorites
      };

      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      console.error('Export favorites error:', error);
      return { success: false, error: error.message };
    }
  }

  importFavorites(importString) {
    try {
      const importData = JSON.parse(importString);
      
      if (!importData.favorites || !Array.isArray(importData.favorites)) {
        return { success: false, error: 'Invalid import data format' };
      }

      const merged = [...this.favorites];
      let addedCount = 0;

      importData.favorites.forEach(fav => {
        if (!merged.some(existing => existing.songId === fav.songId)) {
          merged.push(fav);
          addedCount++;
        }
      });

      this.favorites = merged;
      const saveResult = this.saveFavorites();

      return { 
        success: saveResult.success, 
        added: addedCount,
        total: this.favorites.length,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Import favorites error:', error);
      return { success: false, error: error.message };
    }
  }

  getStatistics() {
    try {
      const stats = {
        total: this.favorites.length,
        totalPlayCount: this.favorites.reduce((sum, fav) => sum + (fav.playCount || 0), 0),
        mostPlayed: null,
        recentlyAdded: null,
        artists: {},
        albums: {}
      };

      if (this.favorites.length > 0) {
        stats.mostPlayed = this.favorites.reduce((max, fav) => 
          (fav.playCount || 0) > (max.playCount || 0) ? fav : max
        );

        stats.recentlyAdded = this.favorites.reduce((max, fav) => 
          new Date(fav.addedAt) > new Date(max.addedAt) ? fav : max
        );

        this.favorites.forEach(fav => {
          stats.artists[fav.artist] = (stats.artists[fav.artist] || 0) + 1;
          stats.albums[fav.album] = (stats.albums[fav.album] || 0) + 1;
        });
      }

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get statistics error:', error);
      return { success: false, error: error.message };
    }
  }
}