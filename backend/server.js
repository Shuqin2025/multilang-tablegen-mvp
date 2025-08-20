// backend/server.js
import express from 'express';
import cors from 'cors';
import tablegenRoutes from './routes/tablegen.js';

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '2mb' })); // 取代 body-parser

// 健康检查（Render 会用得到）
app.get('/api/health', (req, res) => res.send('ok'));

// 业务路由
app.use('/api/tablegen', tablegenRoutes);

// 启动
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[tablegen-backend] listening on :${PORT}`);
});
