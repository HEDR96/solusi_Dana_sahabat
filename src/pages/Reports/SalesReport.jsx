import { useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useApp } from '../../context/AppContext';
import { formatRupiah, monthlyStats } from '../../data/dummyData';
import { exportToCsv } from '../../utils/exportCsv';
import { TrendBadge } from '../../components/UI/TrendBadge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, CheckCircle, XCircle, FileText } from 'lucide-react';

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

const SALES_COLUMNS = [
  { label: 'Leasing', key: 'name' }, { label: 'Total Berkas', key: 'berkas' },
  { label: 'Approve', key: 'approve' }, { label: 'Reject', get: r => r.berkas - r.approve },
  { label: 'Conversion Rate', get: r => r.berkas > 0 ? `${((r.approve / r.berkas) * 100).toFixed(0)}%` : '-' },
];

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.25)' }}>
      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 700, color: p.color || '#fff' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export function SalesReport() {
  const { applications, agents } = useApp();
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [filterAgent, setAgent]     = useState('all');
  const [filterLeasing, setLeasing] = useState('all');

  const filtered = applications.filter(a => {
    const matchAgent   = filterAgent   === 'all' || a.agentId     === filterAgent;
    const matchLeasing = filterLeasing === 'all' || a.leasingName === filterLeasing;
    const matchDate     = (!dateFrom || a.inputDate >= dateFrom) && (!dateTo || a.inputDate <= dateTo);
    return matchAgent && matchLeasing && matchDate;
  });

  const computeStats = list => ({
    total:         list.length,
    approve:       list.filter(a => a.status === 'approve').length,
    reject:        list.filter(a => a.status === 'reject').length,
    cancel:        list.filter(a => a.status === 'cancel').length,
    pending:       list.filter(a => ['pending','cek-data','janji-survey','survey','komite'].includes(a.status)).length,
    totalPinjaman: list.filter(a => a.status === 'approve').reduce((s, a) => s + (a.approvePinjaman || 0), 0),
    conversion:    list.length > 0 ? ((list.filter(a => a.status === 'approve').length / list.length) * 100).toFixed(1) : 0,
  });

  const stats = computeStats(filtered);

  const prevRange = previousPeriod(dateFrom, dateTo);
  const prevStats = prevRange ? computeStats(applications.filter(a => {
    const matchAgent   = filterAgent   === 'all' || a.agentId     === filterAgent;
    const matchLeasing = filterLeasing === 'all' || a.leasingName === filterLeasing;
    return matchAgent && matchLeasing && a.inputDate >= prevRange.from && a.inputDate <= prevRange.to;
  })) : null;

  const agentStats = agents.map(ag => {
    const agApps = filtered.filter(a => a.agentId === ag.id);
    return { name: ag.name.split(' ')[0], berkas: agApps.length, approve: agApps.filter(a => a.status === 'approve').length, reject: agApps.filter(a => a.status === 'reject').length };
  }).filter(a => a.berkas > 0);

  const leasingStats = [...new Set(filtered.map(a => a.leasingName))].map(name => ({
    name, berkas: filtered.filter(a => a.leasingName === name).length, approve: filtered.filter(a => a.leasingName === name && a.status === 'approve').length,
  }));

  const uniqueLeasings = [...new Set(applications.map(a => a.leasingName))];

  const kpiItems = [
    { label: 'Total Berkas', value: stats.total, icon: FileText, color: '#3b82f6', bg: '#eff6ff', trendKey: 'total' },
    { label: 'Approve', value: stats.approve, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4', trendKey: 'approve' },
    { label: 'Reject', value: stats.reject, icon: XCircle, color: '#ef4444', bg: '#fef2f2', trendKey: 'reject' },
    { label: 'Cancel', value: stats.cancel, icon: XCircle, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Proses', value: stats.pending, icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Conversion', value: `${stats.conversion}%`, icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <Layout
      title="Laporan Penjualan"
      subtitle="Analisis performa berkas dan pencairan"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => exportToCsv('laporan-penjualan', SALES_COLUMNS, leasingStats)}><Download size={14} /> Excel</button>
          <button className="btn btn-secondary" onClick={() => window.print()}><Download size={14} /> PDF</button>
        </div>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>Dari</span>
        <input className="input" type="date" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>s/d</span>
        <input className="input" type="date" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Reset tanggal</button>
        )}
        <select className="input" style={{ width: 'auto' }} value={filterAgent} onChange={e => setAgent(e.target.value)}>
          <option value="all">Semua Agen</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterLeasing} onChange={e => setLeasing(e.target.value)}>
          <option value="all">Semua Leasing</option>
          {uniqueLeasings.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      {prevRange && (
        <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginBottom: 16 }}>
          Dibandingkan dengan periode sebelumnya: {prevRange.from} s/d {prevRange.to}
        </p>
      )}

      {/* KPI cards */}
      <div className="rgrid rgrid-6" style={{ gap: 12, marginBottom: 20 }}>
        {kpiItems.map(({ label, value, icon: Icon, color, bg, trendKey }) => (
          <div key={label} className="card" style={{ padding: '16px 14px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-0f172a)', marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{label}</p>
            {prevStats && trendKey && (
              <div style={{ marginTop: 6 }}>
                <TrendBadge current={stats[trendKey]} previous={prevStats[trendKey]} suffix="" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Big stat */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 16, padding: '20px 28px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, color: '#93c5fd', marginBottom: 4 }}>Total Pencairan (Approve)</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{formatRupiah(stats.totalPinjaman)}</p>
        </div>
        <TrendingUp size={40} color="rgba(255,255,255,.2)" />
      </div>

      {/* Charts */}
      <div className="rgrid rgrid-2" style={{ gap: 16, marginBottom: 20 }}>
        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 16 }}>Tren Bulanan 2026</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="berkas" stroke="#3b82f6" strokeWidth={2} name="Berkas" dot={false} />
              <Line type="monotone" dataKey="approve" stroke="#22c55e" strokeWidth={2} name="Approve" dot={false} />
              <Line type="monotone" dataKey="reject" stroke="#ef4444" strokeWidth={2} name="Reject" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 16 }}>Performa per Agen</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentStats} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="berkas" fill="#93c5fd" name="Berkas" radius={[4,4,0,0]} />
              <Bar dataKey="approve" fill="#4ade80" name="Approve" radius={[4,4,0,0]} />
              <Bar dataKey="reject" fill="#f87171" name="Reject" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leasing table */}
      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Performa per Leasing</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              {['Leasing', 'Total Berkas', 'Approve', 'Reject', 'Conversion Rate'].map(h => (
                <th key={h} className="table-th" style={{ textAlign: 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leasingStats.map(l => (
              <tr key={l.name} className="table-row">
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{l.name}</td>
                <td className="table-td" style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{l.berkas}</td>
                <td className="table-td" style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{l.approve}</td>
                <td className="table-td" style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{l.berkas - l.approve}</td>
                <td className="table-td" style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', color: '#15803d' }}>
                    {l.berkas > 0 ? `${((l.approve / l.berkas) * 100).toFixed(0)}%` : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
