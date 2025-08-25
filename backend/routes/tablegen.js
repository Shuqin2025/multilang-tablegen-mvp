// backend/routes/tablegen.js  (CommonJS)
const express = require('express');
const XLSX = require('xlsx');

// 如果你已经替换过 crawler.js，这里会用真实抓取；否则会回退到 mock
let crawlProducts = null;
try {
  ({ crawlProducts } = require('../services/crawler'));
} catch (_) {
  // ignore
}

const router = express.Router();

/**
 * POST /api/tablegen
 * body: { urls: string[], fields: string[], languages: string[], format: "excel"|"pdf" }
 * 现阶段只返回 excel；pdf 以后接入
 */
router.post('/tablegen', async (req, res) => {
  try {
    const {
      urls = [],
      fields = ['name', 'price'],
      languages = ['zh'],
      format = 'excel',
    } = (req.body || {});

    // 1) 真实抓取 or mock
    let rows = [];
    if (Array.isArray(urls) && urls.length && typeof crawlProducts === 'function') {
      try {
        rows = await crawlProducts(urls, { fields, languages });
      } catch (err) {
        // 抓取失败也不要让整个接口挂掉，记录错误并回退到 mock
        console.error('crawler error:', err);
      }
    }
    if (!rows.length) {
      // mock，保证链路通
      rows = urls.map((u, idx) => {
        const base = {
          url: u,
          name: `示例商品${idx + 1}`,
          price: (9.99 + idx).toFixed(2),
          imageUrl: `https://picsum.photos/seed/${idx}/200/200`,
          moq_value: idx + 1,
          description: `示例描述 ${idx + 1}`,
          error: undefined,
        };
        const filtered = { url: base.url };
        for (const f of fields) filtered[f] = base[f] ?? '';
        return filtered;
      });
    }

    // 2) 仅支持 excel（pdf 以后接）
    if (format === 'excel') {
      const header = ['url', ...fields];
      const aoa = [header];
      for (const r of rows) {
        aoa.push([r.url, ...fields.map(f => r[f] ?? '')]);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition',
        `attachment; filename="tablegen_${Date.now()}.xlsx"`);
      return res.send(buf);
    }

    // 其它格式占位
    return res.json({
      ok: true,
      note: 'excel 已支持；pdf 待接入',
      received: { urls, fields, languages, format }
    });
  } catch (err) {
    console.error('tablegen error:', err);
    return res.status(500).json({ ok: false, error: String(err && err.message || err) });
  }
});

module.exports = router;
