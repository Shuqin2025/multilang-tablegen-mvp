import express from 'express';
import excelService from '../services/excel.js';
import crawlerService from '../services/crawler.js';

const router = express.Router();

// 示例接口
router.post('/generate', async (req, res) => {
  try {
    const { url } = req.body;
    const data = await crawlerService.fetchData(url);
    const buffer = await excelService.generateExcel(data);
    res.setHeader('Content-Disposition', 'attachment; filename=result.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '生成失败' });
  }
});

export default router;
