// backend/routes/tablegen.js
import express from 'express';
import * as XLSX from 'xlsx';
import { fetchProducts } from '../services/crawler.js';

const router = express.Router();

/**
 * POST /api/tablegen
 * body: { urls: string[], fields: string[], languages: string[], format: "excel" | "pdf" }
 */
router.post('/', async (req, res) => {
  try {
    const {
      urls = [],
      fields = ['name', 'price', 'imageUrl', 'moq_value', 'description'],
      languages = ['zh'],
      format = 'excel',
    } = req.body || {};

    // 1) 真实抓取
    const rawRows = await fetchProducts(urls);

    // 2) 仅保留勾选字段，并固定表头顺序：url + fields
    const header = ['url', ...fields];
    const aoa = [header];
    rawRows.forEach((r) => {
      const row = [r.url];
      fields.forEach((f) => row.push(r[f] ?? ''));
      aoa.push(row);
    });

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="tablegen_${Date.now()}.xlsx"`);
      return res.send(buf);
    }

    // 暂时默认 JSON（PDF 暂不启用）
    return res.json({ ok: true, rows: rawRows, fields, languages, note: 'excel 已支持下载' });
  } catch (err) {
    console.error('tablegen error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

