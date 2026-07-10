import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, GitBranch, Calendar,
  DollarSign, Building2, Calculator, TrendingUp, FileBarChart,
  Receipt, UserCog, ClipboardList, Settings, ChevronLeft,
  ChevronRight, LogOut, BarChart3, X, Activity, MapPin, Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SECTIONS, canAccessSection } from '../../data/permissions';
import { useMasterPairs } from '../../utils/useMasterOptions';

const NAV = [
  { path: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard',        key: SECTIONS.DASHBOARD },
  { path: '/agents',               icon: Users,           label: 'Daftar Agen',      key: SECTIONS.AGENTS },
  { path: '/applications',         icon: FileText,        label: 'Berkas Masuk',     key: SECTIONS.APPLICATIONS },
  { path: '/pipeline',             icon: GitBranch,       label: 'Pipeline Status',  key: SECTIONS.PIPELINE },
  { path: '/calendar',             icon: Calendar,        label: 'Kalender',         key: SECTIONS.CALENDAR },
  { path: '/activities',           icon: Activity,        label: 'Aktivitas Agen',   key: SECTIONS.ACTIVITIES },
  { path: '/map',                  icon: MapPin,          label: 'Peta Agen',        key: SECTIONS.MAP },
  { path: '/commission',           icon: DollarSign,      label: 'Komisi Agen',      key: SECTIONS.COMMISSION },
  { path: '/leasing',              icon: Building2,       label: 'Master Leasing',   key: SECTIONS.LEASING },
  { path: '/simulation',           icon: Calculator,      label: 'Simulasi Angsuran',key: SECTIONS.SIMULATION },
  { section: 'Laporan' },
  { path: '/reports/sales',        icon: TrendingUp,      label: 'Lap. Penjualan',   key: SECTIONS.REPORTS_SALES },
  { path: '/reports/applications', icon: FileBarChart,    label: 'Lap. Berkas',      key: SECTIONS.REPORTS_APPLICATIONS },
  { path: '/reports/commission',   icon: Receipt,         label: 'Lap. Komisi',      key: SECTIONS.REPORTS_COMMISSION },
  { section: 'Sistem' },
  { path: '/masterdata',           icon: Database,        label: 'Master Data',      key: SECTIONS.MASTERDATA },
  { path: '/users',                icon: UserCog,         label: 'Manajemen User',   key: SECTIONS.USERS },
  { path: '/audit',                icon: ClipboardList,   label: 'Audit Log',        key: SECTIONS.AUDIT },
  { path: '/settings',             icon: Settings,        label: 'Pengaturan',       key: SECTIONS.SETTINGS },
];

// Fallback label role — sumber utama: master_options kategori 'role' (menu Master Data)
const FALLBACK_ROLE_LABELS = [
  { value: 'owner',       label: 'Owner' },
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'admin',       label: 'Admin / Back Office' },
  { value: 'spv-agen',    label: 'Supervisor Agen' },
  { value: 'agen',        label: 'Agen' },
  { value: 'surveyor',    label: 'Surveyor' },
  { value: 'finance',     label: 'Finance' },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, mobileNavOpen, setMobileNavOpen, currentUser, logout } = useApp();
  const navigate = useNavigate();
  const collapsed = !sidebarOpen;
  const rolePairs = useMasterPairs('role', FALLBACK_ROLE_LABELS);
  const roleLabel = rolePairs.find(r => r.value === currentUser?.role)?.label || currentUser?.role;

  const allowedNav = NAV.filter(item => !item.path || canAccessSection(currentUser?.role, item.key));
  const visibleNav = allowedNav.filter((item, i) => {
    if (!item.section) return true;
    const next = allowedNav[i + 1];
    return next && !next.section;
  });

  return (
    <>
      {mobileNavOpen && <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileNavOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Building2 size={17} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>FinanceERP</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>Multifinance System</p>
          </div>
        )}
        <button
          className="icon-btn sidebar-collapse-btn"
          style={{ color: 'rgba(255,255,255,.5)', marginLeft: 'auto', flexShrink: 0 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-tooltip={collapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          className="icon-btn sidebar-mobile-close-btn"
          style={{ color: 'rgba(255,255,255,.5)', marginLeft: 'auto', flexShrink: 0 }}
          onClick={() => setMobileNavOpen(false)}
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleNav.map((item, i) => {
          if (item.section) {
            return collapsed ? (
              <div key={i} style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,.06)' }} />
            ) : (
              <p key={i} className="nav-section-label">{item.section}</p>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              data-tooltip={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="nav-icon" style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="avatar avatar-sm"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', flexShrink: 0 }}
            >
              {currentUser.name[0]}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>
                  {roleLabel}
                </p>
              </div>
            )}
            <button
              className="icon-btn"
              style={{ color: 'rgba(255,255,255,.4)', flexShrink: 0 }}
              onClick={() => { logout(); navigate('/login'); }}
              data-tooltip="Keluar"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}
