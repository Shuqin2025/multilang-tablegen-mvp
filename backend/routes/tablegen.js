// backend/routes/tablegen.js
import express from 'express';
import * as XLSX from 'xlsx';

const router = express.Router();

/**
 * POST /api/tablegen
 * body: { urls: string[], fields: string[], languages: string[], format: "excel"|"pdf" }
 */
router.post('/', async (req, res) => {
  try {
    const {
      urls = [],
      fields = ['name', 'price'],
      languages = ['zh'],
      format = 'excel',
    } = req.body || {};

    // --- 这里放真实抓取逻辑；为保证链路，仍保留 fallback mock ---
    const rows = urls.map((u, idx) => {
      const base = {
        url: u,
        name: `示例商品${idx + 1}`,
        price: (9.99 + idx).toFixed(2),
        imageUrl: `https://picsum.photos/seed/${idx}/200/200`,
        moq_value: idx + 1,
        description: `示例描述 ${idx + 1}`,
      };
      const filtered = { url: base.url };
      for (const f of fields) filtered[f] = base[f] ?? '';
      return filtered;
    });

    if (format === 'excel') {
      const header = ['url', ...fields];
      const aoa = [header];
      rows.forEach(r => aoa.push([r.url, ...fields.map(f => r[f] ?? '')]));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="tablegen_${Date.now()}.xlsx"`
      );
      return res.send(buf);
    }

    // 其它格式先占位
    return res.json({
      ok: true,
      received: { urls, fields, languages, format },
      note: '路由已运行（excel 已支持下载；PDF 可后续接入）',
    });
  } catch (err) {
    console.error('tablegen error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;   // <== 关键：默认导出 Router
