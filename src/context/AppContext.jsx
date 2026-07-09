import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { users as initialUsers } from '../data/dummyData';
import { ToastStack } from '../components/UI/Toast';
import { supabase } from '../lib/supabaseClient';

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
});
const mapLeasing = r => ({
  id: r.id, name: r.name, branch: r.branch, pic: r.pic, contact: r.contact,
  email: r.email, products: r.products, rate: r.rate, tenors: r.tenors,
  minPinjaman: r.min_pinjaman, maxPinjaman: r.max_pinjaman, status: r.status,
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
  user: r.user, date: r.date, notes: r.notes,
});
const mapActivity = r => ({
  id: r.id, agentId: r.agent_id, agentName: r.agent_name, date: r.date,
  type: r.type, description: r.description, outcome: r.outcome,
  relatedAppId: r.related_app_id,
});
const mapNotif = r => ({
  id: r.id, type: r.type, message: r.message, time: r.time_ago,
  read: r.read, link: r.link,
});
const mapAuditLog = r => ({
  id: r.id, user: r.user, role: r.role, action: r.action,
  detail: r.detail, time: r.time, ip: r.ip,
});

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  return { id: data.id, name: data.name, email: data.email, role: data.role, agentId: data.agent_id, status: data.status, lastLogin: data.last_login };
}

