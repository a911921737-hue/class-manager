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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const key = event.queryStringParameters?.key;
  if (!key) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '缺少 key 参数' }) };
  }

  if (!process.env.SUPABASE_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_URL 环境变量未设置' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const result = await supabaseFetch('GET', `/rest/v1/class_sync_data?select=data&id=eq.${encodeURIComponent(key)}`);
      if (result.status >= 400) {
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Supabase 错误: ' + (typeof result.data === 'object' ? JSON.stringify(result.data) : result.data) }) };
      }
      if (result.data && result.data.length > 0) {
        return { statusCode: 200, headers, body: JSON.stringify(result.data[0].data) };
      }
      return { statusCode: 200, headers, body: 'null' };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const existing = await supabaseFetch('GET', `/rest/v1/class_sync_data?select=id&id=eq.${encodeURIComponent(key)}`);
      let result;
      if (existing.status >= 200 && existing.status < 300 && existing.data && existing.data.length > 0) {
        result = await supabaseFetch('PATCH', `/rest/v1/class_sync_data?id=eq.${encodeURIComponent(key)}`,
          { data: body, updated_at: new Date().toISOString() });
      } else {
        result = await supabaseFetch('POST', '/rest/v1/class_sync_data',
          { id: key, data: body, updated_at: new Date().toISOString() });
      }
      if (result.status >= 400) {
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Supabase 错误: ' + (typeof result.data === 'object' ? JSON.stringify(result.data) : result.data) }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
