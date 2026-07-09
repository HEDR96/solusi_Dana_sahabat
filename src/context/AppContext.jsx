import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { applications as initialApps, commissions as initialCommissions, agents as initialAgents, leasingPartners as initialLeasing, users as initialUsers, notifications as initialNotifications, auditLogs as initialAuditLogs, statusLogs as initialStatusLogs, agentActivities as initialActivities } from '../data/dummyData';
import { ToastStack } from '../components/UI/Toast';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    agentId: data.agent_id,
    status: data.status,
    lastLogin: data.last_login,
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState(initialApps);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [agents, setAgents] = useState(initialAgents);
  const [leasing, setLeasing] = useState(initialLeasing);
  const [users, setUsers] = useState(initialUsers);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [statusLogs, setStatusLogs] = useState(initialStatusLogs);
  const [agentActivities, setAgentActivities] = useState(initialActivities);
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

  const addAuditLog = (action, detail) => {
    const newLog = {
      id: auditLogs.length + 1,
      user: currentUser?.name || 'System',
      role: currentUser?.role || 'system',
      action, detail,
      time: new Date().toLocaleString('id-ID'),
      ip: '192.168.1.1'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const updateApplicationStatus = (appId, newStatus, notes, surveyDate, surveyTime) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const updated = { ...app, status: newStatus };
      if (surveyDate) updated.surveyDate = surveyDate;
      if (surveyTime) updated.surveyTime = surveyTime;
      if (newStatus === 'approve') {
        updated.approveDate = new Date().toISOString().split('T')[0];
        updated.approvePinjaman = app.pinjaman;
      }
      return updated;
    }));
    const app = applications.find(a => a.id === appId);
    const newLog = {
      id: statusLogs.length + 1,
      appId,
      fromStatus: app?.status,
      toStatus: newStatus,
      user: currentUser?.name || 'Admin',
      date: new Date().toLocaleString('id-ID'),
      notes,
    };
    setStatusLogs(prev => [...prev, newLog]);
    if (newStatus === 'approve' && app) {
      const newComm = {
        id: commissions.length + 1,
        appId,
        customerName: app.customerName,
        agentId: app.agentId,
        agentName: app.agentName,
        leasingName: app.leasingName,
        approvePinjaman: app.pinjaman,
        approveDate: new Date().toISOString().split('T')[0],
        commissionRate: 1.5,
        commissionAmount: Math.round(app.pinjaman * 0.015),
        status: 'unpaid',
        paymentDate: null, paymentMethod: null, notes: '',
      };
      setCommissions(prev => [...prev, newComm]);
    }
    addAuditLog('Ubah Status', `${appId}: ${app?.status} → ${newStatus}`);
    showToast(`Status berkas ${appId} diubah ke ${newStatus}`);
  };

  const addApplication = (data) => {
    const newApp = {
      ...data,
      id: `BRK${String(2026000 + applications.length + 1).padStart(7, '0')}`,
      status: 'pending',
      inputDate: new Date().toISOString().split('T')[0],
      surveyDate: null, surveyTime: null, surveyResult: null,
      approveDate: null, approvePinjaman: null,
    };
    setApplications(prev => [newApp, ...prev]);
    addAuditLog('Input Berkas Baru', `Berkas ${newApp.id} - ${data.customerName}`);
    const notif = {
      id: notifications.length + 1,
      type: 'berkas-baru',
      message: `Berkas baru dari ${data.agentName} - ${data.customerName}`,
      time: 'Baru saja', read: false, link: '/applications'
    };
    setNotifications(prev => [notif, ...prev]);
    showToast(`Berkas ${newApp.id} berhasil ditambahkan`);
  };

  const markNotifRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const payCommission = (id, method) => {
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: method } : c));
    addAuditLog('Bayar Komisi', `Komisi #${id} dibayarkan via ${method}`);
    showToast('Komisi berhasil dibayarkan');
  };

  const addActivity = (data) => {
    const newActivity = { ...data, id: agentActivities.length + 1 };
    setAgentActivities(prev => [newActivity, ...prev]);
    addAuditLog('Catat Aktivitas', `${data.agentName} - ${data.type} (${data.date})`);
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
      currentUser, authLoading, login, logout, updateProfile,
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
