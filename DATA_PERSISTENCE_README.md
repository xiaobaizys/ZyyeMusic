# 音乐网站数据持久化系统使用指南

## 概述

本数据持久化系统为音乐网站提供完整的数据存储、管理和同步功能，支持收藏、播放列表、播放历史等核心数据的本地持久化存储。

## 核心功能

### 1. 存储管理 (StorageManager)
- LocalStorage 封装和优化
- 数据压缩和备份
- 存储空间管理
- 错误处理和恢复

### 2. 收藏管理 (FavoritesManager)
- 添加/删除收藏
- 收藏列表管理
- 收藏统计和搜索
- 收藏导入导出

### 3. 播放列表管理 (PlaylistManager)
- 创建/删除播放列表
- 添加/移除歌曲
- 播放列表排序
- 当前播放状态管理

### 4. 播放历史管理 (HistoryManager)
- 记录播放历史
- 播放统计分析
- 收听趋势分析
- 历史数据清理

### 5. 数据同步 (DataSyncManager)
- 自动数据同步
- 远程数据推送
- 数据合并策略
- 同步状态监控

### 6. 错误处理 (ErrorHandler)
- 错误日志记录
- 错误统计分析
- 错误追踪和调试
- 错误报告导出

## 快速开始

### 1. 引入文件

```html
<script src="js/storage/StorageManager.js"></script>
<script src="js/storage/FavoritesManager.js"></script>
<script src="js/storage/PlaylistManager.js"></script>
<script src="js/storage/HistoryManager.js"></script>
<script src="js/data/DataManager.js"></script>
<script src="js/data/DataPersistenceSystem.js"></script>
```

### 2. 初始化系统

```javascript
async function init() {
  const result = await dataPersistenceSystem.initialize();
  if (result.success) {
    console.log('系统初始化成功');
  }
}

init();
```

### 3. 基本使用

```javascript
const favorites = dataPersistenceSystem.getFavorites();
const playlists = dataPersistenceSystem.getPlaylists();
const history = dataPersistenceSystem.getHistory();

const song = {
  id: '1',
  title: '歌曲名称',
  artist: '歌手',
  album: '专辑',
  cover: '封面URL',
  duration: 180
};

favorites.addFavorite(song);
playlists.createPlaylist('我的歌单');
history.addToHistory(song, 120);
```

## 详细使用说明

### 收藏功能

#### 添加收藏
```javascript
const favorites = dataPersistenceSystem.getFavorites();
const song = {
  id: '1',
  title: '夜曲',
  artist: '周杰伦',
  album: '十一月的萧邦',
  cover: 'cover.jpg',
  duration: 225
};

favorites.addFavorite(song);
```

#### 检查是否收藏
```javascript
const isFav = favorites.isFavorite('1');
console.log(isFav); // true 或 false
```

#### 获取收藏列表
```javascript
const favList = favorites.getFavorites();
favList.forEach(fav => {
  console.log(fav.title, '-', fav.artist);
});
```

#### 搜索收藏
```javascript
const results = favorites.searchFavorites('周杰伦');
console.log(results.results);
```

#### 排序收藏
```javascript
favorites.sortFavorites('playCount', 'desc'); // 按播放次数降序
favorites.sortFavorites('addedAt', 'asc');    // 按添加时间升序
```

#### 删除收藏
```javascript
favorites.removeFavorite('1');
```

#### 切换收藏状态
```javascript
favorites.toggleFavorite(song); // 如果已收藏则删除，未收藏则添加
```

### 播放列表功能

#### 创建播放列表
```javascript
const playlists = dataPersistenceSystem.getPlaylists();
const result = playlists.createPlaylist('我的歌单', '这是我的歌单', 'cover.jpg');
if (result.success) {
  console.log('创建成功，ID:', result.playlist.id);
}
```

#### 添加歌曲到播放列表
```javascript
const song = { /* 歌曲对象 */ };
playlists.addSongToPlaylist(playlistId, song);
```

