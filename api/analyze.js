import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '10mb' }));

// 跨域设置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI记账助手API运行中', 
    status: 'ok',
    endpoints: {
      analyze: 'POST /analyze'
    }
  });
});

// 分析端点
app.post('/analyze', async (req, res) => {
  try {
    console.log('收到分析请求');
    
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: '请提供图片数据' });
    }

    // ⚠️ 重要：这里换成你的真实DeepSeek API密钥！
    const DEEPSEEK_API_KEY = 'sk-94ZtLx3tEahPqJBMtqmTGKJfY3wcBuIflhldIpTbYNndylUe';
    
    console.log('调用DeepSeek API...');
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请分析消费截图，提取以下信息并以纯JSON格式返回：金额、时间、商户、支付方式、分类。格式示例：{"amount": 100.00, "time": "2024-01-01 12:00", "merchant": "商户名", "payment_method": "微信支付", "category": "餐饮"}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('DeepSeek API错误:', data);
      return res.status(500).json({ 
        error: 'AI服务错误',
        details: data 
      });
    }
    
    const content = data.choices[0].message.content;
    console.log('AI返回:', content.substring(0, 100) + '...');
    
    // 提取JSON部分
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('解析结果:', result);
        return res.json(result);
      }
    } catch (parseError) {
      console.error('解析JSON失败:', parseError);
    }
    
    return res.json({ 
      success: true, 
      text: content,
      note: 'AI返回了文本，但未找到JSON格式，请手动处理'
    });
    
  } catch (error) {
    console.error('服务器错误:', error);
    return res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message,
      stack: error.stack 
    });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '端点不存在' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 AI记账助手API运行在端口 ${port}`);
  console.log(`📝 健康检查: http://localhost:${port}/`);
  console.log(`🔍 分析端点: POST http://localhost:${port}/analyze`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
