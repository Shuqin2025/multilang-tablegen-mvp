// ---- 必须放在最上面：把未捕获异常打进日志，防止静默退出 ----
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const express = require('express');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now(),
  });
});

// 路由（保持你现有的目录结构）
const tablegenRouter = require('./routes/tablegen');
app.use('/api', tablegenRouter);

// Render 要求必须监听 PORT；如果本地则 fallback 到 10000
const PORT = Number(process.env.PORT || 10000);

// 显式启动服务并加错误监听，防止静默失败
const server = app.listen(PORT, () => {
  console.log(`✅ backend is listening on port ${PORT}`);
});
server.on('error', (err) => {
  console.error('SERVER LISTEN ERROR:', err);
});
