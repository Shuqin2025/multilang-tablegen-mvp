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

/* ===== CORS：显式处理预检 + 允许下载头暴露 =====
   说明：
   1) 之前只有 app.use(cors())，不会自动把 OPTIONS 预检处理好；
      这里加上 app.options('*', cors(corsOptions))。
   2) 为了让前端能读到文件名，需要暴露 Content-Disposition。
*/
const corsOptions = {
  origin: [
    'https://tablegen-mvp-frontend.onrender.com', // 你的前端域名
    'http://localhost:5173',                      // 本地调试（可留着）
    /\.onrender\.com$/                            // 允许其他 Render 子域（可选）
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // <=== 关键：响应 CORS 预检

// 让浏览器能读到 Content-Disposition（用于下载文件名）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  next();
});
/* ===================================================== */

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
