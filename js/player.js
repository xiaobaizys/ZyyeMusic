class MusicPlayer {
  constructor(audioElement) {
    this.audio = audioElement
    this.currentSong = null
    this.playlist = []
    this.currentIndex = 0
    this.isPlaying = false
    this.isShuffle = false
    this.repeatMode = 'none'
    this.volume = 0.8
    this.listeners = []
    this.playStartTime = 0
    this.playDuration = 0

    this.setupAudioEvents()
  }

  setupAudioEvents() {
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate())
    this.audio.addEventListener('ended', () => this.onEnded())
    this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata())
    this.audio.addEventListener('error', (e) => this.onError(e))
    this.audio.addEventListener('play', () => this.onPlay())
    this.audio.addEventListener('pause', () => this.onPause())
  }

  loadSong(song) {
    this.currentSong = song
    this.audio.src = song.url
    this.audio.load()
    this.notifyListeners('songLoaded', song)
  }

  play() {
    if (!this.currentSong) {
      return
    }

    this.audio
      .play()
      .then(() => {
        this.isPlaying = true
        this.playStartTime = Date.now()
        this.notifyListeners('play', this.currentSong)
      })
      .catch((error) => {
        console.error('播放失败:', error)
        this.notifyListeners('error', error)
      })
  }

  pause() {
    if (this.isPlaying) {
      this.audio.pause()
      this.isPlaying = false
      this.playDuration += (Date.now() - this.playStartTime) / 1000
      this.notifyListeners('pause', this.currentSong)
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  next() {
    if (this.playlist.length === 0) {
      return
    }

    if (this.isShuffle) {
      this.playRandom()
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length
      this.loadAndPlay()
    }
  }

  previous() {
    if (this.playlist.length === 0) {
      return
    }

    if (this.isShuffle) {
      this.playRandom()
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
      this.loadAndPlay()
    }
  }

  playRandom() {
    if (this.playlist.length === 0) {
      return
    }

    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * this.playlist.length)
    } while (randomIndex === this.currentIndex && this.playlist.length > 1)

    this.currentIndex = randomIndex
    this.loadAndPlay()
  }

  loadAndPlay() {
    if (this.playlist.length === 0) {
      return
    }

    const song = this.playlist[this.currentIndex]
    this.loadSong(song)
    this.play()
  }

  seekTo(time) {
    this.audio.currentTime = time
    this.notifyListeners('seek', time)
  }

  seekToPercent(percent) {
    const time = (percent / 100) * this.audio.duration
    this.seekTo(time)
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.audio.volume = this.volume
    this.notifyListeners('volumeChange', this.volume)
  }

  toggleMute() {
    if (this.audio.muted) {
      this.audio.muted = false
      this.notifyListeners('unmute', this.volume)
    } else {
      this.audio.muted = true
      this.notifyListeners('mute', this.volume)
    }
  }

  setPlaylist(songs, startIndex = 0) {
    this.playlist = songs
    this.currentIndex = startIndex
    this.notifyListeners('playlistLoaded', songs)
  }

  setShuffle(enabled) {
    this.isShuffle = enabled
    this.notifyListeners('shuffleChange', enabled)
  }

  toggleShuffle() {
    this.setShuffle(!this.isShuffle)
  }

  setRepeatMode(mode) {
    this.repeatMode = mode
    this.notifyListeners('repeatChange', mode)
  }

  toggleRepeat() {
    const modes = ['none', 'all', 'one']
    const currentIndex = modes.indexOf(this.repeatMode)
    const nextIndex = (currentIndex + 1) % modes.length
    this.setRepeatMode(modes[nextIndex])
  }

  getCurrentTime() {
    return this.audio.currentTime
  }

  getDuration() {
    return this.audio.duration
  }

  getProgress() {
    if (!this.audio.duration) {
      return 0
    }
    return (this.audio.currentTime / this.audio.duration) * 100
  }

  onTimeUpdate() {
    this.notifyListeners('timeUpdate', {
      currentTime: this.audio.currentTime,
      duration: this.audio.duration,
      progress: this.getProgress(),
    })
  }

  onEnded() {
    this.playDuration += (Date.now() - this.playStartTime) / 1000
    this.notifyListeners('songEnded', {
      song: this.currentSong,
      duration: this.playDuration,
    })

    switch (this.repeatMode) {
      case 'one':
        this.audio.currentTime = 0
        this.play()
        break
      case 'all':
        this.next()
        break
      case 'none':
        if (this.currentIndex < this.playlist.length - 1) {
          this.next()
        } else {
          this.pause()
        }
        break
    }
  }

  onLoadedMetadata() {
    this.notifyListeners('metadataLoaded', {
      duration: this.audio.duration,
    })
  }

  onError(error) {
    console.error('音频错误:', error)
    this.notifyListeners('error', error)
    this.handleAudioError(error)
  }

  handleAudioError(error) {
    const errorMessages = {
      1: '音频加载被用户中止',
      2: '网络错误，无法加载音频',
      3: '音频解码失败',
      4: '不支持的音频格式'
    }

    let errorMessage = '音频播放出错'
    
    if (this.audio.error) {
      const code = this.audio.error.code
      errorMessage = errorMessages[code] || `音频错误 (代码: ${code})`
    }

    console.error('音频播放错误:', errorMessage, error)
    
    this.notifyListeners('audioError', {
      message: errorMessage,
      error: error,
      song: this.currentSong
    })

    if (this.repeatMode === 'one') {
      setTimeout(() => {
        this.next()
      }, 1500)
    } else if (this.currentIndex < this.playlist.length - 1) {
      setTimeout(() => {
        this.next()
      }, 1500)
    }
  }

  onPlay() {
    this.isPlaying = true
    this.notifyListeners('playStateChange', true)
  }

  onPause() {
    this.isPlaying = false
    this.notifyListeners('playStateChange', false)
  }

  addListener(callback) {
    this.listeners.push(callback)
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('监听器错误:', error)
      }
    })
  }

  destroy() {
    this.pause()
    this.listeners = []
    this.audio.removeEventListener('timeupdate', () => this.onTimeUpdate())
    this.audio.removeEventListener('ended', () => this.onEnded())
    this.audio.removeEventListener('loadedmetadata', () => this.onLoadedMetadata())
    this.audio.removeEventListener('error', (e) => this.onError(e))
    this.audio.removeEventListener('play', () => this.onPlay())
    this.audio.removeEventListener('pause', () => this.onPause())
  }
}

