import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, X, FileText, User, CheckCircle, Clock, Users, Menu, UserCircle, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SECTIONS, canAccessSection } from '../../data/permissions';

const NOTIF_ICONS = {
  'berkas-baru':   { icon: FileText,    bg: '#dbeafe', color: '#1e40af' },
  'status-ubah':   { icon: Clock,       bg: '#fef3c7', color: '#92400e' },
  'survey-hari-ini':{ icon: CheckCircle, bg: '#dcfce7', color: '#14532d' },
  'komisi-unpaid': { icon: Bell,        bg: '#fee2e2', color: '#7f1d1d' },
};

const MAX_RESULTS = 5;

export function Topbar({ title, subtitle }) {
  const { notifications, markNotifRead, unreadCount, sidebarOpen, currentUser, visibleApplications, agents, setMobileNavOpen, logout } = useApp();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canSearchAgents = canAccessSection(currentUser?.role, SECTIONS.AGENTS);
  const canSearchApps = canAccessSection(currentUser?.role, SECTIONS.APPLICATIONS);
  const q = search.trim().toLowerCase();

  const appResults = q && canSearchApps
    ? visibleApplications.filter(a =>
        a.customerName.toLowerCase().includes(q) ||
        a.nik.includes(q) ||
        a.phone.includes(q) ||
        a.id.toLowerCase().includes(q)
      ).slice(0, MAX_RESULTS)
    : [];

  const agentResults = q && canSearchAgents
    ? agents.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.id.toLowerCase().includes(q)
      ).slice(0, MAX_RESULTS)
    : [];

  const hasResults = appResults.length > 0 || agentResults.length > 0;

  const goTo = path => { setShowResults(false); setSearch(''); navigate(path); };

  const handleSearchKeyDown = e => {
    if (e.key === 'Escape') { setShowResults(false); e.currentTarget.blur(); }
  };

  return (
    <header className={`topbar${!sidebarOpen ? ' collapsed' : ''}`}>
      {/* Mobile hamburger */}
      <button className="icon-btn mobile-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Buka menu">
        <Menu size={20} />
      </button>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-0f172a)', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginTop: 2 }}>{subtitle}</p>}
      </div>

      {/* Search */}
      <div ref={searchRef} className="topbar-search-wrap" style={{ position: 'relative' }}>
        <div className="search-input" style={{ display: 'flex' }}>
          <Search size={14} color="var(--c-94a3b8)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Cari nama, NIK, nomor berkas..."
          />
          {search && (
            <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => { setSearch(''); setShowResults(false); }}>
              <X size={13} />
            </button>
          )}
        </div>

        {showResults && q && (
          <div className="anim-scale-in" style={{
            position: 'absolute', left: 0, top: 'calc(100% + 8px)',
            width: 'min(380px, calc(100vw - 24px))', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,.12)',
            zIndex: 60, overflow: 'hidden',
          }}>
            {!hasResults ? (
              <div className="empty-state" style={{ padding: '28px 16px' }}>
                <Search size={22} color="var(--c-cbd5e1)" />
                <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Tidak ada hasil untuk "{search}"</p>
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {appResults.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 16px 6px' }}>Berkas</p>
                    {appResults.map(a => (
                      <div key={a.id} onClick={() => goTo(`/applications/${a.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={14} color="#1d4ed8" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.customerName}</p>
                          <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{a.id} · {a.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {agentResults.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 16px 6px', borderTop: appResults.length > 0 ? '1px solid var(--border-light)' : 'none' }}>Agen</p>
                    {agentResults.map(a => (
                      <div key={a.id} onClick={() => goTo(`/agents/${a.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Users size={14} color="#15803d" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>{a.id} · {a.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => setShowNotif(v => !v)}>
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="notif-dot" style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444', border: '2px solid var(--topbar-bg)',
            }} />
          )}
        </button>

        {showNotif && (
          <div className="anim-scale-in" style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 'min(360px, calc(100vw - 24px))', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,.12)',
            zIndex: 60, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>Notifikasi</p>
                {unreadCount > 0 && <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 1 }}>{unreadCount} belum dibaca</p>}
              </div>
              <button className="icon-btn" onClick={() => setShowNotif(false)}><X size={16} /></button>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <Bell size={24} color="var(--c-cbd5e1)" />
                  <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Tidak ada notifikasi</p>
                </div>
              ) : notifications.map(n => {
                const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS['berkas-baru'];
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => { markNotifRead(n.id); setShowNotif(false); navigate(n.link); }}
                    style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '12px 16px', cursor: 'pointer',
                      background: n.read ? 'var(--surface)' : 'var(--selected-bg)',
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'var(--surface)' : 'var(--selected-bg)'}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--c-0f172a)', lineHeight: 1.4, fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 3 }}>{n.time}</p>
                    </div>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', marginTop: 6, flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <div ref={userMenuRef} style={{ position: 'relative', paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowUserMenu(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }} data-tooltip={currentUser?.name}>
            {currentUser?.name?.[0] || '?'}
          </div>
        </button>

        {showUserMenu && (
          <div className="anim-scale-in" style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 'min(200px, calc(100vw - 24px))', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,.12)',
            zIndex: 60, overflow: 'hidden', padding: 6,
          }}>
            <div style={{ padding: '8px 10px', marginBottom: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</p>
              <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email}</p>
            </div>
            <button
              onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--c-374151)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <UserCircle size={15} /> Profil Saya
            </button>
            <button
              onClick={() => { setShowUserMenu(false); logout(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#ef4444' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={15} /> Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
