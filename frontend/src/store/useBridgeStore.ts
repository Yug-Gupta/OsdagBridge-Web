/**
 * useBridgeStore.ts
 *
 * Zustand store for the OsdagBridge frontend.
 * Manages UI state for the input dock, output dock, log dock, and shared layout.
 *
 * Schema loading behaviour:
 *   - On mount, fetchSchema() attempts to load the bridge input schema from the backend.
 *   - If the backend is unreachable, schemaError is set and schema stays empty.
 *   - No static fallback schema is used; the input dock shows an error state instead.
 */
import { create } from 'zustand';
import { UIFieldSchema } from '../types/schema';
import { LocationData } from '../types/location';
import { getNoOfGirders, INPUT_KEYS } from '../utils/bridgeInputs';
import {
  fetchBasicSchema,
  fetchSteelMaterials,
  fetchConcreteMaterials,
  fetchLocationDetails,
  type ConcreteMaterial,
  type SteelMaterial,
} from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'success' | 'warning' | 'stdout_print';
}

const STATIC_LOGS: LogEntry[] = [
  { id: 'init-1', timestamp: '10:00:00', message: '[INFO] OsdagBridge CAD Workbench initialized (UI Preview Mode)', level: 'info' },
  { id: 'init-2', timestamp: '10:00:01', message: '[INFO] Design standard: IRC:6-2017 & IRC:24-2010 loaded',          level: 'info' },
  { id: 'init-3', timestamp: '10:00:02', message: '[INFO] Superstructure: Steel-Concrete Composite I-Girder Bridge',  level: 'info' },
  { id: 'init-4', timestamp: '10:00:02', message: '[INFO] Geometry: Span = 35.0 m | Carriageway = 10.5 m | Skew = 0.0°', level: 'info' },
  { id: 'init-5', timestamp: '10:00:03', message: '[INFO] Girder Arrangement: 4 Girders @ 2.75 m spacing',           level: 'info' },
  { id: 'init-6', timestamp: '10:00:04', message: '[SUCCESS] Design Envelope: 1.35 DL + 1.5 LL loaded',              level: 'success' },
  { id: 'init-7', timestamp: '10:00:05', message: '[SUCCESS] Member limit state verification: All checks satisfy IRC criteria', level: 'success' },
  { id: 'init-8', timestamp: '10:00:06', message: '[INFO] Ready for inspection in Output Dock',                       level: 'info' },
];

interface BridgeState {
  // ── Input schema ───────────────────────────────────────────────────────────
  inputs: Record<string, any>;
  additionalInputs: Record<string, any>;
  schema: UIFieldSchema[];
  schemaLoading: boolean;
  schemaError: string | null;
  steelMaterials: SteelMaterial[];
  concreteMaterials: ConcreteMaterial[];
  location: LocationData | null;
  isLocationModalOpen: boolean;

  // ── UI dock visibility ─────────────────────────────────────────────────────
  isDockCollapsed: boolean;
  isOutputDockCollapsed: boolean;
  isLocked: boolean;
  collapsedContainers: Record<string, boolean>;

  // ── Output dock (static display values) ───────────────────────────────────
  outputCollapsedSections: Record<string, boolean>;
  analysisMember: string;
  analysisLoadCase: string;
  analysisForce: string;
  analysisDisplayOptions: Record<string, boolean>;
  designMember: string;
  designLoadCase: string;
  dcrValues: Record<string, number>;

  // ── Log dock ───────────────────────────────────────────────────────────────
  isLogDockOpen: boolean;
  isLogDockCollapsed: boolean;
  logWindowTitle: string;
  logProgress: number | null;
  logs: LogEntry[];