class PlayerUI {
  constructor(player, dataSystem) {
    this.player = player
    this.dataSystem = dataSystem
    this.elements = {}
    this.initElements()
    this.bindEvents()
    this.setupPlayerListeners()
  }

  initElements() {
    this.elements = {
      cover: document.getElementById('playerCover'),
      title: document.getElementById('playerTitle'),
      artist: document.getElementById('playerArtist'),
      currentTime: document.getElementById('currentTime'),
      duration: document.getElementById('duration'),
      progressFill: document.getElementById('progressFill'),
      progressSlider: document.getElementById('progressSlider'),
      playPauseBtn: document.getElementById('playPauseBtn'),
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      shuffleBtn: document.getElementById('shuffleBtn'),
      repeatBtn: document.getElementById('repeatBtn'),
      volumeBtn: document.getElementById('volumeBtn'),
      volumeSlider: document.getElementById('volumeSlider'),
      addToFavoriteBtn: document.getElementById('addToFavoriteBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
    }
  }

  bindEvents() {
    this.elements.playPauseBtn.addEventListener('click', () => this.player.togglePlay())
    this.elements.prevBtn.addEventListener('click', () => this.player.previous())
    this.elements.nextBtn.addEventListener('click', () => this.player.next())
    this.elements.shuffleBtn.addEventListener('click', () => this.player.toggleShuffle())
    this.elements.repeatBtn.addEventListener('click', () => this.player.toggleRepeat())
    this.elements.volumeBtn.addEventListener('click', () => this.player.toggleMute())
    this.elements.volumeSlider.addEventListener('input', (e) => {
      this.player.setVolume(e.target.value / 100)
    })
    this.elements.progressSlider.addEventListener('input', (e) => {
      this.player.seekToPercent(e.target.value)
    })
    this.elements.addToFavoriteBtn.addEventListener('click', () => this.toggleFavorite())
    this.elements.downloadBtn.addEventListener('click', () => this.downloadSong())
  }

  setupPlayerListeners() {
    this.player.addListener((event, data) => {
      switch (event) {
        case 'play':
          this.updatePlayState(true)
          break
        case 'pause':
          this.updatePlayState(false)
          break
        case 'timeUpdate':
          this.updateProgress(data)
          break
        case 'songLoaded':
          this.updateSongInfo(data)
          break
        case 'shuffleChange':
          this.updateShuffleState(data)
          break
        case 'repeatChange':
          this.updateRepeatState(data)
          break
        case 'volumeChange':
          this.updateVolumeState(data)
          break
        case 'mute':
          this.updateMuteState(true)
          break
        case 'unmute':
          this.updateMuteState(false)
          break
        case 'songEnded':
          this.recordPlayHistory(data)
          break
        case 'audioError':
          this.handleAudioError(data)
          break
      }
    })
  }

  handleAudioError(data) {
    console.error('播放器音频错误:', data)
    
    if (window.musicApp && window.musicApp.showError) {
      const songTitle = data.song ? data.song.title : '未知歌曲'
      window.musicApp.showError(`${data.message} (${songTitle})`)
    }
  }

  updatePlayState(isPlaying) {
    this.elements.playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️'
    this.elements.cover.classList.toggle('playing', isPlaying)
    
    // 更新所有播放按钮
    if (window.musicApp && window.musicApp.updateAllPlayButtons) {
      window.musicApp.updateAllPlayButtons()
    }
  }

  updateProgress(data) {
    const currentTime = formatTime(data.currentTime)
    const duration = formatTime(data.duration)

    this.elements.currentTime.textContent = currentTime
    this.elements.duration.textContent = duration
    this.elements.progressFill.style.width = `${data.progress}%`
    this.elements.progressSlider.value = data.progress
  }

  updateSongInfo(song) {
    this.elements.title.textContent = song.title
    this.elements.artist.textContent = song.artist
    this.elements.cover.src = song.cover || 'assets/images/default-cover.svg'
    this.updateFavoriteButton()
    
    // 更新所有播放按钮
    if (window.musicApp && window.musicApp.updateAllPlayButtons) {
      window.musicApp.updateAllPlayButtons()
    }
  }

  updateShuffleState(isShuffle) {
    this.elements.shuffleBtn.classList.toggle('active', isShuffle)
  }

  updateRepeatState(mode) {
    this.elements.repeatBtn.classList.toggle('active', mode !== 'none')
    const icons = {
      none: '🔁',
      all: '🔁',
      one: '🔂',
    }
    this.elements.repeatBtn.textContent = icons[mode]
  }

  updateVolumeState(volume) {
    this.elements.volumeSlider.value = volume * 100
  }

  updateMuteState(isMuted) {
    this.elements.volumeBtn.textContent = isMuted ? '🔇' : '🔊'
    this.elements.volumeBtn.classList.toggle('volume-mute', isMuted)
  }

  updateFavoriteButton() {
    if (!this.player.currentSong) {
      return
    }

    const favorites = this.dataSystem.getFavorites()
    const isFavorite = favorites.isFavorite(this.player.currentSong.id)

    this.elements.addToFavoriteBtn.classList.toggle('active', isFavorite)
    this.elements.addToFavoriteBtn.textContent = isFavorite ? '❤️' : '🤍'
  }

  toggleFavorite() {
    if (!this.player.currentSong) {
      return
    }

    const favorites = this.dataSystem.getFavorites()
    const result = favorites.toggleFavorite(this.player.currentSong)

    if (result.success) {
      this.updateFavoriteButton()
    }
  }

  showAddToPlaylistModal() {
    if (!this.player.currentSong) {
      return
    }

    const playlists = this.dataSystem.getPlaylists()
    const playlistList = playlists.getPlaylists()

    let modalContent = '<h3>添加到播放列表</h3>'

    if (playlistList.length === 0) {
      modalContent += '<p>暂无播放列表，请先创建播放列表</p>'
    } else {
      modalContent += '<div class="playlist-selection">'
      playlistList.forEach((playlist) => {
        modalContent += `
          <button class="playlist-option" data-id="${playlist.id}">
            ${playlist.name} (${playlist.songs.length} 首歌曲)
          </button>
        `
      })
      modalContent += '</div>'
    }

    modalContent += `
      <div class="modal-actions">
        <button id="closeModalBtn" class="btn-secondary">关闭</button>
      </div>
    `

    showModal(modalContent)

    document.querySelectorAll('.playlist-option').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const playlistId = e.target.dataset.id
        playlists.addSongToPlaylist(playlistId, this.player.currentSong)
        hideModal()
      })
    })

    document.getElementById('closeModalBtn').addEventListener('click', hideModal)
  }

  downloadSong() {
    if (!this.player.currentSong) {
      return
    }

    const link = document.createElement('a')
    link.href = this.player.currentSong.url
    link.download = `${this.player.currentSong.title}.mp3`
    link.click()
  }

  recordPlayHistory(data) {
    if (!data.song) {
      return
    }

    const history = this.dataSystem.getHistory()
    history.addToHistory(data.song, data.duration)
  }

  playSong(song, playlist = null, index = 0) {
    if (playlist) {
      this.player.setPlaylist(playlist, index)
    }

    this.player.loadSong(song)
    this.player.play()
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) {
    return '0:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function showModal(content) {
  const modal = document.getElementById('modal')
  const modalBody = document.getElementById('modalBody')
  modalBody.innerHTML = content
  modal.classList.add('active')

  document.querySelector('.modal-close').addEventListener('click', hideModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal()
    }
  })
}

function hideModal() {
  const modal = document.getElementById('modal')
  modal.classList.remove('active')
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MusicPlayer,
    PlayerUI,
    formatTime,
    showModal,
    hideModal,
  }
}
