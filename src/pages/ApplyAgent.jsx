import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, CheckCircle } from 'lucide-react';

const EMPTY = { name: '', phone: '', email: '', city: '', address: '', nik: '' };

export function ApplyAgent() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);   // id agen jika sukses
  const [error, setError] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim())        return setError('Nama wajib diisi');
    if (!form.phone.trim())       return setError('No. HP wajib diisi');
    if (form.nik.trim().length !== 16) return setError('NIK harus 16 digit');

    setSaving(true);
    const { data, error: err } = await supabase.rpc('apply_as_agent', {
      p_name: form.name, p_phone: form.phone, p_email: form.email,
      p_city: form.city, p_address: form.address, p_nik: form.nik,
    });
    setSaving(false);
    if (err) setError(err.message.replace(/^.*?: /, ''));
    else setDone(data);
  };

  const F = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <UserPlus size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-0f172a, #0f172a)' }}>Lamar Jadi Agen</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Solusi Dana Sahabat — bergabung sebagai mitra agen</p>
        </div>

        <div className="card" style={{ padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(15,23,42,.06)' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Lamaran Terkirim! 🎉</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
                Nomor pendaftaran kamu: <strong style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{done}</strong><br />
                Tim kami akan menghubungi kamu setelah lamaran diverifikasi dan akun diaktifkan.
              </p>
              <Link to="/login" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#3b82f6' }}>← Kembali ke halaman login</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <F label="Nama Lengkap *"><input className="input" value={form.name} onChange={set('name')} placeholder="Sesuai KTP" /></F>
              <F label="NIK / KTP (16 digit) *"><input className="input" value={form.nik} onChange={set('nik')} maxLength={16} inputMode="numeric" /></F>
              <F label="Nomor HP / WhatsApp *"><input className="input" value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="08xxxxxxxxxx" /></F>
              <F label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} /></F>
              <F label="Kota"><input className="input" value={form.city} onChange={set('city')} /></F>
              <F label="Alamat"><input className="input" value={form.address} onChange={set('address')} /></F>

              {error && (
                <p style={{ fontSize: 13, color: '#ef4444', background: '#fef2f2', padding: '10px 12px', borderRadius: 10, marginBottom: 14 }}>{error}</p>
              )}

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: 15 }}>
                {saving ? 'Mengirim...' : 'Kirim Lamaran'}
              </button>
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>
                Sudah punya akun? <Link to="/login" style={{ color: '#3b82f6' }}>Masuk di sini</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
