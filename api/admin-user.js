// Vercel Serverless (ES Module): buat / hapus user Supabase pakai service role key.
// Service role key TIDAK PERNAH di-expose ke frontend — hanya ada di env vars Vercel.
//
// Env vars wajib:
//   SUPABASE_URL         — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY — service_role key
//   VITE_SUPABASE_ANON_KEY — untuk verifikasi token caller

const SUPABASE_URL  = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY      = process.env.VITE_SUPABASE_ANON_KEY;

async function verifyAdmin(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    // Dapatkan user dari token mereka
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: auth },
    });
    if (!r.ok) return null;
    const u = await r.json();
    if (!u?.id) return null;

    // Cek role pakai SERVICE_KEY (bypass RLS — lebih reliable)
    const p = await fetch(
      `${SUPABASE_URL}/rest/v1/dsd_profiles?id=eq.${u.id}&select=role`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    if (!p.ok) return null;
    const profiles = await p.json();
    const role = Array.isArray(profiles) ? profiles[0]?.role : null;
    if (!['owner', 'super-admin'].includes(role)) return null;
    return u;
  } catch (e) {
    console.error('verifyAdmin error:', e?.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY belum diset di Vercel' });

  const caller = await verifyAdmin(req);
  if (!caller) return res.status(403).json({ error: 'Hanya owner/super-admin yang bisa membuat user' });

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (req.method === 'POST') {
    const { name, email, password, role, status, agentId } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: 'name, email, password wajib' });

    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST', headers,
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
    });
    const created = await createResp.json();
    if (!createResp.ok || created.error) {
      return res.status(400).json({ error: created.error?.message || created.msg || JSON.stringify(created) });
    }

    const userId = created.id;
    const profResp = await fetch(`${SUPABASE_URL}/rest/v1/dsd_profiles`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ id: userId, name, email, role: role || 'agen', status: status || 'aktif', agent_id: agentId || null }),
    });
    if (!profResp.ok) {
      // Profil mungkin sudah dibuat oleh trigger — update saja
      await fetch(`${SUPABASE_URL}/rest/v1/dsd_profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ name, email, role: role || 'agen', status: status || 'aktif', agent_id: agentId || null }),
      });
    }

    return res.status(200).json({ id: userId, name, email, role, status });
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId wajib' });
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers });
    if (!r.ok) return res.status(500).json({ error: 'Gagal hapus user: ' + r.status });
    return res.status(200).json({ deleted: userId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
