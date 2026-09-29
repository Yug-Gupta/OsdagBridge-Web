import React, { useEffect } from 'react';
import { useBridgeStore } from './store/useBridgeStore';
import { Header } from './components/layout/Header';
import { InputDock } from './components/docks/InputDock';
import { ViewportContainer } from './components/viewports/ViewportContainer';
import { OutputDock } from './components/docks/OutputDock';
import { LogDock } from './components/docks/LogDock';
import { ProjectLocationModal } from './components/dialogs/ProjectLocationModal';
import { ClearResultsConfirmModal } from './components/dialogs/ClearResultsConfirmModal';
import { MaterialPropertiesModal } from './components/dialogs/MaterialPropertiesModal';
import { AdditionalInputsModal } from './components/dialogs/AdditionalInputsModal';
import { WarningModal } from './components/dialogs/WarningModal';
import { SteelDesignModal } from './components/dialogs/SteelDesignModal';
import { TransverseDesignModal } from './components/dialogs/TransverseDesignModal';
import { DeckDesignModal } from './components/dialogs/DeckDesignModal';
import { GenerateResultsModal } from './components/dialogs/GenerateResultsModal';
import { ReportOptionsModal } from './components/dialogs/ReportOptionsModal';
import { LoadingModal } from './components/dialogs/LoadingModal';

export default function App() {
  const darkMode = useBridgeStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <div className="app-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <a href="#main-workbench" className="skip-link">Skip to workbench</a>
      <Header />
      <div id="main-workbench" className="app-workbench" role="main" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <InputDock />
        <div className="app-center" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0, position: 'relative' }}>
          <ViewportContainer />
          <LogDock />
        </div>
        <OutputDock />
      </div>
      <ProjectLocationModal />
      <ClearResultsConfirmModal />
      <MaterialPropertiesModal />
      <AdditionalInputsModal />
      <WarningModal />
      <SteelDesignModal />
      <TransverseDesignModal />
      <DeckDesignModal />
      <GenerateResultsModal />
      <ReportOptionsModal />
      <LoadingModal />
    </div>
  );
}
