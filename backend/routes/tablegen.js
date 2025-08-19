const express = require('express');
const router = express.Router();

// POST /api/tablegen
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }

    // 模拟生成表格数据（后续可以改为真实抓取逻辑）
    const tableData = {
      headers: ['Column 1', 'Column 2'],
      rows: [
        ['Value 1', 'Value 2'],
        ['Value 3', 'Value 4'],
      ]
    };

    res.json({ success: true, data: tableData });
  } catch (err) {
    console.error('Error generating table:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
