const https = require("https");
// 从环境变量中获取API密钥和模型名称
require("dotenv").config(); // 确保dotenv已加载环境变量

const apiKey = process.env.PADDLE_API_KEY; // 从环境变量获取API密钥
// const model = "glm-4.1v-thinking-flashx"; // 收费模型名称
// const model = "glm-4.1v-thinking-flash"; // 免费模型名称
const API_URL = "e2eco4p7ne90m6fd.aistudio-app.com"

/**
 * 调用飞桨大模型API
 * @param {string} apiKey - API密钥 (用于生成Authorization头)
 * @param {string} model - 模型名称
 * @param {Array} messages - 消息数组，格式示例: [{role: "user", content: "你好"}]
 * @returns {Promise<Object>} - API响应数据
 */
async function callPaddleOCR(
  imgUrl,
  tips
) {
  console.log("大模型识别提示信息：" + tips);
  return new Promise((resolve, reject) => {
    // 参数验证
    if (!apiKey) throw new Error("缺少API密钥");
    if (!model) throw new Error("缺少模型名称参数");
    if (!imgUrl) throw new Error("缺少图片URL参数");
    console.log("识别影像地址：" + imgUrl)

    tips = tips + "（重点：只返回最终的标准JSON结果，不要回复其他东西！）"

    const postData = JSON.stringify({
        file: imgUrl,
        promptLabel: tips,
        useDocOrientationClassify: true, // 自动方向校正
        useDocUnwarping: true, // 自动倾斜校正 
      })

    const options = {
      hostname: API_URL,
      path: "/layout-parsing",
      method: "POST",
      headers: {
        Authorization: `token ${apiKey}`,
        "Content-Type": "application/json",
        // "Content-Length": Buffer.byteLength(postData),
      }
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 400) {
            console.log("大模型报错：" + JSON.stringify(parsedData))
            reject(
              new Error(
                `API请求失败: ${parsedData.error?.message || "未知错误"}`
              )
            );
          } else {
            resolve(parsedData);
          }
        } catch (e) {
          reject(new Error("响应解析失败"));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  callPaddleOCR,
};
