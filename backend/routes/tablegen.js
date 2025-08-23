// backend/routes/tablegen.js
const express = require('express');
const router = express.Router();

const PDFDocument = require('pdfkit');       // 用于导出 PDF
const { PassThrough } = require('stream');   // 用于把 PDF 流直接回传给浏览器
const ExcelJS = require('exceljs');          // 你Excel已在用，保留

/**
 * 工具：安全取值 + 字符串化
 */
function valToText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * 构造简单 Excel Buffer（你原来已有可复用的话，保留原函数即可）
 */
async function buildExcelBuffer(rows, fields, sheetName = 'Sheet1') {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  // 表头
  ws.addRow(fields);

  // 数据
  for (const row of rows) {
    ws.addRow(fields.map(f => valToText(row[f])));
  }

  // 自适应列宽
  fields.forEach((f, idx) => {
    const maxLen = Math.max(
      f.length,
      ...rows.map(r => valToText(r[f]).length)
    );
    ws.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 2, 10), 60);
  });

  return wb.xlsx.writeBuffer();
}

/**
 * 生成并回传 PDF（核心新增）
 */
function sendPdf(res, rows, fields, title = '表格导出') {
  // HTTP 头
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="tablegen_${Date.now()}.pdf"`
  );

  const doc = new PDFDocument({
    size: 'A4',
    margin: 36 // 0.5 inch
  });

  // 直接把 PDF 流送给浏览器
  doc.pipe(res);

  // 标题
  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown(0.5);

  // 表格简单绘制
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colCount = fields.length;
  const colWidth = pageWidth / colCount;

  let x0 = doc.page.margins.left;
  let y = doc.y;

  const rowHeight = 18; // 行高
  const headerBg = '#f1f1f1';
  const lineColor = '#cccccc';

  // 画表头背景
  doc.save().rect(x0, y, pageWidth, rowHeight).fill(headerBg).restore();

  // 表头文本
  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold');
  fields.forEach((f, i) => {
    doc.text(f, x0 + i * colWidth + 4, y + 4, {
      width: colWidth - 8,
      continued: false
    });
  });

  // 表头下方横线
  y += rowHeight;
  doc.moveTo(x0, y).lineTo(x0 + pageWidth, y).stroke(lineColor);

  // 数据行
  doc.font('Helvetica').fillColor('#000000');
  rows.forEach((row, idx) => {
    // 自动分页
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;

      // 新页表头
      doc.save().rect(x0, y, pageWidth, rowHeight).fill(headerBg).restore();
      doc.font('Helvetica-Bold');
      fields.forEach((f, i) => {
        doc.text(f, x0 + i * colWidth + 4, y + 4, {
          width: colWidth - 8
        });
      });
      y += rowHeight;
      doc.moveTo(x0, y).lineTo(x0 + pageWidth, y).stroke(lineColor);
      doc.font('Helvetica');
    }

    // 行内容
    fields.forEach((f, i) => {
      const text = valToText(row[f]);
      doc.text(text, x0 + i * colWidth + 4, y + 4, {
        width: colWidth - 8,
        height: rowHeight - 8
      });
    });

    // 行下横线
    y += rowHeight;
    doc.moveTo(x0, y).lineTo(x0 + pageWidth, y).stroke(lineColor);
  });

  doc.end(); // 结束并发送
}

/**
 * 你的抓取逻辑（保持你原有的实现）。这里给一个占位示例：
 * 输入：urls, fields, languages
 * 输出：rows（数组，每个元素是一个包含目标字段的对象）
 */
async function scrapeProducts(urls, fields, languages) {
  // TODO：这里用你现有的抓取/翻译逻辑
  // 这里给一个演示数据（请替换/对接你的实际数据）
  return urls.map((u, idx) => ({
    url: u,
    name: `示例商品 ${idx + 1}`,
    imageUrl: '',
    price: 9.99 + idx,
    moq_value: '',
    description: ''
  }));
}

/**
 * 主路由：POST /api/tablegen
 * body: { urls: string[], fields: string[], languages: string[], format: 'excel' | 'pdf' }
 */
router.post('/tablegen', async (req, res) => {
  try {
    const {
      urls = [],
      fields = ['name', 'price'],
      languages = ['zh'],
      format = 'excel'
    } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ ok: false, msg: 'urls 不能为空' });
    }

    // 1) 抓取/组装数据
    const rows = await scrapeProducts(urls, fields, languages);

    // 2) 根据 format 分支
    if (format === 'pdf') {
      // PDF 导出
      return sendPdf(res, rows, fields, '多语言表格导出');
    }

    // 默认 Excel 导出
    const buffer = await buildExcelBuffer(rows, fields, '表格');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tablegen_${Date.now()}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('tablegen error:', err);
    res.status(500).json({ ok: false, msg: '服务器异常', detail: String(err) });
  }
});

module.exports = router;
