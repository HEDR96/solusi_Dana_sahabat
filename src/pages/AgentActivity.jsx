import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { Modal } from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES } from '../data/dummyData';
import { Plus, Search, Activity, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const EMPTY = { date: new Date().toISOString().split('T')[0], agentId: '', type: 'kunjungan-dealer', description: '', outcome: 'prospek-baru', relatedAppId: '' };

function OutcomeBadge({ outcome }) {
  const o = ACTIVITY_OUTCOMES.find(x => x.key === outcome);
  if (!o) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
      background: o.hex + '18', color: o.hex,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.hex }} />
      {o.label}
    </span>
  );
}

export function AgentActivity() {
  const { visibleActivities: activities, agents, applications, currentUser, addActivity } = useApp();
  const navigate = useNavigate();
  const isAgen = currentUser?.role === 'agen';
  const [search, setSearch]       = useState('');
  const [filterAgent, setAgent]   = useState('all');
  const [filterType, setType]     = useState('all');
  const [filterOutcome, setOut]   = useState('all');
  const [showModal, setShow]      = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});

  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    return (
      (!q || a.description.toLowerCase().includes(q) || a.agentName.toLowerCase().includes(q)) &&
      (filterAgent   === 'all' || a.agentId === filterAgent) &&
      (filterType    === 'all' || a.type === filterType) &&
      (filterOutcome === 'all' || a.outcome === filterOutcome)
    );
  }).sort((a, b) => b.date.localeCompare(a.date));

  const stats = {
    total: activities.length,
    prospekBaru: activities.filter(a => a.outcome === 'prospek-baru').length,
    menghasilkan: activities.filter(a => a.outcome === 'menghasilkan-berkas').length,
    followUp: activities.filter(a => a.outcome === 'follow-up-lanjutan').length,
  };

  const openAdd = () => {
    setForm({ ...EMPTY, agentId: isAgen ? currentUser.agentId : '' });
    setErrors({});
    setShow(true);
  };

  const sf = k => v => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'Tanggal wajib diisi';
    if (!isAgen && !form.agentId) e.agentId = 'Pilih agen';
    if (!form.description?.trim()) e.description = 'Deskripsi wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const agentId = isAgen ? currentUser.agentId : form.agentId;
    const ag = agents.find(a => a.id === agentId);
    addActivity({
      ...form,
      agentId,
      agentName: ag?.name || currentUser?.name || '',
      relatedAppId: form.relatedAppId || null,
    });
    setShow(false);
  };

  const myApps = applications.filter(a => a.agentId === (isAgen ? currentUser.agentId : form.agentId));

  const F = ({ label, error, children }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );

  const statCards = [
    { label: 'Total Aktivitas', value: stats.total, icon: Activity, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Prospek Baru', value: stats.prospekBaru, icon: TrendingUp, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Menghasilkan Berkas', value: stats.menghasilkan, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Perlu Follow Up', value: stats.followUp, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <Layout
      title="Aktivitas Agen"
      subtitle={isAgen ? 'Catat aktivitas harian pencarian nasabah Anda' : 'Pantau aktivitas prospecting seluruh agen'}
      actions={<button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Catat Aktivitas</button>}
    >
      {/* Summary */}
      <div className="rgrid rgrid-4" style={{ gap: 14, marginBottom: 20 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-0f172a)' }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: 220 }}>
          <Search size={14} color="var(--c-94a3b8)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari deskripsi atau nama agen..." />
        </div>
        {!isAgen && (
          <select className="input" style={{ width: 'auto' }} value={filterAgent} onChange={e => setAgent(e.target.value)}>
            <option value="all">Semua Agen</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <select className="input" style={{ width: 'auto' }} value={filterType} onChange={e => setType(e.target.value)}>
          <option value="all">Semua Jenis</option>
          {ACTIVITY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterOutcome} onChange={e => setOut(e.target.value)}>
          <option value="all">Semua Hasil</option>
          {ACTIVITY_OUTCOMES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{filtered.length} aktivitas ditemukan</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              {['Tanggal', ...(isAgen ? [] : ['Agen']), 'Jenis', 'Deskripsi', 'Hasil', 'Berkas Terkait'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-0f172a)' }}>Belum ada aktivitas tercatat</p>
                    <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Klik "Catat Aktivitas" untuk mulai mencatat</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(a => {
              const type = ACTIVITY_TYPES.find(t => t.key === a.type);
              return (
                <tr key={a.id} className="table-row">
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)', whiteSpace: 'nowrap' }}>{a.date}</td>
                  {!isAgen && (
                    <td className="table-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontSize: 11 }}>{a.agentName[0]}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{a.agentName}</span>
                      </div>
                    </td>
                  )}
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{type?.label || a.type}</td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)', maxWidth: 320 }}>{a.description}</td>
                  <td className="table-td"><OutcomeBadge outcome={a.outcome} /></td>
                  <td className="table-td">
                    {a.relatedAppId ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/applications/${a.relatedAppId}`)}>
                        {a.relatedAppId}
                      </button>
                    ) : <span style={{ fontSize: 12, color: 'var(--c-cbd5e1)' }}>-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShow(false)}
        title="Catat Aktivitas Baru"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShow(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <F label="Tanggal" error={errors.date}>
            <input className="input" type="date" value={form.date} onChange={e => sf('date')(e.target.value)} style={errors.date ? { borderColor: '#ef4444' } : undefined} />
          </F>
          {!isAgen && (
            <F label="Agen" error={errors.agentId}>
              <select className="input" value={form.agentId} onChange={e => sf('agentId')(e.target.value)} style={errors.agentId ? { borderColor: '#ef4444' } : undefined}>
                <option value="">-- Pilih Agen --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </F>
          )}
          <F label="Jenis Aktivitas">
            <select className="input" value={form.type} onChange={e => sf('type')(e.target.value)}>
              {ACTIVITY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </F>
          <F label="Hasil">
            <select className="input" value={form.outcome} onChange={e => sf('outcome')(e.target.value)}>
              {ACTIVITY_OUTCOMES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </F>
          <div style={{ gridColumn: 'span 2' }}>
            <F label="Deskripsi" error={errors.description}>
              <textarea className="input textarea" rows={3} value={form.description} onChange={e => sf('description')(e.target.value)} placeholder="Ceritakan aktivitas yang dilakukan..." style={errors.description ? { borderColor: '#ef4444' } : undefined} />
            </F>
          </div>
          {form.outcome === 'menghasilkan-berkas' && myApps.length > 0 && (
            <div style={{ gridColumn: 'span 2' }}>
              <F label="Hubungkan ke Berkas (opsional)">
                <select className="input" value={form.relatedAppId} onChange={e => sf('relatedAppId')(e.target.value)}>
                  <option value="">-- Tidak ada --</option>
                  {myApps.map(app => <option key={app.id} value={app.id}>{app.id} - {app.customerName}</option>)}
                </select>
              </F>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
