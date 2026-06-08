const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/appConfig');
const { downloadAllowedUrl, getLocalUploadPath, isUnsafeLocalInput } = require('../utils/fileSecurity');

const JOB_URL = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';
const MODEL = 'PaddleOCR-VL-1.6';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_TIMES = 120;

function maskUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  if (url.length <= 120) {
    return url;
  }

  return `${url.slice(0, 117)}...`;
}

function buildPrompt(tips) {
  return `${tips || '请提取文件中的结构化信息，并以标准JSON格式返回。'}（重点：只返回最终的标准JSON结果，不要回复其他内容。）`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseStructuredResult(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const fencedMatch = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : content.trim();

  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
}

async function resolveInputFile(filePathOrUrl, options = {}) {
  if (!filePathOrUrl) {
    throw new Error('缺少图片或文件地址');
  }

  if (!filePathOrUrl.startsWith('http')) {
    if (!options.allowLocalFile || isUnsafeLocalInput(filePathOrUrl)) {
      throw new Error('不允许访问服务器本地文件路径');
    }
    return { localFilePath: filePathOrUrl, cleanup: null };
  }

  const localUploadPath = getLocalUploadPath(filePathOrUrl);
  if (localUploadPath) {
    return { localFilePath: localUploadPath, cleanup: null };
  }

  const downloadedFile = await downloadAllowedUrl(filePathOrUrl);
  return {
    localFilePath: downloadedFile,
    cleanup: () => {
      try {
        fs.unlinkSync(downloadedFile);
      } catch (error) {
        console.warn('清理PaddleOCR-VL临时文件失败:', error.message);
      }
    },
  };
}

function getHeaders() {
  const token = config.apiKeys.paddle;
  if (!token) {
    throw new Error('缺少PADDLE_API_KEY配置');
  }

  return {
    Authorization: `bearer ${token}`,
  };
}

async function submitRemoteJob(fileUrl, optionalPayload, prompt) {
  const payload = {
    fileUrl,
    model: MODEL,
    optionalPayload: {
      ...optionalPayload,
      prompt,
    },
  };

  console.log('[ThirdParty][Paddle] 提交远程任务', {
    url: JOB_URL,
    model: MODEL,
    fileUrl: maskUrl(fileUrl),
    promptLength: prompt.length,
  });

  const response = await axios.post(JOB_URL, payload, {
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });

  console.log('[ThirdParty][Paddle] 远程任务提交响应', {
    status: response.status,
    dataPreview: JSON.stringify(response.data || {}).slice(0, 800),
  });

  return response.data;
}

async function submitLocalJob(localFilePath, optionalPayload, prompt) {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`文件不存在: ${localFilePath}`);
  }

  const form = new FormData();
  form.append('model', MODEL);
  form.append('optionalPayload', JSON.stringify({
    ...optionalPayload,
    prompt,
  }));
  form.append('file', fs.createReadStream(localFilePath), path.basename(localFilePath));

  console.log('[ThirdParty][Paddle] 提交本地任务', {
    url: JOB_URL,
    model: MODEL,
    localFilePath,
    promptLength: prompt.length,
  });

  const response = await axios.post(JOB_URL, form, {
    headers: {
      ...getHeaders(),
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000,
  });

  console.log('[ThirdParty][Paddle] 本地任务提交响应', {
    status: response.status,
    dataPreview: JSON.stringify(response.data || {}).slice(0, 800),
  });

  return response.data;
}

