import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { AlertTriangle, LogOut, Trash2, Info, CheckCircle2, X } from 'lucide-react';

type Variant = 'danger' | 'primary' | 'warning' | 'info';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantMap: Record<Variant, { icon: React.ReactNode; confirmClass: string; accent: string }> = {
  danger: { icon: <Trash2 size={18} />, confirmClass: 'btn-danger', accent: '#D92D20' },
  primary: { icon: <LogOut size={18} />, confirmClass: 'btn-primary', accent: '#2E7D32' },
  warning: { icon: <AlertTriangle size={18} />, confirmClass: 'btn-warning', accent: '#F79009' },
  info: { icon: <Info size={18} />, confirmClass: 'btn-primary', accent: '#1570EF' },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  icon,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const v = variantMap[variant];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onConfirm();
    };
    document.addEventListener('keydown', onKey);
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus trap — focus confirm
    setTimeout(() => cardRef.current?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus(), 20);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'rgba(15,23,42,.46)',
        backdropFilter: 'blur(10px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.15)',
        animation: 'confirmOverlayIn 240ms var(--ease-out) both',
      }}
    >
      <style>{`
        @keyframes confirmOverlayIn{ from{ opacity:0 } to{ opacity:1 } }
        @keyframes confirmCardIn{ from{ opacity:0; transform: translateY(8px) scale(.98) } to{ opacity:1; transform: translateY(0) scale(1) } }
        .btn-danger{ background:#D92D20; color:white; border-color:#D92D20; box-shadow: 0 2px 10px rgba(217,45,32,.22) }
        .btn-danger:hover{ background:#B42318; border-color:#B42318 }
        .btn-warning{ background:#F79009; color:white; border-color:#F79009 }
        .btn-warning:hover{ background:#DC6803; border-color:#DC6803 }
      `}</style>
      <div
        ref={cardRef}
        role="document"
        style={{
          width: 'min(480px, 92vw)',
          background: 'white',
          borderRadius: 20,
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 60px rgba(15,23,42,.18), 0 1px 3px rgba(15,23,42,.08)',
          overflow: 'hidden',
          animation: 'confirmCardIn 280ms var(--ease-spring) both',
          willChange: 'transform, opacity',
        }}
      >
        {/* accent top */}
        <div style={{ height: 4, background: v.accent }} />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 44px',
                background: variant === 'danger' ? '#FEF3F2' : variant === 'warning' ? '#FFFAEB' : variant === 'primary' ? '#EDF7ED' : '#EFF8FF',
                border: `1px solid ${variant === 'danger' ? '#FECACA' : variant === 'warning' ? '#FEDF89' : variant === 'primary' ? '#ABEFC6' : '#D1E9FF'}`,
                color: v.accent,
              }}
            >
              {icon ?? v.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 id="confirm-title" style={{ margin: '2px 0 6px', fontSize: 16, fontWeight: 900, letterSpacing: -0.02, lineHeight: 1.2, color: '#0F172A' }}>
                {title}
              </h3>
              {description && (
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#475467', fontWeight: 500 }}>{description}</p>
              )}
            </div>
            <button
              aria-label={t('commun.confirmation.fermer')}
              onClick={onCancel}
              className="icon-btn"
              style={{ width: 34, height: 34, flex: '0 0 34px' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={onCancel} className="btn btn-outline" style={{ minWidth: 110 }} disabled={loading}>
              {cancelLabel ?? t('commun.actions.annuler')}
            </button>
            <button
              data-autofocus
              onClick={onConfirm}
              className={`btn ${v.confirmClass}`}
              style={{ minWidth: 130 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-dots" style={{ gap: 3 }}>
                    <i style={{ background: 'white' }} />
                    <i style={{ background: 'white' }} />
                    <i style={{ background: 'white' }} />
                  </span>{' '}
                  {t('commun.actions.patientez')}
                </>
              ) : (
                <>
                  {variant === 'danger' ? <Trash2 size={16} /> : variant === 'primary' ? <LogOut size={16} /> : variant === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  {confirmLabel ?? t('commun.actions.confirmer')}
                </>
              )}
            </button>
          </div>

          {variant === 'danger' && (
            <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FEDF89', color: '#92400E', fontSize: 12, lineHeight: 1.5, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ marginTop: 2, flex: '0 0 16px' }} />
              {t('commun.confirmation.irreversible')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
