import { CheckCircle, XCircle, Info } from 'lucide-react';

const VARIANTS = {
  success: { icon: CheckCircle, accent: '#16a34a', iconBg: '#f0fdf4' },
  error:   { icon: XCircle,     accent: '#dc2626', iconBg: '#fef2f2' },
  info:    { icon: Info,        accent: '#2563eb', iconBg: '#eff6ff' },
};

export function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
    }}>
      {toasts.map(t => {
        const v = VARIANTS[t.type] || VARIANTS.success;
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            className="anim-fade-up"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', color: 'var(--c-0f172a)',
              padding: '12px 16px 12px 12px', borderRadius: 14,
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${v.accent}`,
              boxShadow: '0 12px 32px -8px rgba(15,23,42,.25)',
              minWidth: 260, maxWidth: 380,
              fontSize: 13, fontWeight: 600, lineHeight: 1.45,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: v.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={17} color={v.accent} />
            </div>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
