class PlaylistManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.playlists = [];
    this.currentPlaylist = null;
    this.listeners = [];
    this.loadPlaylists();
    this.loadCurrentPlaylist();
  }

  loadPlaylists() {
    try {
      const savedPlaylists = this.storage.get(this.storage.storageKeys.PLAYLISTS, []);
      this.playlists = Array.isArray(savedPlaylists) ? savedPlaylists : [];
      this.notifyListeners('loaded', this.playlists);
    } catch (error) {
      console.error('Load playlists error:', error);
      this.playlists = [];
    }
  }

  loadCurrentPlaylist() {
    try {
      const savedCurrent = this.storage.get(this.storage.storageKeys.CURRENT_PLAYLIST, null);
      this.currentPlaylist = savedCurrent;
    } catch (error) {
      console.error('Load current playlist error:', error);
      this.currentPlaylist = null;
    }
  }

  savePlaylists() {
    try {
      const result = this.storage.set(this.storage.storageKeys.PLAYLISTS, this.playlists);
      if (result.success) {
        this.notifyListeners('saved', this.playlists);
      }
      return result;
    } catch (error) {
      console.error('Save playlists error:', error);
      return { success: false, error: error.message };
    }
  }

  saveCurrentPlaylist() {
    try {
      const result = this.storage.set(this.storage.storageKeys.CURRENT_PLAYLIST, this.currentPlaylist);
      return result;
    } catch (error) {
      console.error('Save current playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  createPlaylist(name, description = '', cover = '') {
    try {
      if (!name || name.trim() === '') {
        return { success: false, error: 'Playlist name is required' };
      }

      const existingPlaylist = this.playlists.find(pl => pl.name === name);
      if (existingPlaylist) {
        return { success: false, error: 'Playlist with this name already exists' };
      }

      const newPlaylist = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        cover: cover,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        playCount: 0,
        isPublic: false
      };

      this.playlists.push(newPlaylist);
      const saveResult = this.savePlaylists();

      if (saveResult.success) {
        this.notifyListeners('created', newPlaylist);
      }

      return { 
        success: saveResult.success, 
        playlist: newPlaylist,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Create playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  deletePlaylist(playlistId) {
    try {
      const index = this.playlists.findIndex(pl => pl.id === playlistId);
      
      if (index === -1) {
        return { success: false, error: 'Playlist not found' };
      }

      const deletedPlaylist = this.playlists.splice(index, 1)[0];
      
      if (this.currentPlaylist && this.currentPlaylist.id === playlistId) {
        this.currentPlaylist = null;
        this.saveCurrentPlaylist();
      }

      const saveResult = this.savePlaylists();

      if (saveResult.success) {
        this.notifyListeners('deleted', deletedPlaylist);
      }

      return { 
        success: saveResult.success, 
        deleted: deletedPlaylist,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Delete playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  updatePlaylist(playlistId, updates) {
    try {
      const index = this.playlists.findIndex(pl => pl.id === playlistId);
      
      if (index === -1) {
        return { success: false, error: 'Playlist not found' };
      }

      const allowedUpdates = ['name', 'description', 'cover', 'isPublic'];
      const filteredUpdates = {};
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      this.playlists[index] = { 
        ...this.playlists[index], 
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      };

      const saveResult = this.savePlaylists();

      if (saveResult.success) {
        this.notifyListeners('updated', this.playlists[index]);
      }

      return { 
        success: saveResult.success, 
        updated: this.playlists[index],
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Update playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  addSongToPlaylist(playlistId, song) {
    try {
      if (!song || !song.id) {
        return { success: false, error: 'Invalid song data' };
      }

      const playlist = this.playlists.find(pl => pl.id === playlistId);
      
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const existingSong = playlist.songs.find(s => s.songId === song.id);
      if (existingSong) {
        return { success: false, error: 'Song already in playlist', alreadyExists: true };
      }

      const songItem = {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        cover: song.cover,
        duration: song.duration,
        addedAt: new Date().toISOString(),
        order: playlist.songs.length
      };

      playlist.songs.push(songItem);
      playlist.updatedAt = new Date().toISOString();
      
      const saveResult = this.savePlaylists();

      if (saveResult.success) {
        this.notifyListeners('songAdded', { playlist, song: songItem });
      }

      return { 
        success: saveResult.success, 
        playlist: playlist,
        song: songItem,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Add song to playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  removeSongFromPlaylist(playlistId, songId) {
    try {
      const playlist = this.playlists.find(pl => pl.id === playlistId);
      
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const songIndex = playlist.songs.findIndex(s => s.songId === songId);
      
      if (songIndex === -1) {
        return { success: false, error: 'Song not found in playlist' };
      }

      const removedSong = playlist.songs.splice(songIndex, 1)[0];
      playlist.updatedAt = new Date().toISOString();
      
      const saveResult = this.savePlaylists();

      if (saveResult.success) {
        this.notifyListeners('songRemoved', { playlist, song: removedSong });
      }

      return { 
        success: saveResult.success, 
        playlist: playlist,
        removed: removedSong,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Remove song from playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  reorderPlaylistSongs(playlistId, songIds) {
    try {
      const playlist = this.playlists.find(pl => pl.id === playlistId);
      
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const songMap = new Map(playlist.songs.map(s => [s.songId, s]));
      const reorderedSongs = [];

      songIds.forEach((songId, index) => {
        const song = songMap.get(songId);
        if (song) {
          song.order = index;
          reorderedSongs.push(song);
        }
      });

      playlist.songs = reorderedSongs;
      playlist.updatedAt = new Date().toISOString();
      
      const saveResult = this.savePlaylists();

      if (saveResult.success) {
        this.notifyListeners('songsReordered', playlist);
      }

      return { 
        success: saveResult.success, 
        playlist: playlist,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Reorder playlist songs error:', error);
      return { success: false, error: error.message };
    }
  }

  getPlaylists() {
    return [...this.playlists];
  }

  getPlaylist(playlistId) {
    return this.playlists.find(pl => pl.id === playlistId);
  }

  getCurrentPlaylist() {
    return this.currentPlaylist ? this.getPlaylist(this.currentPlaylist.id) : null;
  }

  setCurrentPlaylist(playlistId) {
    try {
      const playlist = this.getPlaylist(playlistId);
      
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      this.currentPlaylist = {
        id: playlist.id,
        currentSongIndex: 0
      };

      const saveResult = this.saveCurrentPlaylist();

      if (saveResult.success) {
        this.notifyListeners('currentChanged', playlist);
      }

      return { 
        success: saveResult.success, 
        playlist: playlist,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Set current playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  getCurrentSongIndex() {
    return this.currentPlaylist ? this.currentPlaylist.currentSongIndex : 0;
  }

  setCurrentSongIndex(index) {
    try {
      if (!this.currentPlaylist) {
        return { success: false, error: 'No current playlist' };
      }

      const playlist = this.getCurrentPlaylist();
      if (!playlist || index < 0 || index >= playlist.songs.length) {
        return { success: false, error: 'Invalid song index' };
      }

      this.currentPlaylist.currentSongIndex = index;
      const saveResult = this.saveCurrentPlaylist();

      return { 
        success: saveResult.success, 
        index: index,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Set current song index error:', error);
      return { success: false, error: error.message };
    }
  }

  getCurrentSong() {
    try {
      const playlist = this.getCurrentPlaylist();
      if (!playlist || playlist.songs.length === 0) {
        return null;
      }

      const currentIndex = this.getCurrentSongIndex();
      return playlist.songs[currentIndex];
    } catch (error) {
      console.error('Get current song error:', error);
      return null;
    }
  }

  getNextSong() {
    try {
      const playlist = this.getCurrentPlaylist();
      if (!playlist || playlist.songs.length === 0) {
        return null;
      }

      let nextIndex = this.getCurrentSongIndex() + 1;
      if (nextIndex >= playlist.songs.length) {
        nextIndex = 0;
      }

      this.setCurrentSongIndex(nextIndex);
      return playlist.songs[nextIndex];
    } catch (error) {
      console.error('Get next song error:', error);
      return null;
    }
  }

  getPreviousSong() {
    try {
      const playlist = this.getCurrentPlaylist();
      if (!playlist || playlist.songs.length === 0) {
        return null;
      }

      let prevIndex = this.getCurrentSongIndex() - 1;
      if (prevIndex < 0) {
        prevIndex = playlist.songs.length - 1;
      }

      this.setCurrentSongIndex(prevIndex);
      return playlist.songs[prevIndex];
    } catch (error) {
      console.error('Get previous song error:', error);
      return null;
    }
  }

  incrementPlaylistPlayCount(playlistId) {
    try {
      const playlist = this.playlists.find(pl => pl.id === playlistId);
      if (playlist) {
        return this.updatePlaylist(playlistId, { 
          playCount: (playlist.playCount || 0) + 1 
        });
      }
      return { success: false, error: 'Playlist not found' };
    } catch (error) {
      console.error('Increment playlist play count error:', error);
      return { success: false, error: error.message };
    }
  }

  searchPlaylists(query) {
    try {
      const lowerQuery = query.toLowerCase();
      const results = this.playlists.filter(pl => 
        pl.name.toLowerCase().includes(lowerQuery) ||
        pl.description.toLowerCase().includes(lowerQuery)
      );

      return { success: true, results: results };
    } catch (error) {
      console.error('Search playlists error:', error);
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

  exportPlaylists() {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: this.playlists.length,
        playlists: this.playlists
      };

      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      console.error('Export playlists error:', error);
      return { success: false, error: error.message };
    }
  }

  importPlaylists(importString) {
    try {
      const importData = JSON.parse(importString);
      
      if (!importData.playlists || !Array.isArray(importData.playlists)) {
        return { success: false, error: 'Invalid import data format' };
      }

      let addedCount = 0;

      importData.playlists.forEach(playlist => {
        if (!this.playlists.some(existing => existing.id === playlist.id)) {
          this.playlists.push(playlist);
          addedCount++;
        }
      });

      const saveResult = this.savePlaylists();

      return { 
        success: saveResult.success, 
        added: addedCount,
        total: this.playlists.length,
        error: saveResult.error 
      };
    } catch (error) {
      console.error('Import playlists error:', error);
      return { success: false, error: error.message };
    }
  }

  getStatistics() {
    try {
      const stats = {
        total: this.playlists.length,
        totalSongs: 0,
        totalPlayCount: 0,
        mostPlayed: null,
        largest: null,
        recentlyCreated: null
      };

      if (this.playlists.length > 0) {
        this.playlists.forEach(pl => {
          stats.totalSongs += pl.songs.length;
          stats.totalPlayCount += pl.playCount || 0;
        });

        stats.mostPlayed = this.playlists.reduce((max, pl) => 
          (pl.playCount || 0) > (max.playCount || 0) ? pl : max
        );

        stats.largest = this.playlists.reduce((max, pl) => 
          pl.songs.length > max.songs.length ? pl : max
        );

        stats.recentlyCreated = this.playlists.reduce((max, pl) => 
          new Date(pl.createdAt) > new Date(max.createdAt) ? pl : max
        );
      }

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get statistics error:', error);
      return { success: false, error: error.message };
    }
  }
}