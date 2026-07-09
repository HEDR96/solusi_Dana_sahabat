import { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { User, Mail, Shield, KeyRound, Save } from 'lucide-react';

const ROLE_LABEL = {
  'super-admin': 'Super Admin',
  admin:         'Admin / Back Office',
  agen:          'Agen',
  surveyor:      'Surveyor',
  finance:       'Finance',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Profile() {
  const { currentUser, updateProfile, users } = useApp();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileErrors, setProfileErrors] = useState({});

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaved, setPwSaved] = useState(false);

  if (!currentUser) return null;

  const handleSaveProfile = () => {
    const e = {};
    if (!name.trim()) e.name = 'Nama wajib diisi';
    if (!email.trim()) e.email = 'Email wajib diisi';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Format email tidak valid';
    else if (users.some(u => u.email === email.trim() && u.id !== currentUser.id)) e.email = 'Email sudah digunakan';
    setProfileErrors(e);
    if (Object.keys(e).length > 0) return;
    updateProfile({ name: name.trim(), email: email.trim() });
  };

  const handleChangePassword = () => {
    const e = {};
    if (!currentPw.trim()) e.currentPw = 'Password saat ini wajib diisi';
    if (!newPw.trim()) e.newPw = 'Password baru wajib diisi';
    else if (newPw.length < 6) e.newPw = 'Password baru minimal 6 karakter';
    if (confirmPw !== newPw) e.confirmPw = 'Konfirmasi password tidak cocok';
    setPwErrors(e);
    if (Object.keys(e).length > 0) return;
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
  };

  const Field = ({ label, error, children }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );

  return (
    <Layout title="Profil Saya" subtitle="Kelola informasi akun dan keamanan Anda">
      <div className="rgrid rgrid-sidebar-l" style={{ gap: 20, alignItems: 'start' }}>
        {/* Profile summary card */}
        <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', margin: '0 auto 12px', fontSize: 28, fontWeight: 800 }}>
            {currentUser.name?.[0]}
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 4 }}>{currentUser.name}</h2>
          <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginBottom: 12 }}>{currentUser.email}</p>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8' }}>
            {ROLE_LABEL[currentUser.role] || currentUser.role}
          </span>
          {currentUser.agentId && (
            <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 12, fontFamily: 'monospace' }}>{currentUser.agentId}</p>
          )}
          {currentUser.lastLogin && (
            <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
              Login terakhir: {currentUser.lastLogin}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info akun */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
              <User size={16} color="#3b82f6" />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>Informasi Akun</p>
            </div>
            <div className="rgrid rgrid-2" style={{ gap: 14 }}>
              <Field label="Nama Lengkap" error={profileErrors.name}>
                <input className="input" value={name} onChange={e => setName(e.target.value)} style={profileErrors.name ? { borderColor: '#ef4444' } : undefined} />
              </Field>
              <Field label="Email" error={profileErrors.email}>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} style={profileErrors.email ? { borderColor: '#ef4444' } : undefined} />
              </Field>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <Save size={15} /> Simpan Perubahan
              </button>
            </div>
          </div>

          {/* Ganti password */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
              <KeyRound size={16} color="#3b82f6" />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>Ganti Password</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
              <Field label="Password Saat Ini" error={pwErrors.currentPw}>
                <input className="input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={pwErrors.currentPw ? { borderColor: '#ef4444' } : undefined} />
              </Field>
              <Field label="Password Baru" error={pwErrors.newPw}>
                <input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={pwErrors.newPw ? { borderColor: '#ef4444' } : undefined} />
              </Field>
              <Field label="Konfirmasi Password Baru" error={pwErrors.confirmPw}>
                <input className="input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={pwErrors.confirmPw ? { borderColor: '#ef4444' } : undefined} />
              </Field>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`btn ${pwSaved ? 'btn-success' : 'btn-primary'}`} onClick={handleChangePassword}>
                <KeyRound size={15} /> {pwSaved ? 'Password Diperbarui!' : 'Perbarui Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
