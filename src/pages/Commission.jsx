import { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/dummyData';
import { exportToCsv } from '../utils/exportCsv';
import { useSortableData } from '../utils/useSortableData';
import { useMasterOptions } from '../utils/useMasterOptions';
import { SortableTh } from '../components/UI/SortableTh';
import { Search, Download, CreditCard, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

const SORT_GETTERS = {
  appId: r => r.appId, customerName: r => r.customerName, agentName: r => r.agentName,
  approvePinjaman: r => r.approvePinjaman, approveDate: r => r.approveDate,
  commissionAmount: r => r.commissionAmount, status: r => r.status,
};

export function Commission() {
  const { visibleCommissions: commissions, agents, payCommission, payCommissionsBulk, currentUser, settings } = useApp();
  const canManagePayments = ['owner', 'super-admin', 'admin', 'finance'].includes(currentUser?.role);
  const isOwner      = currentUser?.role === 'owner';
  const isOwnScoped  = currentUser?.role === 'agen';
  const agentRate    = settings?.commissionAgentRate ?? 80; // % agen dari komisi leasing

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

  const getBreakdown = (c) => {
    const leasing = c.commissionAmount;
    const agent   = Math.round(leasing * agentRate / 100);
    return { leasing, agent, owner: leasing - agent };
  };

  const filtered = commissions.filter(c => {
    const q = search.toLowerCase();
    return (
      (!q || c.customerName.toLowerCase().includes(q) || c.agentName.toLowerCase().includes(q) || c.appId.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || c.status === filterStatus) &&
      (filterAgent  === 'all' || c.agentId === filterAgent)
    );
  });

  const totalLeasing = filtered.reduce((s, c) => s + getBreakdown(c).leasing, 0);
  const totalAgent   = filtered.reduce((s, c) => s + getBreakdown(c).agent, 0);
  const totalOwner   = totalLeasing - totalAgent;
  const totalPaid    = filtered.filter(c => c.status === 'paid').reduce((s, c) => s + getBreakdown(c).agent, 0);
  const totalUnpaid  = filtered.filter(c => c.status === 'unpaid').reduce((s, c) => s + getBreakdown(c).agent, 0);

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
  const bulkTotalAgent = bulkSelected.reduce((s, c) => s + getBreakdown(c).agent, 0);
  const handleBulkPay = async () => {
    setBulkSaving(true);
    await payCommissionsBulk([...checkedIds], payMethod);
    setCheckedIds(new Set());
    setBulkSaving(false);
    setShowBulk(false);
  };

  const agentSummary = agents.map(ag => {
    const agComm = filtered.filter(c => c.agentId === ag.id);
    const total  = agComm.reduce((s, c) => s + getBreakdown(c).agent, 0);
    const paid   = agComm.filter(c => c.status === 'paid').reduce((s, c) => s + getBreakdown(c).agent, 0);
    return { ...ag, totalKomisi: total, paidKomisi: paid, unpaidKomisi: total - paid };
  }).filter(a => a.totalKomisi > 0);

  const exportColumns = [
    { label: 'No. Berkas', key: 'appId' }, { label: 'Nasabah', key: 'customerName' },
    { label: 'Agen', key: 'agentName' }, { label: 'Leasing', key: 'leasingName' },
    { label: 'Pinjaman', key: 'approvePinjaman' }, { label: 'Tgl Approve', key: 'approveDate' },
    { label: 'Komisi Leasing', get: c => getBreakdown(c).leasing },
    { label: 'Komisi Agen', get: c => getBreakdown(c).agent },
    ...(isOwner ? [{ label: 'Keuntungan Owner', get: c => getBreakdown(c).owner }] : []),
    { label: 'Status', key: 'status' }, { label: 'Tgl Bayar', key: 'paymentDate' },
  ];

  const summaryCards = [
    { label: 'Komisi Agen Belum Dibayar', value: formatRupiah(totalUnpaid), icon: CreditCard, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', val_color: '#dc2626' },
    { label: 'Komisi Agen Sudah Dibayar', value: formatRupiah(totalPaid), icon: CheckCircle, bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', val_color: '#15803d' },
    { label: 'Total Komisi Leasing', value: formatRupiah(totalLeasing), icon: DollarSign, bg: 'var(--surface)', border: 'var(--border)', color: 'var(--c-64748b)', val_color: 'var(--c-0f172a)' },
    ...(isOwner ? [{ label: 'Keuntungan Owner', value: formatRupiah(totalOwner), icon: TrendingUp, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', val_color: '#1e40af' }] : []),
  ];

  const colSpan = (isOwner ? 11 : 10) + (canManagePayments ? 1 : 0);

  return (
    <Layout
      title="Pembayaran Komisi"
      subtitle="Kelola pembayaran komisi agen"
      actions={<button className="btn btn-secondary" onClick={() => exportToCsv('komisi-agen', exportColumns, filtered)}><Download size={15} /> Export</button>}
    >
      {/* Summary */}
      <div className={`rgrid rgrid-${isOwner ? 4 : 3}`} style={{ gap: 14, marginBottom: 24 }}>
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
              <th className="table-th">Komisi Leasing</th>
              <th className="table-th">Komisi Agen</th>
              {isOwner && <th className="table-th">Keuntungan Owner</th>}
              <SortableTh label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={colSpan}><div className="empty-state"><div className="empty-icon">💰</div><p>Tidak ada data komisi</p></div></td></tr>
            ) : rows.map(comm => {
              const { leasing, agent, owner } = getBreakdown(comm);
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
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(leasing)}</td>
                  <td className="table-td" style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{formatRupiah(agent)}</td>
                  {isOwner && <td className="table-td" style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>{formatRupiah(owner)}</td>}
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
              <p style={{ fontSize: 13, fontWeight: 700 }}>Total Take-Home Agen: {formatRupiah(bulkTotalAgent)}</p>
              <p style={{ fontSize: 12, marginTop: 2 }}>{checkedIds.size} komisi akan ditandai lunas</p>
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bulkSelected.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--c-64748b)' }}>{c.customerName} ({c.agentName})</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatRupiah(getBreakdown(c).agent)}</span>
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
          const { leasing, agent, owner } = getBreakdown(selectedComm);
          return (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 20, flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
                  {[
                    { l: 'Agen', v: selectedComm.agentName },
                    { l: 'Nasabah', v: selectedComm.customerName },
                    { l: 'Pinjaman', v: formatRupiah(selectedComm.approvePinjaman) },
                    { l: 'Komisi Leasing', v: formatRupiah(leasing) },
                    { l: 'Komisi Agen (Dibayar)', v: formatRupiah(agent) },
                    ...(isOwner ? [{ l: 'Keuntungan Owner', v: formatRupiah(owner) }] : []),
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
    </Layout>
  );
}
