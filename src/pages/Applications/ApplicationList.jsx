import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { useApp } from '../../context/AppContext';
import { formatRupiah, STATUSES } from '../../data/dummyData';
import { exportToCsv } from '../../utils/exportCsv';
import { useSortableData } from '../../utils/useSortableData';
import { SortableTh } from '../../components/UI/SortableTh';
import { useDebounce } from '../../utils/useDebounce';
import { useMasterOptions } from '../../utils/useMasterOptions';
import { supabase } from '../../lib/supabaseClient';
import {
  MOTOR_TENORS, CAR_TENORS,
  M_NEW_ANG, M_RO_ANG, M_NEW_FEE, M_RO_FEE,
  C_REG_ANG, C_RO_ANG, C_REG_FEE, C_RO_FEE,
  lookupVal,
} from '../../data/rateTables';
import { Plus, Search, Eye, Download, FileText, SlidersHorizontal, X, CheckSquare, TrendingUp } from 'lucide-react';

const DEFAULT_DOC_TYPES = ['KTP', 'Kartu Keluarga', 'STNK / BPKB', 'Slip Gaji', 'Foto Unit', 'Dok. Pendukung'];

const F = memo(({ label, children, error }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
  </div>
));

const SORT_GETTERS = {
  id: r => r.id, customerName: r => r.customerName, agentName: r => r.agentName,
  leasingName: r => r.leasingName, pinjaman: r => r.pinjaman, status: r => r.status, inputDate: r => r.inputDate,
};

const APPLICATION_COLUMNS = [
  { label: 'No. Berkas', key: 'id' }, { label: 'Nasabah', key: 'customerName' }, { label: 'NIK', key: 'nik' },
  { label: 'Telepon', key: 'phone' }, { label: 'Kota', key: 'city' }, { label: 'Unit', get: r => `${r.unitType} ${r.unitBrand}` },
  { label: 'Agen', key: 'agentName' }, { label: 'Leasing', key: 'leasingName' }, { label: 'Pinjaman', key: 'pinjaman' },
  { label: 'Tenor', key: 'tenor' }, { label: 'Status', key: 'status' }, { label: 'Tgl Input', key: 'inputDate' },
];

const EMPTY = {
  customerName: '', nik: '', phone: '', city: '', address: '',
  unitType: 'Mobil', unitYear: new Date().getFullYear(), unitBrand: '',
  pinjaman: '', tenor: 36, estimasiAngsuran: '', isRO: false,
  leasingId: '', leasingName: '',
  agentId: '', agentName: '', notes: '',
};

