import React, { createContext, useContext } from 'react';
import { Plus, Trash2, SlidersHorizontal, Check } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { ROLLED_SECTION_ID_SUFFIX } from '../../utils/sectionUtils';

/**
 * Recursive renderer for the desktop Additional Inputs schema
 * (osdagbridge.core.bridge_types.plate_girder.ui_fields_additional_input).
 *
 * The schema is a nested object of tabs/rows/columns/fields. This component
 * walks it and renders equivalent React inputs. Field values are stored under
 * `additionalInputs[field.id]` and flushed into `inputs` on Save.
 */

type AnyNode = any;

/**
 * When an ancestor declares `disable: true`, every field in its subtree is
 * rendered disabled (mirrors the desktop UIBuilder disable flag).
 */
const DisabledContext = createContext(false);

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-main)',
  lineHeight: 1.3,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  borderRadius: '4px',
  border: '1px solid var(--border-color)',
  background: 'var(--input-bg)',
  color: 'var(--text-main)',
  fontSize: '12px',
};

function fieldKey(node: AnyNode): string {
  return String(node.id ?? node.label ?? Math.random().toString(36).slice(2));
}

/**
 * Optimized-mode "Set Bounds" control. Mirrors the desktop bounds dialog:
 * lower/upper limits with an optional increment. The chosen bounds are stored
 * under `<id>.bounds`; the optimizer itself lives in the backend.
 */
