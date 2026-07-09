import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await login(email, password);
    if (result?.user) navigate('/dashboard');
    else setError(result?.error || 'Email atau password salah');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px', position: 'relative', overflow: 'hidden',
      }} className="md:flex" id="left-panel">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,.06)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>FinanceERP</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Multifinance Management System</p>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            Kelola Bisnis<br />Multifinance Anda<br />Lebih Efisien
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 400 }}>
            Platform ERP terintegrasi untuk mengelola agen, berkas pengajuan, komisi, survei, dan laporan dalam satu sistem.
          </p>

          <div style={{ display: 'flex', gap: 20, marginTop: 48 }}>
            {[
              { v: '1,200+', l: 'Berkas Diproses' },
              { v: '87%', l: 'Tingkat Approve' },
              { v: '40+', l: 'Mitra Leasing' },
            ].map(({ v, l }) => (
              <div key={l}>
                <p style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{v}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 40px',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-0f172a)' }}>FinanceERP</p>
            <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>Multifinance System</p>
          </div>
        </div>

        <div className="anim-fade-up">
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-0f172a)', marginBottom: 6 }}>Selamat datang</h2>
          <p style={{ fontSize: 14, color: 'var(--c-64748b)', marginBottom: 32 }}>Masuk ke akun Anda untuk melanjutkan</p>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="label">Email</label>
              <input
                className="input"
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@perusahaan.co.id"
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 24 }}>
              <label className="label">Password</label>
              <div className="input-wrap">
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  style={{ paddingRight: 40 }}
                  required
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="input-icon-right">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : <LogIn size={17} />}
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: 'var(--c-cbd5e1)', textAlign: 'center', marginTop: 40 }}>
          © 2026 FinanceERP · PT. Mitra Dana Indonesia
        </p>
      </div>

    </div>
  );
}
