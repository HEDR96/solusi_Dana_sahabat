import { useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Badge } from '../../components/UI/Badge';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../data/dummyData';
import { exportToCsv } from '../../utils/exportCsv';
import { TrendBadge } from '../../components/UI/TrendBadge';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MS_DAY = 86400000;
function previousPeriod(from, to) {
  if (!from || !to) return null;
  const start = new Date(from), end = new Date(to);
  const durationDays = Math.round((end - start) / MS_DAY) + 1;
  const prevTo = new Date(start.getTime() - MS_DAY);
  const prevFrom = new Date(prevTo.getTime() - (durationDays - 1) * MS_DAY);
  const fmt = d => d.toISOString().split('T')[0];
  return { from: fmt(prevFrom), to: fmt(prevTo) };
}

const COMMISSION_REPORT_COLUMNS = [
  { label: 'No. Berkas', key: 'appId' }, { label: 'Nasabah', key: 'customerName' }, { label: 'Agen', key: 'agentName' },
  { label: 'Leasing', key: 'leasingName' }, { label: 'Pinjaman', key: 'approvePinjaman' },
  { label: 'Komisi', key: 'commissionAmount' }, { label: 'Status', key: 'status' }, { label: 'Tgl Bayar', key: 'paymentDate' },
];

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 12, fontWeight: 700, color: p.color || '#fff' }}>{p.name}: {formatRupiah(p.value)}</p>
      ))}
    </div>
  );
}

export function CommissionReport() {
  const { visibleCommissions: allCommissions, visibleAgents: agents } = useApp();
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [filterAgent, setAgent]   = useState('all');

  const commissions = allCommissions.filter(c =>
    (!dateFrom || c.approveDate >= dateFrom) && (!dateTo || c.approveDate <= dateTo) &&
    (filterAgent === 'all' || c.agentId === filterAgent)
  );

  const totalAll   = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const totalPaid  = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
  const totalUnpaid= commissions.filter(c => c.status === 'unpaid').reduce((s, c) => s + c.commissionAmount, 0);

  const prevRange = previousPeriod(dateFrom, dateTo);
  const prevTotal = prevRange
    ? allCommissions.filter(c => c.approveDate >= prevRange.from && c.approveDate <= prevRange.to).reduce((s, c) => s + c.commissionAmount, 0)
    : null;

  const agentData = agents.map(ag => {
    const agComm = commissions.filter(c => c.agentId === ag.id);
    return {
      name:   ag.name.split(' ')[0],
      total:  agComm.reduce((s, c) => s + c.commissionAmount, 0),
      paid:   agComm.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0),
      unpaid: agComm.filter(c => c.status === 'unpaid').reduce((s, c) => s + c.commissionAmount, 0),
    };
  }).filter(a => a.total > 0);

  return (
    <Layout
      title="Laporan Komisi"
      subtitle="Ringkasan pembayaran komisi agen"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => exportToCsv('laporan-komisi', COMMISSION_REPORT_COLUMNS, commissions)}><Download size={14} /> Excel</button>
          <button className="btn btn-secondary" onClick={() => window.print()}><Download size={14} /> PDF</button>
        </div>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>Tgl Approve dari</span>
        <input className="input" type="date" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>s/d</span>
        <input className="input" type="date" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <select className="input" style={{ width: 'auto' }} value={filterAgent} onChange={e => setAgent(e.target.value)}>
          <option value="all">Semua Agen</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {(dateFrom || dateTo || filterAgent !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setAgent('all'); }}>Reset filter</button>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginBottom: 12 }}>Nilai komisi ditampilkan sebagai take-home agen ({agentRate}% dari komisi leasing)</p>
      {prevRange && (
        <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginBottom: 16 }}>
          Dibandingkan dengan periode sebelumnya: {prevRange.from} s/d {prevRange.to}
        </p>
      )}

      {/* Summary */}
      <div className="rgrid rgrid-3" style={{ gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Take-Home Agen', value: formatRupiah(totalAll), color: 'var(--c-0f172a)', bg: 'var(--surface)', border: 'var(--border)', trend: true },
          { label: 'Sudah Dibayar', value: formatRupiah(totalPaid), color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Belum Dibayar', value: formatRupiah(totalUnpaid), color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        ].map(({ label, value, color, bg, border, trend }) => (
          <div key={label} className="card" style={{ background: bg, border: `1px solid ${border}`, textAlign: 'center', padding: '20px' }}>
            <p style={{ fontSize: 11, color, fontWeight: 500, marginBottom: 6, opacity: .8 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
            {trend && prevTotal !== null && (
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
                <TrendBadge current={totalAll} previous={prevTotal} suffix="" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="rgrid rgrid-2" style={{ gap: 16, marginBottom: 20 }}>
        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 16 }}>Komisi per Agen</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--c-94a3b8)' }} tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="paid" fill="#4ade80" name="Paid" radius={[4,4,0,0]} />
              <Bar dataKey="unpaid" fill="#f87171" name="Unpaid" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 16 }}>Rekap Progress per Agen</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {agentData.map(ag => {
              const pct = ag.total > 0 ? (ag.paid / ag.total) * 100 : 0;
              return (
                <div key={ag.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{ag.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{formatRupiah(ag.total)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--surface-alt2)' }}>
                    <div style={{ width: `${pct}%`, background: '#22c55e', borderRadius: 4, transition: 'width .3s' }} />
                    <div style={{ width: `${100 - pct}%`, background: '#fca5a5', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Paid: {formatRupiah(ag.paid)}</span>
                    <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Unpaid: {formatRupiah(ag.unpaid)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Detail Semua Komisi ({commissions.length})</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              {['No. Berkas', 'Nasabah', 'Agen', 'Leasing', 'Pinjaman', 'Komisi Agen', 'Status', 'Tgl Bayar'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commissions.map(c => (
              <tr key={c.id} className="table-row">
                <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{c.appId}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{c.customerName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{c.agentName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{c.leasingName}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(c.approvePinjaman)}</td>
                <td className="table-td" style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{formatRupiah(agentAmt(c))}</td>
                <td className="table-td"><Badge status={c.status} /></td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{c.paymentDate || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
