import express from 'express';
import cors from 'cors';
import tablegenRoutes from './routes/tablegen.js';

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 挂载 tablegen 路由
app.use('/api', tablegenRoutes);

// 测试路由（可选）
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
