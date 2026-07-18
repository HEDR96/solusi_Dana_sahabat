// Vercel Serverless Function (ES Module): upload & list file ke Google Drive via Service Account.
// Env vars (set di Vercel Dashboard → Settings → Environment Variables):
//   GDRIVE_CLIENT_EMAIL  — client_email dari file key service account
//   GDRIVE_PRIVATE_KEY   — private_key dari file key (dengan \n literal)
//   GDRIVE_FOLDER_ID     — ID folder tujuan (dari URL folder Drive)
import crypto from 'crypto';

const SUPABASE_URL  = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/^﻿/, '').trim();
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').replace(/^﻿/, '').trim();

let cachedToken = null;

async function verifySupabaseUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: auth },
    });
    return r.ok;
  } catch { return false; }
}

// Cek apakah caller berhak melihat berkas ini. Query pakai TOKEN CALLER (bukan
// service key) sehingga RLS dsd_applications yang memutuskan — agen hanya lolos
// untuk berkasnya sendiri, spv untuk agen binaannya, dst. Tanpa cek ini, agen
// mana pun bisa menebak appId berurutan dan membaca dokumen (KTP/KK) orang lain.
async function callerCanAccessApp(req, appId) {
  if (!appId) return false;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/dsd_applications?id=eq.${encodeURIComponent(appId)}&select=id`,
      { headers: { apikey: SUPABASE_ANON, Authorization: req.headers.authorization || '' } }
    );
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedToken.exp - 60000) return cachedToken.token;

  const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
  const privateKey  = (process.env.GDRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) throw new Error('GDRIVE_CLIENT_EMAIL / GDRIVE_PRIVATE_KEY belum diset');

  const now    = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim  = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })).toString('base64url');
  const input     = `${header}.${claim}`;
  const signature = crypto.createSign('RSA-SHA256').update(input).sign(privateKey, 'base64url');

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${input}.${signature}`,
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Gagal ambil token Google: ' + JSON.stringify(data));

  cachedToken = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const folderId = process.env.GDRIVE_FOLDER_ID;
  if (!folderId) return res.status(500).json({ error: 'GDRIVE_FOLDER_ID belum diset' });

  if (!(await verifySupabaseUser(req))) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  try {
    const token = await getAccessToken();

    if (req.method === 'GET') {
      const appId = String(req.query.appId || '').replace(/[^A-Za-z0-9_-]/g, '');
      if (!appId) return res.status(400).json({ error: 'appId wajib' });
      if (!(await callerCanAccessApp(req, appId))) {
        return res.status(403).json({ error: 'Tidak berhak mengakses dokumen berkas ini' });
      }
      const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and name contains '${appId}'`);
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink,thumbnailLink,createdTime)&orderBy=createdTime desc&pageSize=50&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await r.json();
      if (data.error) return res.status(500).json({ error: data.error.message });
      return res.status(200).json({ files: data.files || [] });
    }

    if (req.method === 'POST') {
      const { filename, contentType, dataBase64 } = req.body || {};
      if (!filename || !dataBase64) return res.status(400).json({ error: 'filename dan dataBase64 wajib' });

      const safeName = String(filename).replace(/[^A-Za-z0-9._-]/g, '_');
      // Nama file selalu berpola <appId>_<jenis>_... — pastikan caller berhak atas berkasnya
      const appIdFromName = safeName.split('_')[0];
      if (!(await callerCanAccessApp(req, appIdFromName))) {
        return res.status(403).json({ error: 'Tidak berhak mengunggah dokumen untuk berkas ini' });
      }
      const buffer   = Buffer.from(dataBase64, 'base64');
      const metadata = { name: safeName, parents: [folderId] };
      const boundary = 'bnd' + Date.now();
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType || 'image/jpeg'}\r\n\r\n`),
        buffer,
        Buffer.from(`\r\n--${boundary}--`),
      ]);

      const r = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
      );
      const data = await r.json();
      if (data.error) return res.status(500).json({ error: data.error.message });
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
