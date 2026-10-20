/**
 * App.tsx
 *
 * Root component for the OsdagBridge web workbench.
 * Mirrors the top-level layout of osdagbridge.desktop.ui.template_page.
 *
 * Layout structure:
 *   ┌─────────────────────────────────────────────────┐
 *   │ Header (menu bar + viewport toggles)            │
 *   ├────────────┬──────────────────────┬─────────────┤
 *   │ InputDock  │   Log / Viewport     │ OutputDock  │
 *   │            │   (app-center)       │             │
 *   └────────────┴──────────────────────┴─────────────┘
 *
 * Modals:
 *   ProjectLocationModal — project location picker (always mounted, hidden until triggered)
 */

import React, { useEffect } from 'react';
import { useBridgeStore } from './store/useBridgeStore';
import { Header } from './components/layout/Header';
import { InputDock } from './components/docks/InputDock';
import { OutputDock } from './components/docks/OutputDock';
import { LogDock } from './components/docks/LogDock';
import { ProjectLocationModal } from './components/dialogs/ProjectLocationModal';

export default function App() {
  const darkMode = useBridgeStore((s) => s.darkMode);

  // Sync the HTML root element's data-theme attribute with the store flag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <div
      className="app-root"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}
    >
      {/* Accessibility: skip-nav link */}
      <a href="#main-workbench" className="skip-link">Skip to workbench</a>

      <Header />

      {/* Three-column workbench: Input | Center (Log) | Output */}
      <div
        id="main-workbench"
        className="app-workbench"
        role="main"
        style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
      >
        <InputDock />

        <div
          className="app-center"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <LogDock />
        </div>

        <OutputDock />
      </div>

      {/* Modals — always mounted, revealed by store flags */}
      <ProjectLocationModal />
    </div>
  );
}
