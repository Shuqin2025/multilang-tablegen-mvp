// backend/routes/tablegen.js
import express from 'express';
import * as XLSX from 'xlsx';

const router = express.Router();

/**
 * POST /api/tablegen
 * body: {
 *   urls: string[],
 *   fields: string[],           // e.g. ["name","price","imageUrl","moq_value","description"]
 *   languages: string[],        // e.g. ["zh"]
 *   format: "excel" | "pdf"     // 现阶段支持 excel；pdf 以后接
 * }
 *
 * 当 format === "excel"：直接返回 .xlsx 二进制（Content-Disposition 附件下载）
 * 其它格式：返回 JSON 占位
 */
router.post('/', async (req, res) => {
  try {
    const {
      urls = [],
      fields = ['name', 'price'],
      languages = ['zh'],
      format = 'excel',
    } = req.body || {};

    // 1) 这里放真实抓取逻辑；演示用 mock 数据保证链路通
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
      // 2) 生成工作簿（内存中，不落盘，适配 Render）
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

    // 3) 其它格式先返回占位 JSON
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

export default router;