  // ── Theme ──────────────────────────────────────────────────────────────────
  darkMode: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  fetchSchema: () => Promise<void>;
  updateField: (key: string, value: any) => void;
  toggleLock: () => void;
  toggleDock: () => void;
  toggleOutputDock: () => void;
  toggleOutputSection: (section: string) => void;
  setAnalysisMember: (m: string) => void;
  setAnalysisLoadCase: (lc: string) => void;
  setAnalysisForce: (f: string) => void;
  toggleAnalysisDisplayOption: (key: string) => void;
  setDesignMember: (m: string) => void;
  setDesignLoadCase: (lc: string) => void;
  toggleContainer: (container: string) => void;
  toggleLogDock: (open?: boolean) => void;
  toggleLogDockCollapse: () => void;
  resetLogs: () => void;
  toggleDarkMode: () => void;
  setLocation: (loc: LocationData) => void;
  setLocationModalOpen: (open: boolean) => void;

  // UI-only no-ops (kept so existing JSX references compile)
  saveInputs: () => void;
  loadInputs: () => void;
  saveLogs: () => void;
  export3DModel: (format: string) => void;
  exportCadImage: () => void;
  runDesign: () => void;
  resetInputs: () => void;
  setAdditionalInputsOpen: (open: boolean) => void;
  setSteelDesignModalOpen: (open: boolean) => void;
  setTransverseDesignModalOpen: (open: boolean) => void;
  setDeckDesignModalOpen: (open: boolean) => void;
  setGenerateResultsModalOpen: (open: boolean) => void;
  setReportModalOpen: (open: boolean) => void;
  requireDesignCheck: () => boolean;

