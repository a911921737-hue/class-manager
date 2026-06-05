// 通过 HTTPS 调用 Supabase REST API（不走数据库直连，避免 IPv6 问题）
const https = require('https');

function supabaseFetch(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(process.env.SUPABASE_URL + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'User-Agent': 'class-manager-backend/1.0',
        'Accept': 'application/json',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(text) }); }
        catch { resolve({ status: res.statusCode, data: text }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
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
    if (req.method === 'GET') {
      const result = await supabaseFetch(
        'GET',
        `/rest/v1/class_sync_data?select=data&id=eq.${encodeURIComponent(key)}`
      );
      if (result.status === 200 && result.data && result.data.length > 0) {
        return res.json(result.data[0].data);
      }
      return res.json(null);
    }

    if (req.method === 'PUT') {
      // 先检查是否存在
      const existing = await supabaseFetch(
        'GET',
        `/rest/v1/class_sync_data?select=id&id=eq.${encodeURIComponent(key)}`
      );

      if (existing.status === 200 && existing.data && existing.data.length > 0) {
        // 更新
        await supabaseFetch(
          'PATCH',
          `/rest/v1/class_sync_data?id=eq.${encodeURIComponent(key)}`,
          { data: req.body, updated_at: new Date().toISOString() }
        );
      } else {
        // 插入
        await supabaseFetch(
          'POST',
          '/rest/v1/class_sync_data',
          { id: key, data: req.body, updated_at: new Date().toISOString() }
        );
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
