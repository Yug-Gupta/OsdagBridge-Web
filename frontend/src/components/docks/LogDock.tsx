/**
 * LogDock.tsx
 * Web implementation of OsdagBridge Log Dock widget.
 * Mirrors osdagbridge.desktop.ui.docks.log_dock.LogDock
 *
 * Features:
 *   - Real-time logging of design & analysis events
 *   - Status title displaying progress: "Log Window", "Log Window  –  Analysing… X%", "Log Window  –  Complete (100%)"
 *   - Color-coded log levels (info, success, warning, error, stdout_print)
 *   - Smart auto-scrolling (preserves scroll position if user scrolls up)
 *   - Reset / Clear action restoring initial "[timestamp] Log initialized" state
 *   - Copy logs to clipboard
 *   - Minimizable / collapsible & closeable dock
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { Terminal, Trash2, Copy, Check, ChevronDown, ChevronUp, X } from 'lucide-react';

export const LogDock: React.FC = () => {
  const {
    isLogDockOpen,
    toggleLogDock,
    isLogDockCollapsed,
    toggleLogDockCollapse,
    logWindowTitle,
    logProgress,
    logs,
    resetLogs
  } = useBridgeStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Smart auto-scrolling matching desktop (scrollbar within 15px of maximum)
  useEffect(() => {
    if (!scrollRef.current || !isAutoScroll || isLogDockCollapsed) return;
    const el = scrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [logs, isAutoScroll, isLogDockCollapsed]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const wasAtBottom = scrollHeight - scrollTop - clientHeight <= 15;
    setIsAutoScroll(wasAtBottom);
  };

  const handleCopyLogs = async () => {
    const text = logs.map(l => l.message).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!isLogDockOpen) return null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#FF0000'; // Red for errors (mirrors log_dock.py)
      case 'warning':
        return '#FFA500'; // Orange for warnings (mirrors log_dock.py)
      case 'success':
        return '#008000'; // Green for success (mirrors log_dock.py)
      case 'stdout_print':
      case 'info':
      default:
        return 'var(--log-text-color)';
    }
  };

  return (
    <div
      id="logs_dock"
      style={{
        width: '100%',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: isLogDockCollapsed ? '28px' : '140px',
        transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 5,
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* ── Top Strip / Title Bar (_init_ui top strip, mirrors QWidget#logs_dock QLabel) ── */}
      <div
        style={{
          height: '26px',
          minHeight: '26px',
          background: 'var(--log-header-bg)',
          borderBottom: isLogDockCollapsed ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              fontFamily: 'inherit'
            }}
          >
            {logWindowTitle}
          </span>
          {logProgress !== null && logProgress < 100 && (
            <div
              style={{
                width: '60px',
                height: '4px',
                background: 'rgba(144, 175, 19, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${logProgress}%`,
                  height: '100%',
                  background: 'var(--accent-osdag)',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Copy Logs */}
          <button
            type="button"
            onClick={handleCopyLogs}
            title="Copy logs"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? 'var(--accent-osdag)' : 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {/* Reset / Clear Logs */}
          <button
            type="button"
            onClick={resetLogs}
            title="Clear Log (Reset)"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
          >
            <Trash2 size={13} />
          </button>

          {/* Collapse / Expand */}
          <button
            type="button"
            onClick={toggleLogDockCollapse}
            title={isLogDockCollapsed ? "Expand Log Window" : "Minimize Log Window"}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
          >
            {isLogDockCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Close Dock */}
          <button
            type="button"
            onClick={() => toggleLogDock(false)}
            title="Close Log Window"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Log Display Area (textEdit) ── */}
      {!isLogDockCollapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          id="textEdit"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '5px 8px',
            background: 'var(--log-bg)',
            color: 'var(--log-text)',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            lineHeight: 1.45,
            border: '1px solid var(--log-border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: 'text'
          }}
        >
          {logs.map((entry) => (
            <div
              key={entry.id}
              style={{
                color: getLevelColor(entry.level),
                marginBottom: '2px'
              }}
            >
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