const BoundsControl: React.FC<{ node: AnyNode; disabled?: boolean }> = ({ node, disabled }) => {
  const { additionalInputs, setAdditionalInput } = useBridgeStore();
  const id = String(node.id ?? '');
  const bounds = additionalInputs[`${id}.bounds`] ?? {
    lower: node.lower_limit ?? 0,
    upper: node.upper_limit ?? 0,
    increment: node.with_increment ? 1 : 0,
  };
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      {open && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            aria-label="Lower bound"
            value={bounds.lower}
            disabled={disabled}
            onChange={(e) => setAdditionalInput(`${id}.bounds`, { ...bounds, lower: Number(e.target.value) })}
            style={{ ...inputStyle, width: '80px' }}
          />
          <span style={{ color: 'var(--text-sub)' }}>–</span>
          <input
            type="number"
            aria-label="Upper bound"
            value={bounds.upper}
            disabled={disabled}
            onChange={(e) => setAdditionalInput(`${id}.bounds`, { ...bounds, upper: Number(e.target.value) })}
            style={{ ...inputStyle, width: '80px' }}
          />
          {node.with_increment && (
            <input
              type="number"
              aria-label="Increment"
              value={bounds.increment}
              disabled={disabled}
              onChange={(e) => setAdditionalInput(`${id}.bounds`, { ...bounds, increment: Number(e.target.value) })}
              style={{ ...inputStyle, width: '70px' }}
            />
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ ...inputStyle, width: 'auto', cursor: 'pointer', borderColor: 'var(--accent-osdag)', color: 'var(--accent-osdag)', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Check size={13} /> Done
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '4px',
          border: '1px solid var(--accent-osdag)',
          background: 'transparent',
          color: 'var(--accent-osdag)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <SlidersHorizontal size={13} /> {node.text ?? 'Set Bounds'}
      </button>
      <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
        {bounds.lower}–{bounds.upper}
        {node.with_increment ? ` step ${bounds.increment}` : ''}
      </span>
    </div>
  );
};

/** Optimized-mode "All Custom" toggle (desktop `all_custom` widget). */
const AllCustomControl: React.FC<{ node: AnyNode; disabled?: boolean }> = ({ node, disabled }) => {
  const { additionalInputs, setAdditionalInput } = useBridgeStore();
  const id = String(node.id ?? '');
  const active = String(additionalInputs[id] ?? '') === 'Custom';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setAdditionalInput(id, active ? '' : 'Custom')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '4px',
        border: `1px solid ${active ? 'var(--accent-osdag)' : 'var(--border-color)'}`,
        background: active ? 'var(--accent-osdag)' : 'transparent',
        color: active ? '#fff' : 'var(--text-main)',
        fontSize: '11px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {node.text ?? 'All Custom'}
    </button>
  );
};

/**
 * Adaptive field: renders the variant selected by a controller field's value
 * (desktop `adaptive` + `controller` + `modes`). The variant inherits the
 * parent node's id/label.
 */
const AdaptiveField: React.FC<{ node: AnyNode }> = ({ node }) => {
  const { inputs, additionalInputs } = useBridgeStore();
  const controller = String(node.controller ?? '');
  const controllerValue = String(additionalInputs[controller] ?? inputs[controller] ?? '');
  const modes: Record<string, AnyNode> = node.modes ?? {};
  const keys = Object.keys(modes);
  const key = keys.includes(controllerValue) ? controllerValue : keys[0];
  const variant = modes[key];
  if (!variant) return null;

  const merged: AnyNode = {
    ...variant,
    id: node.id ?? variant.id,
    label: node.label ?? variant.label,
    label_width: node.label_width ?? variant.label_width,
  };

  const t = String(merged.type ?? '').toLowerCase();
  if (t === 'all_custom') return <SchemaInput node={merged} />;
  if (t === 'bounds_dialog_btn') return <SchemaInput node={merged} />;
  return <SchemaInput node={merged} />;
};

/**
 * Load-combination editor (desktop `load_combination` widget). Stores rows in
 * `additionalInputs[id]` as an array of { name, factors }.
 */
const LoadCombinationControl: React.FC<{ node: AnyNode; disabled?: boolean }> = ({ node, disabled }) => {
  const { additionalInputs, setAdditionalInput } = useBridgeStore();
  const id = String(node.id ?? '');
  const rows: { name: string; factors: string }[] = additionalInputs[id] ?? [];
  const label = node.label ?? 'Load Combinations';

  const update = (next: { name: string; factors: string }[]) => setAdditionalInput(id, next);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ ...labelStyle, fontWeight: 700 }}>{label}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => update([...rows, { name: '', factors: '' }])}
          style={{ ...inputStyle, width: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: 'var(--bg-grouped)' }}>
            <th style={{ padding: '4px 6px', textAlign: 'left' }}>Combination</th>
            <th style={{ padding: '4px 6px', textAlign: 'left' }}>Factors</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '2px' }}>
                <input
                  value={r.name}
                  disabled={disabled}
                  onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  style={inputStyle}
                />
              </td>
              <td style={{ padding: '2px' }}>
                <input
                  value={r.factors}
                  disabled={disabled}
                  onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, factors: e.target.value } : x)))}
                  style={inputStyle}
                />
              </td>
              <td style={{ padding: '2px', width: '28px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => update(rows.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={3} style={{ padding: '6px', color: 'var(--text-sub)' }}>No combinations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Table whose row count is taken from a companion count field
 * (desktop `table_with_count`).
 */
const TableWithCountControl: React.FC<{ node: AnyNode; disabled?: boolean }> = ({ node, disabled }) => {
  const { additionalInputs, setAdditionalInput } = useBridgeStore();
  const id = String(node.id ?? '');
  const countId = String(node.count_id ?? `${id}.count`);
  const choices: number[] = (node.count_choices ?? [1, 2, 3, 4]).map((c: any) => Number(c) || 1);
  const count = Number(additionalInputs[countId] ?? choices[0]);
  const rows: any[] = additionalInputs[id] ?? Array.from({ length: count }, () => ({}));

  const setCount = (n: number) => {
    setAdditionalInput(countId, n);
    const next = Array.from({ length: n }, (_, i) => rows[i] ?? {});
    setAdditionalInput(id, next);
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ ...labelStyle, fontWeight: 700 }}>{node.label ?? 'Table'}</span>
        <select
          value={count}
          disabled={disabled}
          onChange={(e) => setCount(Number(e.target.value))}
          style={{ ...inputStyle, width: 'auto' }}
        >
          {choices.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <tbody>
          {Array.from({ length: count }, (_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '4px 6px', width: '40px', color: 'var(--text-sub)' }}>{i + 1}</td>
              <td style={{ padding: '2px' }}>
                <input
                  value={rows[i]?.value ?? ''}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = Array.from({ length: count }, (_, j) => (j === i ? { value: e.target.value } : rows[j] ?? {}));
                    setAdditionalInput(id, next);
                  }}
                  style={inputStyle}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * CAD-style I-section cross-section preview.
 * Mirrors RolledSectionPreview (desktop) — shows a schematic I-beam outline
 * with dimension annotations and updates the caption to the selected designation.
 * Exact dimensions come from the backend; this renders a proportional placeholder.
 */
const ISectionPreview: React.FC<{ designation: string }> = ({ designation }) => {
  const hasDesignation = Boolean(designation);

  // Approximate proportions for an I-section (not engineering-exact — used for visual only)
  const W = 280; const H = 200;
  const fw = 100; const wt = 12; const ft = 14; const d = 140;
  const cx = W / 2;
  const top = (H - d) / 2;
  const bot = top + d;
  const fl = cx - fw / 2; const fr = cx + fw / 2;
  const wl = cx - wt / 2; const wr = cx + wt / 2;

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        background: 'var(--bg-grouped)',
        marginBottom: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '5px 10px',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--accent-osdag)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
        }}
      >
        Section Preview
        {hasDesignation && (
          <span style={{ color: 'var(--text-sub)', fontWeight: 500, marginLeft: '8px', textTransform: 'none' }}>
            — {designation}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', width: '100%', maxHeight: '180px' }}
        aria-label={hasDesignation ? `I-section preview for ${designation}` : 'I-section outline'}
      >
        {/* Canvas background */}
        <rect width={W} height={H} fill="var(--bg-grouped)" />

        {/* I-section outline fill */}
        <path
          d={`
            M ${fl} ${top}
            H ${fr}
            V ${top + ft}
            H ${wr}
            V ${bot - ft}
            H ${fr}
            V ${bot}
            H ${fl}
            V ${bot - ft}
            H ${wl}
            V ${top + ft}
            H ${fl}
            Z
          `}
          fill="var(--bg-surface)"
          stroke="var(--accent-osdag)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Dimension annotations — depth */}
        <line x1={fl - 20} y1={top} x2={fl - 20} y2={bot} stroke="var(--text-sub)" strokeWidth="1" strokeDasharray="3,2" />
        <line x1={fl - 26} y1={top} x2={fl - 14} y2={top} stroke="var(--text-sub)" strokeWidth="1" />
        <line x1={fl - 26} y1={bot} x2={fl - 14} y2={bot} stroke="var(--text-sub)" strokeWidth="1" />
        <text x={fl - 32} y={(top + bot) / 2 + 4} textAnchor="middle" fontSize="8" fill="var(--text-sub)" transform={`rotate(-90, ${fl - 32}, ${(top + bot) / 2 + 4})`}>
          d (mm)
        </text>

        {/* Dimension annotations — flange width */}
        <line x1={fl} y1={top + 36} x2={fr} y2={top + 36} stroke="var(--text-sub)" strokeWidth="1" strokeDasharray="3,2" />
        <line x1={fl} y1={top + 30} x2={fl} y2={top + 42} stroke="var(--text-sub)" strokeWidth="1" />
        <line x1={fr} y1={top + 30} x2={fr} y2={top + 42} stroke="var(--text-sub)" strokeWidth="1" />
        <text x={cx} y={top + 48} textAnchor="middle" fontSize="8" fill="var(--text-sub)">
          b (mm)
        </text>

        {/* Caption */}
        {hasDesignation ? (
          <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--accent-osdag)">
            {designation}
          </text>
        ) : (
          <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--text-sub)">
            Select IS Section above
          </text>
        )}
      </svg>
    </div>
  );
};

