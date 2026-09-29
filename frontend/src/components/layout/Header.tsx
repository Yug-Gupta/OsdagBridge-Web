import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';

type MenuItem = {
  label?: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
  submenu?: MenuItem[];
};

type ViewControl = {
  key: string;
  tooltip: string;
  active: boolean;
  activeIcon: string;
  inactiveIcon: string;
  onClick: () => void;
};

const VECTOR_BASE = '/vectors/view_btn';

const MenuDropdown: React.FC<{
  title: string;
  items: MenuItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ title, items, open, onToggle, onClose }) => {
  const renderItems = (list: MenuItem[], depth = 0): React.ReactNode =>
    list.map((item, idx) => {
      if (item.separator) {
        return <div key={`sep-${idx}`} role="separator" className="osdag-menu-separator" />;
      }
      if (item.submenu) {
        return (
          <div key={item.label} className="osdag-menu-submenu">
            <button type="button" className="osdag-menu-item" role="menuitem" aria-haspopup="true">
              <span>{item.label}</span>
              <span className="osdag-menu-arrow">▸</span>
            </button>
            <div className="osdag-menu-panel osdag-menu-panel--nested" role="menu">
              {renderItems(item.submenu, depth + 1)}
            </div>
          </div>
        );
      }
      return (
        <button
          key={item.label}
          type="button"
          className="osdag-menu-item"
          role="menuitem"
          onClick={() => {
            item.action?.();
            onClose();
          }}
        >
          <span>{item.label}</span>
          {item.shortcut && <span className="osdag-menu-shortcut">{item.shortcut}</span>}
        </button>
      );
    });

  return (
    <div className="osdag-menu" style={{ position: 'relative' }}>
      <button
        type="button"
        className={`osdag-menu-title${open ? ' is-open' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onToggle}
      >
        {title}
      </button>
      {open && (
        <div className="osdag-menu-panel" role="menu" aria-label={title}>
          {renderItems(items)}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
  const {
    activeViewportTab,
    setActiveViewportTab,
    showCrossSection,
    showTopView,
    toggleCrossSection,
    toggleTopView,
    toggleCad3dView,
    togglePlotsView,
    isLogDockOpen,
    toggleLogDock,
    isDockCollapsed,
    toggleDock,
    isOutputDockCollapsed,
    toggleOutputDock,
    resetInputs,
    saveInputs,
    loadInputs,
    saveLogs,
    export3DModel,
    exportCadImage,
    setReportModalOpen,
    darkMode,
    toggleDarkMode,
    runDesign,
  } = useBridgeStore();

  // Navigate to a viewport tab; for the top-view button mirror the desktop
  // toggle behaviour (dual <-> plan/cross_section).
  const showView = (tab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots') => {
    setActiveViewportTab(tab);
  };

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Ctrl+S mirrors desktop Save Input shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveInputs();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveInputs]);

  const menus: { title: string; items: MenuItem[] }[] = [
    {
      title: 'File',
      items: [
        { label: 'Load Input', shortcut: 'Ctrl+L', action: loadInputs },
        { separator: true },
        { label: 'Save Input', shortcut: 'Ctrl+S', action: saveInputs },
        { label: 'Save Log Messages', shortcut: 'Alt+M', action: saveLogs },
        { label: 'Create Design Report', shortcut: 'Alt+C', action: () => setReportModalOpen(true) },
        { separator: true },
        { label: 'Save 3D Model', shortcut: 'Alt+3', action: () => export3DModel('stp') },
        { label: 'Save CAD Image', shortcut: 'Alt+I', action: exportCadImage },
        { separator: true },
        { label: 'Quit', shortcut: 'Shift+Q', action: () => window.close() },
      ],
    },
    {
      title: 'Graphics',
      items: [
        { label: 'Zoom In', shortcut: 'Ctrl+I' },
        { label: 'Zoom Out', shortcut: 'Ctrl+O' },
        { label: 'Pan', shortcut: 'Ctrl+P' },
        { label: 'Rotate 3D Model', shortcut: 'Ctrl+R' },
        { separator: true },
        { label: 'Show Front View', shortcut: 'Alt+Shift+F' },
        { label: 'Show Top View', shortcut: 'Alt+Shift+T', action: () => setActiveViewportTab('plan') },
        { label: 'Show Side View', shortcut: 'Alt+Shift+S' },
      ],
    },
    {
      title: 'Database',
      items: [
        { label: 'Save Inputs (.csv)' },
        { label: 'Save Outputs (.csv)' },
        { label: 'Save Inputs (.osi)', action: saveInputs },
        {
          label: 'Download Database',
          submenu: [
            { label: 'Column' },
            { label: 'Beam' },
            { label: 'Channel' },
            { label: 'Angle' },
          ],
        },
        { separator: true },
        { label: 'Reset', shortcut: 'Alt+R', action: resetInputs },
      ],
    },
    {
      title: 'Help',
      items: [
        { label: 'Video Tutorials' },
        { label: 'Design Examples' },
        { separator: true },
        { label: 'Ask Us a Question' },
        { label: 'About Osdag' },
        { separator: true },
        { label: 'Check For Update' },
      ],
    },
  ];

  const viewControls: ViewControl[] = [
    {
      key: 'cross_section',
      tooltip: 'Toggle Cross-Section View',
      active: activeViewportTab !== '3d' && activeViewportTab !== 'plots' && showCrossSection,
      activeIcon: `${VECTOR_BASE}/cross_section_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/cross_section_inactive.svg`,
      onClick: toggleCrossSection,
    },
    {
      key: 'top_view',
      tooltip: 'Toggle Top View',
      active: activeViewportTab !== '3d' && activeViewportTab !== 'plots' && showTopView,
      activeIcon: `${VECTOR_BASE}/top_view_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/top_view_inactive.svg`,
      onClick: toggleTopView,
    },
    {
      key: 'logs_dock',
      tooltip: 'Toggle Logs Dock',
      active: isLogDockOpen,
      activeIcon: `${VECTOR_BASE}/logs_dock_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/logs_dock_inactive.svg`,
      onClick: () => toggleLogDock(),
    },
    {
      key: '3d_cad',
      tooltip: 'Toggle 3D CAD View',
      active: activeViewportTab === '3d',
      activeIcon: `${VECTOR_BASE}/3d_cad_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/3d_cad_inactive.svg`,
      onClick: toggleCad3dView,
    },
    {
      key: 'plots',
      tooltip: 'Toggle 3D Plots View',
      active: activeViewportTab === 'plots',
      activeIcon: `${VECTOR_BASE}/plots_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/plots_inactive.svg`,
      onClick: togglePlotsView,
    },
    {
      key: 'input_dock',
      tooltip: 'Toggle Input Dock',
      active: !isDockCollapsed,
      activeIcon: `${VECTOR_BASE}/input_dock_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/input_dock_inactive.svg`,
      onClick: toggleDock,
    },
    {
      key: 'output_dock',
      tooltip: 'Toggle Output Dock',
      active: !isOutputDockCollapsed,
      activeIcon: `${VECTOR_BASE}/output_dock_active.svg`,
      inactiveIcon: `${VECTOR_BASE}/output_dock_inactive.svg`,
      onClick: toggleOutputDock,
    },
  ];

  return (
    <header ref={headerRef} role="banner" className="app-header osdag-menubar">
      {/* Brand / title area (desktop title bar) */}
      <div className="osdag-menubar__brand">
        <img src="/vectors/Osdag_logo.svg" alt="Osdag" width={20} height={20} />
        <span className="osdag-menubar__title">OsdagBridge</span>
      </div>

      {/* Menu bar items */}
      <nav aria-label="Application menu" className="osdag-menubar__menus">
        {menus.map((menu) => (
          <MenuDropdown
            key={menu.title}
            title={menu.title}
            items={menu.items}
            open={openMenu === menu.title}
            onToggle={() => setOpenMenu(openMenu === menu.title ? null : menu.title)}
            onClose={() => setOpenMenu(null)}
          />
        ))}
      </nav>

      {/* Right side: view controls + quick actions */}
      <div className="osdag-menubar__controls">
        {viewControls.map((ctrl) => (
          <button
            key={ctrl.key}
            type="button"
            className={`osdag-viewbtn${ctrl.active ? ' is-active' : ''}`}
            title={ctrl.tooltip}
            aria-label={ctrl.tooltip}
            aria-pressed={ctrl.active}
            onClick={ctrl.onClick}
          >
            <img
              src={ctrl.active ? ctrl.activeIcon : ctrl.inactiveIcon}
              alt=""
              width={18}
              height={18}
            />
          </button>
        ))}

        <span className="osdag-menubar__divider" aria-hidden="true" />

        <button
          type="button"
          className="osdag-quickbtn"
          onClick={toggleDarkMode}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          className="osdag-quickbtn osdag-quickbtn--primary"
          onClick={runDesign}
          aria-label="Run bridge design"
        >
          Design
        </button>
      </div>
    </header>
  );
};
