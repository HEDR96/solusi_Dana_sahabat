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
  if (!auth.startsWith('Bearer ')) {
    console.error('[verifyAdmin] No Bearer token');
    return null;
  }
  if (!SERVICE_KEY) {
    console.error('[verifyAdmin] SUPABASE_SERVICE_KEY not set');
    return { _debug: 'no_service_key' };
  }
  if (!SUPABASE_URL) {
    console.error('[verifyAdmin] SUPABASE_URL not set');
    return null;
  }
  try {
    // Dapatkan user dari token mereka
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: auth },
    });
    const rText = await r.text();
    if (!r.ok) {
      console.error('[verifyAdmin] auth/user failed:', r.status, rText.slice(0, 200));
      return null;
    }
    const u = JSON.parse(rText);
    if (!u?.id) {
      console.error('[verifyAdmin] no user id in response');
      return null;
    }

    // Cek role pakai SERVICE_KEY (bypass RLS)
    const profileUrl = `${SUPABASE_URL}/rest/v1/dsd_profiles?id=eq.${u.id}&select=role`;
    const p = await fetch(profileUrl, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    const pText = await p.text();
    if (!p.ok) {
      console.error('[verifyAdmin] profile fetch failed:', p.status, pText.slice(0, 200));
      return null;
    }
    const profiles = JSON.parse(pText);
    const role = Array.isArray(profiles) ? profiles[0]?.role : null;
    console.log('[verifyAdmin] user:', u.id, 'role:', role);
    if (!['owner', 'super-admin'].includes(role)) {
      console.error('[verifyAdmin] role not allowed:', role);
      return null;
    }
    return u;
  } catch (e) {
    console.error('[verifyAdmin] exception:', e?.message);
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
  if (!caller) {
    // Kumpulkan info debug untuk troubleshoot
    const debugInfo = {
      hasServiceKey: !!SERVICE_KEY,
      serviceKeyLen: SERVICE_KEY?.length,
      hasSupabaseUrl: !!SUPABASE_URL,
      supabaseUrl: SUPABASE_URL?.slice(0, 40),
      hasAuth: !!(req.headers.authorization),
    };
    return res.status(403).json({ error: 'Hanya owner/super-admin yang bisa membuat user', debug: debugInfo });
  }

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
