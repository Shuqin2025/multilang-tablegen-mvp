// backend/server.js（顶端）
import express from 'express';
import cors from 'cors';
import tablegenRoutes from './routes/tablegen.js';

const app = express();

// 允许的前端域名（根据你现在的两个前端改）
const ALLOWED_ORIGINS = [
  'https://tablegen-mvp-frontend.onrender.com',
  'https://multilang-tablegen-mvp.onrender.com',
  'http://localhost:5173', // 本地调试可留着
];

// CORS：显式允许 origin / methods / headers，放行预检
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400, // 预检缓存
}));

// 确保所有路由都响应预检
app.options('*', cors());

// 解析 JSON 请求体
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 业务接口
app.use('/api/tablegen', tablegenRoutes);

// 监听端口
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
