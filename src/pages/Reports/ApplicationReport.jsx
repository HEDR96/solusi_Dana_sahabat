import { useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Badge } from '../../components/UI/Badge';
import { useApp } from '../../context/AppContext';
import { formatRupiah, STATUSES } from '../../data/dummyData';
import { exportToCsv } from '../../utils/exportCsv';
import { Download, AlertTriangle } from 'lucide-react';

const REPORT_COLUMNS = [
  { label: 'No. Berkas', key: 'id' }, { label: 'Nasabah', key: 'customerName' }, { label: 'Agen', key: 'agentName' },
  { label: 'Leasing', key: 'leasingName' }, { label: 'Pinjaman', key: 'pinjaman' }, { label: 'Status', key: 'status' },
  { label: 'Tgl Input', key: 'inputDate' }, { label: 'Aging (hari)', key: 'agingDays' }, { label: 'Terlambat', get: r => r.isLama ? 'Ya' : 'Tidak' },
];

export function ApplicationReport() {
  const { visibleApplications: applications, visibleAgents: agents } = useApp();
  const [filterAgent, setAgent]   = useState('all');
  const [filterStatus, setStatus] = useState('all');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);
  const PER = 10;

  const NOW = new Date();
  const enriched = applications.map(app => {
    const agingDays = Math.floor((NOW - new Date(app.inputDate)) / 86400000);
    const isLama    = agingDays > 14 && !['approve', 'reject', 'cancel'].includes(app.status);
    return { ...app, agingDays, isLama };
  });

  const filtered = enriched.filter(a => {
    const matchAgent  = filterAgent  === 'all' || a.agentId   === filterAgent;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchDate    = (!dateFrom || a.inputDate >= dateFrom) && (!dateTo || a.inputDate <= dateTo);
    return matchAgent && matchStatus && matchDate;
  });

  const paginated  = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(filtered.length / PER);
  const lama       = filtered.filter(a => a.isLama).length;

  const summaryItems = [
    { label: 'Total Berkas', value: filtered.length, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Approve', value: filtered.filter(a => a.status === 'approve').length, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Masih Proses', value: filtered.filter(a => ['pending','cek-data','janji-survey','survey','komite'].includes(a.status)).length, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Aging > 14 hari', value: lama, color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <Layout
      title="Laporan Berkas Masuk"
      subtitle="Detail seluruh pengajuan dan monitoring aging"
      actions={<button className="btn btn-secondary" onClick={() => exportToCsv('laporan-berkas', REPORT_COLUMNS, filtered)}><Download size={14} /> Export</button>}
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={filterAgent} onChange={e => { setAgent(e.target.value); setPage(1); }}>
          <option value="all">Semua Agen</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">Semua Status</option>
          {STATUSES.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <input className="input" type="date" style={{ width: 'auto' }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
        <span style={{ fontSize: 12, color: 'var(--c-94a3b8)', alignSelf: 'center' }}>s/d</span>
        <input className="input" type="date" style={{ width: 'auto' }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        {(dateFrom || dateTo) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}>Reset tanggal</button>
        )}
      </div>

      {/* Aging alert */}
      {lama > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 13 }}>Aging Alert</p>
            <p style={{ fontSize: 13 }}>Terdapat <strong>{lama} berkas</strong> yang belum diproses lebih dari 14 hari. Segera tindak lanjuti.</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rgrid rgrid-4" style={{ gap: 14, marginBottom: 20 }}>
        {summaryItems.map(({ label, value, color, bg }) => (
          <div key={label} className="card" style={{ background: bg, border: `1px solid ${color}20`, padding: '16px 18px' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color }}>{value}</p>
            <p style={{ fontSize: 12, color, fontWeight: 500, marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Detail Berkas ({filtered.length})</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              {['No. Berkas', 'Nasabah', 'Agen', 'Leasing', 'OTR', 'Status', 'Tgl Input', 'Aging', 'Flag'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state"><div className="empty-icon">📋</div><p>Tidak ada data</p></div>
                </td>
              </tr>
            ) : paginated.map(app => (
              <tr key={app.id} className="table-row" style={{ background: app.isLama ? '#fffbeb' : undefined }}>
                <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{app.id}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{app.customerName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{app.agentName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{app.leasingName}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(app.pinjaman)}</td>
                <td className="table-td"><Badge status={app.status} /></td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.inputDate}</td>
                <td className="table-td">
                  <span style={{ fontSize: 12, fontWeight: 700, color: app.agingDays > 14 ? '#ef4444' : 'var(--c-64748b)' }}>
                    {app.agingDays} hari
                  </span>
                </td>
                <td className="table-td">
                  {app.isLama && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#fef2f2', color: '#ef4444' }}>Terlambat</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>Halaman {page} dari {totalPages}</p>
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
    </Layout>
  );
}
