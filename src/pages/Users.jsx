import { useState, useCallback, memo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { useMasterOptions, useMasterPairs } from '../utils/useMasterOptions';
import { supabase } from '../lib/supabaseClient';
import { Plus, Edit2, Shield, Check, RotateCcw, UserX, UserCheck } from 'lucide-react';

const F = memo(({ label, children, error }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
  </div>
));

// Fallback jika master_options (kategori 'role' / 'roleperm:<role>') belum di-migrate.
// Sumber utama: menu Master Data → dikelola owner, tanpa hardcode.
const FALLBACK_ROLES = [
  { value: 'owner',       label: 'Owner' },
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'admin',       label: 'Admin/Back Office' },
  { value: 'spv-agen',    label: 'Supervisor Agen' },
  { value: 'agen',        label: 'Agen' },
  { value: 'surveyor',    label: 'Surveyor' },
  { value: 'finance',     label: 'Finance' },
];

const FALLBACK_PERMISSIONS = {
  'owner':       ['Semua akses sistem tanpa batasan', 'Kelola semua user & role', 'Akses semua laporan & data', 'Kelola pengaturan sistem'],
  'super-admin': ['Semua akses sistem', 'Kelola user & role', 'Kelola data leasing', 'Kelola pembayaran komisi', 'Lihat semua laporan', 'Pengaturan sistem'],
  'admin':       ['Proses & input berkas', 'Ubah status pengajuan', 'Atur jadwal survey', 'Lihat laporan & komisi'],
  'spv-agen':    ['Lihat agen di bawah supervisinya', 'Monitor berkas & komisi agen binaan', 'Lihat aktivitas agen supervised', 'Laporan filtered per agen binaan'],
  'agen':        ['Input berkas baru', 'Lihat berkas milik sendiri', 'Lihat jadwal survey', 'Lihat komisi sendiri'],
  'surveyor':    ['Lihat jadwal survey', 'Update hasil survey', 'Tambah catatan lapangan'],
  'finance':     ['Kelola pembayaran komisi', 'Ubah status komisi', 'Lihat laporan pembayaran'],
};

// Warna badge per role (visual, bukan data) — role baru dapat warna default
const ROLE_COLORS = {
  'owner':       { color: '#7c3aed', bg: '#f5f3ff' },
  'super-admin': { color: '#ef4444', bg: '#fef2f2' },
  'admin':       { color: '#3b82f6', bg: '#eff6ff' },
  'spv-agen':    { color: '#f97316', bg: '#fff7ed' },
  'agen':        { color: '#22c55e', bg: '#f0fdf4' },
  'surveyor':    { color: '#f59e0b', bg: '#fffbeb' },
  'finance':     { color: '#8b5cf6', bg: '#f5f3ff' },
};
const DEFAULT_ROLE_COLOR = { color: '#64748b', bg: 'var(--surface-alt2)' };

function fmtLogin(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  const now = new Date();
  const mins = Math.floor((now - d) / 60000);
  if (mins < 1)   return 'Baru saja';
  if (mins < 60)  return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function RoleBadge({ role, roles }) {
  const r = roles.find(r => r.key === role);
  if (!r) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: r.bg, color: r.color, whiteSpace: 'nowrap' }}>
      {r.label}
    </span>
  );
}

