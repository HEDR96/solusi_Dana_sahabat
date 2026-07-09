import { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { useSortableData } from '../utils/useSortableData';
import { SortableTh } from '../components/UI/SortableTh';
import { Search, Shield, Activity } from 'lucide-react';

const SORT_GETTERS = {
  time: r => r.time, user: r => r.user, role: r => r.role, action: r => r.action,
};

const ACTION_STYLE = {
  'Login':             { color: '#1d4ed8', bg: '#eff6ff' },
  'Input Berkas Baru': { color: '#15803d', bg: '#f0fdf4' },
  'Ubah Status':       { color: '#b45309', bg: '#fffbeb' },
  'Upload Dokumen':    { color: '#6d28d9', bg: '#f5f3ff' },
  'Bayar Komisi':      { color: '#166534', bg: '#dcfce7' },
  'Edit Data':         { color: '#c2410c', bg: '#fff7ed' },
  'Hapus Data':        { color: '#dc2626', bg: '#fef2f2' },
};

const ROLE_STYLE = {
  'super-admin': { color: '#dc2626', bg: '#fef2f2' },
  'admin':       { color: '#2563eb', bg: '#eff6ff' },
  'agen':        { color: '#16a34a', bg: '#f0fdf4' },
  'surveyor':    { color: '#d97706', bg: '#fffbeb' },
  'finance':     { color: '#7c3aed', bg: '#f5f3ff' },
};

export function AuditLog() {
  const { auditLogs } = useApp();
  const [search, setSearch]           = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const actions = [...new Set(auditLogs.map(l => l.action))];

  const filtered = auditLogs.filter(l => {
    const q = search.toLowerCase();
    return (
      (!q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q)) &&
      (filterAction === 'all' || l.action === filterAction)
    );
  });

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filtered, SORT_GETTERS);

  return (
    <Layout
      title="Audit Log"
      subtitle="Riwayat seluruh aktivitas pengguna dalam sistem"
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: 240 }}>
          <Search size={14} color="var(--c-94a3b8)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user, aksi, detail..." />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="all">Semua Aksi</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={15} color="var(--c-64748b)" />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Log Aktivitas Sistem</p>
          <span style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginLeft: 4 }}>({filtered.length} entri)</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="table-head">
            <tr>
              <SortableTh label="Waktu" sortKey="time" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="User" sortKey="user" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Role" sortKey="role" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <SortableTh label="Aksi" sortKey="action" currentKey={sortKey} dir={sortDir} onSort={requestSort} />
              <th className="table-th">Detail</th>
              <th className="table-th">IP</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>Tidak ada log yang cocok</p>
                  </div>
                </td>
              </tr>
            ) : sorted.map(log => {
              const aStyle = ACTION_STYLE[log.action] || { color: 'var(--c-64748b)', bg: 'var(--surface-alt2)' };
              const rStyle = ROLE_STYLE[log.role]    || { color: 'var(--c-64748b)', bg: 'var(--surface-alt2)' };
              return (
                <tr key={log.id} className="table-row">
                  <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--c-94a3b8)', whiteSpace: 'nowrap' }}>{log.time}</td>
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm" style={{ background: rStyle.bg, color: rStyle.color, fontSize: 12, fontWeight: 800 }}>
                        {log.user[0]}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{log.user}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: rStyle.bg, color: rStyle.color }}>
                      {log.role}
                    </span>
                  </td>
                  <td className="table-td">
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: aStyle.bg, color: aStyle.color, whiteSpace: 'nowrap' }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-td" style={{ fontSize: 13, color: 'var(--c-374151)', maxWidth: 300 }}>{log.detail}</td>
                  <td className="table-td" style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--c-94a3b8)' }}>{log.ip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
