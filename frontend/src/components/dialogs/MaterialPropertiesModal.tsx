import React, { useMemo, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { X, Info, Plus } from 'lucide-react';
import { validateMaterialInput } from '../../utils/validation';

/**
 * Web port of osdagbridge.desktop.ui.dialogs.material_properties.MaterialPropertiesDialog.
 *
 * Two modes, mirroring the desktop:
 *  - read-only "Material Information" — shows the resolved grade properties.
 *  - editable "Enter Custom Properties" — numeric fields with live E/G/Poisson
 *    coupling (steel), an ECM aggregate-factor selector (concrete) and an
 *    auto-derived custom material name; "Add" registers the material.
 */

interface MaterialSpec {
  grade: string;
  type: 'Steel' | 'Concrete';
  properties: Record<string, string>;
}

/**
 * Material lookup table keyed by grade name as stored in the desktop
 * SQLite database (Steel_Grade_Properties / Concrete_Grade_Properties).
 * Keys MUST match what the material dropdowns in the schema produce.
 */
const MATERIAL_DATABASE: Record<string, MaterialSpec> = {
  // ── Steel grades (IS 2062:2011) ──
  'E 250A':  { grade: 'E 250A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '250 MPa', 'Ultimate Tensile Strength (fu)': '410 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 250B0': { grade: 'E 250B0', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '250 MPa', 'Ultimate Tensile Strength (fu)': '410 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 250BR': { grade: 'E 250BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '250 MPa', 'Ultimate Tensile Strength (fu)': '410 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 250C':  { grade: 'E 250C',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '250 MPa', 'Ultimate Tensile Strength (fu)': '410 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 275A':  { grade: 'E 275A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '275 MPa', 'Ultimate Tensile Strength (fu)': '430 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 275B0': { grade: 'E 275B0', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '275 MPa', 'Ultimate Tensile Strength (fu)': '430 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 275BR': { grade: 'E 275BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '275 MPa', 'Ultimate Tensile Strength (fu)': '430 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 275C':  { grade: 'E 275C',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '275 MPa', 'Ultimate Tensile Strength (fu)': '430 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 300A':  { grade: 'E 300A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '300 MPa', 'Ultimate Tensile Strength (fu)': '440 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 300B0': { grade: 'E 300B0', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '300 MPa', 'Ultimate Tensile Strength (fu)': '440 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 300BR': { grade: 'E 300BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '300 MPa', 'Ultimate Tensile Strength (fu)': '440 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 300C':  { grade: 'E 300C',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '300 MPa', 'Ultimate Tensile Strength (fu)': '440 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 350A':  { grade: 'E 350A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '350 MPa', 'Ultimate Tensile Strength (fu)': '490 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 350B0': { grade: 'E 350B0', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '350 MPa', 'Ultimate Tensile Strength (fu)': '490 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 350BR': { grade: 'E 350BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '350 MPa', 'Ultimate Tensile Strength (fu)': '490 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 350C':  { grade: 'E 350C',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '350 MPa', 'Ultimate Tensile Strength (fu)': '490 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 410A':  { grade: 'E 410A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '410 MPa', 'Ultimate Tensile Strength (fu)': '540 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 410B0': { grade: 'E 410B0', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '410 MPa', 'Ultimate Tensile Strength (fu)': '540 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 410BR': { grade: 'E 410BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '410 MPa', 'Ultimate Tensile Strength (fu)': '540 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 410C':  { grade: 'E 410C',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '410 MPa', 'Ultimate Tensile Strength (fu)': '540 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 450A':  { grade: 'E 450A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '450 MPa', 'Ultimate Tensile Strength (fu)': '570 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 450BR': { grade: 'E 450BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '450 MPa', 'Ultimate Tensile Strength (fu)': '570 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 550A':  { grade: 'E 550A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '550 MPa', 'Ultimate Tensile Strength (fu)': '650 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 550BR': { grade: 'E 550BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '550 MPa', 'Ultimate Tensile Strength (fu)': '650 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 600A':  { grade: 'E 600A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '600 MPa', 'Ultimate Tensile Strength (fu)': '700 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 600BR': { grade: 'E 600BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '600 MPa', 'Ultimate Tensile Strength (fu)': '700 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 650A':  { grade: 'E 650A',  type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '650 MPa', 'Ultimate Tensile Strength (fu)': '750 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  'E 650BR': { grade: 'E 650BR', type: 'Steel', properties: { Standard: 'IS 2062:2011', 'Yield Strength (fy)': '650 MPa', 'Ultimate Tensile Strength (fu)': '750 MPa', 'Modulus of Elasticity (E)': '200 GPa', "Poisson's Ratio (ν)": '0.30', 'Density (ρ)': '7850 kg/m³', 'Thermal Expansion (α)': '12 × 10⁻⁶ /°C' } },
  // ── Concrete grades (IRC 112 / IS 456) ──
  'M15': { grade: 'M15', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '15 MPa', 'Mean Axial Tensile Strength (fctm)': '1.6 MPa', 'Secant Modulus of Elasticity (Ecm)': '27.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M20': { grade: 'M20', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '20 MPa', 'Mean Axial Tensile Strength (fctm)': '1.9 MPa', 'Secant Modulus of Elasticity (Ecm)': '29.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M25': { grade: 'M25', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '25 MPa', 'Mean Axial Tensile Strength (fctm)': '2.2 MPa', 'Secant Modulus of Elasticity (Ecm)': '30.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M30': { grade: 'M30', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '30 MPa', 'Mean Axial Tensile Strength (fctm)': '2.5 MPa', 'Secant Modulus of Elasticity (Ecm)': '31.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M35': { grade: 'M35', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '35 MPa', 'Mean Axial Tensile Strength (fctm)': '2.8 MPa', 'Secant Modulus of Elasticity (Ecm)': '32.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M40': { grade: 'M40', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '40 MPa', 'Mean Axial Tensile Strength (fctm)': '3.1 MPa', 'Secant Modulus of Elasticity (Ecm)': '33.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M45': { grade: 'M45', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '45 MPa', 'Mean Axial Tensile Strength (fctm)': '3.4 MPa', 'Secant Modulus of Elasticity (Ecm)': '34.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M50': { grade: 'M50', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '50 MPa', 'Mean Axial Tensile Strength (fctm)': '3.7 MPa', 'Secant Modulus of Elasticity (Ecm)': '35.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M55': { grade: 'M55', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '55 MPa', 'Mean Axial Tensile Strength (fctm)': '4.0 MPa', 'Secant Modulus of Elasticity (Ecm)': '36.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M60': { grade: 'M60', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '60 MPa', 'Mean Axial Tensile Strength (fctm)': '4.2 MPa', 'Secant Modulus of Elasticity (Ecm)': '37.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M65': { grade: 'M65', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '65 MPa', 'Mean Axial Tensile Strength (fctm)': '4.5 MPa', 'Secant Modulus of Elasticity (Ecm)': '38.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M70': { grade: 'M70', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '70 MPa', 'Mean Axial Tensile Strength (fctm)': '4.8 MPa', 'Secant Modulus of Elasticity (Ecm)': '39.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M75': { grade: 'M75', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '75 MPa', 'Mean Axial Tensile Strength (fctm)': '5.0 MPa', 'Secant Modulus of Elasticity (Ecm)': '40.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M80': { grade: 'M80', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '80 MPa', 'Mean Axial Tensile Strength (fctm)': '5.2 MPa', 'Secant Modulus of Elasticity (Ecm)': '41.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M85': { grade: 'M85', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '85 MPa', 'Mean Axial Tensile Strength (fctm)': '5.5 MPa', 'Secant Modulus of Elasticity (Ecm)': '42.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
  'M90': { grade: 'M90', type: 'Concrete', properties: { Standard: 'IRC 112 / IS 456', 'Characteristic Compressive Strength (fck)': '90 MPa', 'Mean Axial Tensile Strength (fctm)': '5.7 MPa', 'Secant Modulus of Elasticity (Ecm)': '43.0 GPa', "Poisson's Ratio (ν)": '0.20', 'Density (ρ)': '2500 kg/m³', 'Thermal Expansion (α)': '10 × 10⁻⁶ /°C' } },
};



interface FieldDef {
  key: string;
  label: string;
  unit: string;
  def: number;
}

const STEEL_FIELDS: FieldDef[] = [
  { key: 'density', label: 'Weight Density (γ)', unit: 'kN/m³', def: 78.5 },
  { key: 'fy', label: 'Yield Strength (fy)', unit: 'MPa', def: 250 },
  { key: 'fu', label: 'Ultimate Tensile Strength (fu)', unit: 'MPa', def: 410 },
  { key: 'E', label: 'Modulus of Elasticity (E)', unit: 'GPa', def: 200 },
  { key: 'G', label: 'Shear Modulus (G)', unit: 'GPa', def: 76.9 },
  { key: 'poisson', label: "Poisson's Ratio (ν)", unit: '', def: 0.3 },
  { key: 'thermal', label: 'Coefficient of Thermal Expansion (α)', unit: '×10⁻⁶/°C', def: 11.7 },
];

const CONCRETE_FIELDS: FieldDef[] = [
  { key: 'density', label: 'Weight Density (γ)', unit: 'kN/m³', def: 25 },
  { key: 'fck', label: 'Characteristic Compressive Strength (fck)', unit: 'MPa', def: 35 },
  { key: 'fctm', label: 'Mean Axial Tensile Strength (fctm)', unit: 'MPa', def: 3.2 },
  { key: 'Ecm', label: 'Secant Modulus of Elasticity (Ecm)', unit: 'GPa', def: 31.2 },
  { key: 'thermal', label: 'Coefficient of Thermal Expansion (α)', unit: '×10⁻⁶/°C', def: 11.7 },
];

const ECM_FACTOR_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Quartzite/granite aggregates = 1', value: 1.0 },
  { label: 'Limestone aggregates = 0.9', value: 0.9 },
  { label: 'Sandstone aggregates = 0.7', value: 0.7 },
  { label: 'Basalt aggregates = 1.2', value: 1.2 },
  { label: 'Custom', value: null },
];

function defaultsFor(memberType: 'Steel' | 'Concrete'): Record<string, string> {
  const fields = memberType === 'Concrete' ? CONCRETE_FIELDS : STEEL_FIELDS;
  return fields.reduce<Record<string, string>>((acc, f) => {
    acc[f.key] = String(f.def);
    return acc;
  }, {});
}

function normalizeToken(text: string): string {
  const v = text.trim();
  if (!v) return '';
  const num = Number(v);
  if (Number.isNaN(num)) return v;
  return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(4)));
}

export const MaterialPropertiesModal: React.FC = () => {
  const {
    isMaterialInfoOpen,
    materialInfoKey,
    materialInfoReadOnly,
    closeMaterialInfo,
    addCustomMaterial,
    showMessageModal,
    inputs,
  } = useBridgeStore();

  const memberType: 'Steel' | 'Concrete' = useMemo(() => {
    const key = materialInfoKey ?? '';
    const selected = String(inputs[key] ?? '');
    if (/concrete|deck/i.test(key) || selected.toLowerCase().startsWith('custom_concrete_')) {
      return 'Concrete';
    }
    return 'Steel';
  }, [materialInfoKey, inputs]);

  const [values, setValues] = useState<Record<string, string>>(() => defaultsFor(memberType));
  const [ecmFactor, setEcmFactor] = useState<string>(ECM_FACTOR_OPTIONS[0].label);
  const [customEcmFactor, setCustomEcmFactor] = useState<string>('1.0');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Re-seed the form each time the dialog is (re)opened, and default the
  // editable values from the currently selected grade when possible.
  React.useEffect(() => {
    if (!isMaterialInfoOpen) {
      setInitialized(false);
      return;
    }
    if (initialized) return;
    const base = defaultsFor(memberType);
    const selected = String(inputs[materialInfoKey ?? ''] ?? '');
    const spec = MATERIAL_DATABASE[selected];
    if (spec) {
      if (spec.type === 'Steel') {
        base.fy = spec.properties['Yield Strength (fy)']?.replace(/[^\d.]/g, '') || base.fy;
        base.fu = spec.properties['Ultimate Tensile Strength (fu)']?.replace(/[^\d.]/g, '') || base.fu;
        base.E = spec.properties['Modulus of Elasticity (E)']?.replace(/[^\d.]/g, '') || base.E;
        base.poisson = spec.properties["Poisson's Ratio (ν)"]?.replace(/[^\d.]/g, '') || base.poisson;
      } else {
        base.fck = spec.properties['Characteristic Compressive Strength (fck)']?.replace(/[^\d.]/g, '') || base.fck;
        base.Ecm = spec.properties['Modulus of Elasticity (Ec)']?.replace(/[^\d.]/g, '') || base.Ecm;
      }
    }
    setValues(base);
    setEcmFactor(ECM_FACTOR_OPTIONS[0].label);
    setCustomEcmFactor('1.0');
    setError(null);
    setInitialized(true);
  }, [isMaterialInfoOpen, initialized, memberType, inputs, materialInfoKey]);

  if (!isMaterialInfoOpen || !materialInfoKey) return null;

  const selectedMaterialName = inputs[materialInfoKey] || '';
  const spec = MATERIAL_DATABASE[selectedMaterialName] || {
    grade: selectedMaterialName || 'Custom Material',
    type: memberType,
    properties: {
      Status: 'User Defined Material Properties',
      Reference: 'Configured via Enter Custom Properties',
    },
  };

  const setField = (key: string, raw: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: raw };
      // Steel E/G/Poisson live coupling (mirrors desktop _handle_user_override).
      if (memberType === 'Steel' && (key === 'E' || key === 'G' || key === 'poisson')) {
        const e = Number(next.E);
        const g = Number(next.G);
        const nu = Number(next.poisson);
        if (key === 'E' && !Number.isNaN(e) && !Number.isNaN(nu)) {
          next.G = (e / (2 * (1 + nu))).toFixed(1);
        } else if (key === 'G' && !Number.isNaN(g) && !Number.isNaN(nu)) {
          next.E = (2 * g * (1 + nu)).toFixed(1);
        } else if (key === 'poisson' && !Number.isNaN(nu)) {
          if (!Number.isNaN(e)) next.G = (e / (2 * (1 + nu))).toFixed(1);
          else if (!Number.isNaN(g)) next.E = (2 * g * (1 + nu)).toFixed(1);
        }
      }
      return next;
    });
  };

  // Focus-out range validation (mirrors desktop _on_material_field_edited)
  const handleFieldBlur = (fieldKey: string) => {
    const raw = values[fieldKey]?.trim() ?? '';
    if (!raw) return;
    const res = validateMaterialInput(fieldKey, raw, memberType);
    if (!res.valid) {
      showMessageModal({
        title: 'Input Error',
        message: res.message || 'Invalid material value.',
        type: 'warning',
      });
      if (res.corrected !== undefined) {
        setField(fieldKey, String(res.corrected));
      }
    }
  };

  const deriveMaterialName = (): string => {
    if (memberType === 'Concrete') {
      const parts = [normalizeToken(values.fck), normalizeToken(values.fctm)].filter(Boolean);
      return `custom_concrete_${parts.join('_')}`;
    }
    const parts = [normalizeToken(values.fy), normalizeToken(values.fu)].filter(Boolean);
    return `custom_steel_${parts.join('_')}`;
  };

  // Mirrors desktop _validate_and_save
  const handleAdd = () => {
    const fields = memberType === 'Concrete' ? CONCRETE_FIELDS : STEEL_FIELDS;
    for (const f of fields) {
      const raw = values[f.key]?.trim() ?? '';
      if (!raw) {
        showMessageModal({
          title: 'Validation Error',
          message: `Please enter a value for ${f.label}.`,
          type: 'critical',
        });
        return;
      }
      if (Number.isNaN(Number(raw))) {
        showMessageModal({
          title: 'Validation Error',
          message: `Please enter a valid number for ${f.label}.`,
          type: 'critical',
        });
        return;
      }
      const res = validateMaterialInput(f.key, raw, memberType);
      if (!res.valid) {
        showMessageModal({
          title: 'Input Error',
          message: res.message || 'Invalid material value.',
          type: 'warning',
        });
        if (res.corrected !== undefined) {
          setField(f.key, String(res.corrected));
        }
        return;
      }
    }
    const properties = fields.reduce<Record<string, number>>((acc, f) => {
      acc[f.key] = Number(values[f.key]);
      return acc;
    }, {});
    const name = deriveMaterialName();
    addCustomMaterial({ name, memberType, properties }, materialInfoKey);
    closeMaterialInfo();
  };

  const applyEcmFactor = (label: string, custom: string) => {
    setEcmFactor(label);
    setCustomEcmFactor(custom);
    const option = ECM_FACTOR_OPTIONS.find((o) => o.label === label);
    const factor = option?.value ?? (Number(custom) || 1.0);
    const base = CONCRETE_FIELDS.find((f) => f.key === 'Ecm')!.def;
    setValues((prev) => ({ ...prev, Ecm: (base * factor).toFixed(1) }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-osdag)',
          borderRadius: '6px',
          width: '560px',
          maxWidth: '94vw',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-grouped)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={17} color="var(--accent-osdag)" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
              {materialInfoReadOnly ? `Material Information — ${spec.grade}` : 'Enter Custom Properties'}
            </span>
          </div>
          <button
            type="button"
            onClick={closeMaterialInfo}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {materialInfoReadOnly ? (
            <>
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  color: 'var(--text-sub)',
                  marginBottom: '10px',
                }}
              >
                {spec.type} Material Specifications
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {Object.entries(spec.properties).map(([prop, val], idx) => (
                    <tr
                      key={prop}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-grouped)' : 'transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-sub)', width: '55%' }}>
                        {prop}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <>
              {/* Material name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ minWidth: '280px', fontSize: '12px', color: 'var(--text-main)' }}>Material</span>
                <input
                  type="text"
                  readOnly
                  value={deriveMaterialName()}
                  aria-label="Custom material name"
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: 'var(--bg-grouped)',
                    color: 'var(--text-sub)',
                    fontSize: '12px',
                  }}
                />
              </div>

              {(memberType === 'Concrete' ? CONCRETE_FIELDS : STEEL_FIELDS).map((f) => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <label htmlFor={`mp-${f.key}`} style={{ minWidth: '280px', fontSize: '12px', color: 'var(--text-main)' }}>
                    {f.label}
                  </label>
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      id={`mp-${f.key}`}
                      type="number"
                      step="any"
                      value={values[f.key] ?? ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      onBlur={() => handleFieldBlur(f.key)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                      }}
                    />
                    {f.unit && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                        {f.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {memberType === 'Concrete' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
                  <label htmlFor="mp-ecm-factor" style={{ minWidth: '280px', fontSize: '12px', color: 'var(--text-main)' }}>
                    Ecm factor (aggregate type)
                  </label>
                  <select
                    id="mp-ecm-factor"
                    value={ecmFactor}
                    onChange={(e) => applyEcmFactor(e.target.value, customEcmFactor)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      background: 'var(--input-bg)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                    }}
                  >
                    {ECM_FACTOR_OPTIONS.map((o) => (
                      <option key={o.label} value={o.label}>{o.label}</option>
                    ))}
                  </select>
                  {ecmFactor === 'Custom' && (
                    <input
                      type="number"
                      step="0.1"
                      value={customEcmFactor}
                      onChange={(e) => applyEcmFactor('Custom', e.target.value)}
                      aria-label="Custom Ecm factor"
                      style={{
                        width: '70px',
                        padding: '6px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                      }}
                    />
                  )}
                </div>
              )}

              {error && (
                <div role="alert" style={{ marginTop: '12px', color: 'var(--danger)', fontSize: '12px' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--bg-grouped)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {materialInfoReadOnly ? (
            <button
              type="button"
              onClick={closeMaterialInfo}
              style={{
                padding: '6px 18px',
                borderRadius: '4px',
                border: 'none',
                background: 'var(--accent-osdag)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => closeMaterialInfo()}
                style={{
                  padding: '6px 16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                style={{
                  padding: '6px 18px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--accent-osdag)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Add
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
