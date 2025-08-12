import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Render 注入的端口（本地开发可默认 10000）
const PORT = process.env.PORT || 10000;

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 你现有的 API 路由放在这下面
// app.post('/api/generate-excel', ...)

app.listen(PORT, () => {
  console.log(`Backend running on :${PORT}`);
});
