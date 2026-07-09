import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Badge } from '../../components/UI/Badge';
import { Modal } from '../../components/UI/Modal';
import { useApp } from '../../context/AppContext';
import { formatRupiah, STATUSES } from '../../data/dummyData';
import { ArrowLeft, Edit2, Printer, CheckCircle, User, Calendar, FileText, ChevronRight } from 'lucide-react';

export function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, statusLogs, updateApplicationStatus, currentUser } = useApp();
  const [showStatus, setShowStatus] = useState(false);
  const [newStatus, setNewStatus]   = useState('');
  const [notes, setNotes]           = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [surveyTime, setSurveyTime] = useState('');

  const app = applications.find(a => a.id === id);
  const isForbidden = app && currentUser?.role === 'agen' && app.agentId !== currentUser.agentId;
  if (!app || isForbidden) return (
    <Layout title="Detail Berkas">
      <div className="empty-state"><p>Berkas tidak ditemukan.</p></div>
    </Layout>
  );

  const logs = statusLogs.filter(l => l.appId === id);
  const canEdit = ['super-admin', 'admin'].includes(currentUser?.role);
  const needsSurvey = ['janji-survey', 'survey'].includes(newStatus);

  const handleSave = () => {
    updateApplicationStatus(id, newStatus, notes, surveyDate, surveyTime);
    setShowStatus(false);
    setNotes(''); setSurveyDate(''); setSurveyTime('');
  };

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 12, color: 'var(--c-94a3b8)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--c-0f172a)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div className="card" style={{ padding: '20px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
        {Icon && <Icon size={16} color="#3b82f6" />}
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{title}</p>
      </div>
      {children}
    </div>
  );

  return (
    <Layout title="Detail Berkas Pengajuan">
      {/* ── Header actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/applications')}>
          <ArrowLeft size={14} /> Kembali
        </button>
        <div style={{ flex: 1 }} />
        <Badge status={app.status} />
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowStatus(true)}>
            <Edit2 size={14} /> Ubah Status
          </button>
        )}
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
          <Printer size={14} /> Cetak
        </button>
      </div>

      {/* ── Application ID header ── */}
      <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Nomor Pengajuan</p>
          <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>{app.id}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>Diinput: {app.inputDate} oleh {app.agentName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge status={app.status} />
          {app.approveDate && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Approve: {app.approveDate}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', marginTop: 2 }}>{formatRupiah(app.approvePinjaman)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rgrid rgrid-detail" style={{ gap: 16 }}>
        {/* ── Left column ── */}
        <div>
          <Section title="Data Nasabah" icon={User}>
            <Row label="Nama Lengkap" value={app.customerName} />
            <Row label="NIK / KTP" value={app.nik} />
            <Row label="Nomor Telepon" value={app.phone} />
            <Row label="Kota" value={app.city} />
            <Row label="Alamat" value={app.address} />
          </Section>

          <Section title="Data Unit & Pinjaman" icon={FileText}>
            <div className="rgrid rgrid-2" style={{ gap: 0 }}>
              <div style={{ paddingRight: 16 }}>
                <Row label="Tipe Unit" value={app.unitType} />
                <Row label="Merk & Model" value={app.unitBrand} />
                <Row label="Tahun Unit" value={app.unitYear} />
                <Row label="Leasing Tujuan" value={app.leasingName} />
              </div>
              <div style={{ paddingLeft: 16, borderLeft: '1px solid var(--border-light)' }}>
                <Row label="Pinjaman Diajukan" value={formatRupiah(app.pinjaman)} />
                <Row label="Tenor" value={`${app.tenor} bulan`} />
                <Row label="Est. Angsuran/Bln" value={formatRupiah(app.estimasiAngsuran)} />
                {app.approvePinjaman && <Row label="Pinjaman Disetujui" value={formatRupiah(app.approvePinjaman)} />}
              </div>
            </div>
          </Section>

          {app.surveyDate && (
            <Section title="Informasi Survey" icon={Calendar}>
              <Row label="Tanggal Survey" value={app.surveyDate} />
              <Row label="Jam Survey" value={app.surveyTime} />
              <Row label="Hasil Survey" value={app.surveyResult || 'Belum diisi'} />
            </Section>
          )}

          <Section title="Dokumen Diupload" icon={FileText}>
            <div className="rgrid rgrid-3" style={{ gap: 8 }}>
              {['KTP', 'KK', 'STNK', 'BPKB', 'Slip Gaji', 'Foto Unit'].map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
                  <CheckCircle size={13} color="#22c55e" />
                  <span style={{ fontSize: 12, color: '#14532d', fontWeight: 500 }}>{d}</span>
                </div>
              ))}
            </div>
          </Section>

          {app.notes && (
            <div className="alert alert-warning" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 13 }}><strong>Catatan:</strong> {app.notes}</span>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div>
          {/* Agen info */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-94a3b8)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Agen Penginput</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>
                {app.agentName[0]}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{app.agentName}</p>
                <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>{app.agentId}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-94a3b8)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.05em' }}>Riwayat Status</p>
            {logs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', textAlign: 'center', padding: '16px 0' }}>Belum ada riwayat</p>
            ) : (
              <div className="timeline">
                {logs.map((log, i) => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-line">
                      <div className="timeline-dot" style={{ background: i === logs.length - 1 ? '#3b82f6' : 'var(--border)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === logs.length - 1 ? '#fff' : 'var(--c-94a3b8)' }} />
                      </div>
                      {i < logs.length - 1 && <div className="timeline-connector" />}
                    </div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        {log.fromStatus && <Badge status={log.fromStatus} />}
                        {log.fromStatus && <ChevronRight size={12} color="var(--c-94a3b8)" />}
                        <Badge status={log.toStatus} />
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--c-64748b)', fontWeight: 600 }}>{log.user}</p>
                      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{log.date}</p>
                      {log.notes && (
                        <p style={{ fontSize: 12, color: 'var(--c-374151)', marginTop: 6, background: 'var(--surface-alt)', borderRadius: 7, padding: '6px 10px', borderLeft: '3px solid var(--border)' }}>
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status modal ── */}
      <Modal
        isOpen={showStatus}
        onClose={() => setShowStatus(false)}
        title="Ubah Status Pengajuan"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowStatus(false)}>Batal</button>
            <button className="btn btn-primary" disabled={!newStatus} onClick={handleSave}>Simpan Status</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginBottom: 6 }}>Status saat ini</p>
            <Badge status={app.status} />
          </div>

          <div>
            <label className="label">Ubah ke status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STATUSES.filter(s => s.key !== app.status).map(s => (
                <button
                  key={s.key}
                  onClick={() => setNewStatus(s.key)}
                  style={{
                    padding: '10px 12px', border: `2px solid ${newStatus === s.key ? '#2563eb' : 'var(--border)'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: newStatus === s.key ? 'var(--selected-bg)' : 'var(--surface)',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  <Badge status={s.key} />
                </button>
              ))}
            </div>
          </div>

          {needsSurvey && (
            <div className="form-grid" style={{ gap: 12 }}>
              <div>
                <label className="label">Tanggal Survey</label>
                <input className="input" type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Jam Survey</label>
                <input className="input" type="time" value={surveyTime} onChange={e => setSurveyTime(e.target.value)} />
              </div>
            </div>
          )}

          {newStatus === 'approve' && (
            <div className="alert alert-success">
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Pengajuan akan disetujui</p>
                <p style={{ fontSize: 12, marginTop: 2 }}>Komisi {formatRupiah(Math.round(app.pinjaman * 0.015))} akan dibuat otomatis (1.5%)</p>
              </div>
            </div>
          )}

          <div>
            <label className="label">Catatan Perubahan</label>
            <textarea className="input textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tambahkan catatan (opsional)..." />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
