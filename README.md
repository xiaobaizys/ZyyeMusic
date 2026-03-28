# 音乐网站项目说明

## 项目结构

```
music-website/
├── index.html              # 主页面
├── css/
│   ├── style.css          # 主样式文件
│   ├── player.css         # 播放器样式
│   └── responsive.css     # 响应式样式
├── js/
│   ├── storage/           # 数据持久化模块
│   │   ├── StorageManager.js
│   │   ├── FavoritesManager.js
│   │   ├── PlaylistManager.js
│   │   └── HistoryManager.js
│   ├── data/              # 数据管理模块
│   │   ├── DataManager.js
│   │   ├── DataPersistenceSystem.js
│   │   ├── UsageExamples.js
│   │   └── sampleData.js
│   ├── player.js          # 播放器逻辑
│   └── main.js            # 主入口文件
├── assets/
│   ├── images/            # 图片资源
│   │   └── default-cover.jpg  # 默认封面（需要添加）
│   └── music/             # 音乐文件
│       └── song1.mp3...      # 音乐文件（需要添加）
└── README.md             # 项目说明
```

## 功能特性

### 核心功能
- ✅ 音乐播放器（播放/暂停、上一首/下一首、进度控制、音量调节）
- ✅ 播放模式（单曲循环、列表循环、随机播放）
- ✅ 音乐搜索（按歌名、歌手、专辑搜索）
- ✅ 分类浏览（全部、流行、摇滚、古典、爵士、电子）
- ✅ 收藏功能（添加/删除、收藏列表、收藏导出）
- ✅ 播放列表管理（创建/编辑/删除、添加歌曲、播放列表）
- ✅ 播放历史（记录播放、历史查询、统计分析）

### 数据持久化
- ✅ LocalStorage 存储
- ✅ 数据压缩和备份
- ✅ 数据导入导出
- ✅ 自动数据同步
- ✅ 错误处理和恢复

### 界面特性
- ✅ 响应式设计（支持桌面、平板、手机）
- ✅ 深色主题
- ✅ 流畅动画
- ✅ 模态对话框
- ✅ 消息提示

## 使用说明

### 1. 准备资源

在 `assets/images/` 目录下添加默认封面图片：
- 文件名：`default-cover.jpg`
- 建议尺寸：300x300 像素

在 `assets/music/` 目录下添加音乐文件：
- 文件名：`song1.mp3`, `song2.mp3`, ..., `song20.mp3`
- 格式：MP3（推荐）或 WAV、OGG

### 2. 修改示例数据

编辑 `js/data/sampleData.js` 文件，修改歌曲数据：
- 更新 `url` 字段为实际的音乐文件路径
- 更新 `cover` 字段为实际的封面图片路径
- 添加或删除歌曲

### 3. 运行项目

直接在浏览器中打开 `index.html` 文件即可。

### 4. 部署项目

可以部署到：
- GitHub Pages
- Netlify
- Vercel
- 或任何静态网站托管服务

## 浏览器兼容性

- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge 12+
- Opera 10.5+

## 技术栈

- **HTML5**: 页面结构
- **CSS3**: 样式设计（Flexbox、Grid）
- **JavaScript (ES6+)**: 业务逻辑
- **LocalStorage**: 本地数据存储
- **HTML5 Audio API**: 音频播放

## 开发文档

详细的技术文档请参考：
- [音乐网站开发文档](music-website-dev-doc.md)
- [数据持久化系统使用指南](DATA_PERSISTENCE_README.md)

## 注意事项

1. **音乐文件**: 确保音乐文件格式正确，建议使用 MP3 格式
2. **图片资源**: 封面图片建议使用正方形，大小适中
3. **浏览器兼容性**: 不同浏览器对音频格式支持不同
4. **存储限制**: LocalStorage 有大小限制（通常5-10MB）
5. **版权问题**: 确保使用的音乐文件有合法授权

## 扩展功能

可以进一步扩展的功能：
- 用户注册登录
- 社交功能
- 在线直播
- 个性化推荐
- 歌词显示
- 评论功能
- 分享功能
- 下载功能

## 技术支持

如有问题或建议，请查看：
- 浏览器控制台（F12）
- 错误日志（通过数据持久化系统）
- 开发文档

---

**版本**: 1.0  
**创建日期**: 2026-03-26  
**最后更新**: 2026-03-26