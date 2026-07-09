// Section keys map 1:1 to sidebar nav items / route groups.
export const SECTIONS = {
  DASHBOARD: 'dashboard',
  AGENTS: 'agents',
  APPLICATIONS: 'applications',
  PIPELINE: 'pipeline',
  CALENDAR: 'calendar',
  COMMISSION: 'commission',
  LEASING: 'leasing',
  SIMULATION: 'simulation',
  REPORTS_SALES: 'reports-sales',
  REPORTS_APPLICATIONS: 'reports-applications',
  REPORTS_COMMISSION: 'reports-commission',
  ACTIVITIES: 'activities',
  USERS: 'users',
  AUDIT: 'audit',
  SETTINGS: 'settings',
};

// Mirrors the permission descriptions already shown in Users.jsx per role.
export const ROLE_SECTIONS = {
  'super-admin': Object.values(SECTIONS),
  admin: [
    SECTIONS.DASHBOARD, SECTIONS.AGENTS, SECTIONS.APPLICATIONS, SECTIONS.PIPELINE,
    SECTIONS.CALENDAR, SECTIONS.COMMISSION, SECTIONS.LEASING, SECTIONS.SIMULATION,
    SECTIONS.REPORTS_SALES, SECTIONS.REPORTS_APPLICATIONS, SECTIONS.REPORTS_COMMISSION,
    SECTIONS.ACTIVITIES,
  ],
  agen: [
    SECTIONS.DASHBOARD, SECTIONS.APPLICATIONS, SECTIONS.CALENDAR,
    SECTIONS.COMMISSION, SECTIONS.SIMULATION, SECTIONS.ACTIVITIES,
  ],
  surveyor: [
    SECTIONS.DASHBOARD, SECTIONS.APPLICATIONS, SECTIONS.PIPELINE, SECTIONS.CALENDAR,
  ],
  finance: [
    SECTIONS.DASHBOARD, SECTIONS.COMMISSION,
    SECTIONS.REPORTS_SALES, SECTIONS.REPORTS_APPLICATIONS, SECTIONS.REPORTS_COMMISSION,
  ],
};

// Dynamic segments (e.g. /agents/:id) are matched by their static prefix.
export const ROUTE_SECTION = [
  { prefix: '/dashboard', section: SECTIONS.DASHBOARD },
  { prefix: '/agents', section: SECTIONS.AGENTS },
  { prefix: '/applications', section: SECTIONS.APPLICATIONS },
  { prefix: '/pipeline', section: SECTIONS.PIPELINE },
  { prefix: '/calendar', section: SECTIONS.CALENDAR },
  { prefix: '/commission', section: SECTIONS.COMMISSION },
  { prefix: '/leasing', section: SECTIONS.LEASING },
  { prefix: '/simulation', section: SECTIONS.SIMULATION },
  { prefix: '/reports/sales', section: SECTIONS.REPORTS_SALES },
  { prefix: '/reports/applications', section: SECTIONS.REPORTS_APPLICATIONS },
  { prefix: '/reports/commission', section: SECTIONS.REPORTS_COMMISSION },
  { prefix: '/activities', section: SECTIONS.ACTIVITIES },
  { prefix: '/users', section: SECTIONS.USERS },
  { prefix: '/audit', section: SECTIONS.AUDIT },
  { prefix: '/settings', section: SECTIONS.SETTINGS },
];

export function canAccessSection(role, section) {
  return (ROLE_SECTIONS[role] || []).includes(section);
}

export function sectionForPath(path) {
  const match = ROUTE_SECTION
    .filter(r => path === r.prefix || path.startsWith(r.prefix + '/'))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match?.section;
}

export function canAccessPath(role, path) {
  const section = sectionForPath(path);
  if (!section) return true;
  return canAccessSection(role, section);
}

// First section a role should land on after login, in priority order.
const DEFAULT_ROUTE_BY_SECTION = {
  [SECTIONS.DASHBOARD]: '/dashboard',
  [SECTIONS.APPLICATIONS]: '/applications',
  [SECTIONS.COMMISSION]: '/commission',
};

export function defaultRouteFor(role) {
  const sections = ROLE_SECTIONS[role] || [];
  for (const key of [SECTIONS.DASHBOARD, SECTIONS.APPLICATIONS, SECTIONS.COMMISSION]) {
    if (sections.includes(key)) return DEFAULT_ROUTE_BY_SECTION[key];
  }
  return '/dashboard';
}
