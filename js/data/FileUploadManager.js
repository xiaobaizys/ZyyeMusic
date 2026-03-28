class FileUploadManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.storage.compressionEnabled = false;
    this.storage.backupEnabled = false;
    this.maxFileSize = {
      audio: 50 * 1024 * 1024,
      image: 5 * 1024 * 1024,
      lyrics: 1 * 1024 * 1024
    };
    this.acceptedTypes = {
      audio: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'],
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      lyrics: ['text/plain', 'text/lrc', '.lrc', '.txt']
    };
    this.acceptedExtensions = {
      audio: ['mp3', 'wav', 'ogg', 'flac'],
      image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      lyrics: ['lrc', 'txt']
    };
    this.storageKeys = {
      USER_SONGS: 'user_songs',
      UPLOADED_FILES: 'uploaded_files'
    };
  }

  validateFile(file, type) {
    if (!file) {
      return { success: false, error: '请选择文件' };
    }

    if (!(file instanceof File)) {
      return { success: false, error: '无效的文件对象' };
    }

    if (file.size === 0) {
      return { success: false, error: '文件为空' };
    }

    const maxSize = this.maxFileSize[type];
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: `文件太大，最大允许 ${this.formatSize(maxSize)}` 
      };
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const acceptedExtensions = this.acceptedExtensions[type];
    if (!acceptedExtensions.includes(fileExtension)) {
      return { 
        success: false, 
        error: `不支持的文件扩展名，请上传 ${acceptedExtensions.join(', ')}` 
      };
    }

    const acceptedTypes = this.acceptedTypes[type];
    const isValidType = acceptedTypes.some(t => 
      file.type.includes(t) || t.includes('.' + fileExtension)
    );

    if (!isValidType) {
      return { 
        success: false, 
        error: `不支持的文件 MIME 类型` 
      };
    }

    const fileName = file.name;
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      return { 
        success: false, 
        error: '文件名包含非法字符' 
      };
    }

    return { success: true };
  }

  async validateImageFile(file) {
    const validation = this.validateFile(file, 'image');
    if (!validation.success) {
      return validation;
    }

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width === 0 || img.height === 0) {
          resolve({ success: false, error: '无效的图片文件' });
        } else {
          resolve({ success: true });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ success: false, error: '图片文件损坏或格式不正确' });
      };
      
      img.src = objectUrl;
    });
  }

  async validateAudioFile(file) {
    const validation = this.validateFile(file, 'audio');
    if (!validation.success) {
      return validation;
    }

    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        if (audio.duration === 0 || isNaN(audio.duration)) {
          resolve({ success: false, error: '无效的音频文件' });
        } else {
          resolve({ success: true, duration: audio.duration });
        }
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ success: false, error: '音频文件损坏或格式不正确' });
      };
      
      audio.src = objectUrl;
    });
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  async uploadAudioFile(file, metadata = {}) {
    console.log('FileUploadManager: 开始上传音频文件', file);
    const validation = this.validateFile(file, 'audio');
    if (!validation.success) {
      console.log('FileUploadManager: 文件验证失败', validation);
      return validation;
    }

    try {
      console.log('FileUploadManager: 开始读取文件...');
      const dataUrl = await this.readFileAsDataURL(file);
      console.log('FileUploadManager: 文件读取完成，大小:', dataUrl.length, '字符');
      
      const songId = 'song_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const extension = this.getFileExtension(file.name);
      
      let songUrl = dataUrl;
      
      if (this.storage.uploadFileToServer) {
        console.log('FileUploadManager: 尝试上传到服务器...');
        const serverResult = await this.storage.uploadFileToServer('audio', dataUrl, extension);
        if (serverResult.success) {
          console.log('FileUploadManager: 服务器上传成功', serverResult.url);
          songUrl = serverResult.url;
        } else {
          console.log('FileUploadManager: 服务器上传失败，使用 DataURL');
        }
      }
      
      const song = {
        id: songId,
        title: metadata.title || this.removeExtension(file.name),
        artist: metadata.artist || '未知艺术家',
        album: metadata.album || '未知专辑',
        genre: metadata.genre || 'pop',
        duration: 0,
        cover: metadata.cover || 'assets/images/default-cover.svg',
        url: songUrl,
        lyrics: metadata.lyrics || '',
        uploadedAt: Date.now(),
        isUserUploaded: true,
        fileName: file.name,
        fileSize: file.size
      };

      console.log('FileUploadManager: 开始保存歌曲...');
      const result = this.saveSong(song);
      console.log('FileUploadManager: 保存结果:', result);
      
      if (result.success) {
        return { success: true, song: song, fileId: songId };
      }
      return result;
    } catch (error) {
      console.error('FileUploadManager: 上传异常', error);
      return { success: false, error: error.message };
    }
  }

  async uploadImageFile(file) {
    const validation = this.validateFile(file, 'image');
    if (!validation.success) {
      return validation;
    }

    try {
      const dataUrl = await this.readFileAsDataURL(file);
      const extension = this.getFileExtension(file.name);
      
      let resultUrl = dataUrl;
      
      if (this.storage.uploadFileToServer) {
        const serverResult = await this.storage.uploadFileToServer('cover', dataUrl, extension);
        if (serverResult.success) {
          resultUrl = serverResult.url;
        }
      }
      
      const fileId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      return { 
        success: true, 
        dataUrl: resultUrl, 
        fileId: fileId,
        fileName: file.name
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async uploadLyricsFile(file) {
    const validation = this.validateFile(file, 'lyrics');
    if (!validation.success) {
      return validation;
    }

    try {
      const text = await this.readFileAsText(file);
      const fileId = 'lrc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      return { 
        success: true, 
        lyrics: text, 
        fileId: fileId,
        fileName: file.name
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  saveSong(song) {
    try {
      console.log('FileUploadManager: 获取现有歌曲列表...');
      const songs = this.getUserSongs();
      console.log('FileUploadManager: 现有歌曲数量:', songs.length);
      
      songs.push(song);
      console.log('FileUploadManager: 保存到Storage...');
      
      const result = this.storage.set(this.storageKeys.USER_SONGS, songs);
      console.log('FileUploadManager: Storage保存结果:', result);
      
      if (result.success) {
        return { success: true, song: song };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('FileUploadManager: 保存歌曲异常', error);
      return { success: false, error: error.message };
    }
  }

  getUserSongs() {
    const songs = this.storage.get(this.storageKeys.USER_SONGS, []);
    return Array.isArray(songs) ? songs : [];
  }

  saveUserSong(song) {
    try {
      const songs = this.getUserSongs();
      const existingIndex = songs.findIndex(s => s.id === song.id);
      
      if (existingIndex !== -1) {
        songs[existingIndex] = song;
      } else {
        songs.push(song);
      }
      
      this.storage.set(this.storageKeys.USER_SONGS, songs);
      return { success: true, song: song };
    } catch (error) {
      console.error('保存用户歌曲失败:', error);
      return { success: false, error: error.message };
    }
  }

  deleteUserSong(songId) {
    try {
      const songs = this.getUserSongs();
      const filteredSongs = songs.filter(s => s.id !== songId);
      this.storage.set(this.storageKeys.USER_SONGS, filteredSongs);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateSong(songId, updates) {
    try {
      const songs = this.getUserSongs();
      const index = songs.findIndex(s => s.id === songId);
      if (index === -1) {
        return { success: false, error: '歌曲不存在' };
      }
      songs[index] = { ...songs[index], ...updates };
      this.storage.set(this.storageKeys.USER_SONGS, songs);
      return { success: true, song: songs[index] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  removeExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  parseLRC(lrcText) {
    console.log('FileUploadManager: 开始解析歌词', lrcText.substring(0, 200));
    
    if (!lrcText || typeof lrcText !== 'string') {
      console.log('FileUploadManager: 歌词文本无效');
      return [];
    }
    
    const lines = lrcText.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

    lines.forEach((line, lineIndex) => {
      const matches = [...line.matchAll(timeRegex)];
      const text = line.replace(timeRegex, '').trim();

      if (text && matches.length > 0) {
        matches.forEach(match => {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = match[3] ? parseInt(match[3]) : 0;
          
          let msValue;
          if (match[3]) {
            if (match[3].length === 3) {
              msValue = milliseconds / 1000;
            } else if (match[3].length === 2) {
              msValue = milliseconds / 100;
            } else {
              msValue = 0;
            }
          } else {
            msValue = 0;
          }
          
          const time = minutes * 60 + seconds + msValue;
          
          console.log('FileUploadManager: 解析时间标签', match[0], '=', time, '秒');
          lyrics.push({ time: time, text: text });
        });
      }
    });

    const sortedLyrics = lyrics.sort((a, b) => a.time - b.time);
    console.log('FileUploadManager: 歌词解析完成，共', sortedLyrics.length, '句');
    sortedLyrics.forEach((lyric, index) => {
      console.log(`  [${index}] ${lyric.time.toFixed(2)}s - ${lyric.text}`);
    });
    return sortedLyrics;
  }
}
