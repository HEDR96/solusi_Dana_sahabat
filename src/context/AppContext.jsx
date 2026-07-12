import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ToastStack } from '../components/UI/Toast';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_SETTINGS = {
  companyName: 'PT. Mitra Dana Indonesia',
  address: 'Jl. Sudirman No.100, Jakarta Pusat',
  phone: '021-5555-1234',
  email: 'info@mitradana.co.id',
  commissionRate: 1.5,
  commissionAgentRate: 80, // % dari komisi leasing yang diteruskan ke agen
  autoCommission: true,
};

const AppContext = createContext(null);

// ─── Mappers: snake_case DB → camelCase app ───────────────────────────────────
const mapApp = r => ({
  id: r.id, status: r.status, agentId: r.agent_id, agentName: r.agent_name,
  customerName: r.customer_name, nik: r.nik, phone: r.phone, city: r.city,
  address: r.address, unitType: r.unit_type, unitYear: r.unit_year,
  unitBrand: r.unit_brand, pinjaman: r.pinjaman, tenor: r.tenor,
  estimasiAngsuran: r.estimasi_angsuran, leasingId: r.leasing_id,
  leasingName: r.leasing_name, inputDate: r.input_date, notes: r.notes,
  surveyDate: r.survey_date, surveyTime: r.survey_time, surveyResult: r.survey_result,
  approveDate: r.approve_date, approvePinjaman: r.approve_pinjaman,
});
const mapAgent = r => ({
  id: r.id, name: r.name, phone: r.phone, email: r.email, city: r.city,
  address: r.address, nik: r.nik, status: r.status, joinDate: r.join_date,
  bank: r.bank, accountNumber: r.account_number, accountName: r.account_name,
  target: r.target, notes: r.notes, totalApprove: r.total_approve,
  totalReject: r.total_reject, totalBerkas: r.total_berkas,
  spvId: r.spv_id || null,
});
const mapLeasing = r => ({
  id: r.id, name: r.name, branch: r.branch, pic: r.pic, contact: r.contact,
  email: r.email, products: r.products, rate: r.rate, tenors: r.tenors,
  minPinjaman: r.min_pinjaman, maxPinjaman: r.max_pinjaman, status: r.status,
  syarat: r.syarat || '', notes: r.notes || '',
});
const mapCommission = r => ({
  id: r.id, appId: r.app_id, customerName: r.customer_name,
  agentId: r.agent_id, agentName: r.agent_name, leasingName: r.leasing_name,
  approvePinjaman: r.approve_pinjaman, approveDate: r.approve_date,
  commissionRate: r.commission_rate, commissionAmount: r.commission_amount,
  status: r.status, paymentDate: r.payment_date, paymentMethod: r.payment_method,
  notes: r.notes,
});
const mapStatusLog = r => ({
  id: r.id, appId: r.app_id, fromStatus: r.from_status, toStatus: r.to_status,
  user: r.user,
  // Tampilkan tanggal+jam dari created_at; fallback kolom date (tipe date, tanpa jam)
  date: r.created_at ? new Date(r.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : r.date,
  notes: r.notes,
});
const mapActivity = r => ({
  id: r.id, agentId: r.agent_id, agentName: r.agent_name, date: r.date,
  type: r.type, description: r.description, outcome: r.outcome,
  relatedAppId: r.related_app_id,
});
// "x menit lalu" dihitung dari created_at; fallback ke teks lama jika kolom belum ada
function relativeTime(iso) {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}
const mapNotif = r => ({
  id: r.id, type: r.type, message: r.message,
  time: relativeTime(r.created_at) || r.time_ago,
  read: r.read, link: r.link,
});
const mapAuditLog = r => ({
  id: r.id, user: r.user, role: r.role, action: r.action,
  detail: r.detail,
  time: r.time,
  timeDisplay: r.time
    ? new Date(r.time).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-',
});

async function fetchProfile(userId) {
  const { data } = await supabase.from('dsd_profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  return { id: data.id, name: data.name, email: data.email, role: data.role, agentId: data.agent_id, status: data.status, lastLogin: data.last_login };
}

// Sanitasi data satu kali (marker tersimpan di dsd_master_options):
// 1. dsd_leasing_partners: sisakan CMD Finance & BFI Finance (permintaan owner Jul 2026);
//    baris lain dihapus, atau dinonaktifkan jika masih direferensikan berkas (FK leasing_id)
// 2. Backfill dsd_status_logs untuk berkas lama yang riwayatnya kosong
//    (insert riwayat dulu gagal diam-diam karena format tanggal salah)
async function runDataCleanup(apps, leasingRows) {
  const MARKER = { category: 'app_settings', value: 'cleanup_leasing_v1' };
  const { data: done } = await supabase.from('dsd_master_options')
    .select('id').eq('category', MARKER.category).eq('value', MARKER.value).limit(1);
  if (done?.length) return null;

  const KEEP = ['cmd finance', 'bfi finance'];
  const norm = s => (s || '').trim().toLowerCase();
  const referenced = new Set(apps.map(a => a.leasingId).filter(Boolean));

  const keeperIds = new Set();
  for (const nm of KEEP) {
    const rows = leasingRows.filter(l => norm(l.name) === nm);
    const chosen = rows.sort((a, b) =>
      (referenced.has(b.id) - referenced.has(a.id)) || (a.id - b.id))[0];
    if (chosen) keeperIds.add(chosen.id);
  }
  const toDelete = [], toDeactivate = [];
  leasingRows.forEach(l => {
    if (keeperIds.has(l.id)) return;
    (referenced.has(l.id) ? toDeactivate : toDelete).push(l.id);
  });
  if (toDelete.length)     await supabase.from('dsd_leasing_partners').delete().in('id', toDelete);
  if (toDeactivate.length) await supabase.from('dsd_leasing_partners').update({ status: 'nonaktif' }).in('id', toDeactivate);
  if (keeperIds.size)      await supabase.from('dsd_leasing_partners').update({ status: 'aktif' }).in('id', [...keeperIds]);
  if (!leasingRows.some(l => norm(l.name) === 'cmd finance')) {
    await supabase.from('dsd_leasing_partners').insert({ name: 'CMD Finance', branch: 'Medan', status: 'aktif' });
  }

  const { data: logRows } = await supabase.from('dsd_status_logs').select('app_id');
  const hasLog = new Set((logRows || []).map(r => r.app_id));
  const missing = apps.filter(a => !hasLog.has(a.id));
  if (missing.length) {
    await supabase.from('dsd_status_logs').insert(missing.map(a => ({
      app_id: a.id, from_status: null, to_status: a.status,
      user: a.agentName || 'System', date: a.inputDate || new Date().toISOString().split('T')[0],
      notes: 'Riwayat awal (dipulihkan otomatis)',
    })));
  }

  await supabase.from('dsd_master_options').insert({ ...MARKER, label: new Date().toISOString(), sort: 0, active: false });

  const [{ data: newLeasing }, { data: newLogs }] = await Promise.all([
    supabase.from('dsd_leasing_partners').select('*').order('id'),
    supabase.from('dsd_status_logs').select('*').order('id'),
  ]);
  return {
    leasing: (newLeasing || []).map(mapLeasing),
    statusLogs: (newLogs || []).map(mapStatusLog),
  };
}

async function loadAll() {
  const [apps, agents, leasing, commissions, statusLogs, activities, notifs, auditLogs, profileRows] = await Promise.all([
    supabase.from('dsd_applications').select('*').order('input_date', { ascending: false }),
    supabase.from('dsd_agents').select('*').order('id'),
    supabase.from('dsd_leasing_partners').select('*').order('id'),
    supabase.from('dsd_commissions').select('*').order('id', { ascending: false }),
    supabase.from('dsd_status_logs').select('*').order('id'),
    supabase.from('dsd_agent_activities').select('*').order('date', { ascending: false }),
    supabase.from('dsd_notifications').select('*').order('id', { ascending: false }),
    supabase.from('dsd_audit_logs').select('*').order('id', { ascending: false }),
    supabase.from('dsd_profiles').select('*').order('created_at'),
  ]);
  return {
    applications: (apps.data || []).map(mapApp),
    agents: (agents.data || []).map(mapAgent),
    leasing: (leasing.data || []).map(mapLeasing),
    commissions: (commissions.data || []).map(mapCommission),
    statusLogs: (statusLogs.data || []).map(mapStatusLog),
    agentActivities: (activities.data || []).map(mapActivity),
    notifications: (notifs.data || []).map(mapNotif),
    auditLogs: (auditLogs.data || []).map(mapAuditLog),
    users: (profileRows.data || []).map(r => ({
      id: r.id, name: r.name, email: r.email, role: r.role,
      status: r.status, agentId: r.agent_id, lastLogin: r.last_login,
    })),
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [applications, setApplications] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [leasing, setLeasing] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('erp-settings') || '{}') }; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [agentActivities, setAgentActivities] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('erp-theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('erp-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  // Auth listener
  useEffect(() => {
    let active = true;
    // Bypass khusus development: localStorage.setItem('dev-role', 'owner') lalu reload.
    // Tidak pernah aktif di production build (import.meta.env.DEV = false).
    if (import.meta.env.DEV && localStorage.getItem('dev-role')) {
      setCurrentUser({
        id: 'dev-user', name: 'Dev Preview', email: 'dev@local',
        role: localStorage.getItem('dev-role'), agentId: localStorage.getItem('dev-agent-id') || null,
      });
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user) setCurrentUser(await fetchProfile(session.user.id));
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) setCurrentUser(await fetchProfile(session.user.id));
      else setCurrentUser(null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Settings global dari DB (baris khusus di dsd_master_options) — agar rate komisi
  // yang di-set owner berlaku sama untuk semua user, bukan per-browser (localStorage saja).
  useEffect(() => {
    if (authLoading || !currentUser) return;
    supabase.from('dsd_master_options')
      .select('label')
      .eq('category', 'app_settings')
      .eq('value', 'global')
      .limit(1)
      .then(({ data }) => {
        if (!data?.[0]?.label) return;
        try {
          const dbSettings = JSON.parse(data[0].label);
          setSettings(prev => ({ ...prev, ...dbSettings }));
        } catch { /* label bukan JSON valid — abaikan */ }
      });
  }, [authLoading, currentUser?.id]);

  // Load all data once auth resolves and user is logged in
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { setDataLoading(false); return; }
    setDataLoading(true);
    loadAll().then(async data => {
      setApplications(data.applications);
      setAgents(data.agents);
      setLeasing(data.leasing);
      setCommissions(data.commissions);
      setStatusLogs(data.statusLogs);
      setAgentActivities(data.agentActivities);
      setNotifications(data.notifications);
      setAuditLogs(data.auditLogs);
      setUsers(data.users);
      setDataLoading(false);
      // Sanitasi data satu kali — butuh hak tulis RLS (owner/super-admin/admin)
      if (['owner', 'super-admin', 'admin'].includes(currentUser.role)) {
        try {
          const cleaned = await runDataCleanup(data.applications, data.leasing);
          if (cleaned) {
            setLeasing(cleaned.leasing);
            setStatusLogs(cleaned.statusLogs);
          }
        } catch { /* non-fatal — dicoba lagi di login berikutnya */ }
      }
    }).catch(() => setDataLoading(false));
  }, [authLoading, currentUser?.id]);

  // Supabase Realtime: notif otomatis saat berkas baru INSERT dari sesi lain
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('realtime_applications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dsd_applications' }, payload => {
        const newApp = mapApp(payload.new);
        const isOwn   = newApp.agentId === currentUser.agentId;
        const canAll  = ['owner', 'super-admin', 'admin', 'spv-agen'].includes(currentUser.role);
        if (!canAll && !isOwn) return;  // agen hanya melihat berkas sendiri
        setApplications(prev => prev.some(a => a.id === newApp.id) ? prev : [newApp, ...prev]);
        // Toast untuk non-agen (agen sendiri yang input tidak perlu notif)
        if (currentUser.role !== 'agen') {
          showToast(`📋 Berkas baru dari ${newApp.agentName}: ${newApp.customerName} (${newApp.id})`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const now = new Date().toISOString();
    await supabase.from('dsd_profiles').update({ last_login: now }).eq('id', data.user.id);
    const profile = await fetchProfile(data.user.id);
    if (!profile) return { error: 'Profil pengguna tidak ditemukan' };
    setCurrentUser(profile);
    // Sync last_login ke daftar users
    setUsers(prev => prev.map(u => u.id === profile.id ? { ...u, lastLogin: profile.lastLogin } : u));
    return { user: profile };
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    const { name, email } = updates;
    const { error } = await supabase.from('dsd_profiles').update({ name, email }).eq('id', currentUser.id);
    if (error) { showToast('Gagal memperbarui profil', 'error'); return; }
    setCurrentUser(prev => ({ ...prev, ...updates }));
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
    showToast('Profil berhasil diperbarui');
  };

  const addAuditLog = async (action, detail) => {
    const newLog = {
      user: currentUser?.name || 'System',
      role: currentUser?.role || 'system',
      action, detail,
      time: new Date().toISOString(),
    };
    const { data } = await supabase.from('dsd_audit_logs').insert(newLog).select().single();
    if (data) setAuditLogs(prev => [mapAuditLog(data), ...prev]);
  };

  const updateApplicationStatus = async (appId, newStatus, notes, surveyDate, surveyTime, approvePinjaman) => {
    const app = applications.find(a => a.id === appId);
    const updates = { status: newStatus };
    if (surveyDate) updates.survey_date = surveyDate;
    if (surveyTime) updates.survey_time = surveyTime;
    if (newStatus === 'approve') {
      updates.approve_date = new Date().toISOString().split('T')[0];
      updates.approve_pinjaman = approvePinjaman || app.pinjaman;
    } else if (['reject', 'cancel'].includes(newStatus)) {
      // Bersihkan approve_date agar kalender tidak tampilkan event palsu
      updates.approve_date = null;
      updates.approve_pinjaman = null;
    }
    await supabase.from('dsd_applications').update(updates).eq('id', appId);
    setApplications(prev => prev.map(a => {
      if (a.id !== appId) return a;
      const u = { ...a, status: newStatus };
      if (surveyDate) u.surveyDate = surveyDate;
      if (surveyTime) u.surveyTime = surveyTime;
      if (newStatus === 'approve') { u.approveDate = updates.approve_date; u.approvePinjaman = updates.approve_pinjaman; }
      if (['reject', 'cancel'].includes(newStatus)) { u.approveDate = null; u.approvePinjaman = null; }
      return u;
    }));

    // Kolom `date` bertipe DATE di Postgres — WAJIB format ISO (yyyy-mm-dd).
    // Sebelumnya dikirim toLocaleString id-ID → insert gagal diam-diam → riwayat kosong.
    const logRow = { app_id: appId, from_status: app?.status, to_status: newStatus, user: currentUser?.name || 'Admin', date: new Date().toISOString().split('T')[0], notes };
    const { data: logData, error: logError } = await supabase.from('dsd_status_logs').insert(logRow).select().single();
    if (logData) setStatusLogs(prev => [...prev, mapStatusLog(logData)]);
    else if (logError) showToast('Riwayat status gagal disimpan: ' + logError.message, 'error');

    if (newStatus === 'approve' && app && settings.autoCommission !== false) {
      // Trigger DB (trg_commission_on_approve) biasanya sudah membuat komisi otomatis
      // saat update status di atas — cek dulu agar tidak tercipta baris dobel.
      let { data: existingComm } = await supabase.from('dsd_commissions')
        .select('*').eq('app_id', appId).order('id', { ascending: false }).limit(1);
      let commData = existingComm?.[0] || null;
      if (!commData) {
        const commRow = {
          app_id: appId, customer_name: app.customerName, agent_id: app.agentId, agent_name: app.agentName,
          leasing_name: app.leasingName, approve_pinjaman: app.pinjaman,
          approve_date: new Date().toISOString().split('T')[0], commission_rate: settings.commissionRate,
          commission_amount: Math.round(app.pinjaman * (settings.commissionRate / 100)), status: 'unpaid',
          payment_date: null, payment_method: null, notes: '',
        };
        ({ data: commData } = await supabase.from('dsd_commissions').insert(commRow).select().single());
      }
      if (commData) setCommissions(prev => prev.some(c => c.id === commData.id) ? prev : [mapCommission(commData), ...prev]);
    }
    await addAuditLog('Ubah Status', `${appId}: ${app?.status} → ${newStatus}`);
    showToast(`Status berkas ${appId} diubah ke ${newStatus}`);
  };

  const updateApplicationData = async (appId, fields) => {
    // fields: { customerName, nik, phone, city, address, unitType, unitBrand, unitYear, pinjaman, tenor, leasingName, notes }
    const dbRow = {
      customer_name: fields.customerName,
      nik: fields.nik,
      phone: fields.phone,
      city: fields.city,
      address: fields.address,
      unit_type: fields.unitType,
      unit_brand: fields.unitBrand,
      unit_year: fields.unitYear,
      pinjaman: Number(fields.pinjaman) || 0,
      tenor: Number(fields.tenor) || 0,
      leasing_name: fields.leasingName,
      notes: fields.notes,
    };
    const { error } = await supabase.from('dsd_applications').update(dbRow).eq('id', appId);
    if (error) { showToast('Gagal menyimpan perubahan: ' + error.message, 'error'); return; }
    setApplications(prev => prev.map(a => a.id !== appId ? a : { ...a, ...fields, pinjaman: dbRow.pinjaman, tenor: dbRow.tenor }));
    await addAuditLog('Edit Data Berkas', `${appId}: data nasabah/unit diperbarui`);
    showToast(`Data berkas ${appId} berhasil diperbarui`);
  };

  const addApplication = async (data, docFiles = {}) => {
    // ID dari sequence DB (anti-tabrakan); fallback ke hitung lokal jika RPC belum ada
    const { data: rpcId } = await supabase.rpc('dsd_next_brk_id');
    const newId = rpcId || `BRK${String(2026000 + applications.length + 1).padStart(7, '0')}`;
    const row = {
      id: newId, status: 'pending', agent_id: data.agentId, agent_name: data.agentName,
      customer_name: data.customerName, nik: data.nik, phone: data.phone, city: data.city,
      address: data.address, unit_type: data.unitType, unit_year: data.unitYear,
      unit_brand: data.unitBrand, pinjaman: data.pinjaman, tenor: data.tenor,
      estimasi_angsuran: data.estimasiAngsuran, leasing_id: data.leasingId,
      leasing_name: data.leasingName, input_date: new Date().toISOString().split('T')[0],
      notes: data.notes || '',
    };
    const { data: inserted } = await supabase.from('dsd_applications').insert(row).select().single();
    if (inserted) setApplications(prev => [mapApp(inserted), ...prev]);
    // Log status awal agar riwayat berkas tidak kosong sejak dibuat
    const { data: firstLog } = await supabase.from('dsd_status_logs')
      .insert({ app_id: newId, from_status: null, to_status: 'pending', user: currentUser?.name || data.agentName, date: row.input_date, notes: 'Berkas dibuat' })
      .select().single();
    if (firstLog) setStatusLogs(prev => [...prev, mapStatusLog(firstLog)]);
    await addAuditLog('Input Berkas Baru', `Berkas ${newId} - ${data.customerName}`);
    const notifRow = { type: 'berkas-baru', message: `Berkas baru dari ${data.agentName} - ${data.customerName}`, time_ago: 'Baru saja', read: false, link: '/applications' };
    const { data: notifData } = await supabase.from('dsd_notifications').insert(notifRow).select().single();
    if (notifData) setNotifications(prev => [mapNotif(notifData), ...prev]);
    // Upload dokumen ke GDrive jika ada
    const fileEntries = Object.entries(docFiles).filter(([, f]) => f);
    if (fileEntries.length > 0) {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const toBase64 = (file) => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      await Promise.allSettled(fileEntries.map(async ([docName, file]) => {
        const safeType = docName.toLowerCase().replace(/\s+/g, '-');
        const dataBase64 = await toBase64(file);
        await fetch('/api/gdrive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            appId: newId,
            filename: `${newId}_${safeType}_${file.name.split('.').pop()}`,
            contentType: file.type || 'application/octet-stream',
            dataBase64,
          }),
        });
      }));
      showToast(`Berkas ${newId} + ${fileEntries.length} dokumen berhasil ditambahkan`);
    } else {
      showToast(`Berkas ${newId} berhasil ditambahkan`);
    }
    return newId;
  };

  const markNotifRead = async (id) => {
    await supabase.from('dsd_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const payCommission = async (id, method) => {
    const updates = { status: 'paid', payment_date: new Date().toISOString().split('T')[0], payment_method: method };
    await supabase.from('dsd_commissions').update(updates).eq('id', id);
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid', paymentDate: updates.payment_date, paymentMethod: method } : c));
    await addAuditLog('Bayar Komisi', `Komisi #${id} dibayarkan via ${method}`);
    showToast('Komisi berhasil dibayarkan');
  };

  const payCommissionsBulk = async (ids, method) => {
    if (!ids.length) return;
    const today = new Date().toISOString().split('T')[0];
    const updates = { status: 'paid', payment_date: today, payment_method: method };
    await supabase.from('dsd_commissions').update(updates).in('id', ids);
    setCommissions(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'paid', paymentDate: today, paymentMethod: method } : c));
    await addAuditLog('Bayar Komisi (Bulk)', `${ids.length} komisi dibayarkan via ${method}`);
    showToast(`${ids.length} komisi berhasil dibayarkan`);
  };

  const addActivity = async (data) => {
    const row = {
      agent_id: data.agentId, agent_name: data.agentName, date: data.date,
      type: data.type, description: data.description, outcome: data.outcome,
      related_app_id: data.relatedAppId || null,
    };
    const { data: inserted } = await supabase.from('dsd_agent_activities').insert(row).select().single();
    if (inserted) setAgentActivities(prev => [mapActivity(inserted), ...prev]);
    await addAuditLog('Catat Aktivitas', `${data.agentName} - ${data.type} (${data.date})`);
    showToast('Aktivitas berhasil dicatat');
  };

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('erp-settings', JSON.stringify(newSettings));
    // Sinkron ke DB agar berlaku untuk semua user; active:false supaya tidak
    // ikut muncul di dropdown master options (yang memfilter active=true).
    const payload = JSON.stringify(newSettings);
    const { data: existing } = await supabase.from('dsd_master_options')
      .select('id').eq('category', 'app_settings').eq('value', 'global').limit(1);
    const { error } = existing?.length
      ? await supabase.from('dsd_master_options').update({ label: payload }).eq('id', existing[0].id)
      : await supabase.from('dsd_master_options').insert({ category: 'app_settings', value: 'global', label: payload, sort: 0, active: false });
    if (error) showToast('Tersimpan lokal, tapi gagal sinkron ke server: ' + error.message, 'error');
    else showToast('Pengaturan berhasil disimpan');
  }, [showToast]);

  // Return: id agen baru (string) jika sukses, false jika gagal.
  // createAccount=false dipakai alur Manajemen User (akun dibuat via createUser dengan password pilihan admin).
  const addAgent = async (data, { createAccount = true } = {}) => {
    // Ambil max ID dari DB untuk hindari collision (length+1 rusak jika ada penghapusan)
    const { data: maxRow } = await supabase.from('dsd_agents').select('id').order('id', { ascending: false }).limit(1).single();
    const lastNum = maxRow?.id ? (parseInt(maxRow.id.replace(/\D/g, ''), 10) || 0) : 0;
    const newId = `AGT${String(lastNum + 1).padStart(3, '0')}`;
    const row = {
      id: newId, name: data.name, phone: data.phone, email: data.email,
      city: data.city, address: data.address, nik: data.nik, status: data.status,
      join_date: data.joinDate || new Date().toISOString().split('T')[0], bank: data.bank, account_number: data.accountNumber,
      account_name: data.accountName, target: Number(data.target) || 10, notes: data.notes,
      total_approve: 0, total_reject: 0, total_berkas: 0,
      spv_id: data.spvId || null,
    };
    const { data: inserted, error } = await supabase.from('dsd_agents').insert(row).select().single();
    if (error) { showToast('Gagal menyimpan agen: ' + error.message, 'error'); return false; }
    setAgents(prev => [...prev, mapAgent(inserted)]);
    await addAuditLog('Tambah Agen', `Agen baru: ${data.name} (${newId})`);

    // Buat akun login jika email diisi agar agen bisa login & input berkas
    if (createAccount && data.email?.trim()) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const resp = await fetch('/api/admin-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: data.name, email: data.email.trim(),
            password: `SDS${newId}${new Date().getFullYear()}`, role: 'agen',
            status: data.status, agentId: newId,
          }),
        });
        const result = await resp.json();
        if (resp.ok) {
          setUsers(prev => [...prev, {
            id: result.id, name: result.name, email: result.email,
            role: 'agen', status: data.status, agentId: newId, lastLogin: '-',
          }]);
          showToast(`Agen ${data.name} ditambahkan + akun login dibuat (password: "password")`);
        } else {
          showToast(`Agen tersimpan, tapi akun login gagal: ${result.error || 'coba tambah user manual'}`, 'error');
        }
        return newId;
      }
    }

    return newId;
  };

  const updateAgent = async (id, data) => {
    const row = {
      name: data.name, phone: data.phone, email: data.email,
      city: data.city, address: data.address, nik: data.nik, status: data.status,
      join_date: data.joinDate, bank: data.bank, account_number: data.accountNumber,
      account_name: data.accountName, target: Number(data.target), notes: data.notes,
      spv_id: data.spvId || null,
    };
    const { error } = await supabase.from('dsd_agents').update(row).eq('id', id);
    if (error) { showToast('Gagal memperbarui agen: ' + error.message, 'error'); return false; }
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...data, target: Number(data.target) } : a));
    await addAuditLog('Edit Agen', `Update data agen: ${data.name} (${id})`);
    return true;
  };

  const addLeasing = async (data) => {
    const row = {
      name: data.name, branch: data.branch, pic: data.pic, contact: data.contact,
      email: data.email, products: data.products, rate: data.rate, tenors: data.tenors,
      min_pinjaman: Number(data.minPinjaman), max_pinjaman: Number(data.maxPinjaman),
      status: data.status, syarat: data.syarat || '', notes: data.notes || '',
    };
    const { data: inserted, error } = await supabase.from('dsd_leasing_partners').insert(row).select().single();
    if (error) { showToast('Gagal menyimpan leasing: ' + error.message, 'error'); return false; }
    setLeasing(prev => [...prev, mapLeasing(inserted)]);
    await addAuditLog('Tambah Leasing', `Mitra leasing baru: ${data.name}`);
    return true;
  };

  const updateLeasing = async (id, data) => {
    const row = {
      name: data.name, branch: data.branch, pic: data.pic, contact: data.contact,
      email: data.email, products: data.products, rate: data.rate, tenors: data.tenors,
      min_pinjaman: Number(data.minPinjaman), max_pinjaman: Number(data.maxPinjaman),
      status: data.status, syarat: data.syarat || '', notes: data.notes || '',
    };
    const { error } = await supabase.from('dsd_leasing_partners').update(row).eq('id', id);
    if (error) { showToast('Gagal memperbarui leasing: ' + error.message, 'error'); return false; }
    setLeasing(prev => prev.map(l => l.id === id ? { ...l, ...data, minPinjaman: Number(data.minPinjaman), maxPinjaman: Number(data.maxPinjaman) } : l));
    await addAuditLog('Edit Leasing', `Update mitra leasing: ${data.name} (${id})`);
    return true;
  };

  const createUser = async (data) => {
    // Pakai endpoint admin (service role di server) — tidak mengganggu sesi admin yang login
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { showToast('Sesi tidak valid — silakan login ulang', 'error'); return false; }

    const resp = await fetch('/api/admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: data.name.trim(), email: data.email.trim(),
        password: data.password, role: data.role,
        status: data.status, agentId: data.agentId || null,
      }),
    });
    const result = await resp.json();
    if (!resp.ok) {
      showToast('Gagal membuat akun: ' + (result.error || `HTTP ${resp.status}`), 'error');
      return false;
    }
    setUsers(prev => [...prev, {
      id: result.id, name: result.name, email: result.email,
      role: result.role, status: result.status, agentId: data.agentId || null, lastLogin: '-',
    }]);
    await addAuditLog('Buat User', `User baru: ${data.name} (${data.role})`);
    showToast(`User ${data.name} berhasil dibuat ✅`);
    return true;
  };

  const updateUserProfile = async (id, data) => {
    const { error } = await supabase.from('dsd_profiles').update({
      name: data.name.trim(), email: data.email.trim(),
      role: data.role, status: data.status, agent_id: data.agentId || null,
    }).eq('id', id);
    if (error) { showToast('Gagal memperbarui user: ' + error.message, 'error'); return false; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    await addAuditLog('Edit User', `Update user: ${data.name}`);
    return true;
  };

  const assignAgentsToSpv = async (spvUserId, agentIds) => {
    // Set spv_id = spvUserId untuk agen yang dipilih; hapus spv_id dari agen yang sebelumnya di bawah SPV ini tapi kini di-deselect
    const prevManaged = agents.filter(a => a.spvId === spvUserId).map(a => a.id);
    const toAdd    = agentIds.filter(id => !prevManaged.includes(id));
    const toRemove = prevManaged.filter(id => !agentIds.includes(id));
    const ops = [
      ...toAdd.map(id => supabase.from('dsd_agents').update({ spv_id: spvUserId }).eq('id', id)),
      ...toRemove.map(id => supabase.from('dsd_agents').update({ spv_id: null }).eq('id', id)),
    ];
    await Promise.all(ops);
    setAgents(prev => prev.map(a => {
      if (toAdd.includes(a.id))    return { ...a, spvId: spvUserId };
      if (toRemove.includes(a.id)) return { ...a, spvId: null };
      return a;
    }));
    await addAuditLog('Atur SPV', `SPV ${spvUserId} mengelola ${agentIds.length} agen`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const role = currentUser?.role;
  const isAgenScoped = role === 'agen';
  const isSpvScoped  = role === 'spv-agen';

  // IDs of agents this supervisor manages (empty array when not spv-agen)
  const managedAgentIds = isSpvScoped
    ? agents.filter(a => a.spvId === currentUser?.id).map(a => a.id)
    : [];

  const visibleAgents = isSpvScoped
    ? agents.filter(a => a.spvId === currentUser?.id)
    : agents;

  const visibleApplications = isAgenScoped
    ? applications.filter(a => a.agentId === currentUser.agentId)
    : isSpvScoped
    ? applications.filter(a => managedAgentIds.includes(a.agentId))
    : applications;

  const visibleCommissions = isAgenScoped
    ? commissions.filter(c => c.agentId === currentUser.agentId)
    : isSpvScoped
    ? commissions.filter(c => managedAgentIds.includes(c.agentId))
    : commissions;

  const visibleActivities = isAgenScoped
    ? agentActivities.filter(a => a.agentId === currentUser.agentId)
    : isSpvScoped
    ? agentActivities.filter(a => managedAgentIds.includes(a.agentId))
    : agentActivities;

  return (
    <AppContext.Provider value={{
      currentUser, authLoading, dataLoading, login, logout, updateProfile,
      applications, setApplications, addApplication, updateApplicationStatus, updateApplicationData,
      visibleApplications, visibleCommissions, visibleActivities,
      visibleAgents, managedAgentIds,
      commissions, setCommissions, payCommission, payCommissionsBulk,
      agentActivities, setAgentActivities, addActivity,
      agents, setAgents, addAgent, updateAgent,
      leasing, setLeasing, addLeasing, updateLeasing,
      users, setUsers, createUser, updateUserProfile, assignAgentsToSpv,
      settings, saveSettings,
      notifications, setNotifications, markNotifRead, unreadCount,
      auditLogs, setAuditLogs, statusLogs, setStatusLogs,
      darkMode, setDarkMode,
      sidebarOpen, setSidebarOpen,
      mobileNavOpen, setMobileNavOpen,
      showToast,
    }}>
      {children}
      <ToastStack toasts={toasts} />
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