async function pollJobResult(jobId) {
  for (let attempt = 0; attempt < MAX_POLL_TIMES; attempt += 1) {
    const response = await axios.get(`${JOB_URL}/${jobId}`, {
      headers: getHeaders(),
      timeout: 30000,
    });

    const jobData = response.data?.data;
    const state = jobData?.state;

    console.log('[ThirdParty][Paddle] 任务轮询状态', {
      jobId,
      attempt: attempt + 1,
      state,
      progress: jobData?.extractProgress || null,
    });

    if (state === 'done') {
      return jobData;
    }

    if (state === 'failed') {
      throw new Error(jobData?.errorMsg || 'PaddleOCR-VL 任务执行失败');
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('PaddleOCR-VL 任务轮询超时');
}

async function downloadJsonLines(jsonlUrl) {
  console.log('[ThirdParty][Paddle] 下载结果文件', {
    jsonlUrl: maskUrl(jsonlUrl),
  });

  const response = await axios.get(jsonlUrl, {
    responseType: 'text',
    timeout: 60000,
  });

  return String(response.data || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function flattenMarkdownText(jsonlItems) {
  const segments = [];

  jsonlItems.forEach((item) => {
    const results = item?.result?.layoutParsingResults || [];
    results.forEach((result) => {
      const text = result?.markdown?.text;
      if (typeof text === 'string' && text.trim()) {
        segments.push(text.trim());
      }
    });
  });

  return segments.join('\n\n');
}

function collectAssets(jsonlItems) {
  const markdownImages = [];
  const outputImages = [];

  jsonlItems.forEach((item, itemIndex) => {
    const results = item?.result?.layoutParsingResults || [];
    results.forEach((result, resultIndex) => {
      const images = result?.markdown?.images || {};
      Object.entries(images).forEach(([name, url]) => {
        markdownImages.push({
          itemIndex,
          resultIndex,
          name,
          url,
        });
      });

      const generatedImages = result?.outputImages || {};
      Object.entries(generatedImages).forEach(([name, url]) => {
        outputImages.push({
          itemIndex,
          resultIndex,
          name,
          url,
        });
      });
    });
  });

  return { markdownImages, outputImages };
}

async function saveMarkdownArtifacts(jsonlItems) {
  const outputDir = path.join(os.tmpdir(), `vlm-ocr-paddle-${Date.now()}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const markdownFiles = [];
  let pageNum = 0;

  jsonlItems.forEach((item) => {
    const results = item?.result?.layoutParsingResults || [];
    results.forEach((result) => {
      const text = result?.markdown?.text;
      if (typeof text !== 'string' || !text.trim()) {
        pageNum += 1;
        return;
      }

      const mdFilename = path.join(outputDir, `doc_${pageNum}.md`);
      fs.writeFileSync(mdFilename, text, 'utf8');
      markdownFiles.push(mdFilename);
      pageNum += 1;
    });
  });

  return {
    outputDir,
    markdownFiles,
  };
}

async function callPaddleOCR(filePathOrUrl, tips, options = {}) {
  const optionalPayload = {
    useDocOrientationClassify: false,
    useDocUnwarping: false,
    useChartRecognition: false,
  };
  const prompt = buildPrompt(tips);
  const { localFilePath, cleanup } = await resolveInputFile(filePathOrUrl, options);

  try {
    console.log('[ThirdParty][Paddle] 开始识别', {
      input: filePathOrUrl.startsWith('http') ? maskUrl(filePathOrUrl) : filePathOrUrl,
      resolvedLocalFilePath: localFilePath,
      promptLength: prompt.length,
    });

    const submitResult = filePathOrUrl.startsWith('http') && !getLocalUploadPath(filePathOrUrl)
      ? await submitRemoteJob(filePathOrUrl, optionalPayload, prompt)
      : await submitLocalJob(localFilePath, optionalPayload, prompt);

    const jobId = submitResult?.data?.jobId;
    if (!jobId) {
      throw new Error('PaddleOCR-VL 未返回 jobId');
    }

    const jobData = await pollJobResult(jobId);
    const jsonlUrl = jobData?.resultUrl?.jsonUrl;
    if (!jsonlUrl) {
      throw new Error('PaddleOCR-VL 未返回结果地址');
    }

    const jsonlItems = await downloadJsonLines(jsonlUrl);
    const rawText = flattenMarkdownText(jsonlItems);
    const parsedJson = parseStructuredResult(rawText);
    const artifacts = await saveMarkdownArtifacts(jsonlItems);
    const assets = collectAssets(jsonlItems);

    return {
      model: MODEL,
      jobId,
      state: jobData?.state || 'done',
      rawText,
      result: rawText,
      json: parsedJson || { text: rawText },
      jsonlUrl,
      jsonlItems,
      markdownFiles: artifacts.markdownFiles,
      outputDir: artifacts.outputDir,
      assets,
      progress: jobData?.extractProgress || null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.errorMsg
        || error.response?.data?.message
        || error.response?.data?.msg
        || error.message;
      console.error('[ThirdParty][Paddle] 请求失败', {
        status,
        message,
        responseData: error.response?.data || null,
      });
      throw new Error(`PaddleOCR-VL 请求失败${status ? ` (${status})` : ''}: ${message}`);
    }

    console.error('[ThirdParty][Paddle] 识别失败', {
      message: error.message,
    });
    throw error;
  } finally {
    if (cleanup) {
      cleanup();
    }
  }
}

module.exports = {
  MODEL,
  callPaddleOCR,
  parseStructuredResult,
};
