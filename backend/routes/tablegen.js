// backend/routes/tablegen.js
import express from 'express';
import * as XLSX from 'xlsx';

const router = express.Router();

/**
 * 接口：POST /api/tablegen
 * 请求体示例：
 * {
 *   "urls": ["https://example.com/product/123"],
 *   "fields": ["name", "price", "imageUrl", "moq_value"],
 *   "languages": ["zh"],
 *   "format": "excel"                 // "excel" 或 "pdf"（PDF可后续接入）
 * }
 *
 * 返回：
 * - 当 format === 'excel' 时：以附件形式（Content-Disposition: attachment）直接返回 .xlsx
 * - 其他情况：返回 JSON（ok: true...）
 */
router.post('/', async (req, res) => {
  try {
    const {
      urls = [],
      fields = ['name', 'price'],
      languages = ['zh'],
      format = 'excel',
    } = req.body || {};

    // 1) 这里替换为你真正的抓取/组装逻辑：
    //    目前先用 urls 构造几行“示例数据”，确保链路跑通。
    const rows = urls.map((u, idx) => {
      const base = {
        url: u,
        name: `示例商品${idx + 1}`,
        price: (9.99 + idx).toFixed(2),
        imageUrl: `https://picsum.photos/seed/${idx}/200/200`,
        moq_value: idx + 1,
        description: `示例描述 ${idx + 1}`,
      };
      // 仅保留请求的 fields 字段
      const filtered = { url: base.url };
      for (const f of fields) filtered[f] = base[f] ?? '';
      return filtered;
    });

    // 2) Excel 导出：内存中生成并“现写现发”，不落盘（适配 Render 的无持久化文件系统）。
    if (format === 'excel') {
      // 生成 AOA（二维数组）：第一行表头
      const header = ['url', ...fields];
      const aoa = [header];
      rows.forEach((row) => {
        const r = [row.url];
        fields.forEach((f) => r.push(row[f] ?? ''));
        aoa.push(r);
      });

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

    // 3) 非 excel（比如后续接 PDF），先返回 JSON 占位
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
