import { useState, useRef } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/dummyData';
import { exportToCsv } from '../utils/exportCsv';
import { exportToXlsx, parseXlsxFile } from '../utils/excelIO';
import { useSortableData } from '../utils/useSortableData';
import { useMasterOptions } from '../utils/useMasterOptions';
import { SortableTh } from '../components/UI/SortableTh';
import { Search, Download, Upload, CreditCard, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

// Kolom template Excel — label ini dipakai untuk export DAN untuk mencocokkan
// kolom saat parsing upload, jadi harus persis sama di kedua arah.
const IMPORT_COLUMNS = [
  { label: 'ID Komisi', key: 'id' },
  { label: 'No. Berkas', key: 'appId' },
  { label: 'Nasabah', key: 'customerName' },
  { label: 'Agen', key: 'agentName' },
  { label: 'Komisi', key: 'commissionAmount' },
  { label: 'Status (paid/unpaid)', key: 'status' },
  { label: 'Tanggal Bayar (YYYY-MM-DD)', key: 'paymentDate' },
  { label: 'Metode Bayar', key: 'paymentMethod' },
  { label: 'Catatan', key: 'notes' },
];

// Validasi satu baris hasil parsing Excel terhadap data komisi yang ada.
// Kolom "ID Komisi" wajib cocok dengan baris yang sudah ada — import ini
// hanya untuk MENGUBAH komisi yang sudah ada, bukan membuat baris baru
// (komisi baru selalu dibuat otomatis oleh sistem saat berkas di-approve).
function validateImportRow(row, commissions) {
  const id = Number(row['ID Komisi']);
  if (!id) return { error: `Baris dilewati: "ID Komisi" kosong atau bukan angka` };
  const existing = commissions.find(c => c.id === id);
  if (!existing) return { error: `ID Komisi ${id} tidak ditemukan — baris dilewati` };

  const rawAmount = row['Komisi'];
  const commissionAmount = Number(rawAmount);
  if (rawAmount == null || rawAmount === '' || !Number.isFinite(commissionAmount) || commissionAmount < 0) {
    return { error: `ID Komisi ${id}: nilai "Komisi" tidak valid` };
  }

  const rawStatus = String(row['Status (paid/unpaid)'] || '').trim().toLowerCase();
  if (!['paid', 'unpaid'].includes(rawStatus)) {
    return { error: `ID Komisi ${id}: "Status" harus "paid" atau "unpaid"` };
  }

  return {
    row: {
      id, commissionAmount, status: rawStatus,
      paymentDate: row['Tanggal Bayar (YYYY-MM-DD)'] ? String(row['Tanggal Bayar (YYYY-MM-DD)']).trim() : null,
      paymentMethod: row['Metode Bayar'] ? String(row['Metode Bayar']).trim() : null,
      notes: row['Catatan'] ? String(row['Catatan']).trim() : null,
      existing,
    },
  };
}

const SORT_GETTERS = {
  appId: r => r.appId, customerName: r => r.customerName, agentName: r => r.agentName,
  approvePinjaman: r => r.approvePinjaman, approveDate: r => r.approveDate,
  commissionAmount: r => r.commissionAmount, status: r => r.status,
};

export function Commission() {
  const { visibleCommissions: commissions, agents, payCommission, payCommissionsBulk, bulkUpdateCommissions, currentUser } = useApp();
  const canManagePayments = ['owner', 'super-admin'].includes(currentUser?.role);
  const isOwnScoped  = currentUser?.role === 'agen';

  const [search, setSearch]         = useState('');
  const [filterStatus, setStatus]   = useState('all');
  const [filterAgent, setAgent]     = useState('all');
  const [showPayModal, setShowPay]  = useState(false);
  const [selectedComm, setSel]      = useState(null);
  const [payMethod, setPayMethod]   = useState('Transfer Bank');
  const payMethods = useMasterOptions('payment_method', ['Transfer Bank', 'Cash', 'QRIS', 'Cek']);

  // Bulk payment
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [showBulk, setShowBulk]     = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Import Excel
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null); // { valid: [], errors: [] }
  const [importSaving, setImportSaving]   = useState(false);

  const downloadTemplate = () => {
    exportToXlsx('template-komisi', IMPORT_COLUMNS, filtered.length ? filtered : commissions);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsedRows = await parseXlsxFile(file);
      const valid = [];
      const errors = [];
      parsedRows.forEach((row, i) => {
        const result = validateImportRow(row, commissions);
        if (result.error) errors.push(`Baris ${i + 2}: ${result.error}`);
        else valid.push(result.row);
      });
      if (!parsedRows.length) errors.push('File kosong atau format tidak dikenali');
      setImportPreview({ valid, errors });
    } catch {
      setImportPreview({ valid: [], errors: ['Gagal membaca file — pastikan formatnya .xlsx dan sesuai template'] });
    }
  };

  const confirmImport = async () => {
    if (!importPreview?.valid.length) return;
    setImportSaving(true);
    await bulkUpdateCommissions(importPreview.valid);
    setImportSaving(false);
    setImportPreview(null);
  };

  const filtered = commissions.filter(c => {
    const q = search.toLowerCase();
    return (
      (!q || c.customerName.toLowerCase().includes(q) || c.agentName.toLowerCase().includes(q) || c.appId.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || c.status === filterStatus) &&
      (filterAgent  === 'all' || c.agentId === filterAgent)
    );
  });

  // Nominal komisi langsung dari DB (dsd_commissions.commission_amount) — tidak ada
  // pemecahan porsi agen/owner lagi, apa yang tersimpan itu yang ditampilkan/dibayar.
  const totalKomisi  = filtered.reduce((s, c) => s + c.commissionAmount, 0);
  const totalPaid    = filtered.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
  const totalUnpaid  = filtered.filter(c => c.status === 'unpaid').reduce((s, c) => s + c.commissionAmount, 0);

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filtered, SORT_GETTERS);
  const PER = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sorted.length / PER);
  const rows = sorted.slice((page - 1) * PER, page * PER);

  const openPay  = comm => { setSel(comm); setShowPay(true); };
  const handlePay = () => { payCommission(selectedComm.id, payMethod); setShowPay(false); };

  const unpaidRows = sorted.filter(c => c.status === 'unpaid');
  const allChecked = unpaidRows.length > 0 && unpaidRows.every(c => checkedIds.has(c.id));
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(unpaidRows.map(c => c.id)));
  };
  const toggleOne = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const bulkSelected = commissions.filter(c => checkedIds.has(c.id));
  const bulkTotal = bulkSelected.reduce((s, c) => s + c.commissionAmount, 0);
  const handleBulkPay = async () => {
    setBulkSaving(true);
    await payCommissionsBulk([...checkedIds], payMethod);
    setCheckedIds(new Set());
    setBulkSaving(false);
    setShowBulk(false);
  };

  const agentSummary = agents.map(ag => {
    const agComm = filtered.filter(c => c.agentId === ag.id);
    const total  = agComm.reduce((s, c) => s + c.commissionAmount, 0);
    const paid   = agComm.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
    return { ...ag, totalKomisi: total, paidKomisi: paid, unpaidKomisi: total - paid };
  }).filter(a => a.totalKomisi > 0);

  const exportColumns = [
    { label: 'No. Berkas', key: 'appId' }, { label: 'Nasabah', key: 'customerName' },
    { label: 'Agen', key: 'agentName' }, { label: 'Leasing', key: 'leasingName' },
    { label: 'Pinjaman', key: 'approvePinjaman' }, { label: 'Tgl Approve', key: 'approveDate' },
    { label: 'Komisi', key: 'commissionAmount' }, { label: 'Komisi Leasing', key: 'commissionAmount' },
    { label: 'Status', key: 'status' }, { label: 'Tgl Bayar', key: 'paymentDate' },
  ];

  const summaryCards = [
    { label: 'Komisi Belum Dibayar', value: formatRupiah(totalUnpaid), icon: CreditCard, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', val_color: '#dc2626' },
    { label: 'Komisi Sudah Dibayar', value: formatRupiah(totalPaid), icon: CheckCircle, bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', val_color: '#15803d' },
    { label: 'Total Komisi', value: formatRupiah(totalKomisi), icon: DollarSign, bg: 'var(--surface)', border: 'var(--border)', color: 'var(--c-64748b)', val_color: 'var(--c-0f172a)' },
  ];

  const colSpan = 9 + (canManagePayments ? 1 : 0);

  return (
    <Layout
      title="Pembayaran Komisi"
      subtitle="Kelola pembayaran komisi agen"
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => exportToCsv('komisi-agen', exportColumns, filtered)}><Download size={15} /> Export CSV</button>
          {canManagePayments && (
            <>
              <button className="btn btn-secondary" onClick={downloadTemplate}><Download size={15} /> Download Template Excel</button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Upload Excel</button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelected} />
            </>
          )}
        </div>
      }
    >
      {/* Summary */}
      <div className="rgrid rgrid-3" style={{ gap: 14, marginBottom: 24 }}>
        {summaryCards.map(({ label, value, icon: Icon, bg, border, color, val_color }) => (
          <div key={label} className="card" style={{ background: bg, border: `1px solid ${border}`, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: color, fontWeight: 500, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: val_color }}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: 240 }}>
          <Search size={14} color="var(--c-94a3b8)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nasabah, agen, nomor berkas..." />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        {!isOwnScoped && (
          <select className="input" style={{ width: 'auto' }} value={filterAgent} onChange={e => setAgent(e.target.value)}>
            <option value="all">Semua Agen</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        {canManagePayments && checkedIds.size > 0 && (
          <button className="btn btn-success" onClick={() => setShowBulk(true)}>
            <CheckCircle size={14} /> Bayar {checkedIds.size} Komisi Terpilih
          </button>
        )}
      </div>

      {/* Commission table */}
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Daftar Komisi</p>
          <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{filtered.length} entri</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              {canManagePayments && (
                <th className="table-th" style={{ width: 36 }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} title="Pilih semua unpaid" />
                </th>
              )}
              <SortableTh label="No. Berkas" sortKey="appId" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Nasabah" sortKey="customerName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Agen" sortKey="agentName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Leasing</th>
              <SortableTh label="Pinjaman" sortKey="approvePinjaman" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Tgl Approve" sortKey="approveDate" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Komisi</th>
              <th className="table-th">Komisi Leasing</th>
              <SortableTh label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={colSpan}><div className="empty-state"><div className="empty-icon">💰</div><p>Tidak ada data komisi</p></div></td></tr>
            ) : rows.map(comm => {
              return (
                <tr key={comm.id} className="table-row" style={{ background: checkedIds.has(comm.id) ? 'var(--selected-bg)' : undefined }}>
                  {canManagePayments && (
                    <td className="table-td">
                      {comm.status === 'unpaid' && (
                        <input type="checkbox" checked={checkedIds.has(comm.id)} onChange={() => toggleOne(comm.id)} />
                      )}
                    </td>
                  )}
                  <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{comm.appId}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{comm.customerName}</td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{comm.agentName}</td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{comm.leasingName}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 600 }}>{formatRupiah(comm.approvePinjaman)}</td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{comm.approveDate}</td>
                  <td className="table-td" style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{formatRupiah(comm.commissionAmount)}</td>
                  <td className="table-td" style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{formatRupiah(comm.commissionAmount)}</td>
                  <td className="table-td"><Badge status={comm.status} /></td>
                  <td className="table-td">
                    {comm.status === 'unpaid' ? (
                      canManagePayments
                        ? <button className="btn btn-success btn-sm" onClick={() => openPay(comm)}>Bayar</button>
                        : <span style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>Menunggu pembayaran</span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{comm.paymentMethod || '-'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>Halaman {page} dari {totalPages} ({sorted.length} entri)</p>
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {(() => {
                const delta = 2, pages = [], left = Math.max(2, page - delta), right = Math.min(totalPages - 1, page + delta);
                pages.push(1);
                if (left > 2) pages.push('…');
                for (let i = left; i <= right; i++) pages.push(i);
                if (right < totalPages - 1) pages.push('…');
                if (totalPages > 1) pages.push(totalPages);
                return pages.map((p, i) => p === '…'
                  ? <span key={`e${i}`} className="page-btn" style={{ pointerEvents: 'none' }}>…</span>
                  : <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                );
              })()}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Agent summary */}
      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Rekap Komisi per Agen</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              {['Agen', 'Kota', 'Total Komisi', 'Sudah Dibayar', 'Belum Dibayar', 'Progres'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agentSummary.map(ag => {
              const pct = ag.totalKomisi > 0 ? (ag.paidKomisi / ag.totalKomisi) * 100 : 0;
              return (
                <tr key={ag.id} className="table-row">
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>{ag.name[0]}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{ag.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', fontFamily: 'monospace' }}>{ag.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{ag.city}</td>
                  <td className="table-td" style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{formatRupiah(ag.totalKomisi)}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{formatRupiah(ag.paidKomisi)}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{formatRupiah(ag.unpaidKomisi)}</td>
                  <td className="table-td">
                    <div style={{ width: 100 }}>
                      <div className="progress">
                        <div className="progress-bar" style={{ width: `${pct}%`, background: pct > 80 ? '#22c55e' : pct > 40 ? '#f59e0b' : '#3b82f6' }} />
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--c-94a3b8)', marginTop: 3 }}>{pct.toFixed(0)}% dibayar</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Pay Modal */}
      <Modal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        title={`Bayar ${checkedIds.size} Komisi Sekaligus`}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowBulk(false)}>Batal</button>
            <button className="btn btn-success" disabled={bulkSaving} onClick={handleBulkPay}>
              {bulkSaving ? 'Memproses...' : `Konfirmasi Bayar ${checkedIds.size} Komisi`}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="alert alert-success">
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700 }}>Total Komisi: {formatRupiah(bulkTotal)}</p>
              <p style={{ fontSize: 12, marginTop: 2 }}>{checkedIds.size} komisi akan ditandai lunas</p>
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bulkSelected.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--c-64748b)' }}>{c.customerName} ({c.agentName})</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatRupiah(c.commissionAmount)}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="label">Metode Pembayaran</label>
            <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              {payMethods.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Pay Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPay(false)}
        title="Konfirmasi Pembayaran Komisi Agen"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPay(false)}>Batal</button>
            <button className="btn btn-success" onClick={handlePay}>Konfirmasi Pembayaran</button>
          </>
        }
      >
        {selectedComm && (() => {
          return (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 20, flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
                  {[
                    { l: 'Agen', v: selectedComm.agentName },
                    { l: 'Nasabah', v: selectedComm.customerName },
                    { l: 'Pinjaman', v: formatRupiah(selectedComm.approvePinjaman) },
                    { l: 'Komisi (Dibayar)', v: formatRupiah(selectedComm.commissionAmount) },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Metode Pembayaran</label>
                <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  {payMethods.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Import Excel — preview sebelum diterapkan */}
      <Modal
        isOpen={!!importPreview}
        onClose={() => setImportPreview(null)}
        title="Preview Import Excel Komisi"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setImportPreview(null)}>Batal</button>
            <button className="btn btn-primary" disabled={!importPreview?.valid.length || importSaving} onClick={confirmImport}>
              {importSaving ? 'Menyimpan...' : `Terapkan ${importPreview?.valid.length || 0} Perubahan`}
            </button>
          </>
        }
      >
        {importPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {importPreview.errors.length > 0 && (
              <div className="alert alert-danger" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <strong style={{ fontSize: 13 }}>{importPreview.errors.length} baris dilewati</strong>
                </div>
                <div style={{ maxHeight: 100, overflowY: 'auto', width: '100%' }}>
                  {importPreview.errors.map((e, i) => (
                    <p key={i} style={{ fontSize: 12, marginTop: 2 }}>{e}</p>
                  ))}
                </div>
              </div>
            )}
            {importPreview.valid.length > 0 ? (
              <div className="table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">Nasabah</th>
                      <th className="table-th">Komisi (Baru)</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Tgl Bayar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.valid.map(r => {
                      const changed = r.existing.commissionAmount !== r.commissionAmount || r.existing.status !== r.status;
                      return (
                        <tr key={r.id} className="table-row">
                          <td className="table-td" style={{ fontSize: 12 }}>{r.existing.customerName}</td>
                          <td className="table-td" style={{ fontSize: 12, fontWeight: changed ? 700 : 400, color: changed ? '#16a34a' : undefined }}>
                            {formatRupiah(r.commissionAmount)}
                            {r.existing.commissionAmount !== r.commissionAmount && (
                              <span style={{ color: 'var(--c-94a3b8)', fontWeight: 400, marginLeft: 6, textDecoration: 'line-through' }}>{formatRupiah(r.existing.commissionAmount)}</span>
                            )}
                          </td>
                          <td className="table-td"><Badge status={r.status} /></td>
                          <td className="table-td" style={{ fontSize: 12 }}>{r.paymentDate || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', textAlign: 'center', padding: '16px 0' }}>Tidak ada baris valid untuk diterapkan.</p>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
