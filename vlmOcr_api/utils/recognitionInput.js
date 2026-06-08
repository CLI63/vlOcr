const path = require('path');
const config = require('../config/appConfig');
const DatabaseService = require('../services/databaseService');
const {
  assertAllowedImageUrl,
  getUploadPathByStoredFilename,
  isUnsafeLocalInput,
} = require('./fileSecurity');

function buildFileUrl(req, fileId) {
  const baseUrl = config.publicFileBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/upload/files/${fileId}`;
}

function getUploadFileIdFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const match = parsed.pathname.match(/^\/api\/upload\/files\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function resolveUploadedFileById(fileId, actor) {
  const file = await DatabaseService.getUploadedFileById(fileId, actor);
  if (!file) {
    throw new Error('上传文件不存在或无权访问');
  }

  return {
    file,
    localFilePath: getUploadPathByStoredFilename(file.stored_filename),
  };
}

async function resolveRecognitionInput(req) {
  const body = req.body || {};
  const fileId = body.fileId || body.file_id || null;
  const rawImageUrl = body.imageUrl || body.imgUrl || '';

  if (fileId) {
    const uploaded = await resolveUploadedFileById(fileId, req.user);
    return {
      input: uploaded.localFilePath,
      localFilePath: uploaded.localFilePath,
      fileId: uploaded.file.id,
      imageUrl: buildFileUrl(req, uploaded.file.id),
      originalName: uploaded.file.original_name,
      mimeType: uploaded.file.mime_type,
      sha256: uploaded.file.sha256,
      allowLocalFile: true,
    };
  }

  if (!rawImageUrl) {
    throw new Error('请上传图片或文件地址');
  }

  if (isUnsafeLocalInput(rawImageUrl)) {
    throw new Error('不允许访问服务器本地文件路径');
  }

  const uploadFileId = getUploadFileIdFromUrl(rawImageUrl);
  if (uploadFileId) {
    const uploaded = await resolveUploadedFileById(uploadFileId, req.user);
    return {
      input: uploaded.localFilePath,
      localFilePath: uploaded.localFilePath,
      fileId: uploaded.file.id,
      imageUrl: buildFileUrl(req, uploaded.file.id),
      originalName: uploaded.file.original_name,
      mimeType: uploaded.file.mime_type,
      sha256: uploaded.file.sha256,
      allowLocalFile: true,
    };
  }

  if (!rawImageUrl.startsWith('https://')) {
    throw new Error('仅允许HTTPS图片URL或本系统上传文件');
  }

  await assertAllowedImageUrl(rawImageUrl);
  return {
    input: rawImageUrl,
    localFilePath: null,
    fileId: null,
    imageUrl: rawImageUrl,
    originalName: path.basename(new URL(rawImageUrl).pathname),
    mimeType: '',
    sha256: '',
    allowLocalFile: false,
  };
}

module.exports = {
  buildFileUrl,
  resolveRecognitionInput,
};
