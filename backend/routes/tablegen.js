// backend/routes/tablegen.js
const express = require('express');
const router = express.Router();

let crawlProduct;
try {
  ({ crawlProduct } = require('../services/crawler'));
} catch (e) {
  // 如果这里 require 失败，路由仍可注册，返回 500 说明原因，避免服务直接崩溃
  console.error('Failed to require ../services/crawler:', e);
  router.post('/tablegen', (req, res) => {
    res.status(500).json({ ok: false, error: 'crawler-load-failed', detail: String(e) });
  });
}

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 真实抓取接口（JSON 版本）。前端勾选字段 + URL 列表
router.post('/tablegen', async (req, res) => {
  try {
    const { urls = [], fields = [], languages = [], format = 'json' } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ ok: false, error: 'no-urls' });
    }
    if (!Array.isArray(fields)) {
      return res.status(400).json({ ok: false, error: 'invalid-fields' });
    }

    // 并发抓取（可根据需要加限制）
    const rows = await Promise.all(
      urls.map(async (u) => {
        try {
          return await crawlProduct(u, fields);
        } catch (err) {
          return { error: String(err), url: u };
        }
      })
    );

    // 先返回 JSON（前端能渲染和下载 JSON）
    // 如果你已经有“生成 Excel / PDF”的现成函数，保留它并在这里按 format 分支即可
    return res.json({ ok: true, result: rows, meta: { format, fields, languages } });
  } catch (err) {
    console.error('POST /api/tablegen Error:', err);
    res.status(500).json({ ok: false, error: 'internal', detail: String(err) });
  }
});

module.exports = router;

