// backend/routes/tablegen.js  (ESM 版本)
import express from 'express';

const router = express.Router();

// 用作健康自检
router.get('/', (_req, res) => {
  res.json({ ok: true, service: 'tablegen', ts: Date.now() });
});

// 示例：文件导出/JSON 逻辑按你现有实现放到这里
// 这里放一个最简占位，确保路由可用
router.post('/generate', async (req, res) => {
  const { input = '' } = req.body || {};
  if (!input) return res.status(400).json({ ok: false, error: 'missing input' });
  return res.json({ ok: true, echo: input });
});

export default router;
