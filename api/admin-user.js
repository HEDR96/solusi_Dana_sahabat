// Vercel Serverless: buat / hapus user Supabase pakai service role key.
// Service role key TIDAK PERNAH di-expose ke frontend — hanya ada di env vars Vercel.
//
// Env vars wajib (Vercel Dashboard → Settings → Environment Variables):
//   SUPABASE_URL         — sama dengan VITE_SUPABASE_URL
//   SUPABASE_SERVICE_KEY — service_role key (BUKAN anon key)
//   VITE_SUPABASE_ANON_KEY — untuk verifikasi token caller

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY;

// Pastikan caller adalah user Supabase yang sudah login (bukan sembarang request)
async function verifyAdmin(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: auth },
  });
  if (!r.ok) return null;
  const u = await r.json();
  // Cek role di tabel profiles
  const p = await fetch(
    `${SUPABASE_URL}/rest/v1/dsd_profiles?id=eq.${u.id}&select=role`,
    { headers: { apikey: ANON_KEY, Authorization: auth } }
  );
  const profiles = await p.json();
  const role = profiles?.[0]?.role;
  if (!['owner', 'super-admin'].includes(role)) return null;
  return u;
}

module.exports = async (req, res) => {
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

  // POST { name, email, password, role, status, agentId } → buat user baru
  if (req.method === 'POST') {
    const { name, email, password, role, status, agentId } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: 'name, email, password wajib' });

    // 1. Buat auth user via Admin API (tidak auto-login)
    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST', headers,
      body: JSON.stringify({
        email, password,
        email_confirm: true,   // langsung aktif, tidak perlu klik email
        user_metadata: { name },
      }),
    });
    const created = await createResp.json();
    if (!createResp.ok || created.error) {
      return res.status(400).json({ error: created.error?.message || created.msg || JSON.stringify(created) });
    }

    const userId = created.id;
    // 2. Insert profile
    const profResp = await fetch(`${SUPABASE_URL}/rest/v1/dsd_profiles`, {
      method: 'POST', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ id: userId, name, email, role: role || 'agen', status: status || 'aktif', agent_id: agentId || null }),
    });
    if (!profResp.ok) {
      const txt = await profResp.text();
      return res.status(500).json({ error: 'User dibuat tapi profil gagal: ' + txt.slice(0, 200) });
    }

    return res.status(200).json({ id: userId, name, email, role, status });
  }

  // DELETE { userId } → hapus user
  if (req.method === 'DELETE') {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId wajib' });
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers });
    if (!r.ok) return res.status(500).json({ error: 'Gagal hapus user: ' + r.status });
    return res.status(200).json({ deleted: userId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
