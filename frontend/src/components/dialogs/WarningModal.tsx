import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';

/**
 * Web reproduction of osdagbridge.desktop.ui.dialogs.custom_messagebox.CustomMessageBox.
 *
 * Faithfully mirrors:
 * - Desktop CustomTitleBar with Osdag logo, title text, and ✕ close button.
 * - Left icon by MessageBoxType (Warning, Critical, Information, Success).
 * - Exact type-specific button color schemes (#F44336 critical, #FF9800 warning, #4CAF50 success, #2196F3 info).
 * - Border color #90AF13 with clean white surface and 12px typography.
 */
export const WarningModal: React.FC = () => {
  const {
    outputWarningMessage,
    setOutputWarningMessage,
    messageModal,
    closeMessageModal,
  } = useBridgeStore();

  const isOpen = Boolean(messageModal || outputWarningMessage);
  const [closeBtnHover, setCloseBtnHover] = useState(false);
  const [btnHoverIndex, setBtnHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (messageModal) closeMessageModal();
        if (outputWarningMessage) setOutputWarningMessage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, messageModal, outputWarningMessage, closeMessageModal, setOutputWarningMessage]);

  if (!isOpen) return null;

  const title = messageModal?.title || (outputWarningMessage ? 'Warning' : 'Message');
  const message = messageModal?.message || outputWarningMessage || '';
  const informativeText = messageModal?.informativeText;
  const type = messageModal?.type || 'warning';
  const buttons = messageModal?.buttons && messageModal.buttons.length > 0 ? messageModal.buttons : ['OK'];

  let iconSrc = '/vectors/msg_warning.svg';
  if (type === 'critical') {
    iconSrc = '/vectors/msg_critical.svg';
  } else if (type === 'information') {
    iconSrc = '/vectors/msg_about.svg';
  } else if (type === 'success') {
    iconSrc = '/vectors/msg_success.svg';
  }

  const getButtonStyles = (btnType: string, isHovered: boolean) => {
    let bg = '#FF9800';
    let hoverBg = '#FB8C00';

    if (btnType === 'critical') {
      bg = '#F44336';
      hoverBg = '#E53935';
    } else if (btnType === 'success') {
      bg = '#4CAF50';
      hoverBg = '#45A049';
    } else if (btnType === 'information') {
      bg = '#2196F3';
      hoverBg = '#1E88E5';
    }

    return {
      backgroundColor: isHovered ? hoverBg : bg,
      color: '#ffffff',
      border: 'none',
      borderRadius: '5px',
      padding: '5px 18px',
      fontSize: '12px',
      fontWeight: 500,
      minWidth: '70px',
      cursor: 'pointer',
      textAlign: 'center' as const,
      transition: 'background-color 0.15s ease',
      height: '30px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const handleClose = (btnLabel?: string) => {
    if (messageModal?.onButtonClick && btnLabel) {
      messageModal.onButtonClick(btnLabel);
    }
    if (messageModal) closeMessageModal();
    if (outputWarningMessage) setOutputWarningMessage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="osdag-msgbox-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        backdropFilter: 'blur(1px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '2px',
          border: '1px solid #90AF13',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          width: '400px',
          maxWidth: '92vw',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Title Bar (mirrors desktop CustomTitleBar) */}
        <div
          style={{
            height: '32px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '8px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/vectors/Osdag_logo.svg"
              alt=""
              width={20}
              height={20}
              style={{ objectFit: 'contain' }}
            />
            <span
              id="osdag-msgbox-title"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            >
              {title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleClose()}
            aria-label="Close"
            onMouseEnter={() => setCloseBtnHover(true)}
            onMouseLeave={() => setCloseBtnHover(false)}
            style={{
              width: '46px',
              height: '32px',
              background: closeBtnHover ? '#e81123' : 'transparent',
              color: closeBtnHover ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              padding: 0,
              transition: 'background 0.15s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Widget (mirrors desktop CustomMessageBox ContentWidget) */}
        <div
          style={{
            padding: '20px 20px 14px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <div style={{ flexShrink: 0, width: '34px', height: '34px' }}>
            <img
              src={iconSrc}
              alt=""
              width={34}
              height={34}
              style={{ objectFit: 'contain' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-main)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
              }}
            >
              {message}
            </div>

            {informativeText && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-sub)',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}
              >
                {informativeText}
              </div>
            )}
          </div>
        </div>

        {/* Button Layout (mirrors desktop CustomMessageBox buttonLayout) */}
        <div
          style={{
            padding: '4px 20px 16px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '6px',
          }}
        >
          {buttons.map((btnLabel, idx) => (
            <button
              key={btnLabel}
              type="button"
              onClick={() => handleClose(btnLabel)}
              autoFocus={idx === 0}
              onMouseEnter={() => setBtnHoverIndex(idx)}
              onMouseLeave={() => setBtnHoverIndex(null)}
              style={getButtonStyles(type, btnHoverIndex === idx)}
            >
              {btnLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