const SchemaInput: React.FC<{ node: AnyNode }> = ({ node }) => {

  const { additionalInputs, setAdditionalInput } = useBridgeStore();
  const parentDisabled = useContext(DisabledContext);
  const type = String(node.type ?? '').toLowerCase();
  const id = String(node.id ?? '');
  const value = additionalInputs[id] ?? node.default ?? '';
  const disabled =
    Boolean(node.read_only) ||
    Boolean(node.enabled === false) ||
    node.disable === true ||
    parentDisabled;
  const label = node.label ?? node.title ?? '';
  const labelWidth = typeof node.label_width === 'number' ? node.label_width : 200;

  const onChange = (v: unknown) => setAdditionalInput(id, v);

  const labelEl = label ? (
    <label style={{ ...labelStyle, minWidth: `${Math.min(labelWidth, 280)}px`, maxWidth: `${Math.min(labelWidth, 280)}px` }}>
      {label}
    </label>
  ) : null;

  const row = (control: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      {labelEl}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>{control}</div>
    </div>
  );

  switch (type) {
    case 'textbox':
      return row(
        <input
          type="text"
          value={String(value ?? '')}
          placeholder={node.placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, opacity: disabled ? 0.65 : 1 }}
        />,
      );

    case 'combobox':
    case 'combo': {
      // Inject rolled section designations for the IS Section selector (desktop: GirderSectionCatalog)
      // The schema carries choices: [] for this field; we populate it from the store.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { rolledSections } = useBridgeStore();
      const isRolledSectionField =
        typeof id === 'string' && (id.endsWith(ROLLED_SECTION_ID_SUFFIX) || id.endsWith('.is_section'));
      let baseChoices: string[] = node.choices ?? node.enabled_choices ?? [];
      if (isRolledSectionField && baseChoices.length === 0) {
        baseChoices = rolledSections.map((s) => s.designation);
      }
      const enabled = node.enabled_choices ?? baseChoices;
      const current = String(value ?? baseChoices[0] ?? '');
      return row(
        <select
          value={current}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.65 : 1 }}
        >
          {baseChoices.map((c) => (
            <option key={c} value={c} disabled={!enabled.includes(c)}>
              {c}
            </option>
          ))}
        </select>,
      );
    }

    case 'checkbox':
      return row(
        <>
          <input
            type="checkbox"
            checked={Boolean(value ?? node.default_checked)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-osdag)' }}
          />
          {node.sub_label && <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{node.sub_label}</span>}
        </>,
      );

    case 'mode_line_edit': {
      const modes: string[] = node.mode_choices ?? [];
      return row(
        <>
          <input
            type="text"
            value={String(value ?? '')}
            placeholder={node.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          {modes.length > 0 && (
            <select
              value={String(additionalInputs[`${id}.mode`] ?? modes[0])}
              disabled={disabled}
              onChange={(e) => setAdditionalInput(`${id}.mode`, e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '90px' }}
            >
              {modes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </>,
      );
    }

    case 'double_range':
      return row(
        <>
          <input
            type="text"
            aria-label={`${label} lower`}
            value={String(additionalInputs[`${id}.lower`] ?? node.lower_limit ?? '')}
            disabled={disabled}
            onChange={(e) => setAdditionalInput(`${id}.lower`, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <span style={{ color: 'var(--text-sub)' }}>–</span>
          <input
            type="text"
            aria-label={`${label} upper`}
            value={String(additionalInputs[`${id}.upper`] ?? node.upper_limit ?? '')}
            disabled={disabled}
            onChange={(e) => setAdditionalInput(`${id}.upper`, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </>,
      );

    case 'description':
      return (
        <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--text-sub)', lineHeight: 1.4 }}>
          {node.text ?? node.label}
        </p>
      );

    case 'notice':
      return (
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '11px',
            color: 'var(--text-main)',
            background: 'var(--bg-grouped)',
            borderLeft: '3px solid var(--accent-osdag)',
            borderRadius: '4px',
            padding: '6px 8px',
          }}
        >
          {node.text ?? node.label}
        </p>
      );

    case 'line':
      return <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />;

    case 'button':
      return row(
        <button
          type="button"
          disabled={disabled}
          style={{
            padding: '5px 14px',
            borderRadius: '4px',
            border: '1px solid var(--accent-osdag)',
            background: 'var(--accent-osdag)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {node.label ?? node.text ?? 'Open'}
        </button>,
      );

    case 'bounds_dialog_btn':
      return row(<BoundsControl node={node} disabled={disabled} />);

    case 'all_custom':
      return row(<AllCustomControl node={node} disabled={disabled} />);

    case 'load_combination':
      return <LoadCombinationControl node={node} disabled={disabled} />;

    case 'table_with_count':
      return <TableWithCountControl node={node} disabled={disabled} />;

    default:
      break;
  }

  // direct_widget_classes: the section_preview placeholder renders a
  // CAD-style I-section SVG — matching RolledSectionPreview in the desktop.
  if (type === 'direct_widget_classes') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { additionalInputs } = useBridgeStore();
    const isSectionPreview =
      typeof id === 'string' && id.toLowerCase().includes('section_preview');

    if (isSectionPreview) {
      // Get current section designation from sibling is_section field
      const sectionKey = Object.keys(additionalInputs).find((k) => k.endsWith('.is_section'));
      const designation = sectionKey ? String(additionalInputs[sectionKey] ?? '') : '';
      return <ISectionPreview designation={designation} />;
    }

    return (
      <div
        style={{
          border: '1px dashed var(--border-color)',
          borderRadius: '8px',
          background: 'var(--bg-grouped)',
          color: 'var(--text-sub)',
          fontSize: '11px',
          padding: '12px',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        {node.label ?? 'Preview'}
      </div>
    );
  }

  // Unknown leaf with a label → render a generic text input.
  if (id && label) {
    return row(
      <input
        type="text"
        value={String(value ?? '')}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, opacity: disabled ? 0.65 : 1 }}
      />,
    );
  }

  return null;
};

const Rows: React.FC<{ rows: AnyNode[] }> = ({ rows }) => (
  <>
    {rows.map((r, i) => {
      if (!r || typeof r !== 'object') return null;
      if (Array.isArray(r.fields)) {
        return (
          <div key={i} style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
            {r.fields.map((f: AnyNode, j: number) => (
              <div key={j} style={{ flex: '1 1 220px', minWidth: 0 }}>
                <SchemaNode node={f} />
              </div>
            ))}
          </div>
        );
      }
      return <SchemaNode key={i} node={r} />;
    })}
  </>
);

const Columns: React.FC<{ node: AnyNode }> = ({ node }) => {
  const widths: number[] | undefined = node.column_widths;
  const cols: AnyNode[] = node.columns;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: widths && widths.length === cols.length
          ? widths.map((w: number) => `${w}px`).join(' ')
          : `repeat(${cols.length}, minmax(0, 1fr))`,
        gap: '10px',
        marginBottom: '8px',
      }}
    >
      {cols.map((c, i) => (
        <SchemaNode key={i} node={c} />
      ))}
    </div>
  );
};

const Tabs: React.FC<{ tabs: AnyNode[] }> = ({ tabs }) => {
  const [active, setActive] = React.useState(0);
  if (tabs.length === 0) return null;
  const current = tabs[Math.min(active, tabs.length - 1)];
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            style={{
              padding: '5px 10px',
              border: 'none',
              borderBottom: i === active ? '2px solid var(--accent-osdag)' : '2px solid transparent',
              background: 'transparent',
              color: i === active ? 'var(--accent-osdag)' : 'var(--text-sub)',
              fontWeight: i === active ? 700 : 500,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {t.label ?? `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      <SchemaNode node={current?.schema ?? current} />
    </div>
  );
};

export const SchemaNode: React.FC<{ node: AnyNode }> = ({ node }) => {
  if (node == null || node === false) return null;
  if (Array.isArray(node)) {
    return (
      <>
        {node.map((n, i) => (
          <SchemaNode key={i} node={n} />
        ))}
      </>
    );
  }
  if (typeof node !== 'object') return null;

  // Adaptive: pick the variant for the controller field's current value.
  if (String(node.type).toLowerCase() === 'adaptive') {
    return <AdaptiveField node={node} />;
  }

  // Leaf field (has a type) — including notices/descriptions with no id.
  if (node.type) {
    const t = String(node.type).toLowerCase();
    const containerTypes = ['columns', 'tabs', 'panel'];
    if (!containerTypes.includes(t)) {
      return <SchemaInput node={node} />;
    }
  }

  // Disabled subtree: propagate the flag to every descendant.
  if (node.disable === true || node.disabled === true) {
    const rest = { ...node };
    delete rest.disable;
    delete rest.disabled;
    return (
      <DisabledContext.Provider value={true}>
        <SchemaNode node={rest} />
      </DisabledContext.Provider>
    );
  }

  if (Array.isArray(node.tabs)) return <Tabs tabs={node.tabs} />;
  if (Array.isArray(node.columns)) return <Columns node={node} />;

  if (Array.isArray(node.cards)) {
    return (
      <>
        {node.cards.map((c: AnyNode, i: number) => (
          <div key={i} style={{ border: '1px solid var(--accent-osdag)', borderRadius: '5px', padding: '10px', marginBottom: '10px' }}>
            {c.title && <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>{c.title}</div>}
            <SchemaNode node={c.schema ?? c} />
          </div>
        ))}
      </>
    );
  }

  if (Array.isArray(node.sections)) {
    return (
      <>
        {node.sections.map((s: AnyNode, i: number) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            {s.title && <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '6px' }}>{s.title}</div>}
            <SchemaNode node={s.schema ?? s} />
          </div>
        ))}
      </>
    );
  }

  if (Array.isArray(node.rows)) return <Rows rows={node.rows} />;

  if (node.schema !== undefined) return <SchemaNode node={node.schema} />;

  // Generic container: recurse through every child object/array, skipping
  // configuration-only keys. Covers header/primary_fields/content/cards layouts
  // and the result-dialog schemas (properties_card, global_bar, ...).
  const SKIP = new Set([
    'layout', 'window', 'controller', 'modes', 'items', 'widget_class', 'widget_props',
    'validator', 'validators', 'decimals', 'refresh', 'path', 'bind_mode', 'bind_value',
    'count_id', 'count_choices', 'alternating_rows', 'show_vertical_header',
    'filler_column_index', 'resize', 'scroll', 'col_span', 'row_span', 'on_change',
    'on_change_compute', 'on_editing_finished', 'on_click', 'on_mode_change',
    'on_count_change', 'on_row_select', 'on_data_changed', 'on_selected', 'on_accepted',
    'mode_choices', 'enabled_choices', 'choices', 'disabled_options', 'column_widths',
    'label_width', 'label_first', 'field_width', 'stretch', 'top_margin', 'suffix',
    'precision', 'unit', 'default', 'default_checked', 'required', 'read_only',
    'function', 'optimizable', 'optimized', 'custom', 'cad', 'sections',
  ]);

  const entries = Object.entries(node).filter(
    ([k, v]) => !SKIP.has(k) && v !== null && typeof v === 'object',
  );
  if (entries.length > 0) {
    return (
      <>
        {entries.map(([k, v]) => (
          <SchemaNode key={k} node={v} />
        ))}
      </>
    );
  }

  return null;
};

export const AdditionalInputsSchema: React.FC<{ schema: AnyNode }> = ({ schema }) => (
  <SchemaNode node={schema} />
);

/** Collect every field id referenced by a schema subtree (for Defaults). */
export function collectFieldIds(node: AnyNode, out: Set<string> = new Set()): Set<string> {
  if (node == null || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((n) => collectFieldIds(n, out));
    return out;
  }
  if (typeof node.id === 'string') out.add(node.id);
  if (node.modes && typeof node.modes === 'object') {
    Object.values(node.modes).forEach((m) => collectFieldIds(m, out));
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'modes') continue;
    if (v && typeof v === 'object') collectFieldIds(v, out);
  }
  return out;
}
