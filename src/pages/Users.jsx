import { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Shield, Check } from 'lucide-react';

const ROLES = [
  { key: 'super-admin', label: 'Super Admin',      color: '#ef4444', bg: '#fef2f2' },
  { key: 'admin',       label: 'Admin/Back Office', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'agen',        label: 'Agen',              color: '#22c55e', bg: '#f0fdf4' },
  { key: 'surveyor',    label: 'Surveyor',          color: '#f59e0b', bg: '#fffbeb' },
  { key: 'finance',     label: 'Finance',           color: '#8b5cf6', bg: '#f5f3ff' },
];

const PERMISSIONS = {
  'super-admin': ['Semua akses sistem', 'Kelola user & role', 'Kelola data leasing', 'Kelola pembayaran komisi', 'Lihat semua laporan', 'Pengaturan sistem'],
  'admin':       ['Proses & input berkas', 'Ubah status pengajuan', 'Atur jadwal survey', 'Lihat laporan & komisi'],
  'agen':        ['Input berkas baru', 'Lihat berkas milik sendiri', 'Lihat jadwal survey', 'Lihat komisi sendiri'],
  'surveyor':    ['Lihat jadwal survey', 'Update hasil survey', 'Tambah catatan lapangan'],
  'finance':     ['Kelola pembayaran komisi', 'Ubah status komisi', 'Lihat laporan pembayaran'],
};

function RoleBadge({ role }) {
  const r = ROLES.find(r => r.key === role);
  if (!r) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: r.bg, color: r.color, whiteSpace: 'nowrap' }}>
      {r.label}
    </span>
  );
}

const EMPTY_USER = { name: '', email: '', password: '', role: 'admin', status: 'aktif', agentId: null };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Users() {
  const { users, setUsers, agents, showToast } = useApp();
  const [showModal, setShow]        = useState(false);
  const [editUser, setEdit]         = useState(null);
  const [selectedRole, setSelRole]  = useState('super-admin');
  const [form, setForm]             = useState(EMPTY_USER);
  const [errors, setErrors]         = useState({});

  const openEdit = user => { setEdit(user); setForm({ ...user, password: '' }); setErrors({}); setShow(true); };
  const openAdd  = ()   => { setEdit(null); setForm(EMPTY_USER); setErrors({}); setShow(true); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Nama wajib diisi';
    if (!form.email?.trim()) e.email = 'Email wajib diisi';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Format email tidak valid';
    else if (users.some(u => u.email === form.email.trim() && u.id !== editUser?.id)) e.email = 'Email sudah digunakan';
    if (!editUser && !form.password?.trim()) e.password = 'Password wajib diisi';
    if (form.role === 'agen' && !form.agentId) e.agentId = 'Pilih agen terkait';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const { password, ...rest } = form;
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...rest } : u));
      showToast(`Data user ${form.name} berhasil diperbarui`);
    } else {
      setUsers(prev => [...prev, { ...rest, id: users.length + 1, lastLogin: '-' }]);
      showToast(`User ${form.name} berhasil ditambahkan`);
    }
    setShow(false);
  };

  const sf = k => v => setForm(p => ({ ...p, [k]: v }));
  const F = ({ label, children, error }) => (
    <div><label className="label">{label}</label>{children}{error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}</div>
  );

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
                const r = ROLES.find(r => r.key === user.role);
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
                    <td className="table-td"><RoleBadge role={user.role} /></td>
                    <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{user.agentId || '-'}</td>
                    <td className="table-td"><Badge status={user.status} /></td>
                    <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)', fontFamily: 'monospace' }}>{user.lastLogin}</td>
                    <td className="table-td">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(user)}><Edit2 size={13} /></button>
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
          {ROLES.map(role => (
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
                  {PERMISSIONS[role.key].map(p => (
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
        title={editUser ? 'Edit User' : 'Tambah User Baru'}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShow(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
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
              {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </F>
          {form.role === 'agen' && (
            <F label="Agen Terkait" error={errors.agentId}>
              <select className="input" value={form.agentId || ''} onChange={e => sf('agentId')(e.target.value)} style={errors.agentId ? { borderColor: '#ef4444' } : undefined}>
                <option value="">-- Pilih Agen --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </F>
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
