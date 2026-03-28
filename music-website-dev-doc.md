# 音乐网站开发文档

## 1. 项目概述

### 1.1 项目简介
本项目是一个基于HTML、CSS、JavaScript技术的音乐播放网站，提供音乐播放、搜索、收藏、播放列表管理等功能。

### 1.2 项目目标
- 提供流畅的音乐播放体验
- 支持音乐搜索和浏览
- 实现用户收藏和播放列表功能
- 响应式设计，支持多终端访问

## 2. 技术栈

### 2.1 前端技术
- **HTML5**: 页面结构
- **CSS3**: 样式设计，使用Flexbox和Grid布局
- **JavaScript (ES6+)**: 业务逻辑和交互
- **LocalStorage**: 本地数据存储

### 2.2 后端技术（可选扩展）
- **Node.js + Express**: 后端服务
- **RESTful API**: 接口设计
- **JSON**: 数据格式

## 3. 功能需求

### 3.1 核心功能
1. **音乐播放**
   - 播放/暂停控制
   - 上一首/下一首切换
   - 进度条拖动
   - 音量调节
   - 循环模式（单曲/列表/随机）

2. **音乐搜索**
   - 按歌曲名称搜索
   - 按歌手搜索
   - 实时搜索建议

3. **音乐浏览**
   - 热门推荐
   - 分类浏览（流行、摇滚、古典等）
   - 歌手列表
   - 专辑列表

4. **收藏功能**
   - 添加到收藏
   - 查看收藏列表
   - 取消收藏

5. **播放列表**
   - 创建播放列表
   - 添加歌曲到播放列表
   - 管理播放列表
   - 拖拽排序

6. **用户界面**
   - 响应式设计
   - 深色/浅色主题切换
   - 动画效果

## 4. 系统架构

### 4.1 整体架构
```
┌─────────────────────────────────┐
│         前端界面层               │
│  ┌──────────┬──────────┬──────┐ │
│  │  首页    │ 播放器   │ 列表 │ │
│  └──────────┴──────────┴──────┘ │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│       业务逻辑层 (JS)            │
│  ┌──────────┬──────────┬──────┐ │
│  │ 播放控制 │ 数据管理 │ UI   │ │
│  └──────────┴──────────┴──────┘ │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│       数据存储层                │
│  ┌──────────┬──────────┬──────┐ │
│  │LocalStorage│  JSON   │ API  │ │
│  └──────────┴──────────┴──────┘ │
└─────────────────────────────────┘
```

### 4.2 目录结构
```
music-website/
├── index.html              # 主页面
├── css/
│   ├── style.css          # 主样式文件
│   ├── player.css         # 播放器样式
│   └── responsive.css     # 响应式样式
├── js/
│   ├── main.js            # 主入口文件
│   ├── player.js          # 播放器逻辑
│   ├── data.js            # 数据管理
│   ├── search.js          # 搜索功能
│   └── ui.js              # UI交互
├── assets/
│   ├── images/            # 图片资源
│   └── music/             # 音乐文件
└── data/
    └── songs.json         # 歌曲数据
```

## 5. 后端API设计

### 5.1 API接口规范

#### 5.1.1 获取歌曲列表
```
GET /api/songs
Response:
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "歌曲名称",
      "artist": "歌手",
      "album": "专辑",
      "duration": "3:45",
      "cover": "封面URL",
      "url": "音频URL"
    }
  ]
}
```

#### 5.1.2 搜索歌曲
```
GET /api/songs/search?q=关键词
Response:
{
  "code": 200,
  "message": "success",
  "data": [...]
}
```

#### 5.1.3 获取歌手列表
```
GET /api/artists
Response:
{
  "code": 200,
  "message": "success",
  "data": [...]
}
```

#### 5.1.4 获取专辑列表
```
GET /api/albums
Response:
{
  "code": 200,
  "message": "success",
  "data": [...]
}
```

### 5.2 数据模型

#### 5.2.1 歌曲模型
```javascript
{
  id: Number,
  title: String,
  artist: String,
  album: String,
  duration: String,
  cover: String,
  url: String,
  genre: String
}
```

#### 5.2.2 歌手模型
```javascript
{
  id: Number,
  name: String,
  avatar: String,
  bio: String
}
```

#### 5.2.3 专辑模型
```javascript
{
  id: Number,
  title: String,
  artist: String,
  cover: String,
  year: Number
}
```

## 6. 前端界面设计

### 6.1 页面布局

#### 6.1.1 首页
- 顶部导航栏
- 搜索框
- 热门推荐轮播
- 分类标签
- 歌曲列表

#### 6.1.2 播放器页面
- 专辑封面
- 歌曲信息
- 进度条
- 控制按钮
- 音量控制
- 播放模式切换

#### 6.1.3 收藏页面
- 收藏列表
- 批量操作
- 排序功能

#### 6.1.4 播放列表页面
- 播放列表列表
- 创建新列表
- 编辑列表
- 拖拽排序

### 6.2 组件设计

