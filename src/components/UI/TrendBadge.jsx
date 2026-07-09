import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// current/previous: raw numbers. Renders a colored % change chip.
export function TrendBadge({ current, previous, suffix = ' vs periode lalu' }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const color = flat ? 'var(--c-94a3b8)' : up ? '#16a34a' : '#dc2626';
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color }}>
      <Icon size={11} />
      {Math.abs(pct).toFixed(0)}%
      <span style={{ fontWeight: 500, color: 'var(--c-94a3b8)' }}>{suffix}</span>
    </span>
  );
}
