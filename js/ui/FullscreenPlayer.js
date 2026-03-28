class FullscreenPlayer {
  constructor(player, dataSystem) {
    this.player = player
    this.dataSystem = dataSystem
    this.currentSong = null
    this.listener = null
  }

  initialize() {
    this.bindEvents()
  }

  bindEvents() {
    const playerCoverClick = document.getElementById('playerCoverClick')
    const closeFullscreenBtn = document.getElementById('closeFullscreenBtn')
    const fullscreenPlayPauseBtn = document.getElementById('fullscreenPlayPauseBtn')
    const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn')
    const fullscreenNextBtn = document.getElementById('fullscreenNextBtn')
    const fullscreenShuffleBtn = document.getElementById('fullscreenShuffleBtn')
    const fullscreenRepeatBtn = document.getElementById('fullscreenRepeatBtn')
    const fullscreenProgressSlider = document.getElementById('fullscreenProgressSlider')
    const fullscreenVolumeBtn = document.getElementById('fullscreenVolumeBtn')
    const fullscreenVolumeSlider = document.getElementById('fullscreenVolumeSlider')
    const lyricsTranslateBtn = document.getElementById('lyricsTranslateBtn')
    const lyricsSizeBtn = document.getElementById('lyricsSizeBtn')

    playerCoverClick?.addEventListener('click', () => this.open())
    closeFullscreenBtn?.addEventListener('click', () => this.close())
    fullscreenPlayPauseBtn?.addEventListener('click', () => this.player.togglePlay())
    fullscreenPrevBtn?.addEventListener('click', () => this.player.previous())
    fullscreenNextBtn?.addEventListener('click', () => this.player.next())
    fullscreenShuffleBtn?.addEventListener('click', () => this.player.toggleShuffle())
    fullscreenRepeatBtn?.addEventListener('click', () => this.player.toggleRepeat())
    fullscreenProgressSlider?.addEventListener('input', (e) => this.player.seekToPercent(e.target.value))
    fullscreenVolumeBtn?.addEventListener('click', () => this.toggleVolume())
    fullscreenVolumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value))
    lyricsTranslateBtn?.addEventListener('click', () => this.showLyricsTranslate())
    lyricsSizeBtn?.addEventListener('click', () => this.toggleLyricsSize())
  }

  open() {
    if (!this.player.currentSong) return

    const fullscreenPlayer = document.getElementById('fullscreenPlayer')
    const fullscreenPlayerBg = document.getElementById('fullscreenPlayerBg')
    const fullscreenCover = document.getElementById('fullscreenCover')
    const fullscreenTitle = document.getElementById('fullscreenTitle')
    const fullscreenArtist = document.getElementById('fullscreenArtist')
    const fullscreenVolumeSlider = document.getElementById('fullscreenVolumeSlider')
    const fullscreenVolumeBtn = document.getElementById('fullscreenVolumeBtn')
    const volumeSlider = document.getElementById('volumeSlider')

    this.currentSong = this.player.currentSong
    this.loadLyrics(this.currentSong)

    const coverUrl = this.currentSong.cover || 'assets/images/default-cover.svg'
    fullscreenPlayerBg?.style.setProperty('--bg-cover-image', `url(${coverUrl})`)
    if (fullscreenCover) fullscreenCover.querySelector('img').src = coverUrl
    if (fullscreenTitle) fullscreenTitle.textContent = this.currentSong.title
    if (fullscreenArtist) fullscreenArtist.textContent = this.currentSong.artist

    const currentVolume = this.player.volume
    if (fullscreenVolumeSlider && volumeSlider) fullscreenVolumeSlider.value = volumeSlider.value
    this.updateVolumeButton(fullscreenVolumeBtn, currentVolume)

    fullscreenPlayer?.classList.add('active')
    document.body.style.overflow = 'hidden'

    this.setupListener()
  }

  close() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer')
    fullscreenPlayer?.classList.remove('active')
    document.body.style.overflow = ''

    if (this.listener) {
      this.player.removeListener(this.listener)
    }
  }

  setupListener() {
    this.listener = (event, data) => this.update(event, data)
    this.player.addListener(this.listener)
  }

  update(event, data) {
    const fullscreenPlayerBg = document.getElementById('fullscreenPlayerBg')
    const fullscreenCurrentTime = document.getElementById('fullscreenCurrentTime')
    const fullscreenDuration = document.getElementById('fullscreenDuration')
    const fullscreenProgressFill = document.getElementById('fullscreenProgressFill')
    const fullscreenProgressSlider = document.getElementById('fullscreenProgressSlider')
    const fullscreenPlayPauseBtn = document.getElementById('fullscreenPlayPauseBtn')
    const fullscreenShuffleBtn = document.getElementById('fullscreenShuffleBtn')
    const fullscreenRepeatBtn = document.getElementById('fullscreenRepeatBtn')
    const fullscreenCover = document.getElementById('fullscreenCover')
    const fullscreenTitle = document.getElementById('fullscreenTitle')
    const fullscreenArtist = document.getElementById('fullscreenArtist')

    switch (event) {
      case 'timeUpdate':
        if (fullscreenCurrentTime) fullscreenCurrentTime.textContent = formatTime(data.currentTime)
        if (fullscreenDuration) fullscreenDuration.textContent = formatTime(data.duration)
        if (fullscreenProgressFill) fullscreenProgressFill.style.width = `${data.progress}%`
        if (fullscreenProgressSlider) fullscreenProgressSlider.value = data.progress
        this.updateLyricsHighlight(data.currentTime)
        break
      case 'play':
        if (fullscreenPlayPauseBtn) fullscreenPlayPauseBtn.textContent = '⏸️'
        break
      case 'pause':
        if (fullscreenPlayPauseBtn) fullscreenPlayPauseBtn.textContent = '▶️'
        break
      case 'songLoaded':
        this.currentSong = data
        this.loadLyrics(data)
        const coverUrl = data.cover || 'assets/images/default-cover.svg'
        fullscreenPlayerBg?.style.setProperty('--bg-cover-image', `url(${coverUrl})`)
        if (fullscreenCover) fullscreenCover.querySelector('img').src = coverUrl
        if (fullscreenTitle) fullscreenTitle.textContent = data.title
        if (fullscreenArtist) fullscreenArtist.textContent = data.artist
        break
      case 'shuffleChange':
        fullscreenShuffleBtn?.classList.toggle('active', data)
        break
      case 'repeatChange':
        fullscreenRepeatBtn?.classList.toggle('active', data !== 'none')
        const repeatIcons = { 'none': '🔁', 'all': '🔁', 'one': '🔂' }
        if (fullscreenRepeatBtn) fullscreenRepeatBtn.textContent = repeatIcons[data]
        break
    }
  }

  toggleVolume() {
    const fullscreenVolumeBtn = document.getElementById('fullscreenVolumeBtn')
    const fullscreenVolumeSlider = document.getElementById('fullscreenVolumeSlider')
    const currentVolume = this.player.volume
    
    if (currentVolume > 0) {
      this.player.setVolume(0)
      if (fullscreenVolumeBtn) fullscreenVolumeBtn.textContent = '🔇'
    } else {
      this.player.setVolume(fullscreenVolumeSlider?.value / 100 || 0.8)
      if (fullscreenVolumeBtn) fullscreenVolumeBtn.textContent = '🔊'
    }
  }

  setVolume(value) {
    const fullscreenVolumeBtn = document.getElementById('fullscreenVolumeBtn')
    const volumeSlider = document.getElementById('volumeSlider')
    const volume = value / 100
    this.player.setVolume(volume)
    if (volumeSlider) volumeSlider.value = value
    this.updateVolumeButton(fullscreenVolumeBtn, volume)
  }

  updateVolumeButton(btn, volume) {
    if (!btn) return
    if (volume === 0) {
      btn.textContent = '🔇'
    } else if (volume < 0.5) {
      btn.textContent = '🔉'
    } else {
      btn.textContent = '🔊'
    }
  }

  showLyricsTranslate() {
    if (this.toastManager) {
      this.toastManager.info('歌词翻译功能开发中')
    }
  }

  toggleLyricsSize() {
    const fontSizes = [0.8, 1, 1.2, 1.4, 1.6]
    let fontSizeIndex = 1
    
    return () => {
      fontSizeIndex = (fontSizeIndex + 1) % fontSizes.length
      const newSize = fontSizes[fontSizeIndex]
      const lyricsContainer = document.getElementById('lyricsContainer')
      if (lyricsContainer) lyricsContainer.style.fontSize = `${newSize}em`
      
      const lyricsSizeBtn = document.getElementById('lyricsSizeBtn')
      if (lyricsSizeBtn) {
        const labels = { 0.8: 'A-', 1: 'A', 1.2: 'A+', 1.4: 'A++', 1.6: 'A+++' }
        lyricsSizeBtn.textContent = labels[newSize]
      }
    }
  }

  loadLyrics(song) {
    const lyricsContainer = document.getElementById('lyricsContainer')
    let lyrics = []

    if (!lyricsContainer) return

    if (song.lyrics && song.lyrics.trim().length > 0) {
      const uploadManager = this.dataSystem.getFileUploadManager()
      lyrics = uploadManager.parseLRC(song.lyrics)
    }

    if (lyrics.length === 0) {
      lyricsContainer.innerHTML = '<p class="lyric-line">暂无歌词</p>'
      return
    }

    lyricsContainer.innerHTML = lyrics.map((lyric, index) => 
      `<p class="lyric-line" data-index="${index}">${lyric.text}</p>`
    ).join('')
    
    this.currentLyrics = lyrics
    this.currentLyricIndex = -1
  }

  updateLyricsHighlight(currentTime) {
    if (!this.currentLyrics || this.currentLyrics.length === 0) return

    let newIndex = -1
    for (let i = 0; i < this.currentLyrics.length; i++) {
      if (this.currentLyrics[i].time <= currentTime) {
        newIndex = i
      } else {
        break
      }
    }

    if (newIndex !== this.currentLyricIndex) {
      this.currentLyricIndex = newIndex
      const lyricLines = document.querySelectorAll('.lyric-line')
      lyricLines.forEach((line, index) => {
        line.classList.toggle('active', index === newIndex)
      })

      if (newIndex >= 0) {
        const activeLine = lyricLines[newIndex]
        const lyricsScrollContainer = document.getElementById('fullscreenLyrics')
        if (activeLine && lyricsScrollContainer) {
          const containerHeight = lyricsScrollContainer.clientHeight
          const lineOffsetTop = activeLine.offsetTop
          const lineHeight = activeLine.offsetHeight
          
          const scrollTo = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2)
          lyricsScrollContainer.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
          })
        }
      }
    }
  }
}
