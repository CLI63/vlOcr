function normalizeContent(rawContent) {
  if (rawContent == null) {
    return '';
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (typeof item?.text === 'string') {
          return item.text;
        }

        if (typeof item?.content === 'string') {
          return item.content;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (typeof rawContent === 'object') {
    return JSON.stringify(rawContent);
  }

  return String(rawContent).replace(/^\uFEFF/, '').trim();
}

function extractJsonCandidate(content) {
  const fencedMatch = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return content.trim();
}

function parseStructuredJson(rawContent) {
  const normalizedContent = normalizeContent(rawContent);
  if (!normalizedContent) {
    throw new Error('模型未返回结构化内容');
  }

  const candidate = extractJsonCandidate(normalizedContent);

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const preview = candidate.slice(0, 200);
    throw new Error(`结构化结果不是有效JSON: ${error.message}；内容片段: ${preview}`);
  }
}

module.exports = {
  parseStructuredJson,
};
