import { getStatusInfo } from '../../data/dummyData';

const BADGE_MAP = {
  pending:       { label: 'Pending',       cls: 'badge-pending' },
  'cek-data':    { label: 'Cek Data',      cls: 'badge-cek-data' },
  'janji-survey':{ label: 'Janji Survey',  cls: 'badge-janji-survey' },
  survey:        { label: 'Survey',        cls: 'badge-survey' },
  komite:        { label: 'Komite',        cls: 'badge-komite' },
  approve:       { label: 'Approve',       cls: 'badge-approve' },
  cancel:        { label: 'Cancel',        cls: 'badge-cancel' },
  reject:        { label: 'Reject',        cls: 'badge-reject' },
  paid:          { label: 'Paid',          cls: 'badge-paid' },
  unpaid:        { label: 'Unpaid',        cls: 'badge-unpaid' },
  aktif:         { label: 'Aktif',         cls: 'badge-aktif' },
  nonaktif:      { label: 'Nonaktif',      cls: 'badge-nonaktif' },
};

export function Badge({ status, className = '' }) {
  const info = BADGE_MAP[status] || { label: status, cls: 'badge-pending' };
  return (
    <span className={`badge ${info.cls} ${className}`}>
      <span className="badge-dot" />
      {info.label}
    </span>
  );
}