  // Viewport tab (kept for Header compatibility)
  activeViewportTab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots';
  setActiveViewportTab: (tab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots') => void;
  showCrossSection: boolean;
  showTopView: boolean;
  toggleCrossSection: () => void;
  toggleTopView: () => void;
  toggleCad3dView: () => void;
  togglePlotsView: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBridgeStore = create<BridgeState>((set, get) => ({
  // ── Input schema ───────────────────────────────────────────────────────────
  inputs: {},
  additionalInputs: {},
  schema: [],
  schemaLoading: false,
  schemaError: null,
  steelMaterials: [],
  concreteMaterials: [],
  location: null,
  isLocationModalOpen: false,

  // ── Dock state ─────────────────────────────────────────────────────────────
  isDockCollapsed: false,
  isOutputDockCollapsed: false,
  isLocked: false,
  collapsedContainers: {},

  // ── Output dock (static) ───────────────────────────────────────────────────
  outputCollapsedSections: {},
  analysisMember: 'All',
  analysisLoadCase: '1.35 DL + 1.5 LL',
  analysisForce: 'Mz',
  analysisDisplayOptions: { Max: true, Min: false, All: true, Summary: false },
  designMember: 'G1',
  designLoadCase: 'Design Envelope',
  dcrValues: {
    flexure: 78,
    shear: 45,
    interaction: 62,
    ltb: 55,
    longTransShear: 34,
    fatigue: 40,
    stressLimitation: 70,
    deflection: 25,
  },

  // ── Log dock (static) ─────────────────────────────────────────────────────
  isLogDockOpen: true,
  isLogDockCollapsed: false,
  logWindowTitle: 'Log Window',
  logProgress: null,
  logs: STATIC_LOGS,

  // ── Theme ──────────────────────────────────────────────────────────────────
  darkMode: false,

  // ── Viewport (display-only, drives Header button state) ───────────────────
  activeViewportTab: 'dual',
  showCrossSection: true,
  showTopView: true,

  // ── Actions ────────────────────────────────────────────────────────────────

  fetchSchema: async () => {
    set({ schemaLoading: true, schemaError: null });
    try {
      // Fetch schema first — failure here propagates to the catch block and leaves
      // the input dock unloaded (no static fallback). Ancillary endpoints
      // (materials, location) fall back internally and do not throw.
      const schemaData = await fetchBasicSchema();

      const [steelMaterials, concreteMaterials, locationData] = await Promise.all([
        fetchSteelMaterials(),
        fetchConcreteMaterials(),
        fetchLocationDetails('Delhi', 'New Delhi'),
      ]);

      const initialInputs: Record<string, any> = { ...get().inputs };
      schemaData.forEach((f) => {
        if (f.default !== undefined && f.default !== null && initialInputs[f.key] === undefined) {
          initialInputs[f.key] = f.default;
        }
      });

      if (initialInputs['geometry.span'] === undefined)              initialInputs['geometry.span'] = 35;
      if (initialInputs['geometry.carriageway_width'] === undefined) initialInputs['geometry.carriageway_width'] = 10.5;
      if (initialInputs['geometry.skew_angle'] === undefined)        initialInputs['geometry.skew_angle'] = 0;
      if (locationData) {
        initialInputs['project.location'] = `${locationData.station}, ${locationData.state}`;
      }

      set({
        schema: schemaData,
        inputs: initialInputs,
        location: locationData,
        schemaLoading: false,
        schemaError: null,
        steelMaterials,
        concreteMaterials,
      });
    } catch (err) {
      set({
        schema: [],
        schemaLoading: false,
        schemaError:
          err instanceof Error
            ? err.message
            : 'Unable to connect to backend server. The input schema could not be loaded.',
      });
    }
  },

  updateField: (key, value) => {
    set((state) => ({
      inputs: { ...state.inputs, [key]: value },
    }));
  },

  toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),
  toggleDock: () => set((state) => ({ isDockCollapsed: !state.isDockCollapsed })),
  toggleOutputDock: () => set((state) => ({ isOutputDockCollapsed: !state.isOutputDockCollapsed })),

  toggleOutputSection: (section) =>
    set((state) => ({
      outputCollapsedSections: {
        ...state.outputCollapsedSections,
        [section]: !state.outputCollapsedSections[section],
      },
    })),

  setAnalysisMember: (analysisMember) => set({ analysisMember }),
  setAnalysisLoadCase: (analysisLoadCase) => set({ analysisLoadCase }),
  setAnalysisForce: (analysisForce) => set({ analysisForce }),

  toggleAnalysisDisplayOption: (key) =>
    set((state) => ({
      analysisDisplayOptions: {
        ...state.analysisDisplayOptions,
        [key]: !state.analysisDisplayOptions[key],
      },
    })),

  setDesignMember: (designMember) => set({ designMember }),
  setDesignLoadCase: (designLoadCase) => set({ designLoadCase }),

  toggleContainer: (container) =>
    set((state) => ({
      collapsedContainers: {
        ...state.collapsedContainers,
        [container]: !state.collapsedContainers[container],
      },
    })),

  toggleLogDock: (open) =>
    set((state) => ({
      isLogDockOpen: open !== undefined ? open : !state.isLogDockOpen,
    })),

  toggleLogDockCollapse: () =>
    set((state) => ({ isLogDockCollapsed: !state.isLogDockCollapsed })),

  resetLogs: () => set({ logs: STATIC_LOGS }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return { darkMode: next };
    }),

  setLocation: (loc) =>
    set((state) => ({
      location: loc,
      inputs: {
        ...state.inputs,
        'project.location': `${loc.station}, ${loc.state}`,
      },
    })),

  setLocationModalOpen: (isLocationModalOpen) => set({ isLocationModalOpen }),

  setActiveViewportTab: (activeViewportTab) => set({ activeViewportTab }),
  toggleCrossSection: () => set((s) => ({ showCrossSection: !s.showCrossSection })),
  toggleTopView: () => set((s) => ({ showTopView: !s.showTopView })),
  toggleCad3dView: () => {},
  togglePlotsView: () => {},

  // ── UI-only no-ops ────────────────────────────────────────────────────────
  saveInputs: () => {},
  loadInputs: () => {},
  saveLogs: () => {},
  export3DModel: () => {},
  exportCadImage: () => {},
  runDesign: () => {},
  resetInputs: () => {},
  setAdditionalInputsOpen: () => {},
  setSteelDesignModalOpen: () => {},
  setTransverseDesignModalOpen: () => {},
  setDeckDesignModalOpen: () => {},
  setGenerateResultsModalOpen: () => {},
  setReportModalOpen: () => {},
  requireDesignCheck: () => false,
}));
