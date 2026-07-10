// Vercel Serverless (ES Module): pendaftaran mandiri agen dari landing page.
// Tidak butuh auth token — public endpoint. Membuat:
//   1. Supabase auth user (password default "password", email_confirm=true)
//   2. dsd_agents (status nonaktif)
//   3. dsd_profiles (status nonaktif, role agen)
//   4. Notifikasi ke owner
//
// Service key hanya ada di env vars Vercel — tidak pernah ke frontend.

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/^﻿/, '').trim();
const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_KEY || '').replace(/^﻿/, '').trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SERVICE_KEY) return res.status(500).json({ error: 'Konfigurasi server belum lengkap' });

  const { name, phone, email, city, address, nik } = req.body || {};
  if (!name?.trim())                       return res.status(400).json({ error: 'Nama wajib diisi' });
  if (!phone?.trim())                      return res.status(400).json({ error: 'No. HP wajib diisi' });
  if (!email?.trim() || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email valid wajib diisi — digunakan untuk login' });
  if ((nik || '').length !== 16)           return res.status(400).json({ error: 'NIK harus 16 digit' });

  const h = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Cek duplikat NIK / phone
  const dup = await fetch(
    `${SUPABASE_URL}/rest/v1/dsd_agents?or=(nik.eq.${encodeURIComponent(nik)},phone.eq.${encodeURIComponent(phone.trim())})&select=id`,
    { headers: h }
  );
  const dupRows = await dup.json();
  if (Array.isArray(dupRows) && dupRows.length) return res.status(400).json({ error: 'NIK atau No. HP sudah terdaftar' });

  // 2. Buat auth user (password default "password")
  const authR = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ email: email.trim(), password: 'password', email_confirm: true, user_metadata: { name: name.trim() } }),
  });
  const authUser = await authR.json();
  if (!authR.ok || authUser.error) {
    const msg = authUser.error?.message || authUser.msg || '';
    if (msg.includes('already registered')) return res.status(400).json({ error: 'Email sudah terdaftar di sistem' });
    return res.status(400).json({ error: 'Gagal membuat akun: ' + msg });
  }
  const userId = authUser.id;

  // 3. Hitung agent ID baru
  const cntR   = await fetch(`${SUPABASE_URL}/rest/v1/dsd_agents?select=id`, { headers: h });
  const allAgt = await cntR.json().catch(() => []);
  const newId  = 'AGT' + String((Array.isArray(allAgt) ? allAgt.length : 0) + 1).padStart(3, '0');

  // 4. Insert dsd_agents (nonaktif)
  const agtR = await fetch(`${SUPABASE_URL}/rest/v1/dsd_agents`, {
    method: 'POST',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: newId, name: name.trim(), phone: phone.trim(), email: email.trim(),
      city: city?.trim() || '', address: address?.trim() || '', nik,
      status: 'nonaktif',
      join_date: new Date().toISOString().slice(0, 10),
      target: 10, total_approve: 0, total_reject: 0, total_berkas: 0,
      notes: 'Pendaftaran mandiri dari landing page — menunggu aktivasi owner',
    }),
  });
  if (!agtR.ok) {
    // Rollback auth user
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: h });
    return res.status(500).json({ error: 'Gagal menyimpan data agen' });
  }

  // 5. Insert dsd_profiles (nonaktif, role agen)
  const profR = await fetch(`${SUPABASE_URL}/rest/v1/dsd_profiles`, {
    method: 'POST',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ id: userId, name: name.trim(), email: email.trim(), role: 'agen', status: 'nonaktif', agent_id: newId }),
  });
  if (!profR.ok) {
    // Trigger mungkin sudah buat profil — patch saja
    await fetch(`${SUPABASE_URL}/rest/v1/dsd_profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), role: 'agen', status: 'nonaktif', agent_id: newId }),
    });
  }

  // 6. Notifikasi ke owner
  await fetch(`${SUPABASE_URL}/rest/v1/dsd_notifications`, {
    method: 'POST',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({
      type: 'agen-baru',
      message: `Lamaran agen baru: ${name.trim()} (${city?.trim() || '-'}) — menunggu aktivasi`,
      time_ago: 'Baru saja', read: false, link: '/agents',
    }),
  });

  return res.status(200).json({ id: newId });
}