#### 获取播放列表
```javascript
const allPlaylists = playlists.getPlaylists();
const specificPlaylist = playlists.getPlaylist(playlistId);
```

#### 设置当前播放列表
```javascript
playlists.setCurrentPlaylist(playlistId);
```

#### 获取当前歌曲
```javascript
const currentSong = playlists.getCurrentSong();
const nextSong = playlists.getNextSong();
const prevSong = playlists.getPreviousSong();
```

#### 删除播放列表
```javascript
playlists.deletePlaylist(playlistId);
```

#### 搜索播放列表
```javascript
const results = playlists.searchPlaylists('流行');
```

### 播放历史功能

#### 添加播放记录
```javascript
const history = dataPersistenceSystem.getHistory();
const song = { /* 歌曲对象 */ };
history.addToHistory(song, 120); // 播放时长120秒
```

#### 获取最近播放
```javascript
const recent = history.getRecentHistory(10);
```

#### 获取最常播放
```javascript
const mostPlayed = history.getMostPlayedSongs(10);
```

#### 获取收听统计
```javascript
const stats = history.getListeningStatistics();
console.log('总播放次数:', stats.statistics.totalPlays);
console.log('总收听时间:', stats.statistics.totalPlayTime);
console.log('最常播放歌曲:', stats.statistics.mostPlayedSong);
```

#### 获取收听趋势
```javascript
const trends = history.getListeningTrends(7); // 最近7天
trends.trends.forEach(trend => {
  console.log(trend.date, trend.plays, '次播放');
});
```

#### 清理旧历史
```javascript
history.clearOldHistory(30); // 清理30天前的历史
```

### 数据导入导出

#### 导出所有数据
```javascript
const dataManager = dataPersistenceSystem.getDataManager();
const result = dataManager.downloadExportFile('backup.json');
```

#### 选择性导出
```javascript
const result = dataManager.downloadSelectiveExportFile({
  includeFavorites: true,
  includePlaylists: true,
  includeHistory: false,
  includeSettings: false,
  includePreferences: false
}, 'partial-backup.json');
```

#### 导入数据
```javascript
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const result = await dataManager.importFromFile(file, {
    merge: true,        // 合并模式
    clearExisting: false // 不清除现有数据
  });
  
  if (result.success) {
    console.log('导入成功，共导入:', result.totalImported, '项');
  }
});

fileInput.click();
```

### 数据同步

#### 启动自动同步
```javascript
const syncManager = dataPersistenceSystem.getSyncManager();
syncManager.startAutoSync(); // 默认5分钟同步一次
```

#### 设置同步URL
```javascript
syncManager.setSyncUrl('https://api.example.com/sync');
```

#### 手动同步
```javascript
const result = await syncManager.performSync();
```

#### 推送数据到远程
```javascript
const result = await syncManager.pushToRemote();
```

### 错误处理

#### 记录错误
```javascript
const errorHandler = dataPersistenceSystem.getErrorHandler();

try {
} catch (error) {
  errorHandler.logError(error, {
    type: 'player',
    action: 'play_song',
    songId: '1'
  });
}
```

#### 获取错误日志
```javascript
const allErrors = errorHandler.getErrorLog();
const recentErrors = errorHandler.getRecentErrors(10);
const errorStats = errorHandler.getErrorStatistics();
```

#### 导出错误日志
```javascript
const result = errorHandler.exportErrorLog();
if (result.success) {
  console.log(result.data);
}
```

## 高级功能

### 事件监听

所有管理器都支持事件监听：

```javascript
const favorites = dataPersistenceSystem.getFavorites();

favorites.addListener((event, data) => {
  console.log('事件:', event, '数据:', data);
});

// 事件类型: 'loaded', 'saved', 'added', 'removed', 'updated', 'sorted', 'cleared'
```

### 数据统计

```javascript
const favStats = favorites.getStatistics();
const plStats = playlists.getStatistics();
const histStats = history.getListeningStatistics();

console.log('收藏统计:', favStats.statistics);
console.log('播放列表统计:', plStats.statistics);
console.log('收听统计:', histStats.statistics);
```

