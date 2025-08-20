import express from 'express';
import bodyParser from 'body-parser';
import tablegenRoutes from './routes/tablegen.js';
import excelService from './services/excel.js';
import crawlerService from './services/crawler.js';

const app = express();
app.use(bodyParser.json());

// 挂载路由
app.use('/api/tablegen', tablegenRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