#### 6.2.1 播放器组件
```javascript
class MusicPlayer {
  constructor()
  play()
  pause()
  next()
  previous()
  seek(time)
  setVolume(volume)
  setMode(mode)
}
```

#### 6.2.2 搜索组件
```javascript
class SearchBox {
  constructor()
  search(query)
  showSuggestions()
  selectSuggestion()
}
```

#### 6.2.3 歌曲列表组件
```javascript
class SongList {
  constructor()
  render(songs)
  filter(filter)
  sort(sortBy)
}
```

## 7. 数据库设计

### 7.1 本地存储结构

#### 7.1.1 收藏列表
```javascript
localStorage.setItem('favorites', JSON.stringify([
  { songId: 1, addedAt: '2024-01-01' }
]))
```

#### 7.1.2 播放列表
```javascript
localStorage.setItem('playlists', JSON.stringify([
  {
    id: 1,
    name: '我的歌单',
    songs: [1, 2, 3],
    createdAt: '2024-01-01'
  }
]))
```

#### 7.1.3 播放历史
```javascript
localStorage.setItem('history', JSON.stringify([
  { songId: 1, playedAt: '2024-01-01 10:00:00' }
]))
```

### 7.2 后端数据库（可选）

#### 7.2.1 songs表
```sql
CREATE TABLE songs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  duration INT,
  cover_url VARCHAR(255),
  audio_url VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7.2.2 artists表
```sql
CREATE TABLE artists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7.2.3 albums表
```sql
CREATE TABLE albums (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  artist_id INT,
  cover_url VARCHAR(255),
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);
```

## 8. 开发计划

### 8.1 第一阶段：基础框架
- [ ] 创建项目目录结构
- [ ] 编写HTML基础页面
- [ ] 实现CSS基础样式
- [ ] 搭建JavaScript基础架构

### 8.2 第二阶段：播放器功能
- [ ] 实现音频播放控制
- [ ] 开发进度条功能
- [ ] 实现音量控制
- [ ] 添加播放模式切换

### 8.3 第三阶段：数据管理
- [ ] 创建歌曲数据结构
- [ ] 实现数据加载和渲染
- [ ] 开发搜索功能
- [ ] 实现分类浏览

### 8.4 第四阶段：高级功能
- [ ] 实现收藏功能
- [ ] 开发播放列表管理
- [ ] 添加播放历史
- [ ] 实现主题切换

### 8.5 第五阶段：优化完善
- [ ] 性能优化
- [ ] 响应式适配
- [ ] 动画效果优化
- [ ] 错误处理完善

### 8.6 第六阶段：后端集成（可选）
- [ ] 搭建Node.js服务器
- [ ] 实现RESTful API
- [ ] 数据库集成
- [ ] 前后端联调

## 9. 部署方案

### 9.1 前端部署
- 使用GitHub Pages
- 或使用Netlify
- 或使用Vercel

### 9.2 后端部署（可选）
- 使用Heroku
- 或使用阿里云/腾讯云
- 或使用Docker容器化部署

## 10. 技术要点

### 10.1 音频播放
- 使用HTML5 Audio API
- 支持多种音频格式（MP3、WAV、OGG）
- 实现预加载和缓冲机制

### 10.2 性能优化
- 图片懒加载
- 数据分页加载
- 使用虚拟滚动
- 缓存策略

### 10.3 用户体验
- 流畅的动画过渡
- 友好的错误提示
- 键盘快捷键支持
- 无障碍访问支持

## 11. 测试计划

### 11.1 功能测试
- 播放器功能测试
- 搜索功能测试
- 收藏功能测试
- 播放列表功能测试

### 11.2 兼容性测试
- 浏览器兼容性测试
- 设备兼容性测试
- 响应式布局测试

### 11.3 性能测试
- 加载速度测试
- 播放流畅度测试
- 内存使用测试

## 12. 项目时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 第一阶段 | 基础框架搭建 | 2-3天 |
| 第二阶段 | 播放器功能开发 | 3-4天 |
| 第三阶段 | 数据管理开发 | 2-3天 |
| 第四阶段 | 高级功能开发 | 3-4天 |
| 第五阶段 | 优化完善 | 2-3天 |
| 第六阶段 | 后端集成（可选） | 5-7天 |

**总计**: 约17-24天（不含后端）

## 13. 注意事项

1. **版权问题**: 确保使用的音乐文件有合法授权
2. **性能考虑**: 大量歌曲时需要考虑分页和懒加载
3. **兼容性**: 注意不同浏览器的音频格式支持
4. **用户体验**: 确保操作流畅，反馈及时
5. **数据安全**: 用户数据需要妥善存储和保护

## 14. 扩展功能

### 14.1 短期扩展
- 歌词显示
- 评论功能
- 分享功能
- 下载功能

### 14.2 长期扩展
- 用户注册登录
- 社交功能
- 个性化推荐
- 在线直播
- 音乐创作工具

## 15. 参考资料

- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [HTML5 Audio Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)
- [JavaScript ES6+ Features](https://es6-features.org/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Flexbox Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)

---

**文档版本**: v1.0
**创建日期**: 2026-03-26
**最后更新**: 2026-03-26
