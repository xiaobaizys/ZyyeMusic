class PerformanceOptimizer {
  constructor(app) {
    this.app = app
    this.debounceTimers = new Map()
    this.throttleTimers = new Map()
  }

  debounce(func, delay = 300) {
    return (...args) => {
      const key = func.toString()
      clearTimeout(this.debounceTimers.get(key))
      const timer = setTimeout(() => {
        func.apply(this, args)
        this.debounceTimers.delete(key)
      }, delay)
      this.debounceTimers.set(key, timer)
    }
  }

  throttle(func, limit = 100) {
    let inThrottle = false
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  setupEventDelegation() {
    document.addEventListener('click', (e) => {
      const target = e.target
      let handled = false

      // 跳过上传相关的按钮和区域,让它们的原生事件正常工作
      const uploadRelatedElement = target.closest('#uploadArea, #selectAudioBtn, #selectCoverBtn, #selectLyricsBtn, #cancelUploadBtn, #confirmUploadBtn, .upload-section, .upload-form-section')
      if (uploadRelatedElement) {
        return
      }
      
      // 跳过进度条和音量滑块,让它们的原生事件正常工作
      const sliderElement = target.closest('#progressSlider, #volumeSlider, #fullscreenProgressSlider, #fullscreenVolumeSlider')
      if (sliderElement) {
        return
      }

      const playBtn = target.closest('.play-btn, .play-fav-btn, .play-hist-btn, .play-user-song-btn, .play-pl-btn')
      if (playBtn && !handled) {
        e.stopPropagation()
        const songId = playBtn.dataset.id
        if (songId && this.app.playSongById) {
          this.app.playSongById(songId)
          handled = true
        }
      }

      const addFavBtn = target.closest('.add-fav-btn')
      if (addFavBtn && !handled) {
        e.stopPropagation()
        const songId = addFavBtn.dataset.id
        if (songId && this.app.addSongToFavorites) {
          this.app.addSongToFavorites(songId)
          handled = true
        }
      }

      const removeFavBtn = target.closest('.remove-fav-btn')
      if (removeFavBtn && !handled) {
        e.stopPropagation()
        const songId = removeFavBtn.dataset.id
        if (songId && this.app.removeSongFromFavorites) {
          this.app.removeSongFromFavorites(songId)
          handled = true
        }
      }

      const deleteSongBtn = target.closest('.delete-user-song-btn')
      if (deleteSongBtn && !handled) {
        e.stopPropagation()
        const songId = deleteSongBtn.dataset.id
        if (songId && this.app.deleteUserSong) {
          this.app.deleteUserSong(songId)
          handled = true
        }
      }

      const editPlBtn = target.closest('.edit-pl-btn')
      if (editPlBtn && !handled) {
        e.stopPropagation()
        const playlistId = editPlBtn.dataset.id
        if (playlistId && this.app.showEditPlaylistModal) {
          this.app.showEditPlaylistModal(playlistId)
          handled = true
        }
      }

      const deletePlBtn = target.closest('.delete-pl-btn')
      if (deletePlBtn && !handled) {
        e.stopPropagation()
        const playlistId = deletePlBtn.dataset.id
        if (playlistId && this.app.deletePlaylist) {
          this.app.deletePlaylist(playlistId)
          handled = true
        }
      }

      const featuredItem = target.closest('.featured-item')
      if (featuredItem && target.tagName !== 'BUTTON') {
        e.stopPropagation()
        const songId = featuredItem.dataset.id
        if (songId && this.app.openSongDetail) {
          this.app.openSongDetail(songId)
          handled = true
        }
      }

      const userSongFeaturedItem = target.closest('.user-song-featured-item')
      if (userSongFeaturedItem && !handled && target.tagName !== 'BUTTON') {
        e.stopPropagation()
        const songId = userSongFeaturedItem.dataset.id
        if (songId && this.app.playSongById) {
          this.app.playSongById(songId)
          handled = true
        }
      }

      const userSongItem = target.closest('.user-song-item')
      if (userSongItem && !handled && target.tagName !== 'BUTTON') {
        e.stopPropagation()
        const songId = userSongItem.dataset.id
        if (songId && this.app.playSongById) {
          this.app.playSongById(songId)
          handled = true
        }
      }

      const carouselPlayBtn = target.closest('.carousel-play-btn')
      if (carouselPlayBtn && !handled) {
        e.stopPropagation()
        const songId = carouselPlayBtn.getAttribute('data-song-id')
        if (songId && this.app.playSongById) {
          this.app.playSongById(songId)
          handled = true
        }
      }
    }, true)
  }

  optimizeDOMOperations() {
    if (typeof requestAnimationFrame === 'function') {
      this.safeUpdateDOM = (callback) => {
        requestAnimationFrame(callback)
      }
    } else {
      this.safeUpdateDOM = (callback) => {
        setTimeout(callback, 0)
      }
    }
  }

  memoize(func) {
    const cache = new Map()
    return (...args) => {
      const key = JSON.stringify(args)
      if (cache.has(key)) {
        return cache.get(key)
      }
      const result = func.apply(this, args)
      cache.set(key, result)
      return result
    }
  }

  batchUpdate(updates) {
    let isBatching = false
    const pendingUpdates = []
    
    return () => {
      pendingUpdates.push(updates)
      if (!isBatching) {
        isBatching = true
        requestAnimationFrame(() => {
          pendingUpdates.forEach(update => update())
          pendingUpdates.length = 0
          isBatching = false
        })
      }
    }
  }

  setupVirtualScroll(container, items, renderItem, itemHeight) {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2
    let startIndex = 0
    
    const update = this.throttle(() => {
      startIndex = Math.floor(container.scrollTop / itemHeight)
      const endIndex = Math.min(startIndex + visibleItems, items.length)
      const visibleSlice = items.slice(startIndex, endIndex)
      
      container.innerHTML = visibleSlice.map((item, index) => renderItem(item, startIndex + index)).join('')
    }, 16)
    
    container.addEventListener('scroll', update)
    update()
  }

  cleanup() {
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.throttleTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    this.throttleTimers.clear()
  }
}
