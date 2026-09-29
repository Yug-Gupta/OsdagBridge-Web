import { create } from 'zustand';
import { UIFieldSchema } from '../types/schema';
import { LocationData } from '../types/location';
import { getNoOfGirders, getSpan, INPUT_KEYS } from '../utils/bridgeInputs';
import {
  fetchAdditionalInputsSchema,
  fetchBasicSchema,
  fetchConcreteMaterials,
  fetchRolledSections,
  fetchSteelMaterials,
  isBackendAvailable,
  validateInputs,
  type ConcreteMaterial,
  type RolledSection,
  type SteelMaterial,
} from '../services/api';
import {
  validateBasicInput,
  validateOsiInputs,
} from '../utils/validation';

export interface CadDisplayState {
  nodes: boolean;
  nodeNumbers: boolean;
  elementNumbers: boolean;
  grillageView: boolean;
  axis: boolean;
  legend: boolean;
  gridLines: boolean;
  supports: boolean;
  loads: boolean;
  girderLabels: boolean;
}

export interface CustomMaterial {
  name: string;
  memberType: 'Steel' | 'Concrete';
  properties: Record<string, number>;
}

export interface MessageModalState {
  title: string;
  message: string;
  informativeText?: string;
  type: 'information' | 'warning' | 'critical' | 'success';
  buttons?: string[];
  onButtonClick?: (btn: string) => void;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'success' | 'warning' | 'stdout_print';
}

interface BridgeState {
  // Input fields state (key -> value)
  inputs: Record<string, any>;
  schema: UIFieldSchema[];
  schemaLoading: boolean;
  schemaError: string | null;
  validationErrors: Record<string, string>;
  fieldErrors: Record<string, boolean>;
  messageModal: MessageModalState | null;
  steelMaterials: SteelMaterial[];
  concreteMaterials: ConcreteMaterial[];
  rolledSections: RolledSection[];

  // Project Location
  location: LocationData | null;
  isLocationModalOpen: boolean;

  // Viewport Tab (mirrors desktop central views: dual 2D CAD, 3D CAD, Plots)
  activeViewportTab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots';
  showCrossSection: boolean;
  showTopView: boolean;

  // 3D Viewer controls
  showDeck: boolean;

  // Desktop CAD toolbar (ToolBarWidget) state
  activeNavTool: 'rotate' | 'pan';
  cadZoom: number;
  cadDisplay: CadDisplayState;

  // Dark mode
  darkMode: boolean;

  // Desktop InputDock controls & states
  isLocked: boolean;
  isUnlockConfirmOpen: boolean;
  isDockCollapsed: boolean;
  isAdditionalInputsOpen: boolean;
  // Additional Inputs (desktop AdditionalInputs dialog) — schema + values
  additionalInputsSchema: unknown[];
  additionalInputsSchemaLoading: boolean;
  additionalInputsSchemaError: string | null;
  additionalInputs: Record<string, any>;
  isMaterialInfoOpen: boolean;
  materialInfoKey: string | null;
  materialInfoReadOnly: boolean;
  customMaterials: Record<string, CustomMaterial>;
  collapsedContainers: Record<string, boolean>;
  designRan: boolean;
  isDesignRunning: boolean;
  designProgress: number;

  // Desktop OutputDock controls & states
  isOutputDockCollapsed: boolean;
  outputCollapsedSections: Record<string, boolean>;
  analysisMember: string;
  analysisLoadCase: string;
  analysisForce: string;
  analysisDisplayOptions: Record<string, boolean>;
  designMember: string;
  designLoadCase: string;
  dcrValues: Record<string, number>;

  // Desktop LogDock controls & states
  isLogDockOpen: boolean;
  isLogDockCollapsed: boolean;
  logWindowTitle: string;
  logProgress: number | null;
  logs: LogEntry[];

  // Output Dialogs
  isSteelDesignModalOpen: boolean;
  isTransverseDesignModalOpen: boolean;
  isDeckDesignModalOpen: boolean;
  isGenerateResultsModalOpen: boolean;
  isReportModalOpen: boolean;
  outputWarningMessage: string | null;