const EMPTY_USER = { name: '', email: '', password: '', role: 'admin', status: 'aktif', agentId: null };
const EMPTY_AGENT = { phone: '', city: '', nik: '', address: '', bank: '', accountNumber: '', accountName: '', target: 10, spvId: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Users() {
  const { users, createUser, updateUserProfile, agents, addAgent, showToast, currentUser, assignAgentsToSpv, visibleAgents } = useApp();
  const [showModal, setShow]        = useState(false);
  const [editUser, setEdit]         = useState(null);
  const [selectedRole, setSelRole]  = useState('super-admin');
  const [form, setForm]             = useState(EMPTY_USER);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [resetting, setResetting]   = useState(null);
  const [toggling, setToggling]     = useState(null);
  const [spvAgentIds, setSpvAgentIds] = useState([]); // agent IDs assigned to SPV being edited
  const [agentMode, setAgentMode]   = useState('new');       // 'new' = daftarkan agen baru | 'existing' = hubungkan agen lama
  const [agentForm, setAgentForm]   = useState(EMPTY_AGENT); // data agen baru (role agen)

  const cityOptions = useMasterOptions('city', ['Medan', 'Binjai', 'Deli Serdang', 'Langkat', 'Tebing Tinggi', 'Pematang Siantar']);
  const bankOptions = useMasterOptions('bank', ['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI', 'BTPN', 'Danamon', 'Permata']);
  const supervisors = users.filter(u => u.role === 'spv-agen');

  const handleToggleStatus = async (user) => {
    setToggling(user.id);
    const newStatus = user.status === 'aktif' ? 'nonaktif' : 'aktif';
    await updateUserProfile(user.id, { ...user, status: newStatus });
    showToast(`User ${user.name} ${newStatus === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`);
    setToggling(null);
  };

  const handleResetPassword = async (user) => {
    // Generate temp password: 3 kata acak + angka
    const words = ['Solusi','Dana','Sahabat','Leasing','Berkas','Agen','Kredit','Motor','Mobil'];
    const tempPass = words[Math.floor(Math.random() * words.length)]
      + Math.floor(1000 + Math.random() * 9000);
    if (!confirm(`Reset password ${user.name}?\nPassword sementara: ${tempPass}\n\nSalin password ini sebelum melanjutkan.`)) return;
    setResetting(user.id);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { showToast('Sesi tidak valid', 'error'); setResetting(null); return; }
    const resp = await fetch('/api/admin-user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: user.id, password: tempPass }),
    });
    const result = await resp.json();
    setResetting(null);
    if (!resp.ok) { showToast('Gagal reset: ' + (result.error || `HTTP ${resp.status}`), 'error'); return; }
    showToast(`Password ${user.name} direset. Password sementara: ${tempPass}`, 'success', 8000);
  };

  // Role & kegunaannya dari DB (menu Master Data) — fallback ke konstanta lama
  const rolePairs = useMasterPairs('role', FALLBACK_ROLES);
  const roles = rolePairs.map(p => ({ key: p.value, label: p.label, ...(ROLE_COLORS[p.value] || DEFAULT_ROLE_COLOR) }));
  const selectedRolePerms = useMasterOptions(`roleperm:${selectedRole}`, FALLBACK_PERMISSIONS[selectedRole] || []);

  const openEdit = useCallback(user => {
    setEdit(user);
    setForm({ ...user, password: '' });
    setErrors({});
    setSpvAgentIds(user.role === 'spv-agen' ? agents.filter(a => a.spvId === user.id).map(a => a.id) : []);
    setAgentMode('existing');
    setAgentForm(EMPTY_AGENT);
    setShow(true);
  }, [agents]);
  const openAdd  = useCallback(()   => { setEdit(null); setForm(EMPTY_USER); setErrors({}); setSpvAgentIds([]); setAgentMode('new'); setAgentForm(EMPTY_AGENT); setShow(true); }, []);

  const isNewAgent = !editUser && form.role === 'agen' && agentMode === 'new';

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Nama wajib diisi';
    if (!form.email?.trim()) e.email = 'Email wajib diisi';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Format email tidak valid';
    else if (users.some(u => u.email === form.email.trim() && u.id !== editUser?.id)) e.email = 'Email sudah digunakan';
    if (!editUser && !form.password?.trim()) e.password = 'Password wajib diisi';
    if (form.role === 'agen') {
      if (isNewAgent) {
        if (!agentForm.phone?.trim()) e.agentPhone = 'Nomor HP wajib diisi';
        if (!agentForm.city?.trim())  e.agentCity  = 'Pilih kota';
        if (!agentForm.nik?.trim())   e.agentNik   = 'NIK wajib diisi';
        else if (agentForm.nik.trim().length !== 16) e.agentNik = 'NIK harus 16 digit';
      } else if (!form.agentId) {
        e.agentId = 'Pilih agen terkait';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    let ok;
    if (editUser) {
      ok = await updateUserProfile(editUser.id, form);
      if (ok) {
        if (form.role === 'spv-agen') await assignAgentsToSpv(editUser.id, spvAgentIds);
        showToast(`Data user ${form.name} berhasil diperbarui`);
      }
    } else if (isNewAgent) {
      // Buat record agen dulu (tanpa auto-akun), lalu akun login dengan password pilihan admin
      const newAgentId = await addAgent(
        { ...agentForm, name: form.name.trim(), email: form.email.trim(), status: form.status, notes: '' },
        { createAccount: false },
      );
      ok = newAgentId ? await createUser({ ...form, agentId: newAgentId }) : false;
    } else {
      ok = await createUser(form);
    }
    setSaving(false);
    if (ok) setShow(false);
  };

  const sf  = useCallback(k => v => setForm(p => ({ ...p, [k]: v })), []);
  const sfA = useCallback(k => v => setAgentForm(p => ({ ...p, [k]: v })), []);

  return (
    <Layout
      title="Manajemen User"
      subtitle={`${users.length} pengguna terdaftar`}
      actions={<button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah User</button>}
    >
      <div className="rgrid rgrid-sidebar-r" style={{ gap: 20, alignItems: 'start' }}>
        {/* User table */}
        <div className="table-wrap">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Daftar User ({users.length})</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="table-head">
              <tr>
                {['Nama', 'Email', 'Role', 'Agen', 'Status', 'Login Terakhir', 'Aksi'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const r = roles.find(r => r.key === user.role);
                return (
                  <tr key={user.id} className="table-row">
                    <td className="table-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: r ? `${r.bg}` : 'var(--border-light)', color: r ? r.color : 'var(--c-64748b)', fontSize: 12, fontWeight: 800 }}>
                          {user.name[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{user.email}</td>
                    <td className="table-td"><RoleBadge role={user.role} roles={roles} /></td>
                    <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{user.agentId || '-'}</td>
                    <td className="table-td"><Badge status={user.status} /></td>
                    <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{fmtLogin(user.lastLogin)}</td>
                    <td className="table-td" style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(user)}><Edit2 size={13} /></button>
                      {currentUser?.role === 'owner' && user.id !== currentUser.id && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Reset password sementara"
                            disabled={resetting === user.id}
                            onClick={() => handleResetPassword(user)}
                            style={{ color: '#f59e0b' }}
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title={user.status === 'aktif' ? 'Nonaktifkan user' : 'Aktifkan user'}
                            disabled={toggling === user.id}
                            onClick={() => handleToggleStatus(user)}
                            style={{ color: user.status === 'aktif' ? '#ef4444' : '#22c55e' }}
                          >
                            {user.status === 'aktif' ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Role permissions panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-64748b)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Hak Akses per Role</p>
          {roles.map(role => (
            <div key={role.key} onClick={() => setSelRole(role.key)}
              style={{
                background: 'var(--surface)', borderRadius: 12, padding: 14, cursor: 'pointer',
                border: `2px solid ${selectedRole === role.key ? role.color : 'var(--border-light)'}`,
                transition: 'border-color .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: selectedRole === role.key ? 10 : 0 }}>
                <Shield size={14} color={role.color} />
                <span style={{ fontSize: 12, fontWeight: 700, color: role.color }}>{role.label}</span>
              </div>
              {selectedRole === role.key && (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedRolePerms.map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-374151)' }}>
                      <Check size={12} color="#22c55e" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShow(false)}
        title={editUser ? 'Edit User' : (isNewAgent ? 'Daftarkan Agen Baru' : 'Tambah User Baru')}
        size={isNewAgent ? 'md' : 'sm'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShow(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <F label="Nama Lengkap" error={errors.name}>
            <input className="input" value={form.name} onChange={e => sf('name')(e.target.value)} style={errors.name ? { borderColor: '#ef4444' } : undefined} />
          </F>
          <F label="Email / Username" error={errors.email}>
            <input className="input" type="email" value={form.email} onChange={e => sf('email')(e.target.value)} style={errors.email ? { borderColor: '#ef4444' } : undefined} />
          </F>
          {!editUser && (
            <F label="Password" error={errors.password}>
              <input className="input" type="password" value={form.password} onChange={e => sf('password')(e.target.value)} placeholder="Masukkan password" style={errors.password ? { borderColor: '#ef4444' } : undefined} />
            </F>
          )}
          <F label="Role">
            <select className="input" value={form.role} onChange={e => sf('role')(e.target.value)}>
              {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </F>
          {form.role === 'agen' && editUser && (
            <F label="Agen Terkait" error={errors.agentId}>
              <select className="input" value={form.agentId || ''} onChange={e => sf('agentId')(e.target.value)} style={errors.agentId ? { borderColor: '#ef4444' } : undefined}>
                <option value="">-- Pilih Agen --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </F>
          )}
          {form.role === 'agen' && !editUser && (
            <>
              {/* Pilihan: daftarkan agen baru vs hubungkan agen lama */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--surface-alt)', borderRadius: 10, padding: 4 }}>
                {[
                  { key: 'new',      label: 'Daftarkan Agen Baru' },
                  { key: 'existing', label: 'Agen Sudah Ada' },
                ].map(m => (
                  <button key={m.key} type="button" onClick={() => setAgentMode(m.key)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all .15s',
                    background: agentMode === m.key ? 'var(--surface)' : 'transparent',
                    color: agentMode === m.key ? 'var(--c-0f172a)' : 'var(--c-64748b)',
                    boxShadow: agentMode === m.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                  }}>{m.label}</button>
                ))}
              </div>

              {agentMode === 'existing' ? (
                <F label="Agen Terkait" error={errors.agentId}>
                  <select className="input" value={form.agentId || ''} onChange={e => sf('agentId')(e.target.value)} style={errors.agentId ? { borderColor: '#ef4444' } : undefined}>
                    <option value="">-- Pilih Agen --</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </F>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p className="form-section-label" style={{ marginBottom: 0 }}>Data Agen</p>
                  <div className="form-grid" style={{ gap: 12 }}>
                    <F label="Nomor HP" error={errors.agentPhone}>
                      <input className="input" value={agentForm.phone} onChange={e => sfA('phone')(e.target.value)} placeholder="08xx-xxxx-xxxx" style={errors.agentPhone ? { borderColor: '#ef4444' } : undefined} />
                    </F>
                    <F label="NIK / KTP" error={errors.agentNik}>
                      <input className="input" value={agentForm.nik} onChange={e => sfA('nik')(e.target.value)} placeholder="16 digit" style={errors.agentNik ? { borderColor: '#ef4444' } : undefined} />
                    </F>
                    <F label="Kota" error={errors.agentCity}>
                      <select className="input" value={agentForm.city} onChange={e => sfA('city')(e.target.value)} style={errors.agentCity ? { borderColor: '#ef4444' } : undefined}>
                        <option value="">— Pilih Kota —</option>
                        {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </F>
                    <F label="Target Berkas/Bulan">
                      <input className="input" type="number" value={agentForm.target} onChange={e => sfA('target')(Number(e.target.value))} />
                    </F>
                    <div className="span-2">
                      <F label="Alamat"><input className="input" value={agentForm.address} onChange={e => sfA('address')(e.target.value)} /></F>
                    </div>
                    <F label="Bank">
                      <select className="input" value={agentForm.bank} onChange={e => sfA('bank')(e.target.value)}>
                        <option value="">— Pilih Bank —</option>
                        {bankOptions.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </F>
                    <F label="Nomor Rekening">
                      <input className="input" value={agentForm.accountNumber} onChange={e => sfA('accountNumber')(e.target.value)} />
                    </F>
                    <F label="Nama Pemilik Rekening">
                      <input className="input" value={agentForm.accountName} onChange={e => sfA('accountName')(e.target.value)} />
                    </F>
                    {supervisors.length > 0 && (
                      <F label="Supervisor">
                        <select className="input" value={agentForm.spvId} onChange={e => sfA('spvId')(e.target.value)}>
                          <option value="">— Tanpa Supervisor —</option>
                          {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </F>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {form.role === 'spv-agen' && editUser && (
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">Agen yang Dibawahi</label>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 200, overflowY: 'auto', padding: 4 }}>
                {agents.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', padding: '8px 12px' }}>Belum ada agen terdaftar</p>
                ) : agents.map(a => {
                  const checked = spvAgentIds.includes(a.id);
                  return (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderRadius: 8, background: checked ? '#eff6ff' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setSpvAgentIds(prev => e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id))}
                        style={{ width: 14, height: 14, flexShrink: 0 }}
                      />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{a.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{a.id} · {a.city}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 4 }}>{spvAgentIds.length} agen dipilih</p>
            </div>
          )}
          <F label="Status">
            <select className="input" value={form.status} onChange={e => sf('status')(e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </F>
        </div>
      </Modal>
    </Layout>
  );
}
