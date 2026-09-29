import React, { useEffect, useState, useRef } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { SchemaField } from '../forms/SchemaField';
import { Lock, Unlock, Save, Play, ChevronUp, ChevronDown } from 'lucide-react';

export const InputDock: React.FC = () => {
  const {
    schema,
    fetchSchema,
    schemaLoading,
    schemaError,
    isLocked,
    toggleLock,
    isDockCollapsed,
    toggleDock,
    setAdditionalInputsOpen,
    collapsedContainers,
    toggleContainer,
    saveInputs,
    runDesign
  } = useBridgeStore();

  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const tooltipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleScrollAreaClick = () => {
    if (isLocked) {
      setShowLockTooltip(true);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = window.setTimeout(() => {
        setShowLockTooltip(false);
      }, 3000);
    }
  };

  // Group schema fields by container -> group (mirrors desktop _make_container and _build_field_loop)
  const containers = schema.reduce<Record<string, Record<string, typeof schema>>>((acc, item) => {
    const c = item.container || 'main';
    const g = item.group || 'General Details';
    if (!acc[c]) acc[c] = {};
    if (!acc[c][g]) acc[c][g] = [];
    acc[c][g].push(item);
    return acc;
  }, {});

  const renderGroup = (groupTitle: string, fields: typeof schema) => {
    const showTitle = fields[0]?.show_group_title !== false;
    return (
      <div
        key={groupTitle}
        className="osdag-groupbox"
        style={!showTitle ? { paddingTop: '8px', marginTop: '10px' } : undefined}
      >
        {showTitle && (
          <div className="osdag-groupbox__title">
            <span>{groupTitle}</span>
          </div>
        )}
        <div style={{ marginTop: showTitle ? '4px' : '0' }}>
          {fields.map((f) => (
            <SchemaField key={f.key} field={f} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="osdag-input-dock" style={{
      display: 'flex',
      height: '100%',
      position: 'relative',
      zIndex: 10,
      flexShrink: 0
    }}>
      {isDockCollapsed ? (
        /* ── InputDockIndicator (mirrors desktop InputDockIndicator) ── */
        <div className="osdag-dock-indicator osdag-dock-indicator--input">
          <img
            src="/vectors/inputs_label_light.svg"
            alt="Inputs"
            width={32}
            height={90}
            style={{ objectFit: 'contain', userSelect: 'none' }}
          />
          <div
            className="osdag-toggle-strip"
            onClick={toggleDock}
            title="Show input panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '0 3px 3px 0' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleDock();
              }}
              title="Show input panel"
            >
              ❯
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Left Container (Input Panel) ── */}
          <aside
            aria-label="Basic inputs"
            style={{
              width: '330px',
              minWidth: '330px',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-color)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '12px 14px 10px 14px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minWidth: '330px',
              boxSizing: 'border-box'
            }}>
              {/* ── 1. Top Bar (_build_top_bar) ── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {/* Basic Inputs Button (active tab, mirrors basic_btn) */}
                <button
                  type="button"
                  aria-current="page"
                  style={{
                    flex: 1,
                    background: 'var(--accent-osdag)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '7px 16px',
                    cursor: 'default',
                    textAlign: 'center'
                  }}
                >
                  Basic Inputs
                </button>

                {/* Additional Inputs Button (mirrors additional_inputs_btn) */}
                <button
                  type="button"
                  onClick={() => setAdditionalInputsOpen(true)}
                  aria-label="Open additional inputs"
                  className="osdag-btn-standard"
                  style={{ flex: 1, padding: '7px 16px', fontSize: '13px' }}
                >
                  Additional Inputs
                </button>

                {/* Lock / Unlock Button (mirrors lock_btn with lock_open / lock_close svg) */}
                <button
                  type="button"
                  onClick={toggleLock}
                  title={isLocked ? "Locked (Click to Unlock)" : "Unlocked (Click to Lock)"}
                  aria-pressed={isLocked}
                  aria-label={isLocked ? 'Unlock inputs' : 'Lock inputs'}
                  style={{
                    background: isLocked ? '#FFA500' : 'var(--bg-grouped)',
                    border: `1px solid ${isLocked ? '#fa7a02' : 'var(--border-color)'}`,
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <img
                    src={isLocked ? "/vectors/lock_close.svg" : "/vectors/lock_open.svg"}
                    alt=""
                    width={16}
                    height={16}
                  />
                </button>
              </div>

              {/* ── 2. Scroll Area (_build_scroll_area) ── */}
              <div
                onClick={handleScrollAreaClick}
                role="form"
                aria-label="Schema-driven bridge inputs"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '6px 5px 10px 2px',
                  position: 'relative',
                  opacity: isLocked ? 0.75 : 1
                }}
              >
                {/* Floating Lock Tooltip */}
                {showLockTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--accent-osdag)',
                    borderRadius: '0px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 20
                  }}>
                    🔒 Unlock to Edit
                  </div>
                )}

                {schemaLoading && (
                  <div role="status" style={{ color: 'var(--text-sub)', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
                    Loading schema definitions...
                  </div>
                )}

                {schemaError && (
                  <div role="alert" style={{
                    margin: '12px 4px',
                    padding: '10px',
                    border: '1px solid var(--danger)',
                    borderRadius: '4px',
                    color: 'var(--danger)',
                    fontSize: '12px',
                  }}>
                    <p>Unable to load bridge inputs: {schemaError}</p>
                    <button
                      type="button"
                      onClick={() => void fetchSchema()}
                      className="osdag-btn-standard"
                      style={{ marginTop: '8px' }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Container & Group loop (mirrors desktop _make_container and _build_field_loop) */}
                {Object.entries(containers).map(([containerKey, containerGroups]) => {
                  const isMain = containerKey === 'main';
                  const isCollapsed = Boolean(collapsedContainers[containerKey]);
                  const containerTitle =
                    containerKey.charAt(0).toUpperCase() + containerKey.slice(1).replace(/_/g, ' ');

                  if (isMain) {
                    return (
                      <React.Fragment key={containerKey}>
                        {Object.entries(containerGroups).map(([groupTitle, fields]) =>
                          renderGroup(groupTitle, fields)
                        )}
                      </React.Fragment>
                    );
                  }

                  return (
                    <div key={containerKey} className="osdag-container-box">
                      <div className="osdag-container-box__header">
                        <span className="osdag-container-box__title">{containerTitle}</span>
                        <button
                          type="button"
                          onClick={() => toggleContainer(containerKey)}
                          className="osdag-container-box__toggle"
                          title={isCollapsed ? `Expand ${containerTitle}` : `Collapse ${containerTitle}`}
                          aria-expanded={!isCollapsed}
                        >
                          <img
                            src={isCollapsed ? '/vectors/arrow_down_light.svg' : '/vectors/arrow_up_light.svg'}
                            alt={isCollapsed ? 'Expand' : 'Collapse'}
                            width={18}
                            height={18}
                            style={{ objectFit: 'contain' }}
                          />
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div>
                          {Object.entries(containerGroups).map(([groupTitle, fields]) =>
                            renderGroup(groupTitle, fields)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── 3. Bottom Action Buttons (_build_bottom_buttons) ── */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '12px',
                paddingTop: '2px'
              }}>
                {/* Save Input Button (DockCustomButton) */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={saveInputs}
                  className="dock-custom-button"
                  style={{ flex: 1 }}
                >
                  <img src="/vectors/save.svg" alt="" width={18} height={18} />
                  <span>Save Input</span>
                </button>

                {/* Design Button (DockCustomButton) */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={runDesign}
                  className="dock-custom-button"
                  style={{ flex: 1 }}
                >
                  <img src="/vectors/design.svg" alt="" width={18} height={18} />
                  <span>Design</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── 4. Toggle Strip (_build_toggle_strip) on right edge ── */}
          <div
            className="osdag-toggle-strip"
            onClick={toggleDock}
            title="Hide input panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '3px 0 0 3px' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleDock();
              }}
              title="Hide input panel"
            >
              ❮
            </button>
          </div>
        </>
      )}
    </div>
  );
};
