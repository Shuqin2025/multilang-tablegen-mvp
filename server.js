// server.js — 极简健康版
const express = require('express');
const cors = require('cors');

const app = express();

// 允许跨域
app.use(cors());
app.use(express.json());

// 关键：Render 会注入 PORT，必须监听它
const PORT = process.env.PORT || 10000;

// 根路由：必须有，可直观判断“活着没”
app.get('/', (req, res) => {
  res.status(200).send('OK: backend is running');
});

// 健康检查路由（你之前也有）
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// 保留一个样例业务路由（可以先注释掉你原来较复杂的逻辑）
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// 全局错误兜底，避免崩进程（很重要）
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 兜住未捕获异常，打印而不是直接崩
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// 启动服务
app.listen(PORT, () => {
  console.log(`[STARTED] Backend listening on port ${PORT}`);
});
