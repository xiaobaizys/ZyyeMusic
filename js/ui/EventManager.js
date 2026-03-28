class EventManager {
  constructor(app) {
    this.app = app
  }

  bindAll() {
    this.bindNavigationEvents()
    this.bindSearchEvents()
    this.bindCategoryEvents()
    this.bindPlaylistEvents()
    this.bindFavoriteEvents()
    this.bindHistoryEvents()
    this.bindKeyboardShortcuts()
    this.bindFullscreenEvents()
    this.bindSongDetailEvents()
    this.bindDataManagementEvents()
  }

  bindNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.target.dataset.page
        this.app.navigateTo(page)
      })
    })
  }

  bindSearchEvents() {
    const searchInput = document.getElementById('searchInput')
    const searchBtn = document.getElementById('searchBtn')

    searchBtn?.addEventListener('click', () => this.app.performSearch())
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.app.performSearch()
      }
    })

    searchInput?.addEventListener('input', (e) => {
      this.app.currentSearchQuery = e.target.value
      if (e.target.value === '') {
        this.app.renderSongs()
      }
    })
  }

  bindCategoryEvents() {
    const categoryBtns = document.querySelectorAll('.category-btn')
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category
        this.app.filterByCategory(category)
      })
    })
  }

  bindPlaylistEvents() {
    const createPlaylistBtn = document.getElementById('createPlaylistBtn')
    createPlaylistBtn?.addEventListener('click', () => this.app.showCreatePlaylistModal())
  }

  bindFavoriteEvents() {
    const exportFavoritesBtn = document.getElementById('exportFavoritesBtn')
    exportFavoritesBtn?.addEventListener('click', () => this.app.exportFavorites())
    
    const clearStorageBtn = document.getElementById('clearStorageBtn')
    clearStorageBtn?.addEventListener('click', () => this.app.clearStorage())
  }

  bindHistoryEvents() {
    const clearHistoryBtn = document.getElementById('clearHistoryBtn')
    clearHistoryBtn?.addEventListener('click', () => this.app.clearHistory())
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      switch(e.code) {
        case 'Space':
          e.preventDefault()
          this.app.player?.togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            this.app.player?.previous()
          } else {
            const newTime = Math.max(0, (this.app.player?.audio?.currentTime || 0) - 5)
            this.app.player?.seekTo(newTime)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            this.app.player?.next()
          } else {
            const newTime = Math.min((this.app.player?.audio?.duration || 0), (this.app.player?.audio?.currentTime || 0) + 5)
            this.app.player?.seekTo(newTime)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          this.app.player?.setVolume(Math.min(1, (this.app.player?.volume || 0.8) + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          this.app.player?.setVolume(Math.max(0, (this.app.player?.volume || 0.8) - 0.1))
          break
        case 'KeyM':
          e.preventDefault()
          this.app.player?.toggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          this.app.toggleFullscreenPlayer?.()
          break
        case 'Escape':
          e.preventDefault()
          this.app.closeFullscreenPlayer?.()
          break
      }
    })
  }

  bindFullscreenEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]')
      if (!target) return
      
      const action = target.dataset.action
      const id = target.dataset.id
      
      if (action === 'play-song') {
        this.app.playSongById(id)
      } else if (action === 'add-favorite') {
        this.app.addSongToFavorites(id)
      } else if (action === 'remove-favorite') {
        this.app.removeSongFromFavorites(id)
      } else if (action === 'play-playlist') {
        this.app.playPlaylist(id)
      } else if (action === 'edit-playlist') {
        this.app.showEditPlaylistModal(id)
      } else if (action === 'delete-playlist') {
        this.app.deletePlaylist(id)
      } else if (action === 'open-detail') {
        this.app.openSongDetail(id)
      }
    })
  }

  bindSongDetailEvents() {
    document.addEventListener('click', (e) => {
      const featuredItem = e.target.closest('.featured-item')
      if (featuredItem) {
        const songId = featuredItem.dataset.id
        this.app.openSongDetail(songId)
      }

      const userSongFeaturedItem = e.target.closest('.user-song-featured-item')
      if (userSongFeaturedItem) {
        const songId = userSongFeaturedItem.dataset.id
        this.app.playSongById(songId)
      }
    })
  }

  bindDataManagementEvents() {
  }

  bindSongEventsWithDelegation() {
    document.addEventListener('click', (e) => {
      const playBtn = e.target.closest('.play-btn, .play-fav-btn, .play-hist-btn')
      if (playBtn) {
        const songId = playBtn.dataset.id
        this.app.playSongById(songId)
        return
      }

      const addFavBtn = e.target.closest('.add-fav-btn')
      if (addFavBtn) {
        const songId = addFavBtn.dataset.id
        this.app.addSongToFavorites(songId)
        return
      }

      const removeFavBtn = e.target.closest('.remove-fav-btn')
      if (removeFavBtn) {
        const songId = removeFavBtn.dataset.id
        this.app.removeSongFromFavorites(songId)
        return
      }

      const playPlBtn = e.target.closest('.play-pl-btn')
      if (playPlBtn) {
        const playlistId = playPlBtn.dataset.id
        this.app.playPlaylist(playlistId)
        return
      }

      const editPlBtn = e.target.closest('.edit-pl-btn')
      if (editPlBtn) {
        const playlistId = editPlBtn.dataset.id
        this.app.showEditPlaylistModal(playlistId)
        return
      }

      const deletePlBtn = e.target.closest('.delete-pl-btn')
      if (deletePlBtn) {
        const playlistId = deletePlBtn.dataset.id
        this.app.deletePlaylist(playlistId)
        return
      }
    })
  }
}
