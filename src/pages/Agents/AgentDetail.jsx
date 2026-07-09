import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Badge } from '../../components/UI/Badge';
import { useApp } from '../../context/AppContext';
import { formatRupiah, ACTIVITY_TYPES, ACTIVITY_OUTCOMES } from '../../data/dummyData';
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, Target, CheckCircle, XCircle, FileText, DollarSign, Activity } from 'lucide-react';

function Row({ label, value, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      {Icon && <Icon size={14} color="var(--c-94a3b8)" style={{ marginTop: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--c-94a3b8)', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)', textAlign: 'right', wordBreak: 'break-all' }}>{value || '-'}</span>
      </div>
    </div>
  );
}

export function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agents, applications, commissions, agentActivities } = useApp();

  const agent = agents.find(a => a.id === id);
  if (!agent) return (
    <Layout title="Detail Agen">
      <div className="empty-state"><div className="empty-icon">👤</div><p>Agen tidak ditemukan.</p></div>
    </Layout>
  );

  const agentApps  = applications.filter(a => a.agentId === id);
  const agentComm  = commissions.filter(c => c.agentId === id);
  const agentActs  = agentActivities.filter(a => a.agentId === id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const totalKomisi  = agentComm.reduce((s, c) => s + c.commissionAmount, 0);
  const paidKomisi   = agentComm.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
  const unpaidKomisi = agentComm.filter(c => c.status === 'unpaid').reduce((s, c) => s + c.commissionAmount, 0);
  const realApprove = agentApps.filter(a => a.status === 'approve').length;
  const realReject  = agentApps.filter(a => a.status === 'reject').length;
  const rate = agentApps.length > 0 ? Math.round((realApprove / agentApps.length) * 100) : 0;

  const statItems = [
    { label: 'Total Berkas', value: agentApps.length, icon: FileText, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Approve', value: realApprove, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Reject', value: realReject, icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Conversion', value: `${rate}%`, icon: Target, color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <Layout title="Detail Agen" subtitle={agent.name}>
      <button onClick={() => navigate('/agents')} className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> Kembali ke Daftar Agen
      </button>

      <div className="rgrid rgrid-sidebar-l" style={{ gap: 20, alignItems: 'start' }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', margin: '0 auto 12px', fontSize: 28, fontWeight: 800 }}>
              {agent.name[0]}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 4 }}>{agent.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', fontFamily: 'monospace', marginBottom: 10 }}>{agent.id}</p>
            <Badge status={agent.status} />
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {statItems.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <Icon size={16} color={color} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-0f172a)' }}>{value}</p>
                <p style={{ fontSize: 10, color: 'var(--c-94a3b8)', marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="card">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Info Kontak</p>
            <Row label="Telepon" value={agent.phone} icon={Phone} />
            <Row label="Email" value={agent.email} icon={Mail} />
            <Row label="Kota" value={agent.city} icon={MapPin} />
            <Row label="NIK" value={agent.nik} icon={CreditCard} />
            <Row label="Bergabung" value={agent.joinDate} />
            <Row label="Target/Bulan" value={`${agent.target} berkas`} icon={Target} />
          </div>

          {/* Bank info */}
          <div className="card">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Rekening Bank</p>
            <Row label="Bank" value={agent.bank} />
            <Row label="No. Rekening" value={agent.accountNumber} />
            <Row label="Atas Nama" value={agent.accountName} />
          </div>

          {/* Commission summary */}
          <div className="card" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <DollarSign size={14} color="#60a5fa" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>Ringkasan Komisi</span>
            </div>
            {[
              { l: 'Total Komisi', v: formatRupiah(totalKomisi), c: 'var(--border)' },
              { l: 'Sudah Dibayar', v: formatRupiah(paidKomisi), c: '#4ade80' },
              { l: 'Belum Dibayar', v: formatRupiah(unpaidKomisi), c: '#f87171' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content — application history */}
        <div className="table-wrap">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>Riwayat Berkas</p>
            <span style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>{agentApps.length} berkas</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="table-head">
              <tr>
                {['No. Berkas', 'Nasabah', 'Leasing', 'OTR', 'Tenor', 'Status', 'Tgl Input'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agentApps.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <div className="empty-icon">📄</div>
                      <p>Belum ada berkas</p>
                    </div>
                  </td>
                </tr>
              ) : agentApps.map(app => (
                <tr key={app.id} className="table-row">
                  <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{app.id}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{app.customerName}</td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{app.leasingName}</td>
                  <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(app.pinjaman)}</td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)', textAlign: 'center' }}>{app.tenor} bln</td>
                  <td className="table-td"><Badge status={app.status} /></td>
                  <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.inputDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent activity */}
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="#3b82f6" />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>Aktivitas Terbaru</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/activities')}>Lihat semua</button>
          </div>
          {agentActs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', textAlign: 'center', padding: '16px 0' }}>Belum ada aktivitas tercatat</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agentActs.map(act => {
                const type = ACTIVITY_TYPES.find(t => t.key === act.type);
                const outcome = ACTIVITY_OUTCOMES.find(o => o.key === act.outcome);
                return (
                  <div key={act.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 11, color: 'var(--c-94a3b8)', whiteSpace: 'nowrap', width: 76, flexShrink: 0 }}>{act.date}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--c-374151)' }}>
                        <strong style={{ color: 'var(--c-0f172a)' }}>{type?.label}</strong> — {act.description}
                      </p>
                    </div>
                    {outcome && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: outcome.hex, whiteSpace: 'nowrap' }}>{outcome.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
