import { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../data/dummyData';
import { exportToCsv } from '../../utils/exportCsv';
import { useSortableData } from '../../utils/useSortableData';
import { SortableTh } from '../../components/UI/SortableTh';
import { useDebounce } from '../../utils/useDebounce';
import { Plus, Search, Eye, Edit2, Download, MapPin, TrendingUp } from 'lucide-react';

const F = memo(({ label, children, error }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
  </div>
));

const SORT_GETTERS = {
  name: r => r.name, city: r => r.city, target: r => r.target,
  totalBerkas: r => r.totalBerkas, totalApprove: r => r.totalApprove, totalReject: r => r.totalReject,
};

const AGENT_COLUMNS = [
  { label: 'ID', key: 'id' }, { label: 'Nama', key: 'name' }, { label: 'Kota', key: 'city' },
  { label: 'Telepon', key: 'phone' }, { label: 'Email', key: 'email' }, { label: 'NIK', key: 'nik' },
  { label: 'Status', key: 'status' }, { label: 'Target/Bulan', key: 'target' },
  { label: 'Total Berkas', key: 'totalBerkas' }, { label: 'Approve', key: 'totalApprove' }, { label: 'Reject', key: 'totalReject' },
  { label: 'Bank', key: 'bank' }, { label: 'No. Rekening', key: 'accountNumber' }, { label: 'Tgl Bergabung', key: 'joinDate' },
];

const EMPTY = {
  name: '', phone: '', email: '', city: '', address: '', nik: '',
  status: 'aktif', joinDate: '', bank: '', accountNumber: '', accountName: '',
  target: 10, notes: '',
};

export function AgentList() {
  const { agents, addAgent, updateAgent, showToast } = useApp();
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [filterStatus, setStatus] = useState('all');
  const [filterCity, setCity]     = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [page, setPage]           = useState(1);
  const PER = 8;

  const debouncedSearch = useDebounce(search, 300);

  const cities = useMemo(() => [...new Set(agents.map(a => a.city))].sort(), [agents]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return agents.filter(a =>
      (!q || a.name.toLowerCase().includes(q) || a.phone.includes(q) || a.id.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || a.status === filterStatus) &&
      (filterCity   === 'all' || a.city === filterCity)
    );
  }, [agents, debouncedSearch, filterStatus, filterCity]);

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filtered, SORT_GETTERS);
  const rows = sorted.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(sorted.length / PER);

  const openEdit = useCallback(a => { setEditItem(a); setForm({ ...a }); setErrors({}); setShowModal(true); }, []);
  const openAdd  = useCallback(() => { setEditItem(null); setForm(EMPTY); setErrors({}); setShowModal(true); }, []);
  const set = useCallback(k => v => setForm(p => ({ ...p, [k]: v })), []);

  const validate = useCallback(() => {
    const e = {};
    if (!form.name?.trim())  e.name  = 'Nama wajib diisi';
    if (!form.phone?.trim()) e.phone = 'Nomor HP wajib diisi';
    if (!form.city?.trim())  e.city  = 'Kota wajib diisi';
    if (!form.nik?.trim())   e.nik   = 'NIK wajib diisi';
    else if (form.nik.trim().length !== 16) e.nik = 'NIK harus 16 digit';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    let ok;
    if (editItem) {
      ok = await updateAgent(editItem.id, form);
      if (ok) showToast(`Data agen ${form.name} berhasil diperbarui`);
    } else {
      ok = await addAgent(form);
      if (ok) showToast(`Agen ${form.name} berhasil ditambahkan`);
    }
    setSaving(false);
    if (ok) setShowModal(false);
  }, [editItem, form, addAgent, updateAgent, showToast, validate]);

  return (
    <Layout title="Daftar Agen" subtitle={`${agents.filter(a => a.status === 'aktif').length} agen aktif dari ${agents.length} total`}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: 240 }}>
          <Search size={14} color="var(--c-94a3b8)" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama, telepon, ID agen..." />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterCity} onChange={e => { setCity(e.target.value); setPage(1); }}>
          <option value="all">Semua Kota</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => exportToCsv('daftar-agen', AGENT_COLUMNS, filtered)}>
          <Download size={15} /> Export
        </button>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah Agen</button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{filtered.length} agen ditemukan</p>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-94a3b8)' }}>
            <span>Aktif: <strong style={{ color: '#22c55e' }}>{agents.filter(a => a.status === 'aktif').length}</strong></span>
            <span>Nonaktif: <strong style={{ color: '#ef4444' }}>{agents.filter(a => a.status === 'nonaktif').length}</strong></span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              <SortableTh label="Agen" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Kota" sortKey="city" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Telepon</th>
              <SortableTh label="Target/Bln" sortKey="target" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Total Berkas" sortKey="totalBerkas" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Approve" sortKey="totalApprove" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Reject" sortKey="totalReject" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Status</th>
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-0f172a)' }}>Tidak ada agen ditemukan</p>
                    <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Coba ubah kata kunci atau filter</p>
                  </div>
                </td>
              </tr>
            ) : rows.map(ag => {
              const rate = ag.totalBerkas > 0 ? Math.round((ag.totalApprove / ag.totalBerkas) * 100) : 0;
              return (
                <tr key={ag.id} className="table-row">
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>
                        {ag.name[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{ag.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', fontFamily: 'monospace' }}>{ag.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-64748b)', fontSize: 13 }}>
                      <MapPin size={12} color="var(--c-94a3b8)" /> {ag.city}
                    </div>
                  </td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)' }}>{ag.phone}</td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)', textAlign: 'center' }}>{ag.target}</td>
                  <td className="table-td" style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{ag.totalBerkas}</span>
                  </td>
                  <td className="table-td" style={{ textAlign: 'center' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{ag.totalApprove}</span>
                      <div style={{ fontSize: 10, color: 'var(--c-94a3b8)' }}>{rate}%</div>
                    </div>
                  </td>
                  <td className="table-td" style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{ag.totalReject}</span>
                  </td>
                  <td className="table-td"><Badge status={ag.status} /></td>
                  <td className="table-td">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/agents/${ag.id}`)}>
                        <Eye size={13} /> Detail
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ag)}>
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>
              {(page - 1) * PER + 1}–{Math.min(page * PER, filtered.length)} dari {filtered.length}
            </p>
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? `Edit Agen — ${editItem.name}` : 'Tambah Agen Baru'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Tambah Agen')}</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <F label="Nama Lengkap" error={errors.name}><input className="input" value={form.name} onChange={e => set('name')(e.target.value)} style={errors.name ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Nomor HP" error={errors.phone}><input className="input" value={form.phone} onChange={e => set('phone')(e.target.value)} style={errors.phone ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Email"><input className="input" type="email" value={form.email} onChange={e => set('email')(e.target.value)} /></F>
          <F label="NIK / KTP" error={errors.nik}><input className="input" value={form.nik} onChange={e => set('nik')(e.target.value)} style={errors.nik ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Kota" error={errors.city}><input className="input" value={form.city} onChange={e => set('city')(e.target.value)} style={errors.city ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Status">
            <select className="input" value={form.status} onChange={e => set('status')(e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </F>
          <div style={{ gridColumn: 'span 2' }}>
            <F label="Alamat"><input className="input" value={form.address} onChange={e => set('address')(e.target.value)} /></F>
          </div>
          <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-64748b)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Rekening Bank</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Nama Bank"><input className="input" value={form.bank} onChange={e => set('bank')(e.target.value)} /></F>
              <F label="Nomor Rekening"><input className="input" value={form.accountNumber} onChange={e => set('accountNumber')(e.target.value)} /></F>
              <F label="Nama Pemilik Rekening"><input className="input" value={form.accountName} onChange={e => set('accountName')(e.target.value)} /></F>
              <F label="Target Bulanan (berkas)"><input className="input" type="number" value={form.target} onChange={e => set('target')(Number(e.target.value))} /></F>
            </div>
          </div>
          <F label="Tanggal Bergabung"><input className="input" type="date" value={form.joinDate} onChange={e => set('joinDate')(e.target.value)} /></F>
          <div style={{ gridColumn: 'span 2' }}>
            <F label="Catatan"><textarea className="input textarea" value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} /></F>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
