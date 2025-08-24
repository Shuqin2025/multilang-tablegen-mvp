// ---- 必须最上面：将未捕获异常写进日志，避免静默退出 ----
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const express = require('express');
const cors = require('cors');

const app = express();

// 关键：Expose Content-Disposition，前端才能读取响应头里的文件名
app.use(cors({
  origin: '*',
  credentials: false,
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json({ limit: '2mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

// 路由
const tablegenRouter = require('./routes/tablegen');
app.use('/api', tablegenRouter);

// Render 监听端口
const PORT = Number(process.env.PORT || 10000);
const server = app.listen(PORT, () => {
  console.log(`✅ backend is listening on port ${PORT}`);
});
server.on('error', (err) => {
  console.error('SERVER LISTEN ERROR:', err);
});
