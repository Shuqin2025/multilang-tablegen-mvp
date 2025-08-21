// backend/routes/tablegen.js
import { Router } from 'express';

// 如需调用你的服务层，请按需解开并使用：
// import excelService from '../services/excel.js';
// import pdfService from '../services/pdf.js';
// import crawlerService from '../services/crawler.js';
// import translateService from '../services/translate.js';

const router = Router();

/**
 * 健康检查/快速自测：
 * GET /api/tablegen
 */
router.get('/', (_req, res) => {
  res.json({ ok: true, service: 'tablegen', timestamp: Date.now() });
});

/**
 * 生成接口：
 * POST /api/tablegen
 * body: { urls: string[], locale?: string, format?: 'excel' | 'pdf' }
 */
router.post('/', async (req, res) => {
  try {
    const { urls = [], locale = 'zh', format = 'excel' } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ ok: false, error: 'urls 不能为空' });
    }

    // 这里按需调用你的服务层（示例）：
    // let fileBuffer;
    // if (format === 'excel') {
    //   fileBuffer = await excelService(urls, { locale });
    // } else if (format === 'pdf') {
    //   fileBuffer = await pdfService(urls, { locale });
    // } else {
    //   return res.status(400).json({ ok: false, error: '不支持的 format' });
    // }

    // 暂时返回一个成功的占位响应，确认后端跑通：
    return res.json({
      ok: true,
      received: { urls, locale, format },
      note: '路由已运行（这里按需接入 excel/pdf 具体生成逻辑）',
    });
  } catch (err) {
    console.error('POST /api/tablegen error:', err);
    res.status(500).json({ ok: false, error: '服务器错误', detail: String(err?.message || err) });
  }
});

export default router;
