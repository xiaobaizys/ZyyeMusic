const dataSystem = dataPersistenceSystem;

async function initializeDataSystem() {
  const result = await dataSystem.initialize();
  if (result.success) {
    console.log('数据持久化系统初始化成功');
  } else {
    console.error('初始化失败:', result.error);
  }
}

function exampleUsage() {
  const favorites = dataSystem.getFavorites();
  const playlists = dataSystem.getPlaylists();
  const history = dataSystem.getHistory();
  const dataManager = dataSystem.getDataManager();

  const sampleSong = {
    id: '1',
    title: '示例歌曲',
    artist: '示例歌手',
    album: '示例专辑',
    cover: 'https://example.com/cover.jpg',
    duration: 180
  };

  favorites.addFavorite(sampleSong);

  const isFavorite = favorites.isFavorite('1');
  console.log('是否收藏:', isFavorite);

  favorites.getFavorites().forEach(fav => {
    console.log('收藏歌曲:', fav.title, '-', fav.artist);
  });

  const playlistResult = playlists.createPlaylist('我的歌单', '这是我的第一个歌单');
  if (playlistResult.success) {
    const playlistId = playlistResult.playlist.id;
    playlists.addSongToPlaylist(playlistId, sampleSong);
  }

  history.addToHistory(sampleSong, 120);

  const recentHistory = history.getRecentHistory(10);
  console.log('最近播放:', recentHistory);

  const statistics = history.getListeningStatistics();
  console.log('收听统计:', statistics.statistics);

  const exportResult = dataManager.downloadExportFile('my-music-backup.json');
  if (exportResult.success) {
    console.log('数据导出成功:', exportResult.filename);
  }
}

function advancedUsage() {
  const favorites = dataSystem.getFavorites();
  const playlists = dataSystem.getPlaylists();
  const history = dataSystem.getHistory();
  const syncManager = dataSystem.getSyncManager();
  const errorHandler = dataSystem.getErrorHandler();

  favorites.addListener((event, data) => {
    console.log('收藏列表变更:', event, data);
  });

  playlists.addListener((event, data) => {
    console.log('播放列表变更:', event, data);
  });

  history.addListener((event, data) => {
    console.log('播放历史变更:', event, data);
  });

  syncManager.startAutoSync();

  syncManager.setSyncUrl('https://api.example.com/sync');

  try {
    throw new Error('测试错误');
  } catch (error) {
    errorHandler.logError(error, { type: 'test', action: 'error_logging' });
  }

  const errorStats = errorHandler.getErrorStatistics();
  console.log('错误统计:', errorStats.statistics);
}

function dataManagementExamples() {
  const dataManager = dataSystem.getDataManager();
  const storage = dataSystem.getStorage();

  const storageInfo = storage.getStorageInfo();
  console.log('存储信息:', storageInfo);

  const summary = dataManager.getDataSummary();
  console.log('数据摘要:', summary.summary);

  const selectiveExport = dataManager.downloadSelectiveExportFile(
    {
      includeFavorites: true,
      includePlaylists: true,
      includeHistory: false,
      includeSettings: false,
      includePreferences: false
    },
    'favorites-playlists-backup.json'
  );

  dataManager.addListener((event, data) => {
    console.log('数据管理事件:', event, data);
  });
}

function searchAndFilterExamples() {
  const favorites = dataSystem.getFavorites();
  const playlists = dataSystem.getPlaylists();
  const history = dataSystem.getHistory();

  const searchResults = favorites.searchFavorites('周杰伦');
  console.log('搜索结果:', searchResults.results);

  favorites.sortFavorites('playCount', 'desc');

  const playlistSearch = playlists.searchPlaylists('流行');
  console.log('播放列表搜索:', playlistSearch.results);

  const historySearch = history.searchHistory('夜曲');
  console.log('历史搜索:', historySearch.results);

  const dateRange = history.getHistoryByDateRange(
    '2026-03-01',
    '2026-03-26'
  );
  console.log('日期范围历史:', dateRange.results);

  const mostPlayed = history.getMostPlayedSongs(10);
  console.log('最常播放:', mostPlayed.results);

  const recentlyPlayed = history.getRecentlyPlayed(20);
  console.log('最近播放:', recentlyPlayed.results);

  const trends = history.getListeningTrends(7);
  console.log('收听趋势:', trends.trends);
}

