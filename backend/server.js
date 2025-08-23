import express from 'express';
import cors from 'cors';
import tablegenRoutes from './routes/tablegen.js';  // ← 路径别写错

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Backend is running on Render'));
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 关键：挂载路由
app.use('/api/tablegen', tablegenRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));

