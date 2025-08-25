// backend/routes/tablegen.js
import express from "express";
import * as XLSX from "xlsx";
import { crawlSafe } from "../services/crawler.js";

const router = express.Router();

/**
 * POST /api/tablegen
 * body: { urls: string[], fields: string[], languages: string[], format: 'excel'|'pdf' }
 */
router.post("/", async (req, res) => {
  try {
    const {
      urls = [],
      fields = ["url", "name", "price", "imageUrl", "description", "error"],
      languages = ["zh"],
      format = "excel",
    } = req.body || {};

    // 1) 并发抓取（每个 URL 可能返回多条）
    const all = await Promise.all(urls.map((u) => crawlSafe(u)));
    const rows = all.flat(); // 合并

    // 2) 只保留用户勾选的列（至少保留 url）
    const wanted = Array.from(new Set(["url", ...fields]));
    const header = wanted;
    const aoa = [header];

    rows.forEach((row) => {
      const line = wanted.map((k) => (row[k] ?? "").toString());
      aoa.push(line);
    });

    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tablegen_${Date.now()}.xlsx"`
      );
      return res.send(buf);
    }

    // 3) 后续接入 PDF：目前先回 JSON
    return res.json({
      ok: true,
      received: { urls, fields, languages, format },
      note: "excel 已支持下载；PDF 可后续接入",
      sampleCount: rows.length,
    });
  } catch (err) {
    console.error("tablegen error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
