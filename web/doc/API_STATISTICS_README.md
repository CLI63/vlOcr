# OCR统计API文档

本文档描述了OCR识别统计相关的API接口，包括每日统计、总计统计、模型统计等功能。

## 基础信息

- **Base URL**: `http://localhost:3000`
- **认证方式**: Bearer Token
- **Token有效期**: 24小时（滑动窗口，每次请求后重置）

## 接口概览

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 每日OCR统计 | GET | /api/statistics/daily-ocr | 获取指定日期范围内的每日OCR识别数量 |
| 总计OCR统计 | GET | /api/statistics/total-ocr | 获取总计OCR识别数量 |
| 模型OCR统计 | GET | /api/statistics/model-ocr | 获取每个模型的OCR识别数量统计 |
| 综合统计 | GET | /api/statistics/summary | 获取包含所有统计信息的综合数据 |

## 详细接口说明

### 1. 每日OCR统计

获取指定日期范围内的每日OCR识别数量统计。

#### 请求信息
- **URL**: `/api/statistics/daily-ocr`
- **Method**: `GET`
- **认证**: 需要Bearer Token

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| startDate | string | 是 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 是 | 结束日期，格式：YYYY-MM-DD |

#### 请求示例
```bash
curl -X GET "http://localhost:3000/api/statistics/daily-ocr?startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "ocr_count": 15
    },
    {
      "date": "2024-01-02",
      "ocr_count": 23
    },
    {
      "date": "2024-01-03",
      "ocr_count": 8
    }
  ],
  "totalDays": 3,
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  }
}
```

**错误响应 (400)**:
```json
{
  "error": "日期范围不能超过31天"
}
```

**错误响应 (500)**:
```json
{
  "error": "获取统计信息失败"
}
```

### 2. 总计OCR统计

获取总计OCR识别数量统计信息。

#### 请求信息
- **URL**: `/api/statistics/total-ocr`
- **Method**: `GET`
- **认证**: 需要Bearer Token

#### 请求示例
```bash
curl -X GET "http://localhost:3000/api/statistics/total-ocr" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "data": {
    "total_ocr_count": 156,
    "total_days": 15,
    "first_ocr_date": "2024-01-01T08:30:00.000Z",
    "last_ocr_date": "2024-01-15T18:45:00.000Z"
  }
}
```

### 3. 模型OCR统计

获取每个模型的OCR识别数量统计。

#### 请求信息
- **URL**: `/api/statistics/model-ocr`
- **Method**: `GET`
- **认证**: 需要Bearer Token

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD |

#### 请求示例
```bash
# 获取所有时间的模型统计
curl -X GET "http://localhost:3000/api/statistics/model-ocr" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取指定日期范围的模型统计
curl -X GET "http://localhost:3000/api/statistics/model-ocr?startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "data": [
    {
      "model_name": "银行回单",
      "model_type": "receipt",
      "ocr_count": 89,
      "first_use_date": "2024-01-01",
      "last_use_date": "2024-01-15"
    },
    {
      "model_name": "身份证",
      "model_type": "id_card",
      "ocr_count": 45,
      "first_use_date": "2024-01-02",
      "last_use_date": "2024-01-14"
    },
    {
      "model_name": "增值税发票",
      "model_type": "invoice",
      "ocr_count": 22,
      "first_use_date": "2024-01-05",
      "last_use_date": "2024-01-13"
    }
  ],
  "totalCount": 156,
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  }
}
```

### 4. 综合统计

获取包含每日统计、总计统计、模型统计的综合数据，默认返回最近7天的数据。

#### 请求信息
- **URL**: `/api/statistics/summary`
- **Method**: `GET`
- **认证**: 需要Bearer Token

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD |

#### 请求示例
```bash
# 获取默认最近7天的综合统计
curl -X GET "http://localhost:3000/api/statistics/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取指定日期范围的综合统计
curl -X GET "http://localhost:3000/api/statistics/summary?startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "dailyStats": {
    "data": [
      {
        "date": "2024-01-01",
        "ocr_count": 15
      },
      {
        "date": "2024-01-02",
        "ocr_count": 23
      }
    ],
    "totalDays": 2,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-07"
    }
  },
  "totalStats": {
    "total_ocr_count": 156,
    "total_days": 15,
    "first_ocr_date": "2024-01-01T08:30:00.000Z",
    "last_ocr_date": "2024-01-15T18:45:00.000Z"
  },
  "modelStats": {
    "data": [
      {
        "model_name": "银行回单",
        "model_type": "receipt",
        "ocr_count": 89,
        "first_use_date": "2024-01-01",
        "last_use_date": "2024-01-15"
      }
    ],
    "totalCount": 156
  }
}
```

## 使用示例

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 获取每日OCR统计
const getDailyOcrStats = async (startDate, endDate) => {
  const response = await api.get('/api/statistics/daily-ocr', {
    params: { startDate, endDate }
  });
  return response.data;
};

// 获取总计OCR统计
const getTotalOcrStats = async () => {
  const response = await api.get('/api/statistics/total-ocr');
  return response.data;
};

// 获取模型OCR统计
const getModelOcrStats = async (startDate, endDate) => {
  const response = await api.get('/api/statistics/model-ocr', {
    params: { startDate, endDate }
  });
  return response.data;
};

// 获取综合统计
const getSummaryStats = async (startDate, endDate) => {
  const response = await api.get('/api/statistics/summary', {
    params: { startDate, endDate }
  });
  return response.data;
};
```

### 前端图表集成示例

```javascript
// 使用ECharts展示每日OCR统计
const renderDailyChart = (data) => {
  const chart = echarts.init(document.getElementById('daily-chart'));
  const option = {
    title: { text: '每日OCR识别数量' },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [{
      data: data.map(item => item.ocr_count),
      type: 'line'
    }]
  };
  chart.setOption(option);
};

// 使用饼图展示模型统计
const renderModelChart = (data) => {
  const chart = echarts.init(document.getElementById('model-chart'));
  const option = {
    title: { text: '模型使用统计' },
    series: [{
      type: 'pie',
      data: data.map(item => ({
        name: item.model_name,
        value: item.ocr_count
      }))
    }]
  };
  chart.setOption(option);
};
```

## 错误处理

### 常见错误码

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证，需要登录 |
| 403 | 认证失败，token无效 |
| 500 | 服务器内部错误 |

### 错误处理示例

```javascript
const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        console.error('参数错误:', data.error);
        break;
      case 401:
        console.error('未认证，请重新登录');
        break;
      case 500:
        console.error('服务器错误，请稍后重试');
        break;
      default:
        console.error('未知错误:', data.error);
    }
  } else {
    console.error('网络错误:', error.message);
  }
};
```

## 注意事项

1. **日期范围限制**: 每日OCR统计接口限制最多31天的数据查询
2. **日期格式**: 所有日期参数必须使用YYYY-MM-DD格式
3. **时区处理**: 服务器使用UTC时区，返回的时间为UTC格式
4. **性能优化**: 对于大数据量查询，建议使用分页或限制日期范围
5. **缓存策略**: 建议前端对统计数据进行缓存，减少重复请求

## 扩展功能

### 自定义统计维度

未来可以扩展以下统计维度：
- 按用户统计
- 按文件类型统计
- 按识别成功率统计
- 按处理时长统计
- 按错误类型统计

### 导出功能

可以添加数据导出功能：
- CSV格式导出
- Excel格式导出
- PDF报告生成

### 实时监控

可以添加实时监控功能：
- WebSocket实时推送
- 图表自动刷新
- 异常告警