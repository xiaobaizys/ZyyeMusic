const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const SONGS_DIR = path.join(UPLOADS_DIR, 'songs');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac'
};

const FILE_VALIDATION = {
  maxFileSize: {
    audio: 50 * 1024 * 1024,
    image: 5 * 1024 * 1024
  },
  allowedMimeTypes: {
    audio: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'],
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  },
  allowedExtensions: {
    audio: ['mp3', 'wav', 'ogg', 'flac'],
    image: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  },
  magicNumbers: {
    'ffd8ffe0': 'image/jpeg',
    'ffd8ffe1': 'image/jpeg',
    'ffd8ffe2': 'image/jpeg',
    '89504e47': 'image/png',
    '47494638': 'image/gif',
    '52494646': 'image/webp',
    '494433': 'audio/mpeg',
    'fff1': 'audio/mpeg',
    'fff3': 'audio/mpeg',
    'fff4': 'audio/mpeg',
    'fff5': 'audio/mpeg',
    'fff6': 'audio/mpeg',
    'fff7': 'audio/mpeg',
    'fff8': 'audio/mpeg',
    'fff9': 'audio/mpeg',
    'fffa': 'audio/mpeg',
    'fffb': 'audio/mpeg',
    'fffc': 'audio/mpeg',
    'fffd': 'audio/mpeg',
    'fffe': 'audio/mpeg',
    'ffff': 'audio/mpeg',
    '52494646': 'audio/wav',
    '4f676753': 'audio/ogg',
    '664c6143': 'audio/flac'
  }
};

function initDirectories() {
  [DATA_DIR, UPLOADS_DIR, SONGS_DIR, COVERS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    }
  });
}

function getDataFilePath(key) {
  return path.join(DATA_DIR, `${key}.json`);
}

function loadData(key, defaultValue = []) {
  const filePath = getDataFilePath(key);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`加载数据失败 ${key}:`, error);
  }
  return defaultValue;
}

function saveData(key, data) {
  const filePath = getDataFilePath(key);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error(`保存数据失败 ${key}:`, error);
    return { success: false, error: error.message };
  }
}

function validateBase64File(base64Data, type) {
  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) {
    return { success: false, error: '无效的 base64 数据格式' };
  }

  const mimeType = matches[1];
  const allowedMimeTypes = FILE_VALIDATION.allowedMimeTypes[type];
  if (!allowedMimeTypes.includes(mimeType)) {
    return { success: false, error: `不支持的 MIME 类型: ${mimeType}` };
  }

  const buffer = Buffer.from(matches[2], 'base64');
  const maxSize = FILE_VALIDATION.maxFileSize[type];
  if (buffer.length > maxSize) {
    return { success: false, error: `文件大小超出限制，最大允许 ${formatSize(maxSize)}` };
  }

  const magicNumberResult = validateMagicNumber(buffer, type);
  if (!magicNumberResult.success) {
    return magicNumberResult;
  }

  return { success: true, buffer, mimeType };
}

function validateMagicNumber(buffer, type) {
  const hex = buffer.toString('hex', 0, 8);
  let matched = false;

  for (const [magic, expectedType] of Object.entries(FILE_VALIDATION.magicNumbers)) {
    if (hex.startsWith(magic)) {
      matched = true;
      break;
    }
  }

  if (!matched && type === 'audio') {
    for (const [magic, expectedType] of Object.entries(FILE_VALIDATION.magicNumbers)) {
      if (hex.startsWith(magic) && expectedType.startsWith('audio/')) {
        matched = true;
        break;
      }
    }
  }

  if (!matched && type === 'image') {
    for (const [magic, expectedType] of Object.entries(FILE_VALIDATION.magicNumbers)) {
      if (hex.startsWith(magic) && expectedType.startsWith('image/')) {
        matched = true;
        break;
      }
    }
  }

  if (!matched) {
    return { success: false, error: '文件内容与扩展名不匹配，可能是恶意文件' };
  }

  return { success: true };
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFilename(filename) {
  return filename.replace(/[<>:"/\\|?*]/g, '_');
}

function saveBase64File(base64Data, directory, prefix, extension, type) {
  const validation = validateBase64File(base64Data, type);
  if (!validation.success) {
    return validation;
  }

  const buffer = validation.buffer;
  const safeExtension = sanitizeFilename(extension).toLowerCase();
  const allowedExtensions = FILE_VALIDATION.allowedExtensions[type];
  if (!allowedExtensions.includes(safeExtension)) {
    return { success: false, error: `不支持的文件扩展名: ${safeExtension}` };
  }

  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${safeExtension}`;
  const filePath = path.join(directory, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    return { 
      success: true, 
      filename: filename, 
      url: `/uploads/${path.basename(directory)}/${filename}` 
    };
  } catch (error) {
    console.error('保存文件失败:', error);
    return { success: false, error: error.message };
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/save-data') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { key, data } = JSON.parse(body);
        const result = saveData(key, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/load-data/')) {
    const key = req.url.replace('/api/load-data/', '');
    const data = loadData(key);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: data }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/upload-file') {
    let body = '';
    let bodySize = 0;
    const MAX_BODY_SIZE = 60 * 1024 * 1024;

    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        req.destroy();
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '请求体过大' }));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      try {
        const { type, base64Data, extension } = JSON.parse(body);
        let directory, prefix, fileType;
        
        if (type === 'audio') {
          directory = SONGS_DIR;
          prefix = 'song';
          fileType = 'audio';
        } else if (type === 'cover') {
          directory = COVERS_DIR;
          prefix = 'cover';
          fileType = 'image';
        } else {
          throw new Error('无效的文件类型');
        }

        const result = saveBase64File(base64Data, directory, prefix, extension, fileType);
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });

    req.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '请求处理失败' }));
      }
    });
    return;
  }

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  if (filePath.startsWith('./uploads/')) {
    filePath = './' + req.url;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

initDirectories();

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎵 音乐网站服务器已启动！                               ║
║                                                           ║
║   访问地址: http://localhost:${PORT}                      ║
║                                                           ║
║   功能特性:                                               ║
║   ✅ 静态文件服务                                         ║
║   ✅ API 数据保存/加载 (JSON 文件)                       ║
║   ✅ 文件上传存储                                         ║
║                                                           ║
║   数据目录: ${DATA_DIR}                                  ║
║   上传目录: ${UPLOADS_DIR}                               ║
║                                                           ║
║   按 Ctrl+C 停止服务器                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
