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

const COMMISSION_COLUMNS = [
  { label: 'No. Berkas', key: 'appId' }, { label: 'Nasabah', key: 'customerName' },
  { label: 'Agen', key: 'agentName' }, { label: 'Leasing', key: 'leasingName' },
  { label: 'Pinjaman', key: 'approvePinjaman' }, { label: 'Tgl Approve', key: 'approveDate' },
  { label: 'Rate (%)', key: 'commissionRate' }, { label: 'Nominal Komisi', key: 'commissionAmount' },
  { label: 'Status', key: 'status' }, { label: 'Tgl Bayar', key: 'paymentDate' },
];

export function Commission() {
  const { visibleCommissions: commissions, agents, payCommission, currentUser } = useApp();
  const canManagePayments = ['owner', 'super-admin', 'admin', 'finance'].includes(currentUser?.role);
  const isOwnScoped = currentUser?.role === 'agen';
  const [search, setSearch]         = useState('');
  const [filterStatus, setStatus]   = useState('all');
  const [filterAgent, setAgent]     = useState('all');
  const [showPayModal, setShowPay]  = useState(false);
  const [selectedComm, setSel]      = useState(null);
  const [payMethod, setPayMethod]   = useState('Transfer Bank');
  const payMethods = useMasterOptions('payment_method', ['Transfer Bank', 'Cash', 'QRIS', 'Cek']);

  const filtered = commissions.filter(c => {
    const q = search.toLowerCase();
    return (
      (!q || c.customerName.toLowerCase().includes(q) || c.agentName.toLowerCase().includes(q) || c.appId.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || c.status === filterStatus) &&
      (filterAgent  === 'all' || c.agentId === filterAgent)
    );
  });

  const totalUnpaid = filtered.filter(c => c.status === 'unpaid').reduce((s, c) => s + c.commissionAmount, 0);
  const totalPaid   = filtered.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
  const totalAll    = totalPaid + totalUnpaid;

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filtered, SORT_GETTERS);

  const openPay = comm => { setSel(comm); setShowPay(true); };
  const handlePay = () => { payCommission(selectedComm.id, payMethod); setShowPay(false); };

  const agentSummary = agents.map(ag => {
    const agComm = filtered.filter(c => c.agentId === ag.id);
    return {
      ...ag,
      totalKomisi: agComm.reduce((s, c) => s + c.commissionAmount, 0),
      paidKomisi:  agComm.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0),
      unpaidKomisi:agComm.filter(c => c.status === 'unpaid').reduce((s, c) => s + c.commissionAmount, 0),
    };
  }).filter(a => a.totalKomisi > 0);

  const summaryCards = [
    { label: 'Total Komisi', value: formatRupiah(totalAll), icon: DollarSign, bg: 'var(--surface)', border: 'var(--border)', color: 'var(--c-64748b)', val_color: 'var(--c-0f172a)' },
    { label: 'Sudah Dibayar', value: formatRupiah(totalPaid), icon: CheckCircle, bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', val_color: '#15803d' },
    { label: 'Belum Dibayar', value: formatRupiah(totalUnpaid), icon: CreditCard, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', val_color: '#dc2626' },
  ];

  return (
    <Layout
      title="Pembayaran Komisi"
      subtitle="Kelola pembayaran komisi agen"
      actions={<button className="btn btn-secondary" onClick={() => exportToCsv('komisi-agen', COMMISSION_COLUMNS, filtered)}><Download size={15} /> Export</button>}
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
              <SortableTh label="No. Berkas" sortKey="appId" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Nasabah" sortKey="customerName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Agen" sortKey="agentName" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Leasing</th>
              <SortableTh label="Pinjaman" sortKey="approvePinjaman" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Tgl Approve" sortKey="approveDate" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Rate</th>
              <SortableTh label="Komisi" sortKey="commissionAmount" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon">💰</div><p>Tidak ada data komisi</p></div></td></tr>
            ) : sorted.map(comm => (
              <tr key={comm.id} className="table-row">
                <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{comm.appId}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{comm.customerName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{comm.agentName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{comm.leasingName}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(comm.approvePinjaman)}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{comm.approveDate}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)', textAlign: 'center' }}>{comm.commissionRate}%</td>
                <td className="table-td" style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{formatRupiah(comm.commissionAmount)}</td>
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
            ))}
          </tbody>
        </table>
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

      {/* Pay Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPay(false)}
        title="Konfirmasi Pembayaran Komisi"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPay(false)}>Batal</button>
            <button className="btn btn-success" onClick={handlePay}>Konfirmasi Pembayaran</button>
          </>
        }
      >
        {selectedComm && (
          <div>
            <div className="alert alert-success" style={{ marginBottom: 20, flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
                {[
                  { l: 'Agen', v: selectedComm.agentName },
                  { l: 'Nasabah', v: selectedComm.customerName },
                  { l: 'Pinjaman', v: formatRupiah(selectedComm.approvePinjaman) },
                  { l: 'Nominal Komisi', v: formatRupiah(selectedComm.commissionAmount) },
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
        )}
      </Modal>
    </Layout>
  );
}
