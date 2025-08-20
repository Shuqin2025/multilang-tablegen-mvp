// backend/routes/tablegen.js
import express from 'express';

const router = express.Router();

// 测试接口：检查路由是否正常工作
router.get('/', (req, res) => {
  res.json({ message: '✅ Tablegen API is working' });
});

// 示例 POST 接口：接收数据并返回
router.post('/generate', (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: '❌ Missing "input" field in request body' });
  }

  // 在这里写你真正的处理逻辑，例如调用 AI 生成报价单
  // 现在先返回一个 mock 结果，保证接口能跑通
  const mockResult = {
    input,
    table: [
      { field: 'Product', value: 'Sample Item' },
      { field: 'Price', value: '$99' },
      { field: 'Currency', value: 'USD' }
    ]
  };

  res.json({ message: '✅ Table generated successfully', result: mockResult });
});

export default router;
