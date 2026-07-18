import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/dummyData';
import { useMemo } from 'react';
import { SECTIONS, canAccessSection } from '../data/permissions';
import { TrendBadge } from '../components/UI/TrendBadge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FileText, CheckCircle,
  XCircle, MinusCircle, Users, DollarSign, TrendingUp, ArrowRight,
  Banknote, ChevronRight
} from 'lucide-react';

/* ── Mini stat card ─────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, onClick, accent, trend }) {
  return (
    <div
      className={`stat-card${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      style={{ borderTop: accent ? `3px solid ${accent}` : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} color={iconColor} />
        </div>
        {onClick && (
          <div className="stat-card-arrow">
            <ChevronRight size={14} color="var(--c-94a3b8)" />
          </div>
        )}
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-0f172a)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12.5, color: 'var(--c-64748b)', marginTop: 5, fontWeight: 600 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 3 }}>{sub}</p>}
      {trend && <div style={{ marginTop: 8 }}><TrendBadge current={trend.current} previous={trend.previous} suffix="vs bulan lalu" /></div>}
    </div>
  );
}

/* ── Pipeline summary strip ─────────────────────── */
function PipelineStrip({ apps }) {
  const navigate = useNavigate();
  const steps = [
    { key: 'pending',       label: 'Pending',       color: 'var(--c-94a3b8)' },
    { key: 'cek-data',      label: 'Cek Data',      color: '#3b82f6' },
    { key: 'janji-survey',  label: 'Janji Survey',  color: '#7c3aed' },
    { key: 'survey',        label: 'Survey',        color: '#f59e0b' },
    { key: 'komite',        label: 'Komite',        color: '#f97316' },
    { key: 'approve',       label: 'Approve',       color: '#22c55e' },
  ];
  const total = apps.length || 1;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
      {steps.map(s => {
        const count = apps.filter(a => a.status === s.key).length;
        const pct = Math.round((count / total) * 100);
        return (
          <div
            key={s.key}
            onClick={() => navigate('/pipeline')}
            style={{
              flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
              transition: 'border-color .15s, background .15s', textAlign: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = 'var(--surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-alt)'; }}
          >
            <p style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{count}</p>
            <div style={{ height: 3, borderRadius: 99, background: `${s.color}30`, margin: '6px 0 4px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 99 }} />
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-64748b)' }}>{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Recharts custom tooltip ────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#fff' }}>
      <p style={{ color: 'var(--c-94a3b8)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: '#fff' }}>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

const PIE_COLORS = ['var(--c-94a3b8)','#3b82f6','#7c3aed','#f59e0b','#f97316','#22c55e','#ec4899','#ef4444'];

export function Dashboard() {
  const { visibleApplications: applications, visibleCommissions: commissions, agents, visibleAgents, currentUser } = useApp();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const canSee = section => canAccessSection(role, section);

  const s = {
    total:     applications.length,
    pending:   applications.filter(a => a.status === 'pending').length,
    cekData:   applications.filter(a => a.status === 'cek-data').length,
    janjiSurvey: applications.filter(a => a.status === 'janji-survey').length,
    survey:    applications.filter(a => a.status === 'survey').length,
    komite:    applications.filter(a => a.status === 'komite').length,
    approve:   applications.filter(a => a.status === 'approve').length,
    cancel:    applications.filter(a => a.status === 'cancel').length,
    reject:    applications.filter(a => a.status === 'reject').length,
    agenAktif: visibleAgents.filter(a => a.status === 'aktif').length,
    komisiUnpaid: commissions.filter(c => c.status === 'unpaid').length,
    komisiPaid:   commissions.filter(c => c.status === 'paid').length,
    totalPencairan: applications.filter(a => a.status === 'approve').reduce((acc, a) => acc + (a.approvePinjaman || 0), 0),
    totalKomisiUnpaid: commissions.filter(c => c.status === 'unpaid').reduce((acc, c) => acc + c.commissionAmount, 0),
  };

  const conversionRate = s.total > 0 ? ((s.approve / s.total) * 100).toFixed(1) : 0;

  const monthlyStats = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const y = d.getFullYear(), m = d.getMonth();
      const mo = applications.filter(a => {
        const ad = new Date(a.inputDate);
        return ad.getFullYear() === y && ad.getMonth() === m;
      });
      return { month: MONTHS[m], berkas: mo.length, approve: mo.filter(a => a.status === 'approve').length, reject: mo.filter(a => a.status === 'reject').length };
    });
  }, [applications]);

  const currentMonth  = monthlyStats[monthlyStats.length - 1] || { berkas: 0, approve: 0 };
  const previousMonth = monthlyStats[monthlyStats.length - 2] || { berkas: 0, approve: 0 };

  const pieData = [
    { name: 'Pending', value: s.pending },
    { name: 'Cek Data', value: s.cekData },
    { name: 'Janji Survey', value: s.janjiSurvey },
    { name: 'Survey', value: s.survey },
    { name: 'Komite', value: s.komite },
    { name: 'Approve', value: s.approve },
    { name: 'Cancel', value: s.cancel },
    { name: 'Reject', value: s.reject },
  ].filter(d => d.value > 0);

  const topAgents = [...visibleAgents].sort((a, b) => b.totalApprove - a.totalApprove).slice(0, 5);

  /* recent apps */
  const recentApps = [...applications].sort((a, b) => String(b.inputDate || '').localeCompare(String(a.inputDate || ''))).slice(0, 5);

  const secondaryCards = [
    canSee(SECTIONS.AGENTS) && { key: 'agenAktif', icon: Users, label: 'Agen Aktif', value: s.agenAktif, iconBg: '#f0fdf4', iconColor: '#15803d', onClick: () => navigate('/agents') },
    canSee(SECTIONS.COMMISSION) && { key: 'komisiUnpaid', icon: DollarSign, label: 'Komisi Unpaid', value: s.komisiUnpaid, iconBg: '#fee2e2', iconColor: '#dc2626', accent: '#ef4444', onClick: () => navigate('/commission') },
    canSee(SECTIONS.COMMISSION) && { key: 'komisiPaid', icon: Banknote, label: 'Komisi Paid', value: s.komisiPaid, iconBg: '#dcfce7', iconColor: '#15803d', accent: '#22c55e', onClick: () => navigate('/commission') },
  ].filter(Boolean);

  return (
    <Layout title="Dashboard" subtitle={`Selamat datang — Ringkasan aktivitas per hari ini, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}>
      {/* ── KPI row: ringkasan hasil berkas ── */}
      <div style={{ marginBottom: secondaryCards.length ? 14 : 20 }}>
        <p className="dashboard-row-label">Ringkasan Berkas</p>
        <div className="rgrid rgrid-4" style={{ gap: 14 }}>
          <StatCard icon={FileText}    label="Total Berkas" value={s.total}   iconBg="#dbeafe" iconColor="#1d4ed8" accent="#3b82f6" onClick={() => navigate('/applications')} trend={{ current: currentMonth.berkas, previous: previousMonth.berkas }} />
          <StatCard icon={CheckCircle} label="Approve"      value={s.approve} iconBg="#dcfce7" iconColor="#14532d" accent="#22c55e" sub={`${conversionRate}% conversion rate`} onClick={() => navigate('/applications')} trend={{ current: currentMonth.approve, previous: previousMonth.approve }} />
          <StatCard icon={XCircle}     label="Reject"       value={s.reject}  iconBg="#fee2e2" iconColor="#7f1d1d" accent="#ef4444" onClick={() => navigate('/applications')} />
          <StatCard icon={MinusCircle} label="Cancel"       value={s.cancel}  iconBg="#fce7f3" iconColor="#831843" accent="#ec4899" onClick={() => navigate('/applications')} />
        </div>
      </div>

      {/* ── KPI row: ringkasan organisasi ── */}
      {secondaryCards.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p className="dashboard-row-label">Ringkasan Organisasi</p>
          <div className={`rgrid rgrid-${Math.min(secondaryCards.length, 3)}`} style={{ gap: 14 }}>
            {secondaryCards.map(c => (
              <StatCard key={c.key} icon={c.icon} label={c.label} value={c.value} iconBg={c.iconBg} iconColor={c.iconColor} accent={c.accent} onClick={c.onClick} />
            ))}
          </div>
        </div>
      )}

      {/* ── Big KPI cards ── */}
      <div className="rgrid rgrid-2" style={{ gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 16, padding: '22px 24px', color: '#fff', boxShadow: '0 8px 24px rgba(37,99,235,.25)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600, marginBottom: 6 }}>TOTAL PENCAIRAN APPROVE</p>
          <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>{formatRupiah(s.totalPencairan)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{s.approve} pengajuan disetujui</p>
          {canSee(SECTIONS.REPORTS_SALES) && (
            <button onClick={() => navigate('/reports/sales')}
              style={{ marginTop: 14, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Lihat laporan <ArrowRight size={13} />
            </button>
          )}
        </div>
        <div style={{ background: 'linear-gradient(135deg,#881337,#be123c)', borderRadius: 16, padding: '22px 24px', color: '#fff', boxShadow: '0 8px 24px rgba(190,18,60,.25)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600, marginBottom: 6 }}>KOMISI BELUM DIBAYAR</p>
          <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>{formatRupiah(s.totalKomisiUnpaid)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{s.komisiUnpaid} komisi menunggu pembayaran</p>
          {canSee(SECTIONS.COMMISSION) && (
            <button onClick={() => navigate('/commission')}
              style={{ marginTop: 14, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Bayar sekarang <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline strip ── */}
      {canSee(SECTIONS.PIPELINE) && (
        <div className="card" style={{ padding: '20px 20px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p className="section-title"><TrendingUp size={16} color="#3b82f6" /> Status Pipeline</p>
              <p className="section-sub">Distribusi berkas aktif per tahap</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pipeline')} style={{ fontSize: 12 }}>
              Lihat kanban <ArrowRight size={13} />
            </button>
          </div>
          <PipelineStrip apps={applications} />
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="rgrid rgrid-charts" style={{ gap: 14, marginBottom: 20 }}>
        {/* Bar chart */}
        <div className="card" style={{ padding: '20px', gridColumn: 'span 1' }}>
          <p className="section-title" style={{ marginBottom: 4 }}>Berkas Masuk per Bulan</p>
          <p className="section-sub" style={{ marginBottom: 16 }}>Perbandingan berkas, approve, reject</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={monthlyStats} barSize={8} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-alt)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="berkas"  name="Berkas"  fill="#93c5fd" radius={[4,4,0,0]} />
              <Bar dataKey="approve" name="Approve" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="reject"  name="Reject"  fill="#fca5a5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart */}
        <div className="card" style={{ padding: '20px' }}>
          <p className="section-title" style={{ marginBottom: 4 }}>Tren Approve</p>
          <p className="section-sub" style={{ marginBottom: 16 }}>Approve & reject per bulan 2026</p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--c-94a3b8)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="approve" name="Approve" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="reject"  name="Reject"  stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card" style={{ padding: '20px' }}>
          <p className="section-title" style={{ marginBottom: 4 }}>Distribusi Status</p>
          <p className="section-sub" style={{ marginBottom: 12 }}>Semua berkas saat ini</p>
          {pieData.every(d => !d.value) ? (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 32 }}>📊</span>
              <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Belum ada berkas untuk ditampilkan</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} berkas`, n]} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--c-64748b)', flex: 1 }}>{d.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-0f172a)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="rgrid rgrid-2" style={{ gap: 14 }}>
        {/* Top agents */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p className="section-title">Top Agen</p>
              <p className="section-sub">Berdasarkan jumlah approve</p>
            </div>
            {canSee(SECTIONS.AGENTS) && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agents')}>Lihat semua</button>
            )}
          </div>
          {topAgents.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 28 }}>👥</span>
              <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', marginTop: 6 }}>Belum ada data agen</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topAgents.map((ag, i) => (
              <div key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#fef3c7' : i === 1 ? 'var(--border-light)' : i === 2 ? '#ffedd5' : 'var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: i === 0 ? '#92400e' : i === 1 ? '#475569' : i === 2 ? '#9a3412' : 'var(--c-64748b)',
                }}>
                  {i + 1}
                </div>
                <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>
                  {ag.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{ag.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{ag.totalApprove}</p>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${(ag.totalApprove / (topAgents[0].totalApprove || 1)) * 100}%`, background: '#22c55e' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent apps */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p className="section-title">Berkas Terbaru</p>
              <p className="section-sub">5 pengajuan terakhir masuk</p>
            </div>
            {canSee(SECTIONS.APPLICATIONS) && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/applications')}>Lihat semua</button>
            )}
          </div>
          {recentApps.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', marginTop: 6 }}>Belum ada pengajuan masuk</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentApps.map((app, i) => (
              <div
                key={app.id}
                onClick={canSee(SECTIONS.APPLICATIONS) ? () => navigate(`/applications/${app.id}`) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', cursor: canSee(SECTIONS.APPLICATIONS) ? 'pointer' : 'default',
                  borderBottom: i < recentApps.length - 1 ? '1px solid var(--border-light)' : 'none',
                  transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div className="avatar avatar-sm" style={{ background: 'var(--surface-alt2)', color: 'var(--c-64748b)', fontWeight: 700 }}>
                  {app.customerName?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.customerName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 1 }}>
                    {app.agentName} · {formatRupiah(app.pinjaman)}
                  </p>
                </div>
                <Badge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
