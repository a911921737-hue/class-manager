const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: '缺少 key 参数' });

  try {
    const client = await getPool().connect();
    try {
      // 自动建表（首次访问时创建）
      await client.query(`
        CREATE TABLE IF NOT EXISTS class_sync_data (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      if (req.method === 'GET') {
        const result = await client.query('SELECT data FROM class_sync_data WHERE id = $1', [key]);
        return res.json(result.rows.length > 0 ? result.rows[0].data : null);
      }

      if (req.method === 'PUT') {
        const data = JSON.stringify(req.body);
        await client.query(
          `INSERT INTO class_sync_data (id, data, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
          [key, data]
        );
        return res.json({ ok: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: err.message });
  }
};
