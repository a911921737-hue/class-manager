const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ---------- 中间件 ----------
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 确保数据文件存在
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}', 'utf-8');
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------- API ----------

// GET /api/data?key=xxx — 拉取数据
app.get('/api/data', (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: '缺少 key 参数' });
  const data = readData();
  if (data[key]) {
    res.json(data[key]);
  } else {
    res.json(null);
  }
});

// PUT /api/data?key=xxx — 上传数据
app.put('/api/data', (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: '缺少 key 参数' });
  const data = readData();
  data[key] = req.body;
  writeData(data);
  res.json({ ok: true });
});

// 健康检查
app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`班级管理同步服务器运行中，端口 ${PORT}`);
});
