import { CheckCircle, XCircle, Info } from 'lucide-react';

const VARIANTS = {
  success: { icon: CheckCircle, bg: '#15803d', border: '#16a34a' },
  error:   { icon: XCircle,     bg: '#b91c1c', border: '#dc2626' },
  info:    { icon: Info,        bg: '#1d4ed8', border: '#2563eb' },
};

export function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {toasts.map(t => {
        const v = VARIANTS[t.type] || VARIANTS.success;
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            className="anim-fade-up"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: v.bg, color: '#fff',
              padding: '12px 16px', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,.25)',
              minWidth: 240, maxWidth: 360,
              fontSize: 13, fontWeight: 600,
            }}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
