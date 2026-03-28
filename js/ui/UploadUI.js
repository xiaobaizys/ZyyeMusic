class UploadUI {
  constructor(dataSystem, toastManager) {
    this.dataSystem = dataSystem
    this.toastManager = toastManager
    this.tempAudioFile = null
    this.tempCoverData = null
    this.tempLyrics = null
  }

  bindEvents(handlers) {
    const uploadArea = document.getElementById('uploadArea')
    const audioFileInput = document.getElementById('audioFileInput')
    const selectAudioBtn = document.getElementById('selectAudioBtn')
    const coverFileInput = document.getElementById('coverFileInput')
    const selectCoverBtn = document.getElementById('selectCoverBtn')
    const lyricsFileInput = document.getElementById('lyricsFileInput')
    const selectLyricsBtn = document.getElementById('selectLyricsBtn')
    const cancelUploadBtn = document.getElementById('cancelUploadBtn')
    const confirmUploadBtn = document.getElementById('confirmUploadBtn')

    selectAudioBtn?.addEventListener('click', () => audioFileInput?.click())
    selectCoverBtn?.addEventListener('click', () => coverFileInput?.click())
    selectLyricsBtn?.addEventListener('click', () => lyricsFileInput?.click())

    audioFileInput?.addEventListener('change', (e) => handlers.handleAudioFileSelect?.(e))
    coverFileInput?.addEventListener('change', (e) => handlers.handleCoverFileSelect?.(e))
    lyricsFileInput?.addEventListener('change', (e) => handlers.handleLyricsFileSelect?.(e))

    uploadArea?.addEventListener('click', () => audioFileInput?.click())
    uploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e))
    uploadArea?.addEventListener('dragleave', () => this.handleDragLeave(uploadArea))
    uploadArea?.addEventListener('drop', (e) => handlers.handleDrop?.(e))

    cancelUploadBtn?.addEventListener('click', () => handlers.cancelUpload?.())
    confirmUploadBtn?.addEventListener('click', () => handlers.confirmUpload?.())
  }

  handleDragOver(e) {
    e.preventDefault()
    e.currentTarget?.classList.add('dragover')
  }

  handleDragLeave(element) {
    element?.classList.remove('dragover')
  }

  showForm() {
    const uploadArea = document.getElementById('uploadArea')
    const uploadFormSection = document.getElementById('uploadFormSection')
    uploadArea.style.display = 'none'
    uploadFormSection.style.display = 'block'
  }

  resetForm() {
    this.tempAudioFile = null
    this.tempCoverData = null
    this.tempLyrics = null

    const uploadArea = document.getElementById('uploadArea')
    const uploadFormSection = document.getElementById('uploadFormSection')
    const coverPreview = document.getElementById('coverPreview')
    const lyricsPreview = document.getElementById('lyricsPreview')
    const audioFileInput = document.getElementById('audioFileInput')
    const coverFileInput = document.getElementById('coverFileInput')
    const lyricsFileInput = document.getElementById('lyricsFileInput')
    const uploadProgressContainer = document.getElementById('uploadProgressContainer')
    const confirmUploadBtn = document.getElementById('confirmUploadBtn')
    const cancelUploadBtn = document.getElementById('cancelUploadBtn')

    if (uploadArea) uploadArea.style.display = 'block'
    if (uploadFormSection) uploadFormSection.style.display = 'none'
    if (uploadProgressContainer) uploadProgressContainer.style.display = 'none'
    if (coverPreview) coverPreview.innerHTML = '<span class="cover-placeholder">🖼️</span>'
    if (lyricsPreview) lyricsPreview.innerHTML = '<span class="lyrics-placeholder">暂无歌词</span>'
    if (audioFileInput) audioFileInput.value = ''
    if (coverFileInput) coverFileInput.value = ''
    if (lyricsFileInput) lyricsFileInput.value = ''
    if (confirmUploadBtn) confirmUploadBtn.disabled = false
    if (cancelUploadBtn) cancelUploadBtn.disabled = false
  }

  setCoverPreview(dataUrl) {
    const coverPreview = document.getElementById('coverPreview')
    if (coverPreview) {
      coverPreview.innerHTML = `<img src="${dataUrl}" alt="封面预览">`
    }
  }

  setLyricsPreview(lyrics) {
    const lyricsPreview = document.getElementById('lyricsPreview')
    if (lyricsPreview) {
      const previewText = lyrics.substring(0, 200) + (lyrics.length > 200 ? '...' : '')
      lyricsPreview.innerHTML = `<span class="lyrics-content">${previewText}</span>`
    }
  }

  setTitle(title) {
    const uploadTitle = document.getElementById('uploadTitle')
    if (uploadTitle) uploadTitle.value = title
  }

  setArtist(artist) {
    const uploadArtist = document.getElementById('uploadArtist')
    if (uploadArtist) uploadArtist.value = artist
  }

  getFormData() {
    return {
      title: document.getElementById('uploadTitle')?.value?.trim() || '',
      artist: document.getElementById('uploadArtist')?.value?.trim() || '',
      album: document.getElementById('uploadAlbum')?.value?.trim() || '未知专辑',
      genre: document.getElementById('uploadGenre')?.value || ''
    }
  }

  showProgress() {
    const uploadProgressContainer = document.getElementById('uploadProgressContainer')
    const confirmUploadBtn = document.getElementById('confirmUploadBtn')
    const cancelUploadBtn = document.getElementById('cancelUploadBtn')
    
    if (uploadProgressContainer) uploadProgressContainer.style.display = 'block'
    if (confirmUploadBtn) confirmUploadBtn.disabled = true
    if (cancelUploadBtn) cancelUploadBtn.disabled = true
  }

  updateProgress(percent, text) {
    const progressFill = document.getElementById('uploadProgressFill')
    const progressPercent = document.getElementById('uploadProgressPercent')
    const progressText = document.getElementById('uploadProgressText')
    
    if (progressFill) progressFill.style.width = `${percent}%`
    if (progressPercent) progressPercent.textContent = `${percent}%`
    if (progressText) progressText.textContent = text
  }

  hideProgress() {
    const uploadProgressContainer = document.getElementById('uploadProgressContainer')
    const confirmUploadBtn = document.getElementById('confirmUploadBtn')
    const cancelUploadBtn = document.getElementById('cancelUploadBtn')
    
    if (uploadProgressContainer) uploadProgressContainer.style.display = 'none'
    if (confirmUploadBtn) confirmUploadBtn.disabled = false
    if (cancelUploadBtn) cancelUploadBtn.disabled = false
  }

  simulateUploadProgress() {
    return new Promise((resolve) => {
      let progress = 0
      const stages = [
        { percent: 20, text: '正在读取文件...', delay: 300 },
        { percent: 40, text: '正在处理音频...', delay: 400 },
        { percent: 60, text: '正在保存数据...', delay: 300 },
        { percent: 80, text: '正在完成...', delay: 200 },
        { percent: 95, text: '即将完成...', delay: 150 }
      ]

      let currentStage = 0

      const update = () => {
        if (currentStage < stages.length) {
          const stage = stages[currentStage]
          this.updateProgress(stage.percent, stage.text)
          currentStage++
          setTimeout(update, stage.delay)
        } else {
          resolve()
        }
      }

      update()
    })
  }
}