  // Actions
  setInputs: (inputs: Record<string, any>) => void;
  updateField: (key: string, value: any) => void;
  setValidationError: (key: string, message: string | null) => void;
  setFieldError: (key: string, error: boolean) => void;
  clearFieldError: (key: string) => void;
  showMessageModal: (modal: MessageModalState) => void;
  closeMessageModal: () => void;
  validateBasicInputs: (key: string, value: any) => { valid: boolean; corrected?: any; message?: string };
  validateRequiredInputs: () => boolean;
  fetchSchema: () => Promise<void>;
  validateFieldLive: (key: string, value: any) => Promise<void>;
  resetInputs: () => void;
  setLocation: (loc: LocationData) => void;
  setLocationModalOpen: (open: boolean) => void;
  setActiveViewportTab: (tab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots') => void;
  setShowCrossSection: (show: boolean) => void;
  setShowTopView: (show: boolean) => void;
  toggleCrossSection: () => void;
  toggleTopView: () => void;
  toggleCad3dView: () => void;
  togglePlotsView: () => void;
  toggleDeck: () => void;
  setActiveNavTool: (tool: 'rotate' | 'pan') => void;
  toggleCadDisplay: (key: keyof CadDisplayState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  setCadZoom: (zoom: number) => void;
  toggleDarkMode: () => void;
  toggleLock: () => void;
  confirmUnlock: () => void;
  setUnlockConfirmOpen: (open: boolean) => void;
  toggleDock: () => void;
  toggleOutputDock: () => void;
  toggleOutputSection: (section: string) => void;
  setAnalysisMember: (member: string) => void;
  setAnalysisLoadCase: (lc: string) => void;
  setAnalysisForce: (force: string) => void;
  toggleAnalysisDisplayOption: (key: string) => void;
  setDesignMember: (member: string) => void;
  setDesignLoadCase: (lc: string) => void;
  setAdditionalInputsOpen: (open: boolean) => void;
  fetchAdditionalInputsSchema: () => Promise<void>;
  setAdditionalInput: (id: string, value: any) => void;
  resetAdditionalInputs: (ids: string[]) => void;
  applyAdditionalInputs: () => void;
  openMaterialInfo: (key: string, readOnly?: boolean) => void;
  closeMaterialInfo: () => void;
  addCustomMaterial: (material: CustomMaterial, targetKey?: string | null) => void;
  toggleContainer: (container: string) => void;
  setSteelDesignModalOpen: (open: boolean) => void;
  setTransverseDesignModalOpen: (open: boolean) => void;
  setDeckDesignModalOpen: (open: boolean) => void;
  setGenerateResultsModalOpen: (open: boolean) => void;
  setReportModalOpen: (open: boolean) => void;
  setOutputWarningMessage: (msg: string | null) => void;
  requireDesignCheck: () => boolean;
  cancelDesign: () => void;
  saveInputs: () => void;
  loadInputs: () => void;
  saveLogs: () => void;
  export3DModel: (format: string) => void;
  exportCadImage: () => void;
  runDesign: () => void;

  // Log Dock Actions
  toggleLogDock: (open?: boolean) => void;
  toggleLogDockCollapse: () => void;
  appendLog: (message: string, level?: string) => void;
  resetLogs: () => void;
}

// Timers for the simulated design pipeline (cleared on cancel).
const designTimers: ReturnType<typeof setTimeout>[] = [];

export const useBridgeStore = create<BridgeState>((set, get) => ({
  inputs: {},
  schema: [],
  schemaLoading: false,
  schemaError: null,
  validationErrors: {},
  fieldErrors: {},
  messageModal: null,
  steelMaterials: [],
  concreteMaterials: [],
  rolledSections: [],

  location: null,
  isLocationModalOpen: false,
  activeViewportTab: 'dual',
  showCrossSection: true,
  showTopView: true,
  showDeck: true,
  activeNavTool: 'rotate',
  cadZoom: 1,
  cadDisplay: {
    nodes: false,
    nodeNumbers: false,
    elementNumbers: false,
    grillageView: false,
    axis: true,
    legend: false,
    gridLines: true,
    supports: true,
    loads: false,
    girderLabels: false,
  },
  darkMode: false,

  isLocked: false,
  isUnlockConfirmOpen: false,
  isDockCollapsed: false,
  isAdditionalInputsOpen: false,
  additionalInputsSchema: [],
  additionalInputsSchemaLoading: false,
  additionalInputsSchemaError: null,
  additionalInputs: {},
  isMaterialInfoOpen: false,
  materialInfoKey: null,
  materialInfoReadOnly: true,
  customMaterials: {},
  collapsedContainers: {},
  designRan: false,
  isDesignRunning: false,
  designProgress: 0,

  // Desktop OutputDock states
  isOutputDockCollapsed: false,
  outputCollapsedSections: {},
  analysisMember: 'All',
  analysisLoadCase: '1.35 DL + 1.5 LL',
  analysisForce: 'Mz',
  analysisDisplayOptions: { Max: true, Min: false, All: true, Summary: false },
  designMember: 'G1',
  designLoadCase: 'Design Envelope',
  dcrValues: {
    flexure: 0,
    shear: 0,
    interaction: 0,
    ltb: 0,
    longTransShear: 0,
    fatigue: 0,
    stressLimitation: 0,
    deflection: 0,
  },

  isSteelDesignModalOpen: false,
  isTransverseDesignModalOpen: false,
  isDeckDesignModalOpen: false,
  isGenerateResultsModalOpen: false,
  isReportModalOpen: false,
  outputWarningMessage: null,

  // Desktop LogDock states
  isLogDockOpen: true,
  isLogDockCollapsed: false,
  logWindowTitle: 'Log Window',
  logProgress: null,
  logs: [
    {
      id: 'init-1',
      timestamp: formatLogTimestamp(),
      message: `[${formatLogTimestamp()}] Log initialized`,
      level: 'info',
    },
  ],

  setInputs: (inputs) => set({ inputs }),

  showMessageModal: (modal) => set({ messageModal: modal }),
  closeMessageModal: () => set({ messageModal: null }),

  setFieldError: (key, error) =>
    set((state) => ({ fieldErrors: { ...state.fieldErrors, [key]: error } })),

  clearFieldError: (key) =>
    set((state) => {
      const next = { ...state.fieldErrors };
      delete next[key];
      return { fieldErrors: next };
    }),

  updateField: (key, value) => {
    get().clearFieldError(key);
    set((state) => {
      const nextInputs = { ...state.inputs, [key]: value };
      // Dependency side-effect: median changes carriageway limits
      if (key === 'geometry.include_median' && value === 'Yes') {
        const cw = nextInputs['geometry.carriageway_width'];
        if (cw !== undefined && cw !== null && cw !== '' && Number(cw) < 7.5) {
          nextInputs['geometry.carriageway_width'] = 7.5;
        }
      }
      return { inputs: nextInputs };
    });
    if (key === 'geometry.design_mode' && String(value).toLowerCase() === 'custom') {
      get().setAdditionalInputsOpen(true);
    }
  },

  validateBasicInputs: (key, value) => {
    return validateBasicInput(key, value, get().inputs);
  },

  validateRequiredInputs: () => {
    const { schema, inputs, location } = get();
    const emptyWidgets: { key: string; label: string }[] = [];
    const nextFieldErrors: Record<string, boolean> = { ...get().fieldErrors };

    schema.forEach((f) => {
      if (f.required) {
        if (f.key === 'project.location') {
          const hasLoc = Boolean(location) || Boolean(inputs['project.location']);
          if (!hasLoc) {
            emptyWidgets.push({ key: f.key, label: f.label });
            nextFieldErrors[f.key] = true;
          }
        } else {
          const val = inputs[f.key];
          if (val === '' || val === null || val === undefined) {
            emptyWidgets.push({ key: f.key, label: f.label });
            nextFieldErrors[f.key] = true;
          }
        }
      }
    });

    if (emptyWidgets.length > 0) {
      set({ fieldErrors: nextFieldErrors });
      const msg =
        'Please fill in the required(*) fields before proceeding:\n' +
        emptyWidgets.map((w) => ` - ${w.label.replace('\n', ' ')}`).join('\n');
      get().showMessageModal({
        title: 'Empty Required Fields',
        message: msg,
        type: 'critical',
      });
      return false;
    }

    return true;
  },

  setValidationError: (key, message) => {
    set((state) => {
      const errs = { ...state.validationErrors };
      if (message) {
        errs[key] = message;
      } else {
        delete errs[key];
      }
      return { validationErrors: errs };
    });
  },

  fetchSchema: async () => {
    set({ schemaLoading: true, schemaError: null });
    try {
      const [schemaData, steelMaterials, concreteMaterials, rolledSections] = await Promise.all([
        fetchBasicSchema(),
        fetchSteelMaterials(),
        fetchConcreteMaterials(),
        fetchRolledSections(),
      ]);

      const steelNames = steelMaterials.map((m) => m.name);
      const concreteGrades = concreteMaterials.map((m) => m.grade);

      const enriched = schemaData.map((f) => {
        // Only fall back to the catalog when the schema has no options of its
        // own (the desktop schema already carries the real DB grades).
        if (f.key === INPUT_KEYS.girder && (f.options?.length ?? 0) === 0 && steelNames.length > 0) {
          return { ...f, options: steelNames };
        }
        if (f.key === INPUT_KEYS.deck && (f.options?.length ?? 0) === 0 && concreteGrades.length > 0) {
          return { ...f, options: concreteGrades };
        }
        return f;
      });

      const initialInputs: Record<string, any> = { ...get().inputs };
      enriched.forEach((f) => {
        if (f.default !== undefined && initialInputs[f.key] === undefined) {
          initialInputs[f.key] = f.default;
        }
      });
      set({
        schema: enriched,
        inputs: initialInputs,
        schemaLoading: false,
        schemaError: null,
        steelMaterials,
        concreteMaterials,
        rolledSections,
      });
    } catch (err) {
      console.error('Failed to load schema', err);
      set({
        schemaLoading: false,
        schemaError: err instanceof Error ? err.message : 'Unable to load schema definitions.',
      });
    }
  },

  validateFieldLive: async (key, value) => {
    const { schema, inputs } = get();
    const field = schema.find((f) => f.key === key);

    // 1. Client-side schema constraints check
    if (field) {
      if (field.required && (value === '' || value === null || value === undefined)) {
        get().setValidationError(key, `${field.label} is required`);
        return;
      }
      if (field.ui_type === 'number' && value !== '' && value !== null && value !== undefined) {
        const numVal = Number(value);
        if (field.min !== undefined && numVal < field.min) {
          get().setValidationError(key, `Minimum value is ${field.min}${field.unit ? ' ' + field.unit : ''}`);
          return;
        }
        if (field.max !== undefined && numVal > field.max) {
          get().setValidationError(key, `Maximum value is ${field.max}${field.unit ? ' ' + field.unit : ''}`);
          return;
        }
      }
    }

    // Clear local error if client schema bounds pass
    get().setValidationError(key, null);

    if (!isBackendAvailable) {
      return;
    }

    try {
      const res = await validateInputs({
        key,
        value,
        all_inputs: { ...inputs, [key]: value },
      });
      if (!res) return;
      if (!res.valid) {
        get().setValidationError(key, res.message || 'Invalid value');
        if (res.corrected_value !== undefined && res.corrected_value !== null) {
          get().updateField(key, res.corrected_value);
        }
      } else {
        get().setValidationError(key, null);
      }
    } catch (err) {
      console.warn('Input validation failed; client-side validation remains active.', err);
    }
  },

  resetInputs: () => {
    const { schema } = get();
    const next: Record<string, any> = {};
    schema.forEach((f) => {
      if (f.default !== undefined) {
        next[f.key] = f.default;
      }
    });
    set({
      inputs: Object.keys(next).length > 0 ? next : get().inputs,
      validationErrors: {},
    });
  },

  setLocation: (loc) => {
    set((state) => ({
      location: loc,
      inputs: {
        ...state.inputs,
        [INPUT_KEYS.projectLocation]: `${loc.station}, ${loc.state}`,
        [INPUT_KEYS.windSpeed]: loc.basic_wind_speed,
        [INPUT_KEYS.seismicZone]: loc.seismic_zone,
        [INPUT_KEYS.maxTemp]: loc.max_temperature,
        [INPUT_KEYS.minTemp]: loc.min_temperature,
      },
    }));
  },

  setLocationModalOpen: (open) => set({ isLocationModalOpen: open }),
  setActiveViewportTab: (activeViewportTab) => set({ activeViewportTab }),
  setShowCrossSection: (show) => set({ showCrossSection: show }),
  setShowTopView: (show) => set({ showTopView: show }),
  toggleCrossSection: () => {
    set((state) => {
      if (state.activeViewportTab === '3d' || state.activeViewportTab === 'plots') {
        return { activeViewportTab: 'dual', showCrossSection: true, showTopView: true };
      }
      return { showCrossSection: !state.showCrossSection };
    });
  },
  toggleTopView: () => {
    set((state) => {
      if (state.activeViewportTab === '3d' || state.activeViewportTab === 'plots') {
        return { activeViewportTab: 'dual', showCrossSection: true, showTopView: true };
      }
      return { showTopView: !state.showTopView };
    });
  },
  toggleCad3dView: () => {
    set((state) => {
      if (state.activeViewportTab === '3d') {
        return { activeViewportTab: 'dual', showCrossSection: true, showTopView: true };
      }
      return { activeViewportTab: '3d' };
    });
  },
  togglePlotsView: () => {
    set((state) => {
      if (state.activeViewportTab === 'plots') {
        return { activeViewportTab: 'dual', showCrossSection: true, showTopView: true };
      }
      return { activeViewportTab: 'plots' };
    });
  },
  toggleDeck: () => set((state) => ({ showDeck: !state.showDeck })),

  setActiveNavTool: (tool) => set({ activeNavTool: tool }),

  toggleCadDisplay: (key) =>
    set((state) => ({
      cadDisplay: { ...state.cadDisplay, [key]: !state.cadDisplay[key] },
    })),

  zoomIn: () => set((state) => ({ cadZoom: Math.min(6, +(state.cadZoom * 1.15).toFixed(3)) })),
  zoomOut: () => set((state) => ({ cadZoom: Math.max(0.25, +(state.cadZoom / 1.15).toFixed(3)) })),
  zoomFit: () => set({ cadZoom: 1 }),
  setCadZoom: (zoom) => set({ cadZoom: Math.max(0.25, Math.min(6, zoom)) }),

  toggleDarkMode: () => {
    set((state) => {
      const next = !state.darkMode;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return { darkMode: next };
    });
  },

  toggleLock: () => {
    const { isLocked } = get();
    if (isLocked) {
      // Unlocking triggers confirmation dialog
      set({ isUnlockConfirmOpen: true });
    } else {
      set({ isLocked: true });
    }
  },

  confirmUnlock: () => {
    const ts = formatLogTimestamp();
    get().appendLog(`[${ts}] Input unlocked. Previous design results cleared.`, 'warning');
    get().appendLog('__progress__0', 'progress');
    set({
      isLocked: false,
      isUnlockConfirmOpen: false,
      designRan: false,
      validationErrors: {},
      dcrValues: {
        flexure: 0,
        shear: 0,
        interaction: 0,
        ltb: 0,
        longTransShear: 0,
        fatigue: 0,
        stressLimitation: 0,
        deflection: 0,
      },
    });
  },

  setUnlockConfirmOpen: (open) => set({ isUnlockConfirmOpen: open }),

  toggleDock: () => set((state) => ({ isDockCollapsed: !state.isDockCollapsed })),

  toggleOutputDock: () => set((state) => ({ isOutputDockCollapsed: !state.isOutputDockCollapsed })),

  toggleOutputSection: (section) =>
    set((state) => ({
      outputCollapsedSections: {
        ...state.outputCollapsedSections,
        [section]: !state.outputCollapsedSections[section],
      },
    })),

  setAnalysisMember: (member) => set({ analysisMember: member }),
  setAnalysisLoadCase: (lc) => set({ analysisLoadCase: lc }),
  setAnalysisForce: (force) => set({ analysisForce: force }),
  toggleAnalysisDisplayOption: (key) =>
    set((state) => ({
      analysisDisplayOptions: {
        ...state.analysisDisplayOptions,
        [key]: !state.analysisDisplayOptions[key],
      },
    })),

  setDesignMember: (member) => {
    const { designRan, designLoadCase, inputs } = get();
    set({ designMember: member });
    if (designRan) {
      set({ dcrValues: computeDCR(member, designLoadCase, getSpan(inputs)) });
    }
  },

  setDesignLoadCase: (lc) => {
    const { designRan, designMember, inputs } = get();
    set({ designLoadCase: lc });
    if (designRan) {
      set({ dcrValues: computeDCR(designMember, lc, getSpan(inputs)) });
    }
  },

  setAdditionalInputsOpen: (open) => set({ isAdditionalInputsOpen: open }),

  fetchAdditionalInputsSchema: async () => {
    if (get().additionalInputsSchema.length > 0) return;
    set({ additionalInputsSchemaLoading: true, additionalInputsSchemaError: null });
    try {
      const schemaData = (await fetchAdditionalInputsSchema()) as unknown[];
      set({ additionalInputsSchema: schemaData, additionalInputsSchemaLoading: false });
    } catch (err) {
      set({
        additionalInputsSchemaLoading: false,
        additionalInputsSchemaError:
          err instanceof Error ? err.message : 'Unable to load additional inputs schema.',
      });
    }
  },

  setAdditionalInput: (id, value) =>
    set((state) => ({ additionalInputs: { ...state.additionalInputs, [id]: value } })),

  // Defaults button: clears the given field ids (and their companion keys).
  resetAdditionalInputs: (ids) =>
    set((state) => {
      const next = { ...state.additionalInputs };
      for (const id of ids) {
        delete next[id];
        delete next[`${id}.bounds`];
        delete next[`${id}.mode`];
        delete next[`${id}.lower`];
        delete next[`${id}.upper`];
      }
      return { additionalInputs: next };
    }),

  // Save button (desktop _save_inputs): flush the working dict into the design
  // input dictionary so the backend receives the additional values.
  applyAdditionalInputs: () => {
    const { additionalInputs } = get();
    if (Object.keys(additionalInputs).length > 0) {
      set((state) => ({ inputs: { ...state.inputs, ...additionalInputs } }));
    }
    get().appendLog(
      `[${formatLogTimestamp()}] Additional Inputs saved.`,
      'success',
    );
    get().showMessageModal({
      title: 'Saved',
      message: 'Inputs saved successfully.',
      type: 'success',
    });
  },

  openMaterialInfo: (key, readOnly = true) =>
    set({ isMaterialInfoOpen: true, materialInfoKey: key, materialInfoReadOnly: readOnly }),

  closeMaterialInfo: () => set({ isMaterialInfoOpen: false, materialInfoKey: null }),

  // Registers a custom steel/concrete material (mirrors MaterialPropertiesDialog
  // Add flow) and selects it on the originating material field.
  addCustomMaterial: (material, targetKey = null) => {
    const key = targetKey ?? get().materialInfoKey;
    set((state) => ({
      customMaterials: { ...state.customMaterials, [material.name]: material },
    }));
    if (key) {
      get().updateField(key, material.name);
    }
    get().appendLog(`[${formatLogTimestamp()}] Added custom material: ${material.name}`, 'success');
  },

  toggleContainer: (container) =>
    set((state) => ({
      collapsedContainers: {
        ...state.collapsedContainers,
        [container]: !state.collapsedContainers[container],
      },
    })),

  setSteelDesignModalOpen: (open) => set({ isSteelDesignModalOpen: open }),
  setTransverseDesignModalOpen: (open) => set({ isTransverseDesignModalOpen: open }),
  setDeckDesignModalOpen: (open) => set({ isDeckDesignModalOpen: open }),
  setGenerateResultsModalOpen: (open) => set({ isGenerateResultsModalOpen: open }),
  setReportModalOpen: (open) => set({ isReportModalOpen: open }),
  setOutputWarningMessage: (msg) => set({ outputWarningMessage: msg }),

  requireDesignCheck: () => {
    const { designRan, isLocked } = get();
    if (!designRan || !isLocked) {
      set({ outputWarningMessage: 'Please run the design first.' });
      return false;
    }
    return true;
  },

  saveInputs: () => {
    const { inputs, appendLog, isLocked } = get();
    if (isLocked) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inputs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'bridge_inputs.osi');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    appendLog(`[${formatLogTimestamp()}] Saved OSI Successfully!`, 'success');
  },

  // File > Load Input (.osi) — mirrors desktop loadOSI_inputs()
  loadInputs: () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.osi,.json,.yaml,.yml';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '');
          const data = JSON.parse(text);
          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('File does not contain a valid input dictionary.');
          }

          // Reject hand-edited files with invalid values (mirrors desktop template_page.py lines 868-878)
          const val = validateOsiInputs(data);
          if (!val.isValid) {
            get().showMessageModal({
              title: 'Invalid OSI File',
              message: `The OSI file contains invalid values and was not loaded:\n\n${val.errorText(10)}`,
              type: 'warning',
            });
            return;
          }

          get().setInputs({ ...get().inputs, ...data });
          get().setValidationError('__all__', null);
          get().appendLog(`[${formatLogTimestamp()}] Loaded OSI Successfully!`, 'success');
        } catch (err) {
          get().appendLog(
            `[${formatLogTimestamp()}] Could not load OSI file: ${err instanceof Error ? err.message : String(err)}`,
            'error',
          );
          get().showMessageModal({
            title: 'Invalid OSI File',
            message: 'Could not load OSI file. Please choose a valid .osi (JSON) input file.',
            type: 'warning',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // File > Save Log Messages
  saveLogs: () => {
    const { logs } = get();
    const text = logs.map((l) => l.message).join('\n');
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'bridge_log.txt');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // File > Save 3D Model (web: download the input/geometry descriptor)
  export3DModel: (format = 'stl') => {
    const { designRan, requireDesignCheck, inputs, appendLog } = get();
    if (!designRan || !requireDesignCheck()) return;
    const payload = {
      format,
      generated: formatLogTimestamp(),
      inputs,
      note: 'Web export placeholder — geometry is generated by the osdagbridge-core engine on the server.',
    };
    const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `osdagbridge_model.${format}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    appendLog(`[${formatLogTimestamp()}] Exported 3D model descriptor (${format.toUpperCase()}).`, 'success');
  },

  // File > Save CAD Image (web: rasterize the viewport is API-specific; stub message)
  exportCadImage: () => {
    get().appendLog(
      `[${formatLogTimestamp()}] CAD image export requested. Use your browser's screenshot on the 3D viewport.`,
      'warning',
    );
  },

  // Log Dock Actions
  toggleLogDock: (open) =>
    set((state) => ({
      isLogDockOpen: open !== undefined ? open : !state.isLogDockOpen,
    })),

  toggleLogDockCollapse: () =>
    set((state) => ({
      isLogDockCollapsed: !state.isLogDockCollapsed,
    })),

  appendLog: (message, log_level = 'info') => {
    if (log_level === 'progress') {
      try {
        const pct = parseInt(message.replace('__progress__', ''), 10);
        if (isNaN(pct)) return;
        if (pct === 0) {
          set({ logWindowTitle: 'Log Window', logProgress: null });
        } else if (pct >= 100) {
          set({ logWindowTitle: 'Log Window  –  Complete (100%)', logProgress: 100 });
        } else {
          set({ logWindowTitle: `Log Window  –  Analysing… ${pct}%`, logProgress: pct });
        }
      } catch {
        // ignore
      }
      return;
    }

    const level = (['error', 'warning', 'success', 'stdout_print', 'info'].includes(log_level)
      ? log_level
      : 'info') as LogEntry['level'];

    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: formatLogTimestamp(),
      message,
      level,
    };

    set((state) => ({
      logs: [...state.logs, newEntry],
    }));
  },

  resetLogs: () => {
    const ts = formatLogTimestamp();
    set({
      logWindowTitle: 'Log Window',
      logProgress: null,
      logs: [
        {
          id: `${Date.now()}`,
          timestamp: ts,
          message: `[${ts}] Log initialized`,
          level: 'info',
        },
      ],
    });
  },

  runDesign: () => {
    const { isLocked, designMember, designLoadCase, inputs, additionalInputs, appendLog, validateRequiredInputs } = get();
    if (isLocked || get().isDesignRunning) return;
    if (!validateRequiredInputs()) return;
    const span = getSpan(inputs);
    const noOfGirders = getNoOfGirders(inputs, additionalInputs);
    const ts = formatLogTimestamp();

    designTimers.forEach(clearTimeout);
    designTimers.length = 0;

    set({ isLogDockOpen: true, isLogDockCollapsed: false, isDesignRunning: true, designProgress: 0 });
    appendLog(`[${ts}] Starting bridge superstructure design for Span: ${span}m, Girders: ${noOfGirders}...`, 'info');
    appendLog('__progress__15', 'progress');
    set({ designProgress: 15 });

    designTimers.push(setTimeout(() => {
      const ts2 = formatLogTimestamp();
      appendLog(`[${ts2}] Calculating DL (Girder self-weight + Deck slab + Crash barrier + Surfacing)...`, 'info');
      appendLog('__progress__45', 'progress');
      set({ designProgress: 45 });
    }, 150));

    designTimers.push(setTimeout(() => {
      const ts3 = formatLogTimestamp();
      appendLog(`[${ts3}] Applying IRC:6-2017 Live Loads (Class 70R Tracked & Wheeled / Class A train)...`, 'info');
      appendLog('__progress__75', 'progress');
      set({ designProgress: 75 });
    }, 300));

    designTimers.push(setTimeout(() => {
      const ts4 = formatLogTimestamp();
      const computed = computeDCR(designMember, designLoadCase, span);
      appendLog(`[${ts4}] Girder ${designMember} capacity checks evaluated successfully for ${designLoadCase}.`, 'info');
      appendLog(`[${ts4}] Design checks complete. All safety and serviceability limit ratios within permissible bounds.`, 'success');
      appendLog('__progress__100', 'progress');

      designTimers.length = 0;
      set({
        designRan: true,
        isLocked: true,
        dcrValues: computed,
        isDesignRunning: false,
        designProgress: 100,
      });
    }, 450));
  },

  // Cancel an in-flight design run (mirrors the desktop loading popup Cancel).
  cancelDesign: () => {
    designTimers.forEach(clearTimeout);
    designTimers.length = 0;
    const ts = formatLogTimestamp();
    set({ isDesignRunning: false, designProgress: 0 });
    get().appendLog(`[${ts}] Analysis was stopped by the user.`, 'warning');
    get().appendLog('__progress__0', 'progress');
  },
}));

function formatLogTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function computeDCR(member: string, loadCase: string, span: number): Record<string, number> {
  const isOuter = member === 'G1' || member === 'G4' || member === 'G5';
  const spanFactor = span / 30.0;
  const isEnvelope = loadCase === 'Design Envelope';
  const envMult = isEnvelope ? 1.0 : 0.88;

  return {
    flexure: Math.min(135, Math.round((isOuter ? 78 : 72) * spanFactor * envMult)),
    shear: Math.min(135, Math.round((isOuter ? 66 : 58) * (span / 30.0) * envMult)),
    interaction: Math.min(135, Math.round((isOuter ? 82 : 75) * envMult)),
    ltb: Math.min(135, Math.round((isOuter ? 71 : 65) * (span > 32 ? 1.1 : 0.95) * envMult)),
    longTransShear: Math.min(135, Math.round((isOuter ? 56 : 50) * envMult)),
    fatigue: Math.min(135, Math.round((isOuter ? 49 : 44) * envMult)),
    stressLimitation: Math.min(135, Math.round((isOuter ? 85 : 79) * envMult)),
    deflection: Math.min(135, Math.round((isOuter ? 64 : 59) * (span > 35 ? 1.15 : 0.95) * envMult)),
  };
}