async function loadAll() {
  const [apps, agents, leasing, commissions, statusLogs, activities, notifs, auditLogs, profileRows] = await Promise.all([
    supabase.from('applications').select('*').order('input_date', { ascending: false }),
    supabase.from('agents').select('*').order('id'),
    supabase.from('leasing_partners').select('*').order('id'),
    supabase.from('commissions').select('*').order('id', { ascending: false }),
    supabase.from('status_logs').select('*').order('id'),
    supabase.from('agent_activities').select('*').order('date', { ascending: false }),
    supabase.from('notifications').select('*').order('id', { ascending: false }),
    supabase.from('audit_logs').select('*').order('id', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at'),
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
  const [users, setUsers] = useState(initialUsers);
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

  // Load all data once auth resolves and user is logged in
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { setDataLoading(false); return; }
    setDataLoading(true);
    loadAll().then(data => {
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
    }).catch(() => setDataLoading(false));
  }, [authLoading, currentUser?.id]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const profile = await fetchProfile(data.user.id);
    if (!profile) return { error: 'Profil pengguna tidak ditemukan' };
    setCurrentUser(profile);
    return { user: profile };
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    const { name, email } = updates;
    const { error } = await supabase.from('profiles').update({ name, email }).eq('id', currentUser.id);
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
      time: new Date().toLocaleString('id-ID'),
      ip: '192.168.1.1',
    };
    const { data } = await supabase.from('audit_logs').insert(newLog).select().single();
    if (data) setAuditLogs(prev => [mapAuditLog(data), ...prev]);
  };

  const updateApplicationStatus = async (appId, newStatus, notes, surveyDate, surveyTime) => {
    const app = applications.find(a => a.id === appId);
    const updates = { status: newStatus };
    if (surveyDate) updates.survey_date = surveyDate;
    if (surveyTime) updates.survey_time = surveyTime;
    if (newStatus === 'approve') {
      updates.approve_date = new Date().toISOString().split('T')[0];
      updates.approve_pinjaman = app.pinjaman;
    }
    await supabase.from('applications').update(updates).eq('id', appId);
    setApplications(prev => prev.map(a => {
      if (a.id !== appId) return a;
      const u = { ...a, status: newStatus };
      if (surveyDate) u.surveyDate = surveyDate;
      if (surveyTime) u.surveyTime = surveyTime;
      if (newStatus === 'approve') { u.approveDate = updates.approve_date; u.approvePinjaman = app.pinjaman; }
      return u;
    }));

    const logRow = { app_id: appId, from_status: app?.status, to_status: newStatus, user: currentUser?.name || 'Admin', date: new Date().toLocaleString('id-ID'), notes };
    const { data: logData } = await supabase.from('status_logs').insert(logRow).select().single();
    if (logData) setStatusLogs(prev => [...prev, mapStatusLog(logData)]);

    if (newStatus === 'approve' && app) {
      const commRow = {
        app_id: appId, customer_name: app.customerName, agent_id: app.agentId, agent_name: app.agentName,
        leasing_name: app.leasingName, approve_pinjaman: app.pinjaman,
        approve_date: new Date().toISOString().split('T')[0], commission_rate: 1.5,
        commission_amount: Math.round(app.pinjaman * 0.015), status: 'unpaid',
        payment_date: null, payment_method: null, notes: '',
      };
      const { data: commData } = await supabase.from('commissions').insert(commRow).select().single();
      if (commData) setCommissions(prev => [mapCommission(commData), ...prev]);
    }
    await addAuditLog('Ubah Status', `${appId}: ${app?.status} → ${newStatus}`);
    showToast(`Status berkas ${appId} diubah ke ${newStatus}`);
  };

  const addApplication = async (data) => {
    const newId = `BRK${String(2026000 + applications.length + 1).padStart(7, '0')}`;
    const row = {
      id: newId, status: 'pending', agent_id: data.agentId, agent_name: data.agentName,
      customer_name: data.customerName, nik: data.nik, phone: data.phone, city: data.city,
      address: data.address, unit_type: data.unitType, unit_year: data.unitYear,
      unit_brand: data.unitBrand, pinjaman: data.pinjaman, tenor: data.tenor,
      estimasi_angsuran: data.estimasiAngsuran, leasing_id: data.leasingId,
      leasing_name: data.leasingName, input_date: new Date().toISOString().split('T')[0],
      notes: data.notes || '',
    };
    const { data: inserted } = await supabase.from('applications').insert(row).select().single();
    if (inserted) setApplications(prev => [mapApp(inserted), ...prev]);
    await addAuditLog('Input Berkas Baru', `Berkas ${newId} - ${data.customerName}`);
    const notifRow = { type: 'berkas-baru', message: `Berkas baru dari ${data.agentName} - ${data.customerName}`, time_ago: 'Baru saja', read: false, link: '/applications' };
    const { data: notifData } = await supabase.from('notifications').insert(notifRow).select().single();
    if (notifData) setNotifications(prev => [mapNotif(notifData), ...prev]);
    showToast(`Berkas ${newId} berhasil ditambahkan`);
  };

  const markNotifRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const payCommission = async (id, method) => {
    const updates = { status: 'paid', payment_date: new Date().toISOString().split('T')[0], payment_method: method };
    await supabase.from('commissions').update(updates).eq('id', id);
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid', paymentDate: updates.payment_date, paymentMethod: method } : c));
    await addAuditLog('Bayar Komisi', `Komisi #${id} dibayarkan via ${method}`);
    showToast('Komisi berhasil dibayarkan');
  };

  const addActivity = async (data) => {
    const row = {
      agent_id: data.agentId, agent_name: data.agentName, date: data.date,
      type: data.type, description: data.description, outcome: data.outcome,
      related_app_id: data.relatedAppId || null,
    };
    const { data: inserted } = await supabase.from('agent_activities').insert(row).select().single();
    if (inserted) setAgentActivities(prev => [mapActivity(inserted), ...prev]);
    await addAuditLog('Catat Aktivitas', `${data.agentName} - ${data.type} (${data.date})`);
    showToast('Aktivitas berhasil dicatat');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isOwnScoped = currentUser?.role === 'agen';
  const visibleApplications = isOwnScoped
    ? applications.filter(a => a.agentId === currentUser.agentId)
    : applications;
  const visibleCommissions = isOwnScoped
    ? commissions.filter(c => c.agentId === currentUser.agentId)
    : commissions;
  const visibleActivities = isOwnScoped
    ? agentActivities.filter(a => a.agentId === currentUser.agentId)
    : agentActivities;

  return (
    <AppContext.Provider value={{
      currentUser, authLoading, dataLoading, login, logout, updateProfile,
      applications, setApplications, addApplication, updateApplicationStatus,
      visibleApplications, visibleCommissions, visibleActivities,
      commissions, setCommissions, payCommission,
      agentActivities, setAgentActivities, addActivity,
      agents, setAgents,
      leasing, setLeasing,
      users, setUsers,
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
