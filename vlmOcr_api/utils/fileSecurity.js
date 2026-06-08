const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns').promises;
const net = require('net');
const axios = require('axios');
const stream = require('stream');
const util = require('util');
const crypto = require('crypto');
const config = require('../config/appConfig');

const pipeline = util.promisify(stream.pipeline);
const uploadDir = path.join(__dirname, '..', 'uploads');

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

function getUploadLimitBytes() {
  return config.maxUploadMb * 1024 * 1024;
}

function isAllowedFile(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return allowedExtensions.has(ext) && allowedMimeTypes.has(file.mimetype);
}

function sanitizeExtension(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return '';
  }
  return ext;
}

function createSafeFilename(originalName) {
  const ext = sanitizeExtension(originalName);
  if (!ext) {
    throw new Error('不支持的文件类型');
  }
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function isPrivateIp(ip) {
  if (!ip || net.isIP(ip) === 0) return true;

  if (net.isIP(ip) === 4) {
    const parts = ip.split('.').map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      parts[0] === 0
    );
  }

  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
}

async function assertAllowedImageUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('无效的图片URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('仅允许HTTPS图片URL');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('不允许访问本机地址');
  }

  const allowedHosts = config.allowedImageHosts;
  if (!allowedHosts.includes(hostname)) {
    throw new Error('图片URL域名不在白名单内');
  }

  const addresses = await dns.lookup(hostname, { all: true });
  if (addresses.some((address) => isPrivateIp(address.address))) {
    throw new Error('不允许访问内网或保留IP地址');
  }

  return parsed;
}

async function downloadAllowedUrl(rawUrl) {
  const parsed = await assertAllowedImageUrl(rawUrl);
  const response = await axios({
    method: 'get',
    url: parsed.toString(),
    responseType: 'stream',
    timeout: 15000,
    maxRedirects: 0,
    maxContentLength: getUploadLimitBytes(),
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const contentType = (response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType && !allowedMimeTypes.has(contentType)) {
    throw new Error('远程文件类型不受支持');
  }

  const urlExt = sanitizeExtension(parsed.pathname);
  const extByMime = contentType === 'application/pdf' ? '.pdf' : '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${urlExt || extByMime}`;
  const tempDir = path.join(os.tmpdir(), 'vlm-ocr-downloads');
  fs.mkdirSync(tempDir, { recursive: true });
  const localFilePath = path.join(tempDir, filename);

  let downloaded = 0;
  response.data.on('data', (chunk) => {
    downloaded += chunk.length;
    if (downloaded > getUploadLimitBytes()) {
      response.data.destroy(new Error('远程文件超过大小限制'));
    }
  });

  await pipeline(response.data, fs.createWriteStream(localFilePath));
  return localFilePath;
}

function getLocalUploadPath(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const match = parsed.pathname.match(/^\/api\/upload\/files\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const filename = decodeURIComponent(match[1]);
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('非法文件名');
  }

  const ext = path.extname(filename).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    throw new Error('不支持的文件类型');
  }

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('上传文件不存在');
  }
  return filePath;
}

function isUnsafeLocalInput(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  if (input.startsWith('http')) {
    return false;
  }

  return (
    path.isAbsolute(input) ||
    input.includes('..') ||
    input.includes('/') ||
    input.includes('\\') ||
    /^[a-zA-Z]:/.test(input)
  );
}

function validateStoredFilename(filename) {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('非法文件名');
  }

  const ext = path.extname(filename).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    throw new Error('不支持的文件类型');
  }

  return filename;
}

function getUploadPathByStoredFilename(storedFilename) {
  const filename = validateStoredFilename(storedFilename);
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('上传文件不存在');
  }
  return filePath;
}

module.exports = {
  allowedExtensions,
  allowedMimeTypes,
  uploadDir,
  getUploadLimitBytes,
  isAllowedFile,
  createSafeFilename,
  assertAllowedImageUrl,
  downloadAllowedUrl,
  getLocalUploadPath,
  getUploadPathByStoredFilename,
  isUnsafeLocalInput,
  validateStoredFilename,
};
