/**
 * docks/index.ts
 * Barrel export for all dock widgets in OsdagBridge Web.
 * Mirrors the structure of osdagbridge.desktop.ui.docks:
 *   - cad_cross_section.py -> CadCrossSectionDock
 *   - cad_dual_view.py     -> CadDualViewDock
 *   - cad_top_view.py      -> CadTopViewDock
 *   - dock_utils.py        -> dockUtils
 *   - input_dock.py        -> InputDock
 *   - log_dock.py          -> LogDock
 *   - output_dock.py       -> OutputDock
 */

export { InputDock } from './InputDock';
export { OutputDock } from './OutputDock';
export { LogDock } from './LogDock';
export { CadCrossSectionDock } from './CadCrossSectionDock';
export { CadDualViewDock } from './CadDualViewDock';
export { CadTopViewDock } from './CadTopViewDock';
export * from './dockUtils';
