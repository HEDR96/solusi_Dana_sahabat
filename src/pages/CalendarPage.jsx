import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const EVENT_COLORS = {
  'berkas-masuk': { dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', label: 'Berkas Masuk' },
  'janji-survey': { dot: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9', label: 'Janji Survey' },
  'survey':       { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309', label: 'Survey' },
  'approve':      { dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', label: 'Approve' },
  'reject':       { dot: '#ef4444', bg: '#fef2f2', text: '#b91c1c', label: 'Reject' },
};

// Status yang masih bisa dijadwalkan survey ('verifikasi' dulu salah tulis —
// status yang benar di sistem adalah 'cek-data')
const SCHEDULABLE = ['pending', 'cek-data', 'janji-survey', 'survey'];

export function CalendarPage() {
  const { visibleApplications: applications, updateApplicationStatus, currentUser } = useApp();
  const navigate = useNavigate();
  const canEdit = ['owner', 'super-admin'].includes(currentUser?.role);
  const TODAY = new Date();
  const [currentDate, setCurrentDate] = useState(TODAY);
  const [selectedDay, setSelectedDay] = useState(null);
  const [schedModal, setSchedModal] = useState({ open: false, date: null, app: null, time: '', saving: false });

  const openSchedModal = (date, app = null) => {
    setSchedModal({ open: true, date, app, time: app?.surveyTime || '', saving: false });
  };
  const closeSchedModal = () => setSchedModal(m => ({ ...m, open: false }));

  const handleScheduleSave = async () => {
    const { app, date, time } = schedModal;
    if (!app) return;
    setSchedModal(m => ({ ...m, saving: true }));
    const dateStr = format(date, 'yyyy-MM-dd');
    await updateApplicationStatus(app.id, 'janji-survey', '', dateStr, time, undefined);
    setSchedModal(m => ({ ...m, saving: false, open: false }));
    setSelectedDay(date);
  };

  const events = [];
  applications.forEach(app => {
    if (app.inputDate) events.push({ date: app.inputDate, type: 'berkas-masuk', app });
    if (app.surveyDate)    events.push({ date: app.surveyDate, type: app.status === 'survey' ? 'survey' : 'janji-survey', app });
    if (app.approveDate)   events.push({ date: app.approveDate, type: 'approve', app });
  });

  const getEventsForDay = date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const upcomingSurveys = applications.filter(a => a.surveyDate >= todayStr && ['janji-survey', 'survey'].includes(a.status));

  return (
    <Layout title="Kalender Aktivitas" subtitle="Lihat jadwal survey dan progress berkas">
      <div className="rgrid rgrid-sidebar-r" style={{ gap: 20, alignItems: 'start' }}>
        {/* Calendar main */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-0f172a)', textTransform: 'capitalize' }}>
              {format(currentDate, 'MMMM yyyy', { locale: idLocale })}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(TODAY)}>Hari Ini</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border-light)' }}>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <div key={day} style={{ textAlign: 'center', padding: '8px', fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{day}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {days.map((day, i) => {
              const dayEvents   = getEventsForDay(day);
              const isToday     = isSameDay(day, TODAY);
              const isSelected  = selectedDay && isSameDay(day, selectedDay);
              const inMonth     = isSameMonth(day, currentDate);
              return (
                <div key={i} onClick={() => setSelectedDay(day)}
                  style={{
                    minHeight: 90, padding: 8, borderBottom: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)',
                    cursor: 'pointer', transition: 'background .1s',
                    background: isSelected ? 'var(--selected-bg)' : !inMonth ? 'var(--off-month-bg)' : 'var(--surface)',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'var(--selected-bg)' : !inMonth ? 'var(--off-month-bg)' : 'var(--surface)'; }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4, fontSize: 13, fontWeight: isToday ? 700 : 500,
                    background: isToday ? '#3b82f6' : 'transparent',
                    color: isToday ? '#fff' : inMonth ? 'var(--c-0f172a)' : 'var(--c-cbd5e1)',
                  }}>
                    {format(day, 'd')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvents.slice(0, 2).map((ev, j) => {
                      const c = EVENT_COLORS[ev.type] || EVENT_COLORS['berkas-masuk'];
                      return (
                        <div key={j} style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4,
                          background: c.bg, color: c.text,
                          borderLeft: `2px solid ${c.dot}`,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          fontWeight: 600,
                        }}>
                          {ev.app.customerName.split(' ')[0]}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: 10, color: 'var(--c-94a3b8)', paddingLeft: 2 }}>+{dayEvents.length - 2} lagi</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Legend */}
          <div className="card">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Keterangan</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(EVENT_COLORS).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: val.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{val.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day detail */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-0f172a)' }}>
                {selectedDay
                  ? format(selectedDay, 'd MMMM yyyy', { locale: idLocale })
                  : 'Pilih Tanggal'}
              </p>
              {canEdit && selectedDay && (
                <button className="btn btn-primary btn-sm" style={{ gap: 5, fontSize: 11 }} onClick={() => openSchedModal(selectedDay)}>
                  <Plus size={12} /> Jadwal Survey
                </button>
              )}
            </div>
            {!selectedDay ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Calendar size={28} color="var(--border)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>Klik tanggal di kalender</p>
              </div>
            ) : selectedEvents.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', textAlign: 'center', padding: '16px 0' }}>Tidak ada aktivitas</p>
            ) : selectedEvents.map((ev, i) => {
              const c = EVENT_COLORS[ev.type] || EVENT_COLORS['berkas-masuk'];
              const isSurveyEvent = ev.type === 'janji-survey' || ev.type === 'survey';
              return (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: c.bg, marginBottom: 8, borderLeft: `3px solid ${c.dot}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: c.text }}>{c.label}</p>
                    {canEdit && isSurveyEvent && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', fontSize: 10, gap: 3 }}
                        onClick={e => { e.stopPropagation(); openSchedModal(selectedDay, ev.app); }}
                      >
                        <Clock size={10} /> Ubah
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 2, cursor: 'pointer' }}
                    onClick={() => navigate(`/applications/${ev.app.id}`)}>{ev.app.customerName}</p>
                  <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{ev.app.id} · {ev.app.agentName}</p>
                  {ev.app.surveyTime && isSurveyEvent && (
                    <p style={{ fontSize: 11, fontWeight: 700, color: c.text, marginTop: 4 }}>⏰ {ev.app.surveyTime}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upcoming surveys */}
          {upcomingSurveys.length > 0 && (
            <div className="card">
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Survey Mendatang</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingSurveys.map(app => (
                  <div key={app.id} onClick={() => navigate(`/applications/${app.id}`)}
                    style={{ padding: '10px 12px', background: '#f5f3ff', borderRadius: 10, cursor: 'pointer', borderLeft: '3px solid #8b5cf6' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>{app.surveyDate} {app.surveyTime}</span>
                      <Badge status={app.status} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{app.customerName}</p>
                    <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{app.agentName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {schedModal.open && (
        <div className="modal-overlay" onClick={closeSchedModal}>
          <div className="modal" style={{ maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-0f172a)' }}>
                Jadwalkan Survey — {schedModal.date ? format(schedModal.date, 'd MMMM yyyy', { locale: idLocale }) : ''}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={closeSchedModal}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Pilih Berkas</label>
                <select
                  className="input"
                  value={schedModal.app?.id || ''}
                  onChange={e => {
                    const found = applications.find(a => a.id === e.target.value);
                    setSchedModal(m => ({ ...m, app: found || null }));
                  }}
                >
                  <option value="">— Pilih berkas —</option>
                  {applications
                    .filter(a => SCHEDULABLE.includes(a.status))
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.id} — {a.customerName} ({a.agentName})
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="label">Jam Survey (opsional)</label>
                <input
                  type="time"
                  className="input"
                  value={schedModal.time}
                  onChange={e => setSchedModal(m => ({ ...m, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeSchedModal}>Batal</button>
              <button
                className="btn btn-primary"
                disabled={!schedModal.app || schedModal.saving}
                onClick={handleScheduleSave}
              >
                {schedModal.saving ? 'Menyimpan…' : 'Simpan Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
