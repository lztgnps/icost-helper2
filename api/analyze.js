export default async function handler(req, res) {
  // 设置跨域头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // ⚠️ 重要：这里换成你的真实DeepSeek API密钥！
    const DEEPSEEK_API_KEY = 'sk-94ZtLx3tEahPqJBMtqmTGKJfY3wcBuIflhldIpTbYNndylUe';
    
    // 调用DeepSeek API
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
    
    // 提取AI回复
    const content = data.choices[0].message.content;
    
    // 提取JSON部分
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonStr);
        return res.status(200).json(result);
      }
    } catch (e) {
      // 如果解析失败，返回原始文本
      return res.status(200).json({
        success: false,
        raw_text: content,
        message: '请手动提取信息：' + content
      });
    }
    
    return res.status(200).json({ success: true, text: content });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}
