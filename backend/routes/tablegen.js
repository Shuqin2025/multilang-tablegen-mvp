// backend/routes/tablegen.js
const express = require('express');
const router = express.Router();

// 可选：用于生成 Excel
// 确保 backend/package.json 里有 "xlsx": "^0.18.5" 依赖；没有就加上并 Redeploy
const XLSX = require('xlsx');

let crawlProduct;
try {
  ({ crawlProduct } = require('../services/crawler'));
} catch (e) {
  // 如果 crawler 加载失败，也不要让服务崩溃，返回 500 + 错误
  console.error('Failed to require ../services/crawler:', e);
  router.post('/tablegen', (req, res) => {
    res.status(500).json({ ok: false, error: 'crawler-load-failed', detail: String(e) });
  });
}

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/**
 * POST /api/tablegen
 * body: { urls: string[], fields: string[], languages?: string[], format?: 'json'|'excel'|'pdf' }
 */
router.post('/tablegen', async (req, res) => {
  try {
    const {
      urls = [],
      fields = [],
      languages = [],
      format = 'json',
    } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ ok: false, error: 'no-urls' });
    }
    if (!Array.isArray(fields)) {
      return res.status(400).json({ ok: false, error: 'invalid-fields' });
    }

    // 并发抓取每个 URL
    const rows = await Promise.all(
      urls.map(async (u) => {
        try {
          // crawlProduct(url, fields) 应返回一个对象，如：{ name, price, imageUrl, ... }
          return await crawlProduct(u, fields);
        } catch (err) {
          // 单条失败也不要影响整体；记录错误
          return { url: u, error: String(err) };
        }
      })
    );

    // 根据 format 分支
    const fmt = String(format || 'json').toLowerCase();

    if (fmt === 'json') {
      // 直接返回 JSON
      return res.json({ ok: true, result: rows, meta: { format: fmt, fields, languages } });
    }

    if (fmt === 'excel') {
      // === 生成 Excel (XLSX) ===
      // 构造二维数组：第一行是表头，后面每行是对应字段
      const header = fields.length ? fields : Object.keys(rows[0] || {});
      const data = [header, ...rows.map(r => header.map(k => (r && r[k] != null ? String(r[k]) : '')))];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'data');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // 关键：设定下载头；server.js 已暴露 Content-Disposition 供前端读取
      const filename = `table_${Date.now()}.xlsx`;
      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        // RFC5987/6266，兼容文件名中的非 ASCII 字符
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );

      return res.status(200).send(buf);
    }

    if (fmt === 'pdf') {
      // 还没上 pdf 依赖时，先友好提示；等你安装 pdfmake 后再实现
      return res
        .status(501)
        .json({ ok: false, error: 'pdf-not-implemented', tip: '请先安装并接入 pdfmake 再开启 PDF 导出。' });
    }

    // 其它未知 format
    return res.status(400).json({ ok: false, error: 'unsupported-format', detail: format });

  } catch (err) {
    console.error('POST /api/tablegen Error:', err);
    res.status(500).json({ ok: false, error: 'internal', detail: String(err) });
  }
});

module.exports = router;
