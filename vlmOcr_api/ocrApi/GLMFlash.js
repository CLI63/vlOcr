const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config/appConfig');
const { downloadAllowedUrl, getLocalUploadPath, isUnsafeLocalInput } = require('../utils/fileSecurity');
const { ensureVisionInput } = require('../utils/visionFile');

const DEFAULT_MODEL = 'GLM-4.6V-Flash';
const GLM_API_HOST = 'open.bigmodel.cn';
const GLM_API_PATH = '/api/paas/v4/chat/completions';
const MIME_TYPE_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function normalizeModelName(modelName) {
  const source = (modelName || DEFAULT_MODEL).trim();
  return source.toLowerCase();
}

function maskUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  if (url.length <= 120) {
    return url;
  }

  return `${url.slice(0, 117)}...`;
}

function getMimeType(filePath) {
  return MIME_TYPE_MAP[path.extname(filePath).toLowerCase()] || 'image/jpeg';
}

async function resolveImageInput(imgUrl, options = {}) {
  if (!imgUrl) {
    throw new Error('缺少图片URL参数');
  }

  if (!imgUrl.startsWith('http')) {
    if (!options.allowLocalFile || isUnsafeLocalInput(imgUrl)) {
      throw new Error('不允许访问服务器本地文件路径');
    }
    return { localFilePath: imgUrl, cleanup: null };
  }

  const localUploadPath = getLocalUploadPath(imgUrl);
  if (localUploadPath) {
    return { localFilePath: localUploadPath, cleanup: null };
  }

  if (imgUrl.includes('localhost') || imgUrl.includes('127.0.0.1')) {
    throw new Error('第三方视觉模型无法直接访问本机localhost图片地址');
  }

  const downloadedFile = await downloadAllowedUrl(imgUrl);
  return {
    localFilePath: downloadedFile,
    cleanup: () => {
      try {
        fs.unlinkSync(downloadedFile);
      } catch (error) {
        console.warn('清理GLM临时下载文件失败:', error.message);
      }
    },
  };
}

async function buildImageContent(imgUrl, options = {}) {
  const { localFilePath, cleanup } = await resolveImageInput(imgUrl, options);
  let visionInput;

  try {
    visionInput = await ensureVisionInput(localFilePath);
    const mimeType = getMimeType(visionInput.imagePath);
    const imageBase64 = fs.readFileSync(visionInput.imagePath, { encoding: 'base64' });
    const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

    return {
      imageUrl: imageDataUrl,
      sourceType: 'base64',
      sourcePath: visionInput.imagePath,
      cleanup: () => {
        if (visionInput?.cleanup) {
          visionInput.cleanup();
        }
        if (cleanup) {
          cleanup();
        }
      },
    };
  } catch (error) {
    if (visionInput?.cleanup) {
      visionInput.cleanup();
    }
    if (cleanup) {
      cleanup();
    }
    throw error;
  }
}

async function callGLMChat(imgUrl, tips, modelName = DEFAULT_MODEL, options = {}) {
  const apiKey = config.apiKeys.glm;
  if (!apiKey) {
    throw new Error('缺少API密钥');
  }

  const imageContent = await buildImageContent(imgUrl, options);

  return new Promise((resolve, reject) => {
    const normalizedModel = normalizeModelName(modelName);
    const prompt = `${tips || '请提取文件中的结构化信息，以JSON格式返回。'}（重点：只返回最终的标准JSON结果，不要回复其他内容！）`;
    const postData = JSON.stringify({
      model: normalizedModel,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageContent.imageUrl } },
          ],
        },
      ],
    });

    console.log('[ThirdParty][GLM] 即将发起请求', {
      host: GLM_API_HOST,
      path: GLM_API_PATH,
      model: normalizedModel,
      imageUrl: maskUrl(imgUrl),
      imageSourceType: imageContent.sourceType,
      imageSourcePath: imageContent.sourcePath,
      promptLength: prompt.length,
      bodyLength: Buffer.byteLength(postData),
    });

    const req = https.request({
      hostname: GLM_API_HOST,
      path: GLM_API_PATH,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('[ThirdParty][GLM] 收到响应', {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          bodyPreview: data ? String(data).slice(0, 800) : '',
        });

        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 400) {
            console.error('[ThirdParty][GLM] 请求失败', {
              statusCode: res.statusCode,
              error: parsedData.error || parsedData,
            });
            return reject(new Error(`API请求失败: ${parsedData.error?.message || '未知错误'}`));
          }
          resolve(parsedData);
        } catch (error) {
          console.error('[ThirdParty][GLM] 响应解析失败', {
            statusCode: res.statusCode,
            parseError: error.message,
            bodyPreview: data ? String(data).slice(0, 800) : '',
          });
          reject(new Error('响应解析失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[ThirdParty][GLM] 网络错误', {
        message: error.message,
      });
      reject(error);
    });
    req.write(postData);
    req.end();
  }).finally(() => {
    if (imageContent.cleanup) {
      imageContent.cleanup();
    }
  });
}

module.exports = {
  DEFAULT_MODEL,
  callGLMChat,
};
