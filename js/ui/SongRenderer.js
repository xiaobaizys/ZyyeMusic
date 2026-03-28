class SongRenderer {
  constructor(dataSystem, lazyImageLoader) {
    this.dataSystem = dataSystem
    this.lazyImageLoader = lazyImageLoader
    this.songs = []
  }

  setSongs(songs) {
    this.songs = songs
  }

  shuffleArray(array) {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  renderFeaturedSongs() {
    const featuredList = document.getElementById('featuredList')
    if (!featuredList) return
    
    const history = this.dataSystem.getHistory()
    const mostPlayedResult = history.getMostPlayedSongs(6)
    
    let featuredSongs = []
    
    if (mostPlayedResult.success && mostPlayedResult.results.length > 0) {
      const songMap = new Map(this.songs.map(song => [song.id, song]))
      
      featuredSongs = mostPlayedResult.results
        .map(historyItem => {
          const song = songMap.get(historyItem.songId)
          if (song) {
            return { ...song, playCount: historyItem.playCount }
          }
          return null
        })
        .filter(item => item !== null)
    }
    
    if (featuredSongs.length < 6 && this.songs.length > 0) {
      const remainingCount = 6 - featuredSongs.length
      const existingIds = new Set(featuredSongs.map(s => s.id))
      const availableSongs = this.songs.filter(s => !existingIds.has(s.id))
      const randomSongs = this.shuffleArray(availableSongs).slice(0, remainingCount)
      featuredSongs = [...featuredSongs, ...randomSongs]
    }
    
    if (featuredSongs.length === 0) {
      featuredList.innerHTML = `
        <div class="empty-state">
          <p>暂无推荐歌曲</p>
        </div>
      `
      return
    }
    
    featuredList.innerHTML = featuredSongs.map(song => `
      <div class="featured-item" data-id="${song.id}">
        <img data-src="${song.cover}" alt="${song.title}" class="lazy-image">
        <div class="featured-info">
          <h3>${song.title}</h3>
          <p>${song.artist}</p>
          ${song.playCount ? `<span class="play-count">播放 ${song.playCount} 次</span>` : ''}
        </div>
      </div>
    `).join('')

    this.observeImages()
  }

  renderUserSongsFeatured() {
    const featuredList = document.getElementById('userSongsFeaturedList')
    if (!featuredList) return
    
    const uploadManager = this.dataSystem.getFileUploadManager()
    const userSongs = uploadManager.getUserSongs()
    
    if (!Array.isArray(userSongs) || userSongs.length === 0) {
      featuredList.innerHTML = `
        <div class="empty-state">
          <p>暂无上传歌曲，去上传一首吧！</p>
        </div>
      `
      return
    }
    
    const sortedUserSongs = [...userSongs].sort((a, b) => 
      new Date(b.uploadedAt) - new Date(a.uploadedAt)
    )
    
    featuredList.innerHTML = sortedUserSongs.map(song => `
      <div class="user-song-featured-item" data-id="${song.id}">
        <img data-src="${song.cover}" alt="${song.title}" class="lazy-image">
        <div class="featured-info">
          <h3>${song.title}</h3>
          <p>${song.artist}</p>
          <span class="upload-date">上传于 ${new Date(song.uploadedAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('')
    
    this.observeImages()
  }

  renderSongs(songs) {
    const songsList = document.getElementById('songsList')
    if (!songsList) return

    if (songs.length === 0) {
      songsList.innerHTML = `
        <div class="empty-state">
          <p>没有找到相关歌曲</p>
        </div>
      `
      return
    }

    songsList.innerHTML = songs.map(song => `
      <div class="song-item" data-id="${song.id}">
        <img data-src="${song.cover}" alt="${song.title}" class="lazy-image">
        <div class="song-info">
          <h3>${song.title}</h3>
          <p>${song.artist} - ${song.album}</p>
        </div>
        <div class="song-actions">
          <button class="action-btn play-btn" data-id="${song.id}" title="播放">▶️</button>
          <button class="action-btn add-fav-btn" data-id="${song.id}" title="添加到收藏">🤍</button>
        </div>
      </div>
    `).join('')

    this.observeImages()
  }

  renderFavorites() {
    const favoritesList = document.getElementById('favoritesList')
    if (!favoritesList) return
    
    const favorites = this.dataSystem.getFavorites().getFavorites()
    const uploadManager = this.dataSystem.getFileUploadManager()
    const userSongs = uploadManager.getUserSongs()
    const songMap = new Map(userSongs.map(song => [song.id, song]))

    if (favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="empty-state">
          <p>暂无收藏歌曲</p>
        </div>
      `
      return
    }

    favoritesList.innerHTML = favorites.map(fav => {
      const originalSong = songMap.get(fav.songId)
      const coverUrl = originalSong?.cover || fav.cover
      return `
        <div class="favorite-item" data-id="${fav.songId}">
          <img data-src="${coverUrl}" alt="${fav.title}" class="lazy-image">
          <div class="favorite-info">
            <h3>${fav.title}</h3>
            <p>${fav.artist}</p>
            <span class="play-time">添加于 ${new Date(fav.addedAt).toLocaleDateString()}</span>
          </div>
          <div class="favorite-actions">
            <button class="action-btn play-fav-btn" data-id="${fav.songId}" title="播放">▶️</button>
            <button class="action-btn remove-fav-btn" data-id="${fav.songId}" title="移除">🗑️</button>
          </div>
        </div>
      `
    }).join('')

    this.observeImages()
  }

  renderPlaylists() {
    const playlistsList = document.getElementById('playlistsList')
    if (!playlistsList) return
    
    const playlists = this.dataSystem.getPlaylists().getPlaylists()

    if (playlists.length === 0) {
      playlistsList.innerHTML = `
        <div class="empty-state">
          <p>暂无播放列表</p>
        </div>
      `
      return
    }

    playlistsList.innerHTML = playlists.map(pl => `
      <div class="playlist-item" data-id="${pl.id}">
        <div class="playlist-cover">
          <img data-src="${pl.cover || 'assets/images/default-cover.svg'}" alt="${pl.name}" class="lazy-image">
        </div>
        <div class="playlist-info">
          <h3>${pl.name}</h3>
          <p>${pl.description || '无描述'}</p>
          <span class="playlist-count">${pl.songs.length} 首歌曲</span>
        </div>
        <div class="playlist-actions">
          <button class="action-btn play-pl-btn" data-id="${pl.id}" title="播放">▶️</button>
          <button class="action-btn edit-pl-btn" data-id="${pl.id}" title="编辑">✏️</button>
          <button class="action-btn delete-pl-btn" data-id="${pl.id}" title="删除">🗑️</button>
        </div>
      </div>
    `).join('')

    this.observeImages()
  }

  renderHistory() {
    const historyList = document.getElementById('historyList')
    if (!historyList) return
    
    const history = this.dataSystem.getHistory().getRecentHistory(50)

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <p>暂无播放历史</p>
        </div>
      `
      return
    }

    historyList.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.songId}">
        <img data-src="${item.cover}" alt="${item.title}" class="lazy-image">
        <div class="history-info">
          <h3>${item.title}</h3>
          <p>${item.artist}</p>
          <span class="play-time">播放于 ${new Date(item.playedAt).toLocaleString()}</span>
        </div>
        <div class="history-actions">
          <button class="action-btn play-hist-btn" data-id="${item.songId}" title="播放">▶️</button>
        </div>
      </div>
    `).join('')

    this.observeImages()
  }

  observeImages() {
    if (this.lazyImageLoader && typeof this.lazyImageLoader.observeAll === 'function') {
      this.lazyImageLoader.observeAll('.lazy-image')
    }
  }
}
