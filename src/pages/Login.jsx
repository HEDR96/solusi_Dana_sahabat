import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn, Shield, TrendingUp, Users, FileCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATS = [
  { v: '1.200+', l: 'Berkas Diproses' },
  { v: '87%',    l: 'Tingkat Approve' },
  { v: '40+',    l: 'Mitra Leasing'   },
];

const FEATURES = [
  { icon: Users,      t: 'Manajemen Agen', d: 'Pantau kinerja agen & SPV secara real-time' },
  { icon: FileCheck,  t: 'Tracking Berkas', d: 'Alur pengajuan dari input hingga cair' },
  { icon: TrendingUp, t: 'Laporan & Komisi', d: 'Analitik penjualan & kalkulasi komisi otomatis' },
];

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await login(email, password);
    if (result?.user) navigate('/dashboard');
    else setError(result?.error || 'Email atau password salah');
    setLoading(false);
  };

  return (
    <div className="login-layout">
      {/* ── Left decorative panel ── */}
      <div className="login-left">
        <div className="login-left-blob login-left-blob-1" />
        <div className="login-left-blob login-left-blob-2" />
        <div className="login-left-blob login-left-blob-3" />

        <div className="login-left-inner">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Building2 size={22} color="#fff" />
            </div>
            <div>
              <p className="login-brand-name">FinanceERP</p>
              <p className="login-brand-sub">Multifinance Management System</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="login-headline">
            Kelola Bisnis<br />Multifinance Anda<br />Lebih Efisien
          </h1>
          <p className="login-tagline">
            Platform ERP terintegrasi untuk mengelola agen, berkas pengajuan,
            komisi, survei, dan laporan dalam satu sistem terpadu.
          </p>

          {/* Feature list */}
          <div className="login-features">
            {FEATURES.map(({ icon: Icon, t, d }) => (
              <div key={t} className="login-feature-item">
                <div className="login-feature-icon">
                  <Icon size={15} color="#60a5fa" />
                </div>
                <div>
                  <p className="login-feature-title">{t}</p>
                  <p className="login-feature-desc">{d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="login-stats">
            {STATS.map(({ v, l }) => (
              <div key={l} className="login-stat">
                <p className="login-stat-value">{v}</p>
                <p className="login-stat-label">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-form-wrap">
          {/* Mobile-only brand */}
          <div className="login-mobile-brand">
            <div className="login-brand-icon login-brand-icon-sm">
              <Building2 size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-0f172a)' }}>FinanceERP</p>
              <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>Multifinance System</p>
            </div>
          </div>

          <div className="anim-fade-up">
            <h2 className="login-form-title">Selamat datang 👋</h2>
            <p className="login-form-sub">Masuk ke akun Anda untuk melanjutkan</p>

            {error && (
              <div className="alert alert-danger login-error">
                <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="field login-field">
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@perusahaan.co.id"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field login-field">
                <label className="label">Password</label>
                <div className="input-wrap">
                  <input
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    style={{ paddingRight: 44 }}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="input-icon-right">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn btn-primary login-submit-btn"
              >
                {loading ? (
                  <div className="login-spinner" />
                ) : <LogIn size={17} />}
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
            </form>

            <p className="login-register-hint">
              Ingin bergabung jadi agen?{' '}
              <a href="/daftar-agen" className="login-link">Lamar di sini</a>
            </p>
          </div>

          <p className="login-footer">
            © 2026 FinanceERP · PT. Mitra Dana Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}
