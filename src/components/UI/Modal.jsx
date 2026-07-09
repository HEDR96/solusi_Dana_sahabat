import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = { sm: 'modal-sm', md: 'modal-md', lg: 'modal-lg', xl: 'modal-xl' }[size] || 'modal-md';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-0f172a)' }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
