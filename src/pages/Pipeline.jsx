import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { useApp } from '../context/AppContext';
import { STATUSES, formatRupiah } from '../data/dummyData';
import { Columns, List, Eye } from 'lucide-react';

const PIPELINE_COLS = STATUSES.filter(s => !['approve', 'cancel', 'reject'].includes(s.key));
const TERMINAL     = STATUSES.filter(s => ['approve', 'cancel', 'reject'].includes(s.key));

export function Pipeline() {
  const { applications } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState('kanban');

  const byStatus = key => applications.filter(a => a.status === key);

  return (
    <Layout
      title="Pipeline Berkas"
      subtitle={`${applications.filter(a => !['approve','cancel','reject'].includes(a.status)).length} berkas aktif · Pantau progress setiap tahap`}
      actions={
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-alt2)', borderRadius: 8, padding: 3 }}>
          <button className={`btn btn-sm${view === 'kanban' ? ' btn-primary' : ' btn-ghost'}`} style={{ gap: 5 }} onClick={() => setView('kanban')}>
            <Columns size={14} /> Kanban
          </button>
          <button className={`btn btn-sm${view === 'list' ? ' btn-primary' : ' btn-ghost'}`} style={{ gap: 5 }} onClick={() => setView('list')}>
            <List size={14} /> List
          </button>
        </div>
      }
    >
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(s => {
          const count = byStatus(s.key).length;
          return (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px',
              background: 'var(--surface)', borderRadius: 8,
              border: `1.5px solid ${count > 0 ? s.hex + '35' : 'var(--border-light)'}`,
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.hex }} />
              <span style={{ fontSize: 12, color: 'var(--c-64748b)', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: count > 0 ? s.hex : 'var(--c-cbd5e1)' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {view === 'kanban' ? (
        <KanbanView byStatus={byStatus} navigate={navigate} />
      ) : (
        <ListView applications={applications} navigate={navigate} />
      )}
    </Layout>
  );
}

function KanbanView({ byStatus, navigate }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
      {PIPELINE_COLS.map(col => {
        const cards = byStatus(col.key);
        return (
          <div key={col.key} className="kanban-col" style={{ minWidth: 230, flex: '1 0 230px' }}>
            <div className="kanban-header" style={{ borderTop: `3px solid ${col.hex}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.hex }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)' }}>{col.label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.hex + '18', color: col.hex }}>{cards.length}</span>
            </div>
            <div className="kanban-body">
              {cards.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--c-cbd5e1)', fontSize: 12 }}>Tidak ada berkas</div>
                : cards.map(app => <KanbanCard key={app.id} app={app} navigate={navigate} hex={col.hex} />)
              }
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
        {TERMINAL.map(col => {
          const cards = byStatus(col.key);
          return (
            <div key={col.key} className="kanban-col" style={{ flex: 1 }}>
              <div className="kanban-header" style={{ borderTop: `3px solid ${col.hex}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.hex }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)' }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.hex + '18', color: col.hex }}>{cards.length}</span>
              </div>
              <div className="kanban-body" style={{ maxHeight: 200 }}>
                {cards.length === 0
                  ? <div style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--c-cbd5e1)', fontSize: 12 }}>Tidak ada</div>
                  : cards.map(app => <KanbanCard key={app.id} app={app} navigate={navigate} hex={col.hex} compact />)
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ app, navigate, hex, compact }) {
  return (
    <div className="kanban-card" onClick={() => navigate(`/applications/${app.id}`)}
      style={{ cursor: 'pointer', borderLeft: `3px solid ${hex}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compact ? 4 : 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--c-94a3b8)' }}>{app.id}</span>
        <Eye size={12} color="var(--c-cbd5e1)" />
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 4, lineHeight: 1.3 }}>{app.customerName}</p>
      {!compact ? (
        <>
          <p style={{ fontSize: 12, color: 'var(--c-64748b)', marginBottom: 6 }}>{app.unitType} · {app.unitBrand}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{formatRupiah(app.pinjaman)}</span>
            <span style={{ fontSize: 10, color: 'var(--c-94a3b8)' }}>{app.leasingName?.split(' ')[0]}</span>
          </div>
          {app.surveyDate && (
            <p style={{ fontSize: 11, color: '#8b5cf6', marginTop: 6, fontWeight: 600 }}>Survey: {app.surveyDate} {app.surveyTime}</p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.unitBrand} · {formatRupiah(app.pinjaman)}</p>
      )}
    </div>
  );
}

function ListView({ applications, navigate }) {
  return (
    <div className="table-wrap">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className="table-head">
          <tr>
            {['ID', 'Nasabah', 'Kendaraan', 'Leasing', 'OTR', 'Status', 'Agen', 'Tanggal', 'Aksi'].map(h => (
              <th key={h} className="table-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map(app => {
            const statusInfo = STATUSES.find(s => s.key === app.status);
            return (
              <tr key={app.id} className="table-row">
                <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.id}</td>
                <td className="table-td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg,${statusInfo?.hex || 'var(--c-64748b)'}60,${statusInfo?.hex || 'var(--c-64748b)'})`, color: '#fff', fontSize: 11 }}>
                      {app.customerName[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{app.customerName}</p>
                      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{app.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)' }}>{app.unitType} {app.unitBrand}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{app.leasingName}</td>
                <td className="table-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{formatRupiah(app.pinjaman)}</td>
                <td className="table-td"><Badge status={app.status} /></td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{app.agentName}</td>
                <td className="table-td" style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.inputDate}</td>
                <td className="table-td">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/applications/${app.id}`)}>
                    <Eye size={13} /> Detail
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
