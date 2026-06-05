const https = require('https');

function supabaseFetch(method, path, body) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'User-Agent': 'class-manager-backend/1.0',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    const r = https.request(options, (response) => {
      let chunks = [];
      response.on('data', (c) => chunks.push(c));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve({ status: response.statusCode, data: JSON.parse(text) }); }
        catch { resolve({ status: response.statusCode, data: text }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
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

  if (!process.env.SUPABASE_URL) {
    return res.status(500).json({ error: 'SUPABASE_URL 环境变量未设置' });
  }

  try {
    if (req.method === 'GET') {
      const result = await supabaseFetch('GET', `/rest/v1/class_sync_data?select=data&id=eq.${encodeURIComponent(key)}`);
      if (result.status >= 200 && result.status < 300 && result.data && result.data.length > 0) {
        return res.json(result.data[0].data);
      }
      return res.json(null);
    }
    if (req.method === 'PUT') {
      const existing = await supabaseFetch('GET', `/rest/v1/class_sync_data?select=id&id=eq.${encodeURIComponent(key)}`);
      if (existing.status >= 200 && existing.status < 300 && existing.data && existing.data.length > 0) {
        await supabaseFetch('PATCH', `/rest/v1/class_sync_data?id=eq.${encodeURIComponent(key)}`,
          { data: req.body, updated_at: new Date().toISOString() });
      } else {
        await supabaseFetch('POST', '/rest/v1/class_sync_data',
          { id: key, data: req.body, updated_at: new Date().toISOString() });
      }
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