export function ApplicationList() {
  const { visibleApplications: applications, agents, leasing, addApplication, updateApplicationStatus, currentUser } = useApp();
  const navigate = useNavigate();
  const canBulkEdit = ['owner', 'super-admin', 'admin'].includes(currentUser?.role);
  const unitTypes    = useMasterOptions('unit_type', ['Mobil', 'Motor', 'Alat Berat', 'Lainnya']);
  const tenorOptions = useMasterOptions('tenor', ['12', '18', '24', '36', '48', '60']);
  const cityOptions  = useMasterOptions('city', ['Medan', 'Binjai', 'Deli Serdang', 'Langkat', 'Tebing Tinggi', 'Pematang Siantar']);
  const docTypes     = useMasterOptions('doc_type', DEFAULT_DOC_TYPES);
  const [search, setSearch]         = useState('');
  const [filterStatus, setStatus]   = useState('all');
  const [filterAgent, setAgent]     = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [errors, setErrors]         = useState({});
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [docChecked, setDocChecked] = useState({});
  const [docFiles, setDocFiles] = useState({});
  const [dbTables, setDbTables] = useState(null);
  const PER = 10;

  useEffect(() => {
    // Load semua tabel, group by leasing_key → { 'CMD': {motor_new_ang:...}, '5': {...} }
    supabase.from('dsd_rate_tables').select('leasing_key,product,tipe,data')
      .then(({ data }) => {
        if (!data?.length) return;
        const map = {};
        data.forEach(r => {
          const lk = r.leasing_key || 'CMD';
          if (!map[lk]) map[lk] = {};
          map[lk][`${r.product}_${r.tipe}`] = r.data;
        });
        setDbTables(map);
      });
  }, []);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return applications.filter(a =>
      (!q || a.customerName.toLowerCase().includes(q) || a.nik.includes(q) || a.phone.includes(q) || a.id.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || a.status === filterStatus) &&
      (filterAgent  === 'all' || a.agentId === filterAgent)
    );
  }, [applications, debouncedSearch, filterStatus, filterAgent]);

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filtered, SORT_GETTERS);
  const totalPages = Math.ceil(sorted.length / PER);
  const rows = sorted.slice((page - 1) * PER, page * PER);

  // Auto-hitung angsuran & komisi: pakai tabel leasing terpilih, fallback ke CMD Finance
  const rateResult = useMemo(() => {
    const p = Number(form.pinjaman);
    if (!p || p <= 0) return null;
    const jenis = form.unitType === 'Motor' ? 'motor' : 'mobil';
    const isRO_ = form.isRO;
    const pRibu = p / 1000;
    const tenors = jenis === 'motor' ? MOTOR_TENORS : CAR_TENORS;
    const tenor = Number(form.tenor);
    if (!tenors.includes(tenor)) return null;

    // Pilih tabel: leasing terpilih → CMD Finance DB → hardcoded fallback.
    // Baris "CMD Finance" di leasing partners memakai kunci rate khusus 'CMD'.
    const selName = leasing.find(l => l.id === Number(form.leasingId))?.name?.trim().toLowerCase();
    const lk = form.leasingId ? (selName === 'cmd finance' ? 'CMD' : String(form.leasingId)) : 'CMD';
    const leasingTables = (dbTables?.[lk] && Object.keys(dbTables[lk]).length) ? dbTables[lk]
      : (dbTables?.['CMD'] || {});
    const isOwnTables = !!(dbTables?.[lk] && Object.keys(dbTables[lk]).length);

    const gt = (key, fallback) => (leasingTables[key] && Object.keys(leasingTables[key]).length ? leasingTables[key] : fallback);
    const angTable = jenis === 'motor'
      ? gt(isRO_ ? 'motor_ro_ang' : 'motor_new_ang', isRO_ ? M_RO_ANG : M_NEW_ANG)
      : gt(isRO_ ? 'mobil_ro_ang' : 'mobil_reg_ang', isRO_ ? C_RO_ANG : C_REG_ANG);
    const feeTable = jenis === 'motor'
      ? gt(isRO_ ? 'motor_ro_fee' : 'motor_new_fee', isRO_ ? M_RO_FEE : M_NEW_FEE)
      : gt(isRO_ ? 'mobil_ro_fee' : 'mobil_reg_fee', isRO_ ? C_RO_FEE : C_REG_FEE);
    const angsuran = lookupVal(angTable, tenors, pRibu, tenor);
    const fee = lookupVal(feeTable, tenors, pRibu, tenor);
    if (!angsuran || !fee) return null;
    return { angsuran, fee, isOwnTables };
  }, [form.pinjaman, form.tenor, form.unitType, form.isRO, form.leasingId, dbTables, leasing]);

  const allOnPageSelected = rows.length > 0 && rows.every(r => selectedIds.has(r.id));
  const toggleRow = useCallback(id => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }), []);
  const toggleAllOnPage = useCallback(() => setSelectedIds(prev => {
    const next = new Set(prev);
    if (allOnPageSelected) rows.forEach(r => next.delete(r.id));
    else rows.forEach(r => next.add(r.id));
    return next;
  }), [allOnPageSelected, rows]);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectedApps = useMemo(() => applications.filter(a => selectedIds.has(a.id)), [applications, selectedIds]);

  const handleBulkStatus = () => {
    if (!bulkStatus) return;
    selectedApps.forEach(app => updateApplicationStatus(app.id, bulkStatus, 'Diubah melalui aksi massal'));
    setShowBulkStatus(false);
    setBulkStatus('');
    clearSelection();
  };

  const set = useCallback(k => v => setForm(p => ({ ...p, [k]: v })), []);

  const validate = useCallback(() => {
    const e = {};
    if (!form.customerName?.trim()) e.customerName = 'Nama nasabah wajib diisi';
    if (!form.nik?.trim()) e.nik = 'NIK wajib diisi';
    else if (form.nik.trim().length !== 16) e.nik = 'NIK harus 16 digit';
    if (!form.phone?.trim()) e.phone = 'Nomor telepon wajib diisi';
    if (!form.city?.trim()) e.city = 'Kota wajib diisi';
    if (!form.unitBrand?.trim()) e.unitBrand = 'Merk & model unit wajib diisi';
    if (!form.pinjaman || Number(form.pinjaman) <= 0) e.pinjaman = 'Pinjaman harus lebih dari 0';
    if (currentUser?.role !== 'agen' && !form.agentId) e.agentId = 'Pilih agen penginput';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, currentUser, agents]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    const ls = leasing.find(l => l.id === Number(form.leasingId));
    const ag = currentUser?.role === 'agen'
      ? agents.find(a => a.id === currentUser.agentId)
      : agents.find(a => a.id === form.agentId);
    addApplication({
      ...form,
      leasingId: Number(form.leasingId),
      leasingName: ls?.name || '',
      agentId: ag?.id || form.agentId,
      agentName: ag?.name || form.agentName,
      pinjaman: Number(form.pinjaman),
      estimasiAngsuran: Number(form.estimasiAngsuran),
    });
    setShowModal(false);
    setForm(EMPTY);
    setErrors({});
  }, [validate, form, currentUser, agents, addApplication]);

  const activeFilters = (filterStatus !== 'all' ? 1 : 0) + (filterAgent !== 'all' ? 1 : 0);

  return (
    <Layout
      title="Berkas Masuk"
      subtitle={`${applications.length} total pengajuan terdaftar`}
    >
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: 240 }}>
          <Search size={14} color="var(--c-94a3b8)" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama nasabah, NIK, nomor HP, nomor berkas..."
          />
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(v => !v)}
          style={{ position: 'relative' }}
        >
          <SlidersHorizontal size={15} />
          Filter
          {activeFilters > 0 && (
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilters}
            </span>
          )}
        </button>
        <button className="btn btn-secondary" onClick={() => exportToCsv('berkas-masuk', APPLICATION_COLUMNS, filtered)}>
          <Download size={15} /> Export
        </button>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setErrors({}); setDocChecked({}); setDocFiles({}); setShowModal(true); }}>
          <Plus size={16} /> Input Berkas
        </button>
      </div>

      {/* ── Inline filters ── */}
      {showFilters && (
        <div className="anim-fade-up card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label">Status Pengajuan</label>
            <select className="input input-sm" value={filterStatus} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Semua Status</option>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label">Agen</label>
            <select className="input input-sm" value={filterAgent} onChange={e => { setAgent(e.target.value); setPage(1); }}>
              <option value="all">Semua Agen</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setStatus('all'); setAgent('all'); setPage(1); }}>
            Reset filter
          </button>
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selectedIds.size > 0 && (
        <div className="anim-fade-up card" style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--selected-bg)', border: '1px solid #93c5fd' }}>
          <CheckSquare size={16} color="#2563eb" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{selectedIds.size} berkas dipilih</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCsv('berkas-terpilih', APPLICATION_COLUMNS, selectedApps)}>
            <Download size={13} /> Export Terpilih
          </button>
          {canBulkEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowBulkStatus(true)}>Ubah Status Massal</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={clearSelection}><X size={14} /> Batal</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="table-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>
            {filtered.length} berkas ditemukan
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUSES.slice(0, 4).map(s => {
              const count = applications.filter(a => a.status === s.key).length;
              if (!count) return null;
              return (
                <button
                  key={s.key}
                  onClick={() => { setStatus(filterStatus === s.key ? 'all' : s.key); setPage(1); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, border: '1.5px solid var(--border)', background: filterStatus === s.key ? 'var(--selected-bg)' : 'var(--surface)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--c-64748b)' }}
                >
                  {s.label} <span style={{ color: 'var(--c-0f172a)' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={24} color="var(--c-94a3b8)" /></div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-0f172a)' }}>Tidak ada berkas</p>
            <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Coba ubah filter atau tambah berkas baru</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="table-head">
              <tr>
                <th className="table-th" style={{ width: 36 }}>
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} style={{ accentColor: '#2563eb', cursor: 'pointer' }} />
                </th>
                <SortableTh label="No. Berkas" sortKey="id" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <SortableTh label="Nasabah & Unit" sortKey="customerName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <SortableTh label="Agen" sortKey="agentName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <SortableTh label="Leasing" sortKey="leasingName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <SortableTh label="Pinjaman" sortKey="pinjaman" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <th className="table-th">Tenor</th>
                <SortableTh label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <SortableTh label="Tgl Input" sortKey="inputDate" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(app => (
                <tr key={app.id} className="table-row" style={selectedIds.has(app.id) ? { background: 'var(--selected-bg)' } : undefined}>
                  <td className="table-td">
                    <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleRow(app.id)} style={{ accentColor: '#2563eb', cursor: 'pointer' }} />
                  </td>
                  <td className="table-td">
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#2563eb' }}>{app.id}</span>
                  </td>
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: 'var(--surface-alt2)', color: 'var(--c-64748b)', fontWeight: 700 }}>
                        {app.customerName[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{app.customerName}</p>
                        <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 1 }}>{app.unitBrand} · {app.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)' }}>{app.agentName}</td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)' }}>{app.leasingName}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(app.pinjaman)}</td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-64748b)' }}>{app.tenor} bln</td>
                  <td className="table-td"><Badge status={app.status} /></td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.inputDate}</td>
                  <td className="table-td">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <Eye size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>
              Menampilkan {(page - 1) * PER + 1}–{Math.min(page * PER, filtered.length)} dari {filtered.length}
            </p>
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return p <= totalPages ? (
                  <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ) : null;
              })}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Input ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Input Berkas Pengajuan Baru"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <FileText size={15} /> Submit Berkas
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="span-2">
            <F label="Nama Nasabah" error={errors.customerName}><input className="input" value={form.customerName} onChange={e => set('customerName')(e.target.value)} placeholder="Nama lengkap sesuai KTP" style={errors.customerName ? { borderColor: '#ef4444' } : undefined} /></F>
          </div>
          <F label="NIK / Nomor KTP" error={errors.nik}><input className="input" value={form.nik} onChange={e => set('nik')(e.target.value)} placeholder="16 digit NIK" style={errors.nik ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Nomor Telepon" error={errors.phone}><input className="input" value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="08xx-xxxx-xxxx" style={errors.phone ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Kota" error={errors.city}>
            <select className="input" value={form.city} onChange={e => set('city')(e.target.value)} style={errors.city ? { borderColor: '#ef4444' } : undefined}>
              <option value="">— Pilih Kota —</option>
              {/* Nilai lama yang tidak ada di master options tetap ditampilkan agar data lama tidak hilang saat edit */}
              {form.city && !cityOptions.includes(form.city) && <option value={form.city}>{form.city}</option>}
              {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
          <F label="Tipe Unit">
            <select className="input" value={form.unitType} onChange={e => set('unitType')(e.target.value)}>
              {unitTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </F>
          {(form.unitType === 'Motor' || form.unitType === 'Mobil') && (
            <F label="Jenis Pengajuan">
              <select className="input" value={form.isRO ? 'ro' : 'new'} onChange={e => set('isRO')(e.target.value === 'ro')}>
                <option value="new">{form.unitType === 'Motor' ? 'NEW' : 'REGULER'}</option>
                <option value="ro">RO (Repeat Order)</option>
              </select>
            </F>
          )}
          <F label="Merk & Model Unit" error={errors.unitBrand}><input className="input" value={form.unitBrand} onChange={e => set('unitBrand')(e.target.value)} placeholder="Toyota Avanza 1.3 G" style={errors.unitBrand ? { borderColor: '#ef4444' } : undefined} /></F>
          <F label="Tahun Unit"><input className="input" type="number" value={form.unitYear} onChange={e => set('unitYear')(Number(e.target.value))} /></F>
          <F label="Pinjaman yang Diajukan (Rp)" error={errors.pinjaman}>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              value={form.pinjaman ? Number(form.pinjaman).toLocaleString('id') : ''}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                set('pinjaman')(raw);
              }}
              placeholder="120.000.000"
              style={errors.pinjaman ? { borderColor: '#ef4444' } : undefined}
            />
          </F>
          <F label="Tenor">
            <select className="input" value={form.tenor} onChange={e => set('tenor')(Number(e.target.value))}>
              {tenorOptions.map(t => <option key={t} value={Number(t)}>{t} bulan</option>)}
            </select>
          </F>

          {/* Auto kalkulasi angsuran & komisi (per leasing atau CMD Finance fallback) */}
          {rateResult ? (
            <div className="span-2" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingUp size={14} color="#16a34a" />
                <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  Estimasi {rateResult.isOwnTables ? (form.leasingName || 'Leasing') : 'CMD Finance'} · {form.unitType} {form.isRO ? 'RO' : (form.unitType === 'Motor' ? 'NEW' : 'REGULER')} · {form.tenor} bln
                  {!rateResult.isOwnTables && form.leasingId ? <span style={{ fontWeight: 400, color: '#16a34a', marginLeft: 4 }}>(referensi)</span> : null}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#16a34a', marginBottom: 2 }}>Angsuran / Bulan</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{formatRupiah(rateResult.angsuran)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#16a34a', marginBottom: 2 }}>Fee Agent / Komisi</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{formatRupiah(rateResult.fee)}</p>
                </div>
              </div>
            </div>
          ) : form.pinjaman && Number(form.pinjaman) > 0 && (form.unitType === 'Motor' || form.unitType === 'Mobil') ? (
            <div className="span-2">
              <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>
                Tenor tidak tersedia di tabel · Motor: 6–36 bln, Mobil: 12–48 bln
              </p>
            </div>
          ) : null}
          <F label="Leasing Tujuan">
            <select className="input" value={form.leasingId} onChange={e => {
              const ls = leasing.find(l => l.id === Number(e.target.value));
              set('leasingId')(Number(e.target.value));
              set('leasingName')(ls?.name || '');
            }}>
              <option value="">— Pilih Leasing —</option>
              {leasing.filter(l => l.status === 'aktif').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </F>
          {currentUser?.role !== 'agen' && (
            <F label="Agen Penginput" error={errors.agentId}>
              <select className="input" value={form.agentId} onChange={e => {
                const ag = agents.find(a => a.id === e.target.value);
                set('agentId')(e.target.value);
                set('agentName')(ag?.name || '');
              }} style={errors.agentId ? { borderColor: '#ef4444' } : undefined}>
                <option value="">-- Pilih Agen --</option>
                {agents.filter(a => a.status === 'aktif').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </F>
          )}
          <div className="span-2">
            <F label="Alamat Lengkap"><input className="input" value={form.address} onChange={e => set('address')(e.target.value)} placeholder="Alamat sesuai KTP" /></F>
          </div>
          <div className="span-2">
            <F label="Catatan Tambahan">
              <textarea className="input textarea" value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} placeholder="Catatan khusus untuk admin..." />
            </F>
          </div>

          {/* Upload section */}
          <div className="span-2" style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-374151)', marginBottom: 10 }}>
              Dokumen yang Diupload
              <span style={{ fontWeight: 400, color: 'var(--c-94a3b8)', marginLeft: 6 }}>— centang untuk lampirkan file (opsional)</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docTypes.map(doc => (
                <div key={doc}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--c-374151)', cursor: 'pointer', padding: '7px 10px', background: 'var(--surface)', borderRadius: 8, border: `1px solid ${docChecked[doc] ? '#93c5fd' : 'var(--border)'}`, transition: 'border-color .15s' }}>
                    <input
                      type="checkbox"
                      checked={!!docChecked[doc]}
                      onChange={e => setDocChecked(p => ({ ...p, [doc]: e.target.checked }))}
                      style={{ accentColor: '#2563eb' }}
                    />
                    {doc}
                  </label>
                  {docChecked[doc] && (
                    <div style={{ marginTop: 4, marginLeft: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px dashed #93c5fd', borderRadius: 7 }}>
                      <input
                        type="file"
                        onChange={e => setDocFiles(p => ({ ...p, [doc]: e.target.files?.[0] || null }))}
                        style={{ fontSize: 12, color: 'var(--c-374151)', width: '100%' }}
                      />
                      {docFiles[doc] && (
                        <p style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>✓ {docFiles[doc].name}</p>
                      )}
                      <p style={{ fontSize: 10, color: 'var(--c-94a3b8)', marginTop: 2 }}>Opsional — boleh dilengkapi nanti</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Modal Bulk Status ── */}
      <Modal
        isOpen={showBulkStatus}
        onClose={() => setShowBulkStatus(false)}
        title="Ubah Status Massal"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowBulkStatus(false)}>Batal</button>
            <button className="btn btn-primary" disabled={!bulkStatus} onClick={handleBulkStatus}>Terapkan ke {selectedIds.size} Berkas</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--c-64748b)' }}>
            Status akan diterapkan ke <strong style={{ color: 'var(--c-0f172a)' }}>{selectedIds.size} berkas</strong> yang dipilih.
          </p>
          <div>
            <label className="label">Ubah ke status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STATUSES.map(s => (
                <button
                  key={s.key}
                  onClick={() => setBulkStatus(s.key)}
                  style={{
                    padding: '10px 12px', border: `2px solid ${bulkStatus === s.key ? '#2563eb' : 'var(--border)'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: bulkStatus === s.key ? 'var(--selected-bg)' : 'var(--surface)',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  <Badge status={s.key} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