function statisticsExamples() {
  const favorites = dataSystem.getFavorites();
  const playlists = dataSystem.getPlaylists();
  const history = dataSystem.getHistory();

  const favStats = favorites.getStatistics();
  console.log('收藏统计:', favStats.statistics);

  const plStats = playlists.getStatistics();
  console.log('播放列表统计:', plStats.statistics);

  const listenStats = history.getListeningStatistics();
  console.log('收听统计:', listenStats.statistics);

  const trends = history.getListeningTrends(30);
  console.log('30天收听趋势:', trends.trends);
}

function backupAndRestoreExamples() {
  const dataManager = dataSystem.getDataManager();

  dataManager.createBackup();

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
      const result = await dataManager.importFromFile(file, {
        merge: true,
        clearExisting: false,
        validate: true
      });
      
      if (result.success) {
        console.log('导入成功:', result.totalImported, '项');
      } else {
        console.error('导入失败:', result.error);
      }
    }
  });

  fileInput.click();
}

function cleanupAndMaintenanceExamples() {
  const history = dataSystem.getHistory();
  const storage = dataSystem.getStorage();

  history.clearOldHistory(30);

  history.setMaxHistorySize(50);

  storage.restoreFromBackup('favorites');

  const errorHandler = dataSystem.getErrorHandler();
  errorHandler.clearErrorLog();
}

function integrationExample() {
  initializeDataSystem().then(() => {
    exampleUsage();
    advancedUsage();
    dataManagementExamples();
    searchAndFilterExamples();
    statisticsExamples();
    backupAndRestoreExamples();
    cleanupAndMaintenanceExamples();
  });
}

function uiIntegrationExample() {
  const favorites = dataSystem.getFavorites();
  const playlists = dataSystem.getPlaylists();
  const history = dataSystem.getHistory();

  function renderFavorites() {
    const favList = favorites.getFavorites();
    const container = document.getElementById('favorites-list');
    
    if (container) {
      container.innerHTML = favList.map(fav => `
        <div class="favorite-item" data-id="${fav.songId}">
          <img src="${fav.cover}" alt="${fav.title}">
          <div class="song-info">
            <h3>${fav.title}</h3>
            <p>${fav.artist}</p>
          </div>
          <button class="remove-fav" data-id="${fav.songId}">移除</button>
        </div>
      `).join('');
    }
  }

  function renderPlaylists() {
    const plList = playlists.getPlaylists();
    const container = document.getElementById('playlist-list');
    
    if (container) {
      container.innerHTML = plList.map(pl => `
        <div class="playlist-item" data-id="${pl.id}">
          <div class="playlist-cover">
            <img src="${pl.cover || '/default-cover.jpg'}" alt="${pl.name}">
          </div>
          <div class="playlist-info">
            <h3>${pl.name}</h3>
            <p>${pl.songs.length} 首歌曲</p>
          </div>
        </div>
      `).join('');
    }
  }

  function renderHistory() {
    const histList = history.getRecentHistory(20);
    const container = document.getElementById('history-list');
    
    if (container) {
      container.innerHTML = histList.map(item => `
        <div class="history-item" data-id="${item.songId}">
          <img src="${item.cover}" alt="${item.title}">
          <div class="song-info">
            <h3>${item.title}</h3>
            <p>${item.artist}</p>
            <span class="play-time">${new Date(item.playedAt).toLocaleString()}</span>
          </div>
        </div>
      `).join('');
    }
  }

  favorites.addListener(() => renderFavorites());
  playlists.addListener(() => renderPlaylists());
  history.addListener(() => renderHistory());

  document.addEventListener('DOMContentLoaded', () => {
    initializeDataSystem().then(() => {
      renderFavorites();
      renderPlaylists();
      renderHistory();
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-fav')) {
      const songId = event.target.dataset.id;
      favorites.removeFavorite(songId);
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDataSystem,
    exampleUsage,
    advancedUsage,
    dataManagementExamples,
    searchAndFilterExamples,
    statisticsExamples,
    backupAndRestoreExamples,
    cleanupAndMaintenanceExamples,
    integrationExample,
    uiIntegrationExample
  };
}