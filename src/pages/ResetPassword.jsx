import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Halaman tujuan link email "Lupa Password" (redirectTo: /reset-password).
// Supabase memproses token recovery di URL dan membuat sesi sementara;
// halaman ini menampilkan form untuk menyimpan password baru.
export function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady]       = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    // Tunggu Supabase selesai memproses token dari hash URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password minimal 6 karakter');
    if (password !== confirm) return setError('Konfirmasi password tidak sama');
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) return setError(err.message);
    setDone(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 1800);
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg, #f8fafc)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <KeyRound size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--c-0f172a)' }}>Atur Password Baru</h2>
        </div>

        {done ? (
          <div className="alert alert-success" style={{ display: 'flex', gap: 8 }}>
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13 }}>Password berhasil diubah — mengalihkan ke dashboard…</span>
          </div>
        ) : !ready ? (
          <p style={{ fontSize: 13, color: 'var(--c-64748b)', textAlign: 'center' }}>
            Memverifikasi link reset… Jika halaman ini tidak berubah, link mungkin sudah
            kedaluwarsa — minta link baru lewat "Lupa password?" di halaman login.
          </p>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <div className="alert alert-danger" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <Shield size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
            )}
            <div className="field" style={{ marginBottom: 14 }}>
              <label className="label">Password Baru</label>
              <div className="input-wrap">
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  style={{ paddingRight: 44 }}
                  autoComplete="new-password"
                  required autoFocus
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="input-icon-right">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 18 }}>
              <label className="label">Ulangi Password</label>
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Ketik ulang password baru"
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
              {saving ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
