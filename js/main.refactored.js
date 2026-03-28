class MusicApp {
  constructor() {
    this.dataSystem = dataPersistenceSystem
    this.player = null
    this.playerUI = null
    this.currentCategory = 'all'
    this.currentSearchQuery = ''
    this.isInitialized = false
    this.songs = []
    this.currentSong = null
    this.currentDetailSong = null

    this.themeManager = null
    this.toastManager = null
    this.carouselManager = null
    this.songRenderer = null
    this.eventManager = null
    this.uploadUI = null
    this.fullscreenPlayer = null
  }

  async initialize() {
    try {
      await this.dataSystem.initialize()
      this.dataSyncManager = new DataSyncManager(this.dataSystem)
      this.dataSystem.setDataSyncManager(this.dataSyncManager)
      
      this.initializeManagers()
      this.setupPlayer()
      this.loadInitialData()
      this.loadUserSongs()
      this.bindEvents()
      
      this.isInitialized = true
      
      if (typeof lazyImageLoader !== 'undefined') {
        lazyImageLoader.observeAll('.lazy-image')
      }
      
      console.log('音乐网站初始化成功')
    } catch (error) {
      console.error('初始化失败:', error)
      this.showError('初始化失败，请刷新页面重试')
    }
  }

  initializeManagers() {
    this.toastManager = new ToastManager()
    this.themeManager = new ThemeManager()
    this.carouselManager = new CarouselManager()
    this.songRenderer = new SongRenderer(this.dataSystem, typeof lazyImageLoader !== 'undefined' ? lazyImageLoader : null)
    this.eventManager = new EventManager(this)
    this.uploadUI = new UploadUI(this.dataSystem, this.toastManager)
    this.fullscreenPlayer = new FullscreenPlayer(null, this.dataSystem)

    this.themeManager.initialize()
    this.carouselManager.initialize()
    this.fullscreenPlayer.initialize()
  }

  loadUserSongs() {
    const uploadManager = this.dataSystem.getFileUploadManager()
    const userSongs = uploadManager.getUserSongs()
    if (Array.isArray(userSongs)) {
      this.songs = [...this.songs, ...userSongs]
    }
    this.songRenderer.setSongs(this.songs)
    this.renderUserSongsList()
  }

  setupPlayer() {
    const audioElement = document.getElementById('audioPlayer')
    this.player = new MusicPlayer(audioElement)
    this.playerUI = new PlayerUI(this.player, this.dataSystem)
    this.fullscreenPlayer.player = this.player
    this.fullscreenPlayer.toastManager = this.toastManager
  }

  bindEvents() {
    this.themeManager.bindEvents(() => this.themeManager.toggle())
    this.eventManager.bindAll()
    this.eventManager.bindSongEventsWithDelegation()
    this.bindUploadEvents()
  }

  bindUploadEvents() {
    this.uploadUI.bindEvents({
      handleAudioFileSelect: (e) => this.handleAudioFileSelect(e),
      handleCoverFileSelect: (e) => this.handleCoverFileSelect(e),
      handleLyricsFileSelect: (e) => this.handleLyricsFileSelect(e),
      handleDrop: (e) => this.handleDrop(e),
      cancelUpload: () => this.cancelUpload(),
      confirmUpload: () => this.confirmUpload()
    })
  }

  loadInitialData() {
    this.renderFeaturedSongs()
    this.renderSongs()
  }

  renderFeaturedSongs() {
    this.songRenderer.renderFeaturedSongs()
  }

  renderUserSongsFeatured() {
    this.songRenderer.renderUserSongsFeatured()
  }

  renderSongs(songs = null) {
    const targetSongs = songs || this.getSongsByCategory(this.currentCategory)
    if (this.currentSearchQuery) {
      this.songRenderer.renderSongs(this.searchSongs(this.currentSearchQuery))
    } else {
      this.songRenderer.renderSongs(targetSongs)
    }
  }

  renderFavorites() {
    this.songRenderer.renderFavorites()
  }

  renderPlaylists() {
    this.songRenderer.renderPlaylists()
  }

  renderHistory() {
    this.songRenderer.renderHistory()
  }

  renderUserSongsList() {
    const userSongsSection = document.getElementById('userSongsSection')
    const userSongsList = document.getElementById('userSongsList')
    const uploadManager = this.dataSystem.getFileUploadManager()
    const userSongs = uploadManager.getUserSongs()
    
    if (userSongs.length === 0) {
      userSongsSection.style.display = 'none'
      return
    }

    userSongsSection.style.display = 'block'
    
    userSongsList.innerHTML = userSongs.map(song => `
      <div class="user-song-item" data-id="${song.id}">
        <img data-src="${song.cover}" alt="${song.title}" class="lazy-image">
        <div class="user-song-info">
          <h4>${song.title}</h4>
          <p>${song.artist} - ${song.album}</p>
          <span class="upload-date">上传于 ${new Date(song.uploadedAt).toLocaleDateString()}</span>
        </div>
        <div class="user-song-actions">
          <button class="action-btn play-user-song-btn" data-id="${song.id}" title="播放">▶️</button>
          <button class="action-btn delete-user-song-btn" data-id="${song.id}" title="删除">🗑️</button>
        </div>
      </div>
    `).join('')

    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image')
    }
  }

  navigateTo(page) {
    const navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(item => {
      item.classList.remove('active')
      if (item.dataset.page === page) {
        item.classList.add('active')
      }
    })

    const pages = document.querySelectorAll('.page')
    pages.forEach(p => p.classList.remove('active'))
    
    const targetPage = document.getElementById(`${page}Page`)
    if (targetPage) {
      targetPage.classList.add('active')
    }

    if (page === 'favorites') {
      this.renderFavorites()
    } else if (page === 'playlists') {
      this.renderPlaylists()
    } else if (page === 'history') {
      this.renderHistory()
    }
  }

  performSearch() {
    const searchInput = document.getElementById('searchInput')
    this.currentSearchQuery = searchInput.value.trim()
    
    if (this.currentSearchQuery) {
      this.navigateTo('home')
      this.renderSongs()
    }
  }

  filterByCategory(category) {
    this.currentCategory = category
    
    const categoryBtns = document.querySelectorAll('.category-btn')
    categoryBtns.forEach(btn => {
      btn.classList.remove('active')
      if (btn.dataset.category === category) {
        btn.classList.add('active')
      }
    })

    this.renderSongs()
  }

  getSongsByCategory(category) {
    if (category === 'all') {
      return this.songs
    }
    return this.songs.filter(song => song.genre === category)
  }

  searchSongs(query) {
    const lowerQuery = query.toLowerCase()
    return this.songs.filter(song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery)
    )
  }

  getSongById(id) {
    return this.songs.find(song => song.id === id)
  }

  playSongById(songId) {
    const song = this.getSongById(songId)
    if (song) {
      this.playerUI.playSong(song)
    }
  }

  playPlaylist(playlistId) {
    const playlists = this.dataSystem.getPlaylists()
    const playlist = playlists.getPlaylist(playlistId)
    
    if (playlist && playlist.songs.length > 0) {
      const songs = playlist.songs.map(s => ({
        id: s.songId,
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        url: this.getSongById(s.songId)?.url || ''
      }))

      this.player.setPlaylist(songs, 0)
      this.player.loadAndPlay()
    }
  }

  addSongToFavorites(songId) {
    const song = this.getSongById(songId)
    if (song) {
      const favorites = this.dataSystem.getFavorites()
      const result = favorites.addFavorite(song)
      
      if (result.success) {
        this.toastManager.success('已添加到收藏')
      } else if (result.alreadyExists) {
        this.toastManager.info('歌曲已在收藏中')
      } else {
        this.toastManager.error('添加收藏失败')
      }
    }
  }

  removeSongFromFavorites(songId) {
    const favorites = this.dataSystem.getFavorites()
    const result = favorites.removeFavorite(songId)
    
    if (result.success) {
      this.renderFavorites()
      this.toastManager.success('已从收藏中移除')
    } else {
      this.toastManager.error('移除失败')
    }
  }

  showCreatePlaylistModal() {
    const modalContent = `
      <h3>创建播放列表</h3>
      <div class="form-group">
        <label for="playlistName">播放列表名称</label>
        <input type="text" id="playlistName" placeholder="输入播放列表名称" required>
      </div>
      <div class="form-group">
        <label for="playlistDesc">描述（可选）</label>
        <textarea id="playlistDesc" placeholder="输入播放列表描述"></textarea>
      </div>
      <div class="form-actions">
        <button id="cancelCreateBtn" class="btn-secondary btn-cancel">取消</button>
        <button id="confirmCreateBtn" class="btn-primary">创建</button>
      </div>
    `

    showModal(modalContent)

    document.getElementById('cancelCreateBtn').addEventListener('click', hideModal)
    document.getElementById('confirmCreateBtn').addEventListener('click', () => {
      const name = document.getElementById('playlistName').value.trim()
      
      if (name) {
        const playlists = this.dataSystem.getPlaylists()
        const result = playlists.createPlaylist(name, document.getElementById('playlistDesc').value.trim())
        
        if (result.success) {
          hideModal()
          this.renderPlaylists()
          this.toastManager.success('播放列表创建成功')
        } else {
          this.toastManager.error(result.error || '创建失败')
        }
      } else {
        this.toastManager.error('请输入播放列表名称')
      }
    })
  }

  showEditPlaylistModal(playlistId) {
    const playlists = this.dataSystem.getPlaylists()
    const playlist = playlists.getPlaylist(playlistId)
    
    if (!playlist) return

    const modalContent = `
      <h3>编辑播放列表</h3>
      <div class="form-group">
        <label for="editPlaylistName">播放列表名称</label>
        <input type="text" id="editPlaylistName" value="${playlist.name}" required>
      </div>
      <div class="form-group">
        <label for="editPlaylistDesc">描述（可选）</label>
        <textarea id="editPlaylistDesc" placeholder="输入播放列表描述">${playlist.description || ''}</textarea>
      </div>
      <div class="form-actions">
        <button id="cancelEditBtn" class="btn-secondary btn-cancel">取消</button>
        <button id="confirmEditBtn" class="btn-primary">保存</button>
      </div>
    `

    showModal(modalContent)

    document.getElementById('cancelEditBtn').addEventListener('click', hideModal)
    document.getElementById('confirmEditBtn').addEventListener('click', () => {
      const name = document.getElementById('editPlaylistName').value.trim()
      if (name) {
        const result = playlists.updatePlaylist(playlistId, { name, description: document.getElementById('editPlaylistDesc').value.trim()
        if (result.success) {
          hideModal()
          this.renderPlaylists()
          this.toastManager.success('播放列表更新成功')
        } else {
          this.toastManager.error(result.error || '更新失败')
        }
      } else {
        this.toastManager.error('请输入播放列表名称')
      }
    })
  }

  deletePlaylist(playlistId) {
    if (confirm('确定要删除这个播放列表吗？')) {
      const playlists = this.dataSystem.getPlaylists()
      const result = playlists.deletePlaylist(playlistId)
      if (result.success) {
        this.renderPlaylists()
        this.toastManager.success('播放列表已删除')
      } else {
        this.toastManager.error('删除失败')
      }
    }
  }

  exportFavorites() {
    const dataManager = this.dataSystem.getDataManager()
    const result = dataManager.downloadExportFile('favorites-backup.json')
    if (result.success) {
      this.toastManager.success('收藏导出成功')
    } else {
      this.toastManager.error('导出失败')
    }
  }

  clearStorage() {
    if (confirm('⚠️ 确定要清理存储吗？\n\n这将清理旧的备份数据和压缩数据，释放 LocalStorage 空间。\n您的歌曲、收藏和播放列表不会被删除。')) {
      try {
        const storage = this.dataSystem.getStorage()
        const prefix = storage.prefix
        const keys = Object.keys(localStorage)
        
        let removedCount = 0
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            if (key.includes('_backup_')) {
              localStorage.removeItem(key)
              removedCount++
            }
          }
        })
        
        this.toastManager.success(`已清理 ${removedCount} 个备份文件！存储空间已释放。`)
      } catch (error) {
        console.error('清理存储失败:', error)
        this.toastManager.error('清理存储失败')
      }
    }
  }

  clearHistory() {
    if (confirm('确定要清除所有播放历史吗？')) {
      const history = this.dataSystem.getHistory()
      const result = history.clearHistory()
      
      if (result.success) {
        this.renderHistory()
        this.toastManager.success('播放历史已清除')
      } else {
        this.toastManager.error('清除失败')
      }
    }
  }

  deleteUserSong(songId) {
    if (confirm('确定要删除这首歌曲吗？')) {
      const uploadManager = this.dataSystem.getFileUploadManager()
      const result = uploadManager.deleteUserSong(songId)
      
      if (result.success) {
        this.songs = this.songs.filter(s => s.id !== songId)
        this.songRenderer.setSongs(this.songs)
        this.renderUserSongsList()
        this.renderUserSongsFeatured()
        this.renderSongs()
        this.carouselManager.refresh()
        this.toastManager.success('歌曲已删除')
      } else {
        this.toastManager.error(result.error || '删除失败')
      }
    }
  }

  toggleFullscreenPlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer')
    if (fullscreenPlayer.classList.contains('active')) {
      this.fullscreenPlayer.close()
    } else {
      this.fullscreenPlayer.open()
    }
  }

  closeFullscreenPlayer() {
    this.fullscreenPlayer.close()
  }

  openSongDetail(songId) {
    const song = this.getSongById(songId)
    if (!song) {
      this.toastManager.error('歌曲不存在')
      return
    }

    this.currentDetailSong = song
    const songDetailCover = document.getElementById('songDetailCover')
    const songDetailTitle = document.getElementById('songDetailTitle')
    const songDetailAlbum = document.getElementById('songDetailAlbum')
    const songDetailReleaseDate = document.getElementById('songDetailReleaseDate')
    const songDetailPlayCount = document.getElementById('songDetailPlayCount')
    const songDetailCreditTitle = document.getElementById('songDetailCreditTitle')
    const songDetailAlbumDesc = document.getElementById('songDetailAlbumDesc')

    songDetailCover.querySelector('img').src = song.cover || 'assets/images/default-cover.svg'
    songDetailTitle.textContent = song.title
    songDetailCreditTitle.textContent = song.title
    songDetailAlbum.textContent = song.album || '未知专辑'
    
    const history = this.dataSystem.getHistory()
    const historyItem = history.getHistoryItem(songId)
    const playCount = historyItem?.playCount || 0
    songDetailPlayCount.textContent = playCount > 0 ? `${playCount}` : '0'

    const uploadedDate = song.uploadedAt ? new Date(song.uploadedAt).toLocaleDateString('zh-CN') : '未知'
    songDetailReleaseDate.textContent = uploadedDate

    songDetailAlbumDesc.textContent = song.description || '暂无专辑简介'

    this.navigateTo('songDetail')
  }

  showSuccess(message) { this.toastManager.success(message) }
  showError(message) { this.toastManager.error(message) }
  showInfo(message) { this.toastManager.info(message) }
  showWarning(message) { this.toastManager.warning(message) }

  async handleAudioFileSelect(e) {
    const file = e.target.files[0]
    if (file) await this.handleAudioFile(file)
  }

  async handleAudioFile(file) {
    const uploadManager = this.dataSystem.getFileUploadManager()
    this.toastManager.info('正在验证音频文件...')
    const validation = await uploadManager.validateAudioFile(file)
    if (!validation.success) {
      this.toastManager.error(validation.error)
      return
    }
    this.uploadUI.tempAudioFile = file
    this.uploadUI.showForm()
    this.uploadUI.setTitle(uploadManager.removeExtension(file.name))
    this.uploadUI.setArtist('未知艺术家')
    this.toastManager.success('音频文件验证通过！')
  }

  async handleCoverFileSelect(e) {
    const file = e.target.files[0]
    if (file) await this.handleCoverFile(file)
  }

  async handleCoverFile(file) {
    const uploadManager = this.dataSystem.getFileUploadManager()
    this.toastManager.info('正在验证图片文件...')
    const validation = await uploadManager.validateImageFile(file)
    if (!validation.success) {
      this.toastManager.error(validation.error)
      return
    }
    try {
      const result = await uploadManager.uploadImageFile(file)
      if (result.success) {
        this.uploadUI.tempCoverData = result.dataUrl
        this.uploadUI.setCoverPreview(result.dataUrl)
        this.toastManager.success('封面上传成功！')
      } else {
        this.toastManager.error(result.error)
      }
    } catch (error) {
      this.toastManager.error('封面上传失败: ' + error.message)
    }
  }

  async handleLyricsFileSelect(e) {
    const file = e.target.files[0]
    if (file) await this.handleLyricsFile(file)
  }

  async handleLyricsFile(file) {
    const uploadManager = this.dataSystem.getFileUploadManager()
    const validation = uploadManager.validateFile(file, 'lyrics')
    if (!validation.success) {
      this.toastManager.error(validation.error)
      return
    }
    try {
      const result = await uploadManager.uploadLyricsFile(file)
      if (result.success) {
        this.uploadUI.tempLyrics = result.lyrics
        this.uploadUI.setLyricsPreview(result.lyrics)
      } else {
        this.toastManager.error(result.error)
      }
    } catch (error) {
      this.toastManager.error('歌词上传失败')
    }
  }

  handleDrop(e) {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) this.handleAudioFile(files[0])
  }

  cancelUpload() {
    this.uploadUI.resetForm()
  }

  async confirmUpload() {
    const formData = this.uploadUI.getFormData()
    if (!formData.title || !formData.artist) {
      this.toastManager.error('请填写歌曲标题和艺术家')
      return
    }
    if (!this.uploadUI.tempAudioFile) {
      this.toastManager.error('请选择音频文件')
      return
    }
    this.uploadUI.showProgress()
    const uploadManager = this.dataSystem.getFileUploadManager()
    try {
      await this.uploadUI.simulateUploadProgress()
      const metadata = {
        title: formData.title,
        artist: formData.artist,
        album: formData.album,
        genre: formData.genre,
        cover: this.uploadUI.tempCoverData,
        lyrics: this.uploadUI.tempLyrics
      }
      const result = await uploadManager.uploadAudioFile(this.uploadUI.tempAudioFile, metadata)
      if (result.success) {
        this.uploadUI.updateProgress(100, '上传完成！')
        this.toastManager.success('歌曲上传成功！')
        this.songs.push(result.song)
        this.songRenderer.setSongs(this.songs)
        this.renderUserSongsList()
        this.cancelUpload()
        this.renderSongs()
        this.renderFeaturedSongs()
        this.renderUserSongsFeatured()
        this.carouselManager.refresh()
        this.navigateTo('home')
      } else {
        this.toastManager.error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传异常:', error)
      this.toastManager.error('上传失败: ' + (error.message || '未知错误'))
    } finally {
      this.uploadUI.hideProgress()
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new MusicApp()
  window.musicApp = app
  app.initialize()
})
