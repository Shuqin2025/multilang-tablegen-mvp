// backend/routes/tablegen.js
const express = require('express');
const XLSX = require('xlsx'); // 用于导出 Excel
const router = express.Router();

// 尝试加载抓取函数（你已有 services/crawler.js）
let crawlProduct;
try {
  ({ crawlProduct } = require('../services/crawler'));
} catch (e) {
  console.error('Failed to require ../services/crawler:', e);
  // 兜底：只有当 crawler 加载失败时，仍允许路由注册，但返回 500
  router.post('/tablegen', (req, res) => {
    return res.status(500).json({ ok: false, error: 'crawler-load-failed', detail: String(e) });
  });
}

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 主接口：生成 JSON / Excel / PDF(占位)
router.post('/tablegen', async (req, res) => {
  try {
    const { urls = [], fields = [], languages = [], format = 'json' } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ ok: false, error: 'no-urls' });
    }
    if (!Array.isArray(fields)) {
      return res.status(400).json({ ok: false, error: 'invalid-fields' });
    }

    // 并发抓取所有 URL
    const rows = await Promise.all(
      urls.map(async (u) => {
        try {
          if (typeof crawlProduct === 'function') {
            return await crawlProduct(u, fields);
          }
          // 如果没有 crawler，用最简单的 mock 防止整体失败
          const obj = { url: u };
          for (const f of fields) obj[f] = `mock_${f}`;
          return obj;
        } catch (err) {
          return { url: u, error: String(err) };
        }
      })
    );

    const lower = String(format || 'json').toLowerCase();

    // 1) JSON：直接返回结构数据（便于调试）
    if (lower === 'json') {
      return res.json({ ok: true, result: rows, meta: { format: lower, fields, languages } });
    }

    // 2) Excel：用 xlsx 构建 buffer，并以二进制下载返回
    if (lower === 'excel' || lower === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

      const filename = `table_${Date.now()}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // 暴露头给浏览器读取（已在 CORS 中统一设置 exposedHeaders）
      return res.status(200).send(buf);
    }

    // 3) PDF：先返回 501 占位（等安装 pdfmake 再实现）
    if (lower === 'pdf') {
      return res
        .status(501)
        .json({ ok: false, error: 'pdf-not-implemented', tip: '请先安装并接入 pdfmake 再开启 PDF 导出。' });
    }

    // 未知格式
    return res.status(400).json({ ok: false, error: 'unsupported-format', format: lower });
  } catch (err) {
    console.error('POST /api/tablegen Error:', err);
    res.status(500).json({ ok: false, error: 'internal', detail: String(err) });
  }
});

module.exports = router;
