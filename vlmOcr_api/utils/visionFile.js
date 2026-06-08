const fs = require('fs');
const os = require('os');
const path = require('path');
const pdfPoppler = require('pdf-poppler');

const rasterImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function isRasterImage(filePath) {
  return rasterImageExtensions.has(path.extname(filePath).toLowerCase());
}

async function ensureVisionInput(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (isRasterImage(filePath)) {
    return { imagePath: filePath, cleanup: null };
  }

  if (ext !== '.pdf') {
    throw new Error('本地VLM仅支持 JPG、PNG、WEBP 或 PDF 文件');
  }

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vlm-ocr-pdf-'));
  const outPrefix = path.basename(filePath, ext);

  try {
    await pdfPoppler.convert(filePath, {
      format: 'jpeg',
      out_dir: outDir,
      out_prefix: outPrefix,
      page: 1,
      scale: 1440,
    });

    const imagePath = path.join(outDir, `${outPrefix}-1.jpg`);
    if (!fs.existsSync(imagePath)) {
      throw new Error('PDF转图片失败，未生成首页图片');
    }

    return {
      imagePath,
      cleanup: () => {
        try {
          fs.rmSync(outDir, { recursive: true, force: true });
        } catch (error) {
          console.warn('清理PDF临时图片失败:', error.message);
        }
      },
    };
  } catch (error) {
    try {
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('清理PDF临时目录失败:', cleanupError.message);
    }
    throw new Error(`PDF转图片失败: ${error.message}`);
  }
}

module.exports = {
  ensureVisionInput,
  isRasterImage,
};
