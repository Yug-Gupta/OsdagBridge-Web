import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { apiClient } from '../../services/api';
import { LocationData } from '../../types/location';
import { X, MapPin, Check, Wind, Activity, Thermometer } from 'lucide-react';

export const ProjectLocationModal: React.FC = () => {
  const { isLocationModalOpen, setLocationModalOpen, setLocation, location, showMessageModal } = useBridgeStore();

  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [stations, setStations] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [locationDetails, setLocationDetails] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLocationModalOpen) {
      apiClient.get('/location/states').then((res) => {
        setStates(res.data.states);
        if (res.data.states.length > 0 && !selectedState) {
          setSelectedState(res.data.states[0]);
        }
      }).catch(() => {
        // Mock fallback
        const mockStates = ['Maharashtra', 'Gujarat'];
        setStates(mockStates);
        if (!selectedState) setSelectedState(mockStates[0]);
      });
    }
  }, [isLocationModalOpen]);

  useEffect(() => {
    if (selectedState) {
      apiClient.get(`/location/stations?state=${encodeURIComponent(selectedState)}`).then((res) => {
        setStations(res.data.stations);
        if (res.data.stations.length > 0) {
          setSelectedStation(res.data.stations[0]);
        }
      }).catch(() => {
        // Mock fallback
        const mockStations = selectedState === 'Maharashtra' ? ['Mumbai', 'Pune'] : ['Ahmedabad', 'Surat'];
        setStations(mockStations);
        setSelectedStation(mockStations[0]);
      });
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedState && selectedStation) {
      setLoading(true);
      apiClient
        .get(`/location/details?state=${encodeURIComponent(selectedState)}&station=${encodeURIComponent(selectedStation)}`)
        .then((res) => {
          setLocationDetails(res.data);
          setLoading(false);
        })
        .catch(() => {
          // Mock fallback
          setLocationDetails({
            state: selectedState,
            station: selectedStation,
            basic_wind_speed: 44,
            seismic_zone: "III",
            max_temperature: 40,
            min_temperature: 10
          });
          setLoading(false);
        });
    }
  }, [selectedState, selectedStation]);

  if (!isLocationModalOpen) return null;

  // Desktop faithful validate_and_save (mirrors project_location.py lines 669-693)
  const handleApply = () => {
    if (!locationDetails) {
      showMessageModal({
        title: 'Incomplete Data',
        message: 'Please select a location either on the map or from the dropdown menu.',
        type: 'warning',
      });
      return;
    }

    const missing: string[] = [];
    if (!locationDetails.basic_wind_speed && locationDetails.basic_wind_speed !== 0) {
      missing.push('Wind Speed');
    }
    if (!locationDetails.seismic_zone) {
      missing.push('Seismic Zone');
    }
    if (locationDetails.max_temperature === undefined || locationDetails.min_temperature === undefined) {
      missing.push('Temperature');
    }

    if (missing.length > 0) {
      showMessageModal({
        title: 'Incomplete Data',
        message: `Missing data: ${missing.join(', ')}.\nPlease select a different location or use Custom Data to enter values manually.`,
        type: 'warning',
      });
      return;
    }

    setLocation(locationDetails);
    setLocationModalOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--overlay-bg)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '8px',
        width: '540px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-grouped)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--accent-osdag)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Project Location & Weather Details</h3>
          </div>
          <button
            onClick={() => setLocationModalOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--input-bg)', color: 'var(--text-main)' }}
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                District / Station
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--input-bg)', color: 'var(--text-main)' }}
              >
                {stations.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Environmental Parameters Card */}
          <div style={{ background: 'var(--bg-grouped)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '16px' }}>
            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '12px' }}>
              IRC:6 Environmental Constraints
            </h4>

            {locationDetails ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wind size={20} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Basic Wind Speed (V_b)</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {locationDetails.basic_wind_speed} m/s
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={20} color="#dc2626" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Seismic Zone</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      {locationDetails.seismic_zone}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Thermometer size={20} color="#ea580c" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Temperature</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {locationDetails.max_temperature} °C
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Thermometer size={20} color="#0d9488" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min Temperature</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {locationDetails.min_temperature} °C
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading location data...</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          background: 'var(--bg-grouped)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={() => setLocationModalOpen(false)}
            style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '12px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '6px 18px',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--accent-osdag)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} /> Apply Location
          </button>
        </div>
      </div>
    </div>
  );
};
