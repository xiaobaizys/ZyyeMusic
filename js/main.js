class MusicApp {
  constructor() {
    this.dataSystem = dataPersistenceSystem;
    this.player = null;
    this.playerUI = null;
    this.currentCategory = 'all';
    this.currentSearchQuery = '';
    this.isInitialized = false;
    this.songs = [];
    this.tempAudioFile = null;
    this.tempCoverData = null;
    this.tempLyrics = null;
    this.currentSong = null;
    this.currentLyrics = [];
    this.currentLyricIndex = -1;
    this.currentDetailSong = null;
    
    this.currentCarouselIndex = 0;
    this.carouselAutoPlay = true;
    this.carouselAutoPlayInterval = 5000;
    this.carouselInterval = null;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    
    this.performanceOptimizer = null;
  }

  async initialize() {
    try {
      await this.dataSystem.initialize();
      this.dataSyncManager = new DataSyncManager(this.dataSystem);
      this.dataSystem.setDataSyncManager(this.dataSyncManager);
      
      this.performanceOptimizer = new PerformanceOptimizer(this);
      this.performanceOptimizer.optimizeDOMOperations();
      this.performanceOptimizer.setupEventDelegation();
      
      this.initializeTheme();
      this.setupPlayer();
      this.setupUI();
      this.bindEvents();
      this.loadInitialData();
      this.loadUserSongs();
      this.renderUserSongsFeatured();
      this.isInitialized = true;
      
      if (typeof lazyImageLoader !== 'undefined') {
        lazyImageLoader.observeAll('.lazy-image');
      }
      
      console.log('音乐网站初始化成功');
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('初始化失败，请刷新页面重试');
    }
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('music_website_theme');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggleBtn.textContent = '☀️';
      themeToggleBtn.title = '切换到白天模式';
    } else {
      document.body.classList.remove('dark-mode');
      themeToggleBtn.textContent = '🌙';
      themeToggleBtn.title = '切换到黑夜模式';
    }
  }

  toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    if (isDarkMode) {
      localStorage.setItem('music_website_theme', 'dark');
      themeToggleBtn.textContent = '☀️';
      themeToggleBtn.title = '切换到白天模式';
    } else {
      localStorage.setItem('music_website_theme', 'light');
      themeToggleBtn.textContent = '🌙';
      themeToggleBtn.title = '切换到黑夜模式';
    }
  }

  loadUserSongs() {
    const uploadManager = this.dataSystem.getFileUploadManager();
    const userSongs = uploadManager.getUserSongs();
    // 确保是数组才使用
    if (Array.isArray(userSongs)) {
      this.songs = [...this.songs, ...userSongs];
    }
    this.renderUserSongsList();
  }

  setupPlayer() {
    const audioElement = document.getElementById('audioPlayer');
    this.player = new MusicPlayer(audioElement);
    this.playerUI = new PlayerUI(this.player, this.dataSystem);
  }

  setupUI() {
    this.initCarousel();
    this.renderFeaturedSongs();
    this.renderUserSongsFeatured();
    this.renderSongs();
    this.renderFavorites();
    this.renderPlaylists();
    this.renderHistory();
  }

  bindEvents() {
    this.bindNavigationEvents();
    this.bindSearchEvents();
    this.bindCategoryEvents();
    this.bindPlaylistEvents();
    this.bindFavoriteEvents();
    this.bindHistoryEvents();
    this.bindUploadEvents();
    this.bindThemeEvents();
    this.bindFullscreenPlayerEvents();
    this.bindSongDetailEvents();
    this.bindDataManagementEvents();
    this.bindKeyboardShortcuts();
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          this.player.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            this.player.previous();
          } else {
            const newTime = Math.max(0, this.player.audio.currentTime - 5);
            this.player.seekTo(newTime);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            this.player.next();
          } else {
            const newTime = Math.min(this.player.audio.duration || 0, this.player.audio.currentTime + 5);
            this.player.seekTo(newTime);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.player.setVolume(Math.min(1, this.player.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.player.setVolume(Math.max(0, this.player.volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          this.player.toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreenPlayer();
          break;
        case 'Escape':
          e.preventDefault();
          this.closeFullscreenPlayer();
          break;
      }
    });
  }

  toggleFullscreenPlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    if (fullscreenPlayer.classList.contains('active')) {
      this.closeFullscreenPlayer();
    } else {
      this.openFullscreenPlayer();
    }
  }

  bindThemeEvents() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    themeToggleBtn.addEventListener('click', () => this.toggleTheme());
  }

  bindFullscreenPlayerEvents() {
    const playerCoverClick = document.getElementById('playerCoverClick');
    const closeFullscreenBtn = document.getElementById('closeFullscreenBtn');
    const fullscreenPlayPauseBtn = document.getElementById('fullscreenPlayPauseBtn');
    const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn');
    const fullscreenNextBtn = document.getElementById('fullscreenNextBtn');
    const fullscreenShuffleBtn = document.getElementById('fullscreenShuffleBtn');
    const fullscreenRepeatBtn = document.getElementById('fullscreenRepeatBtn');
    const fullscreenProgressSlider = document.getElementById('fullscreenProgressSlider');
    const fullscreenVolumeBtn = document.getElementById('fullscreenVolumeBtn');
    const fullscreenVolumeSlider = document.getElementById('fullscreenVolumeSlider');
    const volumeSlider = document.getElementById('volumeSlider');
    const lyricsTranslateBtn = document.getElementById('lyricsTranslateBtn');
    const lyricsSizeBtn = document.getElementById('lyricsSizeBtn');

    playerCoverClick.addEventListener('click', () => this.openFullscreenPlayer());
    closeFullscreenBtn.addEventListener('click', () => this.closeFullscreenPlayer());
    fullscreenPlayPauseBtn.addEventListener('click', () => this.player.togglePlay());
    fullscreenPrevBtn.addEventListener('click', () => this.player.previous());
    fullscreenNextBtn.addEventListener('click', () => this.player.next());
    fullscreenShuffleBtn.addEventListener('click', () => this.player.toggleShuffle());
    fullscreenRepeatBtn.addEventListener('click', () => this.player.toggleRepeat());
    fullscreenProgressSlider.addEventListener('input', (e) => this.player.seekToPercent(e.target.value));

    fullscreenVolumeBtn.addEventListener('click', () => {
      const currentVolume = this.player.volume;
      if (currentVolume > 0) {
        this.player.setVolume(0);
        fullscreenVolumeBtn.textContent = '🔇';
      } else {
        this.player.setVolume(fullscreenVolumeSlider.value / 100);
        fullscreenVolumeBtn.textContent = '🔊';
      }
    });

    fullscreenVolumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      this.player.setVolume(volume);
      volumeSlider.value = e.target.value;
      if (volume === 0) {
        fullscreenVolumeBtn.textContent = '🔇';
      } else if (volume < 0.5) {
        fullscreenVolumeBtn.textContent = '🔉';
      } else {
        fullscreenVolumeBtn.textContent = '🔊';
      }
    });

    let currentFontSize = 1;
    const fontSizes = [0.8, 1, 1.2, 1.4, 1.6];
    let fontSizeIndex = 1;

    lyricsTranslateBtn.addEventListener('click', () => {
      this.showInfo('歌词翻译功能开发中');
    });

    lyricsSizeBtn.addEventListener('click', () => {
      fontSizeIndex = (fontSizeIndex + 1) % fontSizes.length;
      const newSize = fontSizes[fontSizeIndex];
      const lyricsContainer = document.getElementById('lyricsContainer');
      lyricsContainer.style.fontSize = `${newSize}em`;
      
      if (newSize === 0.8) {
        lyricsSizeBtn.textContent = 'A-';
      } else if (newSize === 1) {
        lyricsSizeBtn.textContent = 'A';
      } else if (newSize === 1.2) {
        lyricsSizeBtn.textContent = 'A+';
      } else if (newSize === 1.4) {
        lyricsSizeBtn.textContent = 'A++';
      } else {
        lyricsSizeBtn.textContent = 'A+++';
      }
    });
  }

  openFullscreenPlayer() {
    if (!this.player.currentSong) {
      return;
    }

    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    const fullscreenPlayerBg = document.getElementById('fullscreenPlayerBg');
    const fullscreenCover = document.getElementById('fullscreenCover');
    const fullscreenTitle = document.getElementById('fullscreenTitle');
    const fullscreenArtist = document.getElementById('fullscreenArtist');
    const fullscreenVolumeSlider = document.getElementById('fullscreenVolumeSlider');
    const fullscreenVolumeBtn = document.getElementById('fullscreenVolumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    this.currentSong = this.player.currentSong;
    this.loadLyrics(this.currentSong);

    const coverUrl = this.currentSong.cover || 'assets/images/default-cover.svg';
    fullscreenPlayerBg.style.setProperty('--bg-cover-image', `url(${coverUrl})`);
    fullscreenCover.querySelector('img').src = coverUrl;
    fullscreenTitle.textContent = this.currentSong.title;
    fullscreenArtist.textContent = this.currentSong.artist;

    const currentVolume = this.player.volume;
    fullscreenVolumeSlider.value = volumeSlider.value;
    if (currentVolume === 0) {
      fullscreenVolumeBtn.textContent = '🔇';
    } else if (currentVolume < 0.5) {
      fullscreenVolumeBtn.textContent = '🔉';
    } else {
      fullscreenVolumeBtn.textContent = '🔊';
    }

    fullscreenPlayer.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.setupFullscreenPlayerListener();
  }

  closeFullscreenPlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');

    fullscreenPlayer.classList.remove('active');
    document.body.style.overflow = '';

    if (this.fullscreenListener) {
      this.player.removeListener(this.fullscreenListener);
    }
  }

  setupFullscreenPlayerListener() {
    this.fullscreenListener = (event, data) => {
      this.updateFullscreenPlayer(event, data);
    };
    this.player.addListener(this.fullscreenListener);
  }

  updateFullscreenPlayer(event, data) {
    const fullscreenPlayerBg = document.getElementById('fullscreenPlayerBg');
    const fullscreenCurrentTime = document.getElementById('fullscreenCurrentTime');
    const fullscreenDuration = document.getElementById('fullscreenDuration');
    const fullscreenProgressFill = document.getElementById('fullscreenProgressFill');
    const fullscreenProgressSlider = document.getElementById('fullscreenProgressSlider');
    const fullscreenPlayPauseBtn = document.getElementById('fullscreenPlayPauseBtn');
    const fullscreenShuffleBtn = document.getElementById('fullscreenShuffleBtn');
    const fullscreenRepeatBtn = document.getElementById('fullscreenRepeatBtn');
    const fullscreenCover = document.getElementById('fullscreenCover');
    const fullscreenTitle = document.getElementById('fullscreenTitle');
    const fullscreenArtist = document.getElementById('fullscreenArtist');

    switch (event) {
      case 'timeUpdate':
        fullscreenCurrentTime.textContent = formatTime(data.currentTime);
        fullscreenDuration.textContent = formatTime(data.duration);
        fullscreenProgressFill.style.width = `${data.progress}%`;
        fullscreenProgressSlider.value = data.progress;
        this.updateLyricsHighlight(data.currentTime);
        break;
      case 'play':
        fullscreenPlayPauseBtn.textContent = '⏸️';
        break;
      case 'pause':
        fullscreenPlayPauseBtn.textContent = '▶️';
        break;
      case 'songLoaded':
        this.currentSong = data;
        this.loadLyrics(data);
        const coverUrl = data.cover || 'assets/images/default-cover.svg';
        fullscreenPlayerBg.style.setProperty('--bg-cover-image', `url(${coverUrl})`);
        fullscreenCover.querySelector('img').src = coverUrl;
        fullscreenTitle.textContent = data.title;
        fullscreenArtist.textContent = data.artist;
        break;
      case 'shuffleChange':
        fullscreenShuffleBtn.classList.toggle('active', data);
        break;
      case 'repeatChange':
        fullscreenRepeatBtn.classList.toggle('active', data !== 'none');
        const repeatIcons = { 'none': '🔁', 'all': '🔁', 'one': '🔂' };
        fullscreenRepeatBtn.textContent = repeatIcons[data];
        break;
    }
  }

  loadLyrics(song) {
    console.log('MusicApp: loadLyrics 被调用', song);
    const lyricsContainer = document.getElementById('lyricsContainer');
    this.currentLyrics = [];
    this.currentLyricIndex = -1;

    if (!lyricsContainer) {
      console.error('MusicApp: lyricsContainer 元素不存在！');
      return;
    }

    console.log('MusicApp: 歌曲是否有歌词？', !!song.lyrics);
    if (song.lyrics) {
      console.log('MusicApp: 歌词内容预览:', song.lyrics.substring(0, 300));
    }

    if (song.lyrics && song.lyrics.trim().length > 0) {
      const uploadManager = this.dataSystem.getFileUploadManager();
      this.currentLyrics = uploadManager.parseLRC(song.lyrics);
    }

    console.log('MusicApp: 解析后的歌词数量', this.currentLyrics.length);

    if (this.currentLyrics.length === 0) {
      lyricsContainer.innerHTML = '<p class="lyric-line">暂无歌词</p>';
      return;
    }

    lyricsContainer.innerHTML = this.currentLyrics.map((lyric, index) => 
      `<p class="lyric-line" data-index="${index}">${lyric.text}</p>`
    ).join('');
    
    console.log('MusicApp: 歌词已渲染到DOM，行数:', lyricsContainer.querySelectorAll('.lyric-line').length);
  }

  updateLyricsHighlight(currentTime) {
    if (this.currentLyrics.length === 0) return;

    let newIndex = -1;
    for (let i = 0; i < this.currentLyrics.length; i++) {
      if (this.currentLyrics[i].time <= currentTime) {
        newIndex = i;
      } else {
        break;
      }
    }

    if (newIndex !== this.currentLyricIndex) {
      this.currentLyricIndex = newIndex;
      const lyricLines = document.querySelectorAll('.lyric-line');
      lyricLines.forEach((line, index) => {
        line.classList.toggle('active', index === newIndex);
      });

      if (newIndex >= 0) {
        const activeLine = lyricLines[newIndex];
        const lyricsScrollContainer = document.getElementById('fullscreenLyrics');
        if (activeLine && lyricsScrollContainer) {
          const containerHeight = lyricsScrollContainer.clientHeight;
          const lineOffsetTop = activeLine.offsetTop;
          const lineHeight = activeLine.offsetHeight;
          
          const scrollTo = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
          lyricsScrollContainer.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
          });
        }
      }
    }
  }

  bindNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  bindSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    searchBtn.addEventListener('click', () => this.performSearch());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    searchInput.addEventListener('input', (e) => {
      this.currentSearchQuery = e.target.value;
      if (e.target.value === '') {
        this.renderSongs();
      }
    });
  }

  bindCategoryEvents() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.filterByCategory(category);
      });
    });
  }

  bindPlaylistEvents() {
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistModal());
  }

  bindFavoriteEvents() {
    const exportFavoritesBtn = document.getElementById('exportFavoritesBtn');
    exportFavoritesBtn.addEventListener('click', () => this.exportFavorites());
    
    const clearStorageBtn = document.getElementById('clearStorageBtn');
    clearStorageBtn.addEventListener('click', () => this.clearStorage());
  }

  bindHistoryEvents() {
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    clearHistoryBtn.addEventListener('click', () => this.clearHistory());
  }

  navigateTo(page) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });

    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    if (page === 'favorites') {
      this.renderFavorites();
    } else if (page === 'playlists') {
      this.renderPlaylists();
    } else if (page === 'history') {
      this.renderHistory();
    }
  }

  loadInitialData() {
    this.renderFeaturedSongs();
    this.renderSongs();
  }

  renderFeaturedSongs() {
    const featuredList = document.getElementById('featuredList');
    
    const history = this.dataSystem.getHistory();
    const mostPlayedResult = history.getMostPlayedSongs(6);
    
    let featuredSongs = [];
    
    if (mostPlayedResult.success && mostPlayedResult.results.length > 0) {
      const songMap = new Map(this.songs.map(song => [song.id, song]));
      
      featuredSongs = mostPlayedResult.results
        .map(historyItem => {
          const song = songMap.get(historyItem.songId);
          if (song) {
            return { ...song, playCount: historyItem.playCount };
          }
          return null;
        })
        .filter(item => item !== null);
    }
    
    if (featuredSongs.length < 6 && this.songs.length > 0) {
      const remainingCount = 6 - featuredSongs.length;
      const existingIds = new Set(featuredSongs.map(s => s.id));
      const availableSongs = this.songs.filter(s => !existingIds.has(s.id));
      const randomSongs = this.shuffleArray(availableSongs).slice(0, remainingCount);
      featuredSongs = [...featuredSongs, ...randomSongs];
    }
    
    if (featuredSongs.length === 0) {
      featuredList.innerHTML = `
        <div class="empty-state">
          <p>暂无推荐歌曲</p>
        </div>
      `;
      return;
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
    `).join('');

    featuredList.querySelectorAll('.featured-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const songId = e.currentTarget.dataset.id;
        this.openSongDetail(songId);
      });
    });

    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  renderUserSongsFeatured() {
    const featuredList = document.getElementById('userSongsFeaturedList');
    const uploadManager = this.dataSystem.getFileUploadManager();
    const userSongs = uploadManager.getUserSongs();
    
    if (!Array.isArray(userSongs) || userSongs.length === 0) {
      featuredList.innerHTML = `
        <div class="empty-state">
          <p>暂无上传歌曲，去上传一首吧！</p>
        </div>
      `;
      return;
    }
    
    const sortedUserSongs = [...userSongs].sort((a, b) => 
      new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
    
    featuredList.innerHTML = sortedUserSongs.map(song => `
      <div class="user-song-featured-item" data-id="${song.id}">
        <img data-src="${song.cover}" alt="${song.title}" class="lazy-image">
        <div class="featured-info">
          <h3>${song.title}</h3>
          <p>${song.artist}</p>
          <span class="upload-date">上传于 ${new Date(song.uploadedAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');

    featuredList.querySelectorAll('.user-song-featured-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const songId = e.currentTarget.dataset.id;
        this.playSongById(songId);
      });
    });
    
    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  renderSongs() {
    const songsList = document.getElementById('songsList');
    let songs = this.getSongsByCategory(this.currentCategory);

    if (this.currentSearchQuery) {
      songs = this.searchSongs(this.currentSearchQuery);
    }

    if (songs.length === 0) {
      songsList.innerHTML = `
        <div class="empty-state">
          <p>没有找到相关歌曲</p>
        </div>
      `;
      return;
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
    `).join('');

    this.bindSongEvents();
    
    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  bindSongEvents() {
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const songId = e.target.dataset.id;
        this.playSongById(songId);
      });
    });

    document.querySelectorAll('.add-fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const songId = e.target.dataset.id;
        this.addSongToFavorites(songId);
      });
    });
  }

  renderFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const favorites = this.dataSystem.getFavorites().getFavorites();
    const uploadManager = this.dataSystem.getFileUploadManager();
    const userSongs = uploadManager.getUserSongs();
    const songMap = new Map(userSongs.map(song => [song.id, song]));

    if (favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="empty-state">
          <p>暂无收藏歌曲</p>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = favorites.map(fav => {
      const originalSong = songMap.get(fav.songId);
      const coverUrl = originalSong?.cover || fav.cover;
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
      `;
    }).join('');

    this.bindFavoriteItemEvents();
    
    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  bindFavoriteItemEvents() {
    document.querySelectorAll('.play-fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const songId = e.target.dataset.id;
        this.playSongById(songId);
      });
    });

    document.querySelectorAll('.remove-fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const songId = e.target.dataset.id;
        this.removeSongFromFavorites(songId);
      });
    });
  }

  renderPlaylists() {
    const playlistsList = document.getElementById('playlistsList');
    const playlists = this.dataSystem.getPlaylists().getPlaylists();

    if (playlists.length === 0) {
      playlistsList.innerHTML = `
        <div class="empty-state">
          <p>暂无播放列表</p>
        </div>
      `;
      return;
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
    `).join('');

    this.bindPlaylistItemEvents();
    
    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  bindPlaylistItemEvents() {
    document.querySelectorAll('.play-pl-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playlistId = e.target.dataset.id;
        this.playPlaylist(playlistId);
      });
    });

    document.querySelectorAll('.edit-pl-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playlistId = e.target.dataset.id;
        this.showEditPlaylistModal(playlistId);
      });
    });

    document.querySelectorAll('.delete-pl-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playlistId = e.target.dataset.id;
        this.deletePlaylist(playlistId);
      });
    });
  }

  renderHistory() {
    const historyList = document.getElementById('historyList');
    const history = this.dataSystem.getHistory().getRecentHistory(50);

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <p>暂无播放历史</p>
        </div>
      `;
      return;
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
    `).join('');

    this.bindHistoryItemEvents();
    
    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  bindHistoryItemEvents() {
    document.querySelectorAll('.play-hist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const songId = e.target.dataset.id;
        this.playSongById(songId);
      });
    });
  }

  performSearch() {
    const searchInput = document.getElementById('searchInput');
    this.currentSearchQuery = searchInput.value.trim();
    
    if (this.currentSearchQuery) {
      this.navigateTo('home');
      this.renderSongs();
    }
  }

  filterByCategory(category) {
    this.currentCategory = category;
    
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      }
    });

    this.renderSongs();
  }

  getSongsByCategory(category) {
    if (category === 'all') {
      return this.songs;
    }
    return this.songs.filter(song => song.genre === category);
  }

  searchSongs(query) {
    const lowerQuery = query.toLowerCase();
    return this.songs.filter(song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery)
    );
  }

  getSongById(id) {
    return this.songs.find(song => song.id === id);
  }

  getRandomSongs(count = 10) {
    if (this.songs.length === 0) {
      return [];
    }
    const shuffled = [...this.songs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.songs.length));
  }

  playSongById(songId) {
    const song = this.getSongById(songId);
    if (song) {
      this.playerUI.playSong(song);
    }
  }

  playPlaylist(playlistId) {
    const playlists = this.dataSystem.getPlaylists();
    const playlist = playlists.getPlaylist(playlistId);
    
    if (playlist && playlist.songs.length > 0) {
      const songs = playlist.songs.map(s => ({
        id: s.songId,
        title: s.title,
        artist: s.artist,
        album: s.album,
        cover: s.cover,
        duration: s.duration,
        url: this.getSongById(s.songId)?.url || ''
      }));

      this.player.setPlaylist(songs, 0);
      this.player.loadAndPlay();
    }
  }

  addSongToFavorites(songId) {
    const song = this.getSongById(songId);
    if (song) {
      const favorites = this.dataSystem.getFavorites();
      const result = favorites.addFavorite(song);
      
      if (result.success) {
        this.showSuccess('已添加到收藏');
      } else if (result.alreadyExists) {
        this.showInfo('歌曲已在收藏中');
      } else {
        this.showError('添加收藏失败');
      }
    }
  }

  removeSongFromFavorites(songId) {
    const favorites = this.dataSystem.getFavorites();
    const result = favorites.removeFavorite(songId);
    
    if (result.success) {
      this.renderFavorites();
      this.showSuccess('已从收藏中移除');
    } else {
      this.showError('移除失败');
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
    `;

    showModal(modalContent);

    document.getElementById('cancelCreateBtn').addEventListener('click', hideModal);
    document.getElementById('confirmCreateBtn').addEventListener('click', () => {
      const name = document.getElementById('playlistName').value.trim();
      const description = document.getElementById('playlistDesc').value.trim();
      
      if (name) {
        const playlists = this.dataSystem.getPlaylists();
        const result = playlists.createPlaylist(name, description);
        
        if (result.success) {
          hideModal();
          this.renderPlaylists();
          this.showSuccess('播放列表创建成功');
        } else {
          this.showError(result.error || '创建失败');
        }
      } else {
        this.showError('请输入播放列表名称');
      }
    });
  }

  showEditPlaylistModal(playlistId) {
    const playlists = this.dataSystem.getPlaylists();
    const playlist = playlists.getPlaylist(playlistId);
    
    if (!playlist) {
      return;
    }

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
    `;

    showModal(modalContent);

    document.getElementById('cancelEditBtn').addEventListener('click', hideModal);
    document.getElementById('confirmEditBtn').addEventListener('click', () => {
      const name = document.getElementById('editPlaylistName').value.trim();
      const description = document.getElementById('editPlaylistDesc').value.trim();
      
      if (name) {
        const result = playlists.updatePlaylist(playlistId, { name, description });
        
        if (result.success) {
          hideModal();
          this.renderPlaylists();
          this.showSuccess('播放列表更新成功');
        } else {
          this.showError(result.error || '更新失败');
        }
      } else {
        this.showError('请输入播放列表名称');
      }
    });
  }

  deletePlaylist(playlistId) {
    if (confirm('确定要删除这个播放列表吗？')) {
      const playlists = this.dataSystem.getPlaylists();
      const result = playlists.deletePlaylist(playlistId);
      
      if (result.success) {
        this.renderPlaylists();
        this.showSuccess('播放列表已删除');
      } else {
        this.showError('删除失败');
      }
    }
  }

  exportFavorites() {
    const dataManager = this.dataSystem.getDataManager();
    const result = dataManager.downloadExportFile('favorites-backup.json');
    
    if (result.success) {
      this.showSuccess('收藏导出成功');
    } else {
      this.showError('导出失败');
    }
  }

  clearStorage() {
    if (confirm('⚠️ 确定要清理存储吗？\n\n这将清理旧的备份数据和压缩数据，释放 LocalStorage 空间。\n您的歌曲、收藏和播放列表不会被删除。')) {
      try {
        const storage = this.dataSystem.getStorage();
        const prefix = storage.prefix;
        const keys = Object.keys(localStorage);
        
        let removedCount = 0;
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            if (key.includes('_backup_')) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        });
        
        this.showSuccess(`已清理 ${removedCount} 个备份文件！存储空间已释放。`);
      } catch (error) {
        console.error('清理存储失败:', error);
        this.showError('清理存储失败');
      }
    }
  }

  resetAllStorage() {
    if (confirm('⚠️⚠️⚠️ 警告！⚠️⚠️⚠️\n\n确定要重置所有数据吗？\n\n这将删除所有歌曲、收藏、播放列表和历史记录！\n此操作不可恢复！')) {
      if (confirm('再次确认：确定要删除所有数据吗？')) {
        try {
          const storage = this.dataSystem.getStorage();
          const result = storage.clearLocal();
          
          if (result.success) {
            this.songs = [];
            this.loadInitialData();
            this.loadUserSongs();
            this.renderUserSongsFeatured();
            this.renderSongs();
            this.renderFavorites();
            this.renderPlaylists();
            this.renderHistory();
            this.refreshCarousel();
            this.showSuccess('所有数据已重置！');
          } else {
            this.showError('重置失败');
          }
        } catch (error) {
          console.error('重置存储失败:', error);
          this.showError('重置存储失败');
        }
      }
    }
  }

  checkStorageUsage() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      const prefix = this.dataSystem.getStorage().prefix;
      const usageDetails = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          const size = new Blob([value]).size;
          totalSize += size;
          itemCount++;
          
          usageDetails.push({
            key: key.replace(prefix, ''),
            size: this.formatSize(size)
          });
        }
      }
      
      console.log('📊 LocalStorage 使用情况:');
      console.log(`   总大小: ${this.formatSize(totalSize)}`);
      console.log(`   项目数量: ${itemCount}`);
      console.log('   详情:', usageDetails);
      
      return {
        totalSize,
        itemCount,
        usageDetails
      };
    } catch (error) {
      console.error('检查存储使用情况失败:', error);
      return null;
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  clearHistory() {
    if (confirm('确定要清除所有播放历史吗？')) {
      const history = this.dataSystem.getHistory();
      const result = history.clearHistory();
      
      if (result.success) {
        this.renderHistory();
        this.showSuccess('播放历史已清除');
      } else {
        this.showError('清除失败');
      }
    }
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showInfo(message) {
    this.showToast(message, 'info');
  }

  showWarning(message) {
    this.showToast(message, 'warning');
  }

  showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, 4000);
  }

  bindUploadEvents() {
    const uploadArea = document.getElementById('uploadArea');
    const audioFileInput = document.getElementById('audioFileInput');
    const selectAudioBtn = document.getElementById('selectAudioBtn');
    const coverFileInput = document.getElementById('coverFileInput');
    const selectCoverBtn = document.getElementById('selectCoverBtn');
    const lyricsFileInput = document.getElementById('lyricsFileInput');
    const selectLyricsBtn = document.getElementById('selectLyricsBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');

    selectAudioBtn.addEventListener('click', () => audioFileInput.click());
    selectCoverBtn.addEventListener('click', () => coverFileInput.click());
    selectLyricsBtn.addEventListener('click', () => lyricsFileInput.click());

    audioFileInput.addEventListener('change', (e) => this.handleAudioFileSelect(e));
    coverFileInput.addEventListener('change', (e) => this.handleCoverFileSelect(e));
    lyricsFileInput.addEventListener('change', (e) => this.handleLyricsFileSelect(e));

    uploadArea.addEventListener('click', () => audioFileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleAudioFile(files[0]);
      }
    });

    cancelUploadBtn.addEventListener('click', () => this.cancelUpload());
    confirmUploadBtn.addEventListener('click', () => this.confirmUpload());
  }

  handleAudioFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.handleAudioFile(file);
    }
  }

  async handleAudioFile(file) {
    const uploadManager = this.dataSystem.getFileUploadManager();
    
    this.showInfo('正在验证音频文件...');
    const validation = await uploadManager.validateAudioFile(file);
    
    if (!validation.success) {
      this.showError(validation.error);
      return;
    }

    this.tempAudioFile = file;
    
    const uploadArea = document.getElementById('uploadArea');
    const uploadFormSection = document.getElementById('uploadFormSection');
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadArtist = document.getElementById('uploadArtist');
    
    uploadArea.style.display = 'none';
    uploadFormSection.style.display = 'block';
    
    uploadTitle.value = uploadManager.removeExtension(file.name);
    uploadArtist.value = '未知艺术家';
    this.showSuccess('音频文件验证通过！');
  }

  async handleCoverFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      await this.handleCoverFile(file);
    }
  }

  async handleCoverFile(file) {
    const uploadManager = this.dataSystem.getFileUploadManager();
    
    this.showInfo('正在验证图片文件...');
    const validation = await uploadManager.validateImageFile(file);
    
    if (!validation.success) {
      this.showError(validation.error);
      return;
    }

    try {
      const result = await uploadManager.uploadImageFile(file);
      if (result.success) {
        this.tempCoverData = result.dataUrl;
        const coverPreview = document.getElementById('coverPreview');
        coverPreview.innerHTML = `<img src="${result.dataUrl}" alt="封面预览">`;
        this.showSuccess('封面上传成功！');
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError('封面上传失败: ' + error.message);
    }
  }

  async handleLyricsFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      await this.handleLyricsFile(file);
    }
  }

  async handleLyricsFile(file) {
    const uploadManager = this.dataSystem.getFileUploadManager();
    const validation = uploadManager.validateFile(file, 'lyrics');
    
    if (!validation.success) {
      this.showError(validation.error);
      return;
    }

    try {
      const result = await uploadManager.uploadLyricsFile(file);
      if (result.success) {
        this.tempLyrics = result.lyrics;
        const lyricsPreview = document.getElementById('lyricsPreview');
        const previewText = result.lyrics.substring(0, 200) + (result.lyrics.length > 200 ? '...' : '');
        lyricsPreview.innerHTML = `<span class="lyrics-content">${previewText}</span>`;
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError('歌词上传失败');
    }
  }

  cancelUpload() {
    this.tempAudioFile = null;
    this.tempCoverData = null;
    this.tempLyrics = null;
    
    const uploadArea = document.getElementById('uploadArea');
    const uploadFormSection = document.getElementById('uploadFormSection');
    const userSongsSection = document.getElementById('userSongsSection');
    const coverPreview = document.getElementById('coverPreview');
    const lyricsPreview = document.getElementById('lyricsPreview');
    const audioFileInput = document.getElementById('audioFileInput');
    const coverFileInput = document.getElementById('coverFileInput');
    const lyricsFileInput = document.getElementById('lyricsFileInput');
    const uploadProgressContainer = document.getElementById('uploadProgressContainer');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    
    uploadArea.style.display = 'block';
    uploadFormSection.style.display = 'none';
    uploadProgressContainer.style.display = 'none';
    
    coverPreview.innerHTML = '<span class="cover-placeholder">🖼️</span>';
    lyricsPreview.innerHTML = '<span class="lyrics-placeholder">暂无歌词</span>';
    
    audioFileInput.value = '';
    coverFileInput.value = '';
    lyricsFileInput.value = '';
    
    confirmUploadBtn.disabled = false;
    cancelUploadBtn.disabled = false;
  }

  async confirmUpload() {
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadArtist = document.getElementById('uploadArtist');
    const uploadAlbum = document.getElementById('uploadAlbum');
    const uploadGenre = document.getElementById('uploadGenre');
    const uploadProgressContainer = document.getElementById('uploadProgressContainer');
    const uploadProgressFill = document.getElementById('uploadProgressFill');
    const uploadProgressPercent = document.getElementById('uploadProgressPercent');
    const uploadProgressText = document.getElementById('uploadProgressText');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    
    const title = uploadTitle.value.trim();
    const artist = uploadArtist.value.trim();
    
    if (!title || !artist) {
      this.showError('请填写歌曲标题和艺术家');
      return;
    }

    if (!this.tempAudioFile) {
      this.showError('请选择音频文件');
      return;
    }

    console.log('开始上传...', {
      tempAudioFile: this.tempAudioFile,
      tempCoverData: this.tempCoverData,
      tempLyrics: this.tempLyrics
    });

    confirmUploadBtn.disabled = true;
    cancelUploadBtn.disabled = true;
    uploadProgressContainer.style.display = 'block';
    uploadProgressFill.style.width = '0%';
    uploadProgressPercent.textContent = '0%';
    uploadProgressText.textContent = '正在处理音频文件...';

    const uploadManager = this.dataSystem.getFileUploadManager();
    
    try {
      await this.simulateUploadProgress(uploadProgressFill, uploadProgressPercent, uploadProgressText);

      const metadata = {
        title: title,
        artist: artist,
        album: uploadAlbum.value.trim() || '未知专辑',
        genre: uploadGenre.value,
        cover: this.tempCoverData,
        lyrics: this.tempLyrics
      };

      const result = await uploadManager.uploadAudioFile(this.tempAudioFile, metadata);
      
      console.log('上传结果:', result);
      
      if (result.success) {
        uploadProgressFill.style.width = '100%';
        uploadProgressPercent.textContent = '100%';
        uploadProgressText.textContent = '上传完成！';
        
        this.showSuccess('歌曲上传成功！');
        this.songs.push(result.song);
        this.renderUserSongsList();
        this.cancelUpload();
        this.renderSongs();
        this.renderFeaturedSongs();
        this.renderUserSongsFeatured();
        this.refreshCarousel();
        this.navigateTo('home');
      } else {
        this.showError(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传异常:', error);
      this.showError('上传失败: ' + (error.message || '未知错误'));
    } finally {
      confirmUploadBtn.disabled = false;
      cancelUploadBtn.disabled = false;
      uploadProgressContainer.style.display = 'none';
    }
  }

  simulateUploadProgress(progressFill, progressPercent, progressText) {
    return new Promise((resolve) => {
      let progress = 0;
      const stages = [
        { percent: 20, text: '正在读取文件...', delay: 300 },
        { percent: 40, text: '正在处理音频...', delay: 400 },
        { percent: 60, text: '正在保存数据...', delay: 300 },
        { percent: 80, text: '正在完成...', delay: 200 },
        { percent: 95, text: '即将完成...', delay: 150 }
      ];

      let currentStage = 0;

      const updateProgress = () => {
        if (currentStage < stages.length) {
          const stage = stages[currentStage];
          progress = stage.percent;
          progressFill.style.width = `${progress}%`;
          progressPercent.textContent = `${progress}%`;
          progressText.textContent = stage.text;
          currentStage++;
          setTimeout(updateProgress, stage.delay);
        } else {
          resolve();
        }
      };

      updateProgress();
    });
  }

  renderUserSongsList() {
    const userSongsSection = document.getElementById('userSongsSection');
    const userSongsList = document.getElementById('userSongsList');
    const uploadManager = this.dataSystem.getFileUploadManager();
    const userSongs = uploadManager.getUserSongs();
    
    if (userSongs.length === 0) {
      userSongsSection.style.display = 'none';
      return;
    }

    userSongsSection.style.display = 'block';
    
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
    `).join('');

    this.bindUserSongEvents();
    
    if (typeof lazyImageLoader !== 'undefined') {
      lazyImageLoader.observeAll('.lazy-image');
    }
  }

  bindUserSongEvents() {
    document.querySelectorAll('.play-user-song-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = e.currentTarget.dataset.id;
        this.playSongById(songId);
      });
    });

    document.querySelectorAll('.delete-user-song-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = e.currentTarget.dataset.id;
        this.deleteUserSong(songId);
      });
    });

    document.querySelectorAll('.user-song-item').forEach(item => {
      item.addEventListener('click', () => {
        const songId = item.dataset.id;
        this.playSongById(songId);
      });
    });
  }

  deleteUserSong(songId) {
    if (confirm('确定要删除这首歌曲吗？')) {
      const uploadManager = this.dataSystem.getFileUploadManager();
      const result = uploadManager.deleteUserSong(songId);
      
      if (result.success) {
        this.songs = this.songs.filter(s => s.id !== songId);
        this.renderUserSongsList();
        this.renderUserSongsFeatured();
        this.renderSongs();
        this.refreshCarousel();
        this.showSuccess('歌曲已删除');
      } else {
        this.showError(result.error || '删除失败');
      }
    }
  }

  refreshCarousel() {
    this.stopCarouselAutoPlay();
    this.currentCarouselIndex = 0;
    
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const container = document.querySelector('.carousel-container');
    
    track.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    this.renderCarouselSlides();
    
    const slides = track.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    
    if (totalSlides > 0) {
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => this.goToSlide(i));
        dotsContainer.appendChild(dot);
      }
      
      this.updateCarousel();
      this.startCarouselAutoPlay();
    }
  }

  initCarousel() {
    this.renderCarouselSlides();
    
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');
    const container = document.querySelector('.carousel-container');
    const slides = track.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;

    if (totalSlides === 0) return;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => this.goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    prevBtn.addEventListener('click', () => this.prevSlide());
    nextBtn.addEventListener('click', () => this.nextSlide());

    container.addEventListener('mouseenter', () => this.stopCarouselAutoPlay());
    container.addEventListener('mouseleave', () => this.startCarouselAutoPlay());

    this.bindCarouselTouchEvents(container, track);

    this.bindCarouselKeyboardEvents(container);

    this.updateCarousel();
    this.startCarouselAutoPlay();
  }

  bindCarouselTouchEvents(container, track) {
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      isSwiping = true;
      this.stopCarouselAutoPlay();
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      touchEndX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', () => {
      if (!isSwiping) return;
      isSwiping = false;
      
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
      
      this.startCarouselAutoPlay();
    });

    let mouseStartX = 0;
    let isMouseDragging = false;

    container.addEventListener('mousedown', (e) => {
      mouseStartX = e.clientX;
      isMouseDragging = true;
      this.stopCarouselAutoPlay();
      track.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isMouseDragging) return;
    });

    document.addEventListener('mouseup', (e) => {
      if (!isMouseDragging) return;
      isMouseDragging = false;
      track.classList.remove('dragging');
      
      const diff = mouseStartX - e.clientX;
      const swipeThreshold = 50;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
      
      this.startCarouselAutoPlay();
    });
  }

  bindCarouselKeyboardEvents(container) {
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', '轮播图');

    container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextSlide();
          break;
        case 'Home':
          e.preventDefault();
          this.goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          const slides = document.querySelectorAll('.carousel-slide');
          this.goToSlide(slides.length - 1);
          break;
      }
    });
  }

  renderCarouselSlides() {
    const track = document.getElementById('carouselTrack');
    const uploadManager = this.dataSystem.getFileUploadManager();
    let userSongs = uploadManager.getUserSongs();
    
    if (!Array.isArray(userSongs)) {
      userSongs = [];
    }

    const gradients = [
      'var(--carousel-gradient-1)',
      'var(--carousel-gradient-2)', 
      'var(--carousel-gradient-3)',
      'var(--carousel-gradient-4)'
    ];

    if (userSongs.length === 0) {
      const defaultSlides = [
        { emoji: '🎵', title: '享受音乐时光', desc: '让旋律陪伴您的每一天' },
        { emoji: '🎶', title: '分享您的收藏', desc: '上传喜爱的歌曲，珍藏美好回忆' },
        { emoji: '💿', title: '创建专属歌单', desc: '按心情分类，随时切换不同风格' },
        { emoji: '🎧', title: '沉浸式体验', desc: '高品质音频，感受每一个音符' }
      ];

      track.innerHTML = defaultSlides.map((slide, index) => `
        <div class="carousel-slide" style="background: ${gradients[index % gradients.length]}">
          <div class="carousel-content">
            <div class="carousel-emoji">${slide.emoji}</div>
            <h2>${slide.title}</h2>
            <p>${slide.desc}</p>
          </div>
        </div>
      `).join('');
    } else {
      const displaySongs = userSongs.slice(0, 4);
      track.innerHTML = displaySongs.map((song, index) => `
        <div class="carousel-slide" style="background: ${gradients[index % gradients.length]}">
          <div class="carousel-song-content">
            <div class="carousel-song-cover">
              <img src="${song.cover || 'assets/images/default-cover.svg'}" alt="${song.title}">
            </div>
            <div class="carousel-song-info">
              <h2>${song.title}</h2>
              <p>${song.artist}</p>
              ${song.category ? `<span class="song-category">${this.getCategoryName(song.category)}</span>` : ''}
              <button class="carousel-play-btn" data-song-id="${song.id}">▶️</button>
            </div>
          </div>
        </div>
      `).join('');

      track.querySelectorAll('.carousel-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const songId = btn.getAttribute('data-song-id');
          this.playSongById(songId);
        });
      });
    }
  }

  getCategoryName(category) {
    const categoryNames = {
      'pop': '流行',
      'rock': '摇滚',
      'classical': '古典',
      'jazz': '爵士',
      'electronic': '电子'
    };
    return categoryNames[category] || category;
  }

  updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    
    track.style.transform = `translateX(-${this.currentCarouselIndex * 100}%)`;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentCarouselIndex);
    });
  }

  nextSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    this.currentCarouselIndex = (this.currentCarouselIndex + 1) % totalSlides;
    this.updateCarousel();
  }

  prevSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    this.currentCarouselIndex = (this.currentCarouselIndex - 1 + totalSlides) % totalSlides;
    this.updateCarousel();
  }

  goToSlide(index) {
    this.currentCarouselIndex = index;
    this.updateCarousel();
  }

  startCarouselAutoPlay() {
    if (!this.carouselAutoPlay) return;
    
    this.stopCarouselAutoPlay();
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, this.carouselAutoPlayInterval);
  }

  stopCarouselAutoPlay() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  bindSongDetailEvents() {
    const backFromDetailBtn = document.getElementById('backFromDetailBtn');
    const detailPlayBtn = document.getElementById('detailPlayBtn');
    const detailAddToListBtn = document.getElementById('detailAddToListBtn');
    const detailFavoriteBtn = document.getElementById('detailFavoriteBtn');
    const detailShareBtn = document.getElementById('detailShareBtn');
    const downloadSongBtn = document.getElementById('downloadSongBtn');

    backFromDetailBtn.addEventListener('click', () => this.navigateTo('home'));
    detailPlayBtn.addEventListener('click', () => {
      if (this.currentDetailSong) {
        this.playSongById(this.currentDetailSong.id);
      }
    });
    detailFavoriteBtn.addEventListener('click', () => {
      if (this.currentDetailSong) {
        this.addSongToFavorites(this.currentDetailSong.id);
      }
    });
    detailAddToListBtn.addEventListener('click', () => {
      this.showInfo('添加到播放列表功能开发中');
    });
    detailShareBtn.addEventListener('click', () => {
      this.showInfo('分享功能开发中');
    });
    downloadSongBtn.addEventListener('click', () => {
      this.showInfo('下载功能开发中');
    });
  }

  openSongDetail(songId) {
    const song = this.getSongById(songId);
    if (!song) {
      this.showError('歌曲不存在');
      return;
    }

    this.currentDetailSong = song;

    const songDetailCover = document.getElementById('songDetailCover');
    const songDetailTitle = document.getElementById('songDetailTitle');
    const songDetailAlbum = document.getElementById('songDetailAlbum');
    const songDetailReleaseDate = document.getElementById('songDetailReleaseDate');
    const songDetailPlayCount = document.getElementById('songDetailPlayCount');
    const songDetailCreditTitle = document.getElementById('songDetailCreditTitle');
    const songDetailAlbumDesc = document.getElementById('songDetailAlbumDesc');

    songDetailCover.querySelector('img').src = song.cover || 'assets/images/default-cover.svg';
    songDetailTitle.textContent = song.title;
    songDetailCreditTitle.textContent = song.title;
    songDetailAlbum.textContent = song.album || '未知专辑';
    
    const history = this.dataSystem.getHistory();
    const historyItem = history.getHistoryItem(songId);
    const playCount = historyItem?.playCount || 0;
    songDetailPlayCount.textContent = playCount > 0 ? `${playCount}` : '0';

    const uploadedDate = song.uploadedAt ? new Date(song.uploadedAt).toLocaleDateString('zh-CN') : '未知';
    songDetailReleaseDate.textContent = uploadedDate;

    songDetailAlbumDesc.textContent = song.description || '暂无专辑简介';

    this.navigateTo('songDetail');
  }

  renderUserSongsFeatured() {
    const userSongsFeaturedList = document.getElementById('userSongsFeaturedList');
    const uploadManager = this.dataSystem.getFileUploadManager();
    const userSongs = uploadManager.getUserSongs();
    
    if (userSongs.length === 0) {
      userSongsFeaturedList.innerHTML = `
        <div class="empty-state">
          <p>暂无上传歌曲</p>
        </div>
      `;
      return;
    }
    
    userSongsFeaturedList.innerHTML = userSongs.slice(0, 6).map(song => `
      <div class="featured-item" data-id="${song.id}">
        <img src="${song.cover}" alt="${song.title}">
        <div class="featured-info">
          <h3>${song.title}</h3>
          <p>${song.artist}</p>
        </div>
      </div>
    `).join('');

    userSongsFeaturedList.querySelectorAll('.featured-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const songId = e.currentTarget.dataset.id;
        this.openSongDetail(songId);
      });
    });
  }

  bindDataManagementEvents() {
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importDataInput = document.getElementById('importDataInput');

    exportDataBtn.addEventListener('click', () => {
      const result = this.dataSyncManager.exportAllData();
      if (result.success) {
        this.showSuccess(result.message);
      } else {
        this.showError(result.error || '导出失败');
      }
    });

    importDataBtn.addEventListener('click', () => {
      importDataInput.click();
    });

    importDataInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const preview = await this.dataSyncManager.getDataPreview(file);
        if (preview.success) {
          const confirmImport = confirm(
            `确定要导入数据吗？\n\n` +
            `版本: ${preview.version}\n` +
            `导出时间: ${new Date(preview.exportedAt).toLocaleString()}\n\n` +
            `包含数据:\n` +
            `- 用户歌曲: ${preview.userSongs} 首\n` +
            `- 收藏: ${preview.favorites} 首\n` +
            `- 播放列表: ${preview.playlists} 个\n` +
            `- 播放历史: ${preview.history} 条`
          );

          if (confirmImport) {
            const result = await this.dataSyncManager.importData(file);
            if (result.success) {
              this.showSuccess(result.message);
              setTimeout(() => {
                location.reload();
              }, 1000);
            } else {
              this.showError(result.error || '导入失败');
            }
          }
        }
      } catch (error) {
        this.showError('无效的数据文件格式');
      }

      importDataInput.value = '';
    });
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .toast-success {
    background-color: #1db954 !important;
  }

  .toast-error {
    background-color: #e74c3c !important;
  }

  .toast-info {
    background-color: #3498db !important;
  }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
  const app = new MusicApp();
  window.musicApp = app;
  app.initialize();
});