class DataSyncManager {
  constructor(dataSystem) {
    this.dataSystem = dataSystem;
    this.dataVersion = '1.0.0';
  }

  exportAllData() {
    try {
      const uploadManager = this.dataSystem.getFileUploadManager();
      const favorites = this.dataSystem.getFavorites().getFavorites();
      const playlists = this.dataSystem.getPlaylists().getPlaylists();
      const history = this.dataSystem.getHistory().getRecentHistory(1000);
      const userSongs = uploadManager.getUserSongs();

      const exportData = {
        version: this.dataVersion,
        exportedAt: new Date().toISOString(),
        data: {
          userSongs: userSongs,
          favorites: favorites,
          playlists: playlists,
          history: history
        }
      };

      const jsonString = JSON.stringify(exportData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `music-website-backup-${this.getDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: '数据导出成功！' };
    } catch (error) {
      console.error('导出数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  async importData(file) {
    try {
      const text = await this.readFileAsText(file);
      const importData = JSON.parse(text);

      if (!importData.version || !importData.data) {
        return { success: false, error: '无效的数据文件格式' };
      }

      const { userSongs, favorites, playlists, history } = importData.data;

      if (userSongs && Array.isArray(userSongs)) {
        const uploadManager = this.dataSystem.getFileUploadManager();
        userSongs.forEach(song => {
          uploadManager.saveUserSong(song);
        });
      }

      if (favorites && Array.isArray(favorites)) {
        const favoritesManager = this.dataSystem.getFavorites();
        favorites.forEach(fav => {
          favoritesManager.addFavorite(fav);
        });
      }

      if (playlists && Array.isArray(playlists)) {
        const playlistManager = this.dataSystem.getPlaylists();
        playlists.forEach(playlist => {
          playlistManager.createPlaylist(playlist.name, playlist.description);
          const newPlaylist = playlistManager.getPlaylists().pop();
          if (newPlaylist && playlist.songs) {
            playlist.songs.forEach(song => {
              playlistManager.addSongToPlaylist(newPlaylist.id, song);
            });
          }
        });
      }

      if (history && Array.isArray(history)) {
        const historyManager = this.dataSystem.getHistory();
        history.forEach(item => {
          historyManager.addToHistory(item);
        });
      }

      return { 
        success: true, 
        message: '数据导入成功！请刷新页面查看。',
        imported: {
          userSongs: userSongs?.length || 0,
          favorites: favorites?.length || 0,
          playlists: playlists?.length || 0,
          history: history?.length || 0
        }
      };
    } catch (error) {
      console.error('导入数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}`;
  }

  getDataPreview(file) {
    return new Promise((resolve, reject) => {
      this.readFileAsText(file)
        .then(text => {
          try {
            const data = JSON.parse(text);
            resolve({
              success: true,
              version: data.version,
              exportedAt: data.exportedAt,
              userSongs: data.data?.userSongs?.length || 0,
              favorites: data.data?.favorites?.length || 0,
              playlists: data.data?.playlists?.length || 0,
              history: data.data?.history?.length || 0
            });
          } catch (e) {
            reject(new Error('无效的JSON文件'));
          }
        })
        .catch(reject);
    });
  }
}
