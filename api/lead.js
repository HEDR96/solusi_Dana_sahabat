// Vercel Serverless (ES Module): terima lead dari landing page — endpoint publik.
// Dua jenis:
//   type "career"  → calon agen (form Career)  → dsd_agents (status nonaktif)
//   type "inquiry" → pengajuan dana (Simulasi) → dsd_applications (status pending)
//
// Dulu landing page insert LANGSUNG ke tabel dengan anon key — selalu ditolak RLS
// (policy hanya untuk authenticated), jadi semua lead website hilang.
// Service key hanya ada di env vars Vercel — tidak pernah ke frontend.

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/^﻿/, '').trim();
const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_KEY || '').replace(/^﻿/, '').trim();

// Anti-spam ringan: rate limit per-IP (in-memory, bertahan selama instance
// lambda hidup — cukup untuk menahan bot kasar tanpa infra tambahan)
const hits = new Map();
function rateLimited(req, max = 5, windowMs = 60_000) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > windowMs) { rec.count = 0; rec.start = now; }
  rec.count += 1;
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.count > max;
}

const H = () => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
});

async function maxIdNumber(table, fallback) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&order=id.desc&limit=1`, { headers: H() });
  const rows = await r.json().catch(() => []);
  const raw = Array.isArray(rows) ? rows[0]?.id : null;
  return raw ? (parseInt(String(raw).replace(/\D/g, ''), 10) || fallback) : fallback;
}

async function notify(message, link) {
  await fetch(`${SUPABASE_URL}/rest/v1/dsd_notifications`, {
    method: 'POST',
    headers: { ...H(), Prefer: 'return=minimal' },
    body: JSON.stringify({ type: 'lead-website', message, time_ago: 'Baru saja', read: false, link }),
  });
}

async function handleCareer(body, res) {
  const { nama, hp, kota, pengalaman } = body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama wajib diisi' });
  if (!hp?.trim())   return res.status(400).json({ error: 'No. HP wajib diisi' });

  // Duplikat by phone → tetap sukses (lead sudah tercatat), jangan bocorkan data
  const dup = await fetch(
    `${SUPABASE_URL}/rest/v1/dsd_agents?phone=eq.${encodeURIComponent(hp.trim())}&select=id`,
    { headers: H() }
  );
  const dupRows = await dup.json().catch(() => []);
  if (Array.isArray(dupRows) && dupRows.length) return res.status(200).json({ ok: true });

  const newId = 'AGT' + String((await maxIdNumber('dsd_agents', 0)) + 1).padStart(3, '0');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/dsd_agents`, {
    method: 'POST',
    headers: { ...H(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: newId, name: nama.trim(), phone: hp.trim(), city: kota?.trim() || '',
      status: 'nonaktif',
      join_date: new Date().toISOString().slice(0, 10),
      target: 0, total_approve: 0, total_reject: 0, total_berkas: 0,
      notes: pengalaman ? `Lead website. Pengalaman sales: ${pengalaman}` : 'Lead dari website',
    }),
  });
  if (!r.ok) return res.status(500).json({ error: 'Gagal menyimpan data' });

  await notify(`Lead agen dari website: ${nama.trim()} (${kota?.trim() || '-'})`, '/agents');
  return res.status(200).json({ ok: true, id: newId });
}

async function handleInquiry(body, res) {
  const { jenis, tahun, nilaiKendaraan, estimasiDana, kota, whatsapp } = body;
  if (!whatsapp?.trim()) return res.status(400).json({ error: 'Nomor WhatsApp wajib diisi' });

  // Lead di-assign ke akun owner (jangan hardcode email — cari by role)
  const ownerR = await fetch(
    `${SUPABASE_URL}/rest/v1/dsd_profiles?role=eq.owner&select=agent_id,name&limit=1`,
    { headers: H() }
  );
  const ownerRows = await ownerR.json().catch(() => []);
  const owner = Array.isArray(ownerRows) ? ownerRows[0] : null;

  const DANA = { lt5: 3000000, '5-10': 7500000, '10-25': 17500000, '25-50': 37500000, gt50: 60000000 };

  const newId = 'BRK' + String((await maxIdNumber('dsd_applications', 2026000)) + 1).padStart(7, '0');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/dsd_applications`, {
    method: 'POST',
    headers: { ...H(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: newId, status: 'pending',
      agent_id: owner?.agent_id ?? null,
      agent_name: owner?.name ?? 'Website',
      customer_name: `Lead Web ${whatsapp.trim()}`,
      phone: whatsapp.trim(),
      city: kota?.trim() || '',
      unit_type: jenis === 'motor' ? 'Motor (BPKB)' : 'Mobil (BPKB)',
      unit_year: tahun ? (parseInt(tahun, 10) || null) : null,
      pinjaman: DANA[estimasiDana] || 0,
      tenor: 12, estimasi_angsuran: 0,
      input_date: new Date().toISOString().slice(0, 10),
      notes: `Inquiry website. Nilai kendaraan: ${nilaiKendaraan || '-'}. Estimasi dana: ${estimasiDana || '-'}.`,
    }),
  });
  if (!r.ok) return res.status(500).json({ error: 'Gagal menyimpan data' });

  await notify(`Inquiry dana dari website: ${whatsapp.trim()} (${kota?.trim() || '-'})`, '/applications');
  return res.status(200).json({ ok: true, id: newId });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SERVICE_KEY) return res.status(500).json({ error: 'Konfigurasi server belum lengkap' });

  const body = req.body || {};
  // Honeypot: field "website" tersembunyi di form — manusia tidak mengisinya.
  // Bot yang mengisi diberi respons sukses palsu agar tidak belajar.
  if (body.website) return res.status(200).json({ ok: true });
  if (rateLimited(req)) return res.status(429).json({ error: 'Terlalu banyak permintaan — coba lagi sebentar lagi' });

  if (body.type === 'career')  return handleCareer(body, res);
  if (body.type === 'inquiry') return handleInquiry(body, res);
  return res.status(400).json({ error: 'type tidak dikenal' });
}
