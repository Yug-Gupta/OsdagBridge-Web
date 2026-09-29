# 3D CAD Viewer — Required Backend Data

The web 3D viewer (`components/viewports/BridgeViewer.tsx`) renders entirely from
a single parameter object, `BridgeCadParameters`
(`src/types/bridgeGeometry.ts`). It is the web mirror of the desktop
`osdagbridge.core.bridge_types.plate_girder.dto.BridgeParametersDTO`, produced by
`PlateGirderBridge.get_3d_cad_parameters()`.

The frontend never sizes members. Until the endpoint below exists, a mock is
assembled from the current inputs
(`src/utils/mockCadParameters.ts`) with placeholder section sizes.

## Endpoint

```
POST /api/v1/cad/3d-parameters
Content-Type: application/json

{ "inputs": { ...basic inputs... }, "additional_inputs": { ...additional inputs... } }
```

Response: `BridgeCadParameters` (all lengths in **mm**, angles in **degrees**).

```jsonc
{
  "span_length": 30000,
  "num_girders": 4,
  "girder_spacing": 2400,
  "skew_angle": 0,

  "carriageway_width": 7500,
  "deck_thickness": 200,
  "deck_overhang": 1000,

  "footpath_config": "NONE",          // "NONE" | "LEFT" | "RIGHT" | "BOTH"
  "footpath_width": 1500,
  "footpath_thickness": 200,

  "railing_type": "IRC 5 - RCC Railing",
  "railing_width": 375,
  "rail_count": 3,

  "barrier_type": "IRC 5 - RCC Crash Barrier",
  "crash_barrier_width": 450,

  "median_enabled": false,
  "median_type": "IRC 5 - Raised Kerb",

  "wearing_course_thickness": 75,

  "cross_bracing_spacing": 3500,
  "bracing_type": "X",

  "end_diaphragm_type": "Cross Bracing",

  "girder": { "d": 1500, "bf": 400, "bf_b": 400, "tf": 25, "tf_b": 25, "tw": 12 },

  "intermediate_stiffener_enabled": true,
  "intermediate_stiffener_spacing": 1800,
  "end_stiffener_pairs": 2,

  "steel_grade": "E 250",
  "concrete_grade": "M 40"
}
```

`barrier_type`, `median_type` and `railing_type` must use the IRC 5 strings
understood by `src/utils/irc5Geometry.ts` (ported from
`osdagbridge.desktop.cad.irc5_geometry`).

## Frontend integration point

Only `fetch3dCadParameters(inputs, additionalInputs)` in `src/services/api.ts`
needs the real endpoint. It already:

1. POSTs to `/cad/3d-parameters`.
2. Validates the response (`span_length` present).
3. Falls back to the mock builder on any failure/absence.

`ViewportContainer.tsx` debounces this call (250 ms) on input changes and passes
the result to `BridgeViewer`, so switching from mock → live requires no component
changes.

## Optional / future fields

To render fidelity beyond the current model, the endpoint may also return:
`intermediate_stiffener_thickness`, `end_stiffener_thickness`,
`num_longitudinal_stiffeners`, `girder_segments` (stepped girder depths),
`shear_stud_params`, and per-member `stiffeners_dict`. The viewer currently draws
uniform-section girders; these can be added without changing the API contract
(they are already defined in the desktop DTO).

## Not required from this endpoint

Analysis/design results (DCR, utilisation) are separate; the viewer only needs
geometry. Results come from the result-dialog schemas
(`mock-result-schemas.json` / `/schema/result-dialogs`).