### 存储管理

```javascript
const storage = dataPersistenceSystem.getStorage();

const storageInfo = storage.getStorageInfo();
console.log('总大小:', storageInfo.totalSizeFormatted);
console.log('键数量:', storageInfo.keyCount);

storageInfo.keys.forEach(key => {
  console.log(key.key, ':', key.sizeFormatted);
});
```

## 最佳实践

### 1. 错误处理
```javascript
try {
  const result = favorites.addFavorite(song);
  if (!result.success) {
    console.error('添加收藏失败:', result.error);
    if (result.alreadyExists) {
      console.log('歌曲已在收藏中');
    }
  }
} catch (error) {
  console.error('操作异常:', error);
}
```

### 2. 数据验证
```javascript
function validateSong(song) {
  return song && 
         song.id && 
         song.title && 
         song.artist && 
         song.duration;
}

if (validateSong(song)) {
  favorites.addFavorite(song);
}
```

### 3. 性能优化
```javascript
history.setMaxHistorySize(50); // 限制历史记录数量
storage.compressionEnabled = true; // 启用数据压缩
storage.backupEnabled = true; // 启用自动备份
```

### 4. 数据清理
```javascript
history.clearOldHistory(30); // 定期清理旧数据
errorHandler.clearErrorLog(); // 定期清理错误日志
```

## API 参考

### StorageManager

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `set(key, value, options)` | 存储数据 | `{ success, key, error }` |
| `get(key, defaultValue)` | 获取数据 | 数据值或默认值 |
| `remove(key)` | 删除数据 | `{ success, error }` |
| `clear()` | 清空所有数据 | `{ success, error }` |
| `getStorageInfo()` | 获取存储信息 | `{ totalSize, keys, ... }` |

### FavoritesManager

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `addFavorite(song)` | 添加收藏 | `{ success, favorite, error }` |
| `removeFavorite(songId)` | 删除收藏 | `{ success, removed, error }` |
| `isFavorite(songId)` | 检查是否收藏 | boolean |
| `getFavorites()` | 获取收藏列表 | 数组 |
| `searchFavorites(query)` | 搜索收藏 | `{ success, results }` |
| `sortFavorites(sortBy, order)` | 排序收藏 | `{ success, sorted, error }` |

### PlaylistManager

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `createPlaylist(name, description, cover)` | 创建播放列表 | `{ success, playlist, error }` |
| `deletePlaylist(playlistId)` | 删除播放列表 | `{ success, deleted, error }` |
| `addSongToPlaylist(playlistId, song)` | 添加歌曲 | `{ success, playlist, song, error }` |
| `setCurrentPlaylist(playlistId)` | 设置当前播放列表 | `{ success, playlist, error }` |
| `getCurrentSong()` | 获取当前歌曲 | 歌曲对象或null |

### HistoryManager

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `addToHistory(song, playDuration)` | 添加播放记录 | `{ success, item, error }` |
| `getRecentHistory(count)` | 获取最近播放 | 数组 |
| `getMostPlayedSongs(count)` | 获取最常播放 | `{ success, results }` |
| `getListeningStatistics()` | 获取收听统计 | `{ success, statistics }` |
| `getListeningTrends(days)` | 获取收听趋势 | `{ success, trends }` |

## 浏览器兼容性

- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge 12+
- Opera 10.5+

## 注意事项

1. **存储限制**: LocalStorage 有大小限制（通常5-10MB）
2. **数据安全**: 敏感数据建议加密存储
3. **性能考虑**: 大量数据时考虑分页或懒加载
4. **错误处理**: 所有操作都应该进行错误处理
5. **数据备份**: 定期备份重要数据

## 示例代码

完整的使用示例请参考 `js/data/UsageExamples.js` 文件。

## 技术支持

如有问题或建议，请查看错误日志或联系开发团队。

---

**版本**: 2.0  
**更新日期**: 2026-03-26