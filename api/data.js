const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: '缺少 key 参数' });

  try {
    const sb = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('class_sync_data')
        .select('data')
        .eq('id', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('GET error:', error);
        return res.status(500).json({ error: error.message });
      }
      return res.json(data ? data.data : null);
    }

    if (req.method === 'PUT') {
      const { data, error } = await sb
        .from('class_sync_data')
        .upsert({ id: key, data: req.body, updated_at: new Date().toISOString() }, { onConflict: 'id' });

      if (error) {
        console.error('PUT error:', error);
        return res.status(500).json({ error: error.message });
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
