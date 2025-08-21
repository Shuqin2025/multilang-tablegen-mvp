// backend/server.js
import express from 'express';
import cors from 'cors';
import tablegenRoutes from './routes/tablegen.js';  // 确认路径无误

const app = express();

// 允许跨域
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 根路径：方便直接用浏览器测试
app.get('/', (req, res) => {
  res.send('✅ Backend is running on Render');
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 业务接口
app.use('/api/tablegen', tablegenRoutes);

// 监听端口（Render 会注入 PORT）
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
