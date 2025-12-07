import React, { useState, useMemo } from 'react';
import { Settings, X, Eye, EyeOff } from 'lucide-react';
import ECGMonitor from './ECGMonitor';
import { useVitalsSimulation } from './useVitalsSimulation';

// UA Brand Colors matching Physical Exam interface
const uaColors = {
  arizonaRed: '#AB0520',
  arizonaBlue: '#0C234B',
  chili: '#8B0015',
  white: '#FFFFFF',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

// Available vital signs that can be toggled
const availableVitalSigns = [
  { id: 'temperature', label: 'Temperature', unit: '°F', color: '#FF6B35', value: 'temperature' },
  { id: 'heartRate', label: 'Heart Rate', unit: '/min', color: '#2ecc71', value: 'pulse' },
  { id: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', color: '#3498db', value: 'breathRate' },
  { id: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', color: '#e74c3c', value: 'bloodPressure' },
  { id: 'oxygenSaturation', label: 'Oxygen Saturation', unit: '%', color: '#3498db', value: 'o2Sat' },
  { id: 'etCO2', label: 'Et CO₂', unit: 'mmHg', color: '#f1c40f', value: 'etCO2' },
  { id: 'height', label: 'Height', unit: 'cm', color: '#9b59b6', value: 'height' },
  { id: 'weight', label: 'Weight', unit: 'kg', color: '#e67e22', value: 'weight' },
  { id: 'bmi', label: 'BMI', unit: '', color: '#34495e', value: 'bmi' },
  { id: 'painScore', label: 'Pain Score', unit: '/10', color: '#e74c3c', value: 'painScore' },
  { id: 'ecg', label: 'ECG', unit: 'II', color: '#39FF14', value: 'ecg' }
];

const VitalsMonitor = ({ vitals: initialVitals, onClose, hideHeader = false, showSettings = false, onSettingsToggle }) => {
  // Use simulation hook for live vitals
  const { vitals: liveVitals, getTimeSince } = useVitalsSimulation(initialVitals);

  const [internalShowSettings, setInternalShowSettings] = useState(false);
  const [enabledVitals, setEnabledVitals] = useState({
    heartRate: false,
    bloodPressure: false,
    respiratoryRate: false,
    oxygenSaturation: false,
    etCO2: false,
    ecg: false,
    temperature: false,
    height: false,
    weight: false,
    bmi: false,
    painScore: false
  });


  const toggleVitalSign = (vitalId) => {
    setEnabledVitals(prev => ({
      ...prev,
      [vitalId]: !prev[vitalId]
    }));
  };

  const getVitalValue = (vital) => {
    // Map vital IDs to live vitals properties
    const vitalMapping = {
      temperature: 'temperature',
      heartRate: 'heartRate',
      respiratoryRate: 'respiratoryRate',
      bloodPressure: 'bloodPressure',
      oxygenSaturation: 'oxygenSaturation',
      etCO2: 'etCO2',
      height: 'height',
      weight: 'weight',
      bmi: 'bmi',
      painScore: 'painScore'
    };

    const mappedKey = vitalMapping[vital.id];
    const value = mappedKey ? liveVitals[mappedKey] : '--';

    // Check for NaN or invalid values
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return '--';
    }

    return value;
  };

  // Memoize filtered lists to prevent recalculation on every vital update
  const enabledVitalsList = useMemo(
    () => availableVitalSigns.filter(vital => enabledVitals[vital.id]),
    [enabledVitals]
  );
  
  const showECG = enabledVitals.ecg;
  
  // Group anthropometric measurements (height, weight, BMI) together
  const anthropometricVitals = ['height', 'weight', 'bmi'];
  const groupedAnthropometric = useMemo(
    () => enabledVitalsList.filter(vital => anthropometricVitals.includes(vital.id)),
    [enabledVitalsList]
  );
  const otherVitals = useMemo(
    () => enabledVitalsList.filter(vital => !anthropometricVitals.includes(vital.id) && vital.id !== 'ecg'),
    [enabledVitalsList]
  );
  
  const hasAnthropometric = groupedAnthropometric.length > 0;
  const hasAnyVitalsEnabled = enabledVitalsList.length > 0;

  return (
    <div className="monitoring-container">
      {/* Floating Monitoring Panel */}
      <div className="monitor-left-panel">
        <div className="vital-monitors">
            {/* Settings Button - only show if header is not hidden */}
            {!hideHeader && (
              <div className="monitor-settings-header">
                <h3 className="monitor-main-title">Patient Monitoring</h3>
                <button 
                  className="settings-button"
                  onClick={() => {
                    setInternalShowSettings(!internalShowSettings);
                    if (onSettingsToggle) onSettingsToggle(!internalShowSettings);
                  }}
                  title="Configure vital signs"
                >
                  <Settings size={18} />
                </button>
              </div>
            )}

            {/* Settings Panel */}
            {(showSettings || internalShowSettings) && (
              <div className="settings-panel">
                <div className="settings-header">
                  <h4>Configure Vital Signs</h4>
                  <button 
                    className="close-settings"
                    onClick={() => {
                      setInternalShowSettings(false);
                      if (onSettingsToggle) onSettingsToggle(false);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="settings-content">
                  {availableVitalSigns.map(vital => (
                    <div key={vital.id} className="setting-item">
                      <button
                        className={`toggle-button ${enabledVitals[vital.id] ? 'enabled' : 'disabled'}`}
                        onClick={() => toggleVitalSign(vital.id)}
                      >
                        {enabledVitals[vital.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <span className="setting-label">
                        {vital.label}
                      </span>
                      <span className="setting-unit">{vital.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Grid Layout Vitals Monitor */}
            {hasAnyVitalsEnabled && (
              <div className="monitor-box grid-layout" style={{
                position: showSettings ? 'fixed' : 'static',
                top: showSettings ? '244px' : 'auto', // 64px (header) + 180px (settings panel)
                left: showSettings ? '16px' : 'auto',
                width: showSettings ? '300px' : '100%',
                zIndex: 9997
              }}>
                {/* Close button for the display panel */}
                {onClose && (
                  <button
                    className="close-monitor-button"
                    onClick={onClose}
                    title="Close monitor"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#AB0520';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.color = 'inherit';
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
                <div className="vitals-grid">
                  {/* HR, RR, SpO2 Combined - Top Row */}
                  {(enabledVitals.heartRate || enabledVitals.respiratoryRate || enabledVitals.oxygenSaturation) && (
                    <div className="grid-item compact-vitals-item">
                      <div className="compact-vitals-grid">
                        {enabledVitals.heartRate && (
                          <div className="compact-vital">
                            <div className="compact-title">
                              <span className="monitor-label" style={{ color: '#2ecc71' }}>HR</span>
                            </div>
                            <div className="compact-value" style={{ color: '#2ecc71' }}>
                              {getVitalValue(availableVitalSigns.find(v => v.id === 'heartRate'))}
                            </div>
                            <div className="compact-unit">bpm</div>
                          </div>
                        )}
                        {enabledVitals.respiratoryRate && (
                          <div className="compact-vital">
                            <div className="compact-title">
                              <span className="monitor-label" style={{ color: '#3498db' }}>RR</span>
                            </div>
                            <div className="compact-value" style={{ color: '#3498db' }}>
                              {getVitalValue(availableVitalSigns.find(v => v.id === 'respiratoryRate'))}
                            </div>
                            <div className="compact-unit">/min</div>
                          </div>
                        )}
                        {enabledVitals.oxygenSaturation && (
                          <div className="compact-vital">
                            <div className="compact-title">
                              <span className="monitor-label" style={{ color: '#3498db' }}>SpO₂</span>
                            </div>
                            <div className="compact-value" style={{ color: '#3498db' }}>
                              {getVitalValue(availableVitalSigns.find(v => v.id === 'oxygenSaturation'))}
                            </div>
                            <div className="compact-unit">%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Anthropometric Data - Middle Left */}
                  {(enabledVitals.weight || enabledVitals.height || enabledVitals.bmi) && (
                    <div className="grid-item anthropometric-grid-item">
                      <div className="monitor-title">
                        <span className="monitor-label" style={{ color: '#e67e22' }}>{liveVitals.patientName}</span>
                      </div>
                      <div className="anthropometric-grid">
                        {enabledVitals.weight && (
                          <div className="anthro-item">
                            <div className="anthro-value" style={{ color: '#e67e22' }}>
                              {getVitalValue(availableVitalSigns.find(v => v.id === 'weight'))}
                            </div>
                            <div className="anthro-unit">Kg</div>
                          </div>
                        )}
                        {enabledVitals.height && (
                          <div className="anthro-item">
                            <div className="anthro-value" style={{ color: '#9b59b6' }}>
                              {getVitalValue(availableVitalSigns.find(v => v.id === 'height'))}
                            </div>
                            <div className="anthro-unit">cm</div>
                          </div>
                        )}
                        {enabledVitals.bmi && (
                          <div className="anthro-item">
                            <div className="anthro-value" style={{ color: '#34495e' }}>
                              {getVitalValue(availableVitalSigns.find(v => v.id === 'bmi'))}
                            </div>
                            <div className="anthro-unit">kg/m²</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Et CO2 and Blood Pressure Stacked - Middle Center */}
                  {(enabledVitals.etCO2 || enabledVitals.bloodPressure) && (
                    <div className="grid-item stacked-grid-item">
                      {enabledVitals.etCO2 && (
                        <div className="stacked-item">
                          <div className="stacked-title">
                            <span className="monitor-label" style={{ color: '#f1c40f' }}>Et CO₂</span>
                          </div>
                          <div className="stacked-value" style={{ color: '#f1c40f' }}>
                            {getVitalValue(availableVitalSigns.find(v => v.id === 'etCO2'))}
                          </div>
                          <div className="stacked-unit">mmHg</div>
                        </div>
                      )}
                      {enabledVitals.bloodPressure && (
                        <div className="stacked-item">
                          <div className="stacked-title">
                            <span className="monitor-label" style={{ color: '#e74c3c' }}>BP</span>
                            <span className="timestamp"> {getTimeSince(liveVitals.bpLastMeasured)}</span>
                          </div>
                          <div className="stacked-value" style={{ color: '#e74c3c' }}>
                            {getVitalValue(availableVitalSigns.find(v => v.id === 'bloodPressure'))}
                          </div>
                          <div className="stacked-unit">mmHg</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Temperature and Pain Stacked - Middle Right */}
                  {(enabledVitals.temperature || enabledVitals.painScore) && (
                    <div className="grid-item stacked-grid-item">
                      {enabledVitals.temperature && (
                        <div className="stacked-item">
                          <div className="stacked-title">
                            <span className="monitor-label" style={{ color: '#FF6B35' }}>Temp</span>
                            <span className="timestamp"> {getTimeSince(liveVitals.tempLastUpdated)}</span>
                          </div>
                          <div className="stacked-value" style={{ color: '#FF6B35' }}>
                            {getVitalValue(availableVitalSigns.find(v => v.id === 'temperature'))}
                          </div>
                          <div className="stacked-unit">°F</div>
                        </div>
                      )}
                      {enabledVitals.painScore && (
                        <div className="stacked-item">
                          <div className="stacked-title">
                            <span className="monitor-label" style={{ color: '#e74c3c' }}>Pain</span>
                            <span className="timestamp"> {getTimeSince(liveVitals.painLastUpdated)}</span>
                          </div>
                          <div className="stacked-value" style={{ color: '#e74c3c' }}>
                            {getVitalValue(availableVitalSigns.find(v => v.id === 'painScore'))}
                          </div>
                          <div className="stacked-unit">/10</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
                
                {/* ECG Monitor - Full Width Bottom */}
                {enabledVitals.ecg && (
                  <div className="ecg-bottom-container">
                    <div className="ecg-bottom-item">
                      <div className="monitor-title">
                        <span className="monitor-label ecg">ECG</span>
                        <span className="monitor-unit">II</span>
                      </div>
                      <div className="ecg-display-bottom">
                        <ECGMonitor heartRate={liveVitals.heartRate} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>


      <style jsx>{`
        .monitoring-container {
          width: 100%;
          height: 100vh;
          background: transparent;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9998;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .monitor-left-panel {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 326px;
          background: transparent;
          padding: 0;
          overflow-y: auto;
          max-height: calc(100vh - 24px);
          pointer-events: auto;
        }



        .vital-monitors {
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: auto;
          width: 100%;
        }

        .monitor-settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: ${uaColors.white};
          border-radius: 12px;
          padding: 16px 20px;
          border: 1px solid ${uaColors.slate[200]};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .monitor-main-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          letter-spacing: -0.025em;
        }

        .settings-button {
          background: ${uaColors.slate[50]};
          border: 1px solid ${uaColors.slate[200]};
          color: ${uaColors.slate[600]};
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-button:hover {
          color: ${uaColors.arizonaRed};
          background: ${uaColors.slate[100]};
          border-color: ${uaColors.slate[300]};
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

          .settings-panel {
            background: ${uaColors.white};
            border-radius: 0 0 12px 12px;
            padding: 0;
            border: 1px solid ${uaColors.slate[200]};
            border-top: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-height: 180px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 64px;
            left: 16px;
            width: 300px;
            z-index: 9998;
          }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid ${uaColors.slate[200]};
          background: ${uaColors.slate[50]};
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .settings-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          letter-spacing: -0.025em;
        }

        .close-settings {
          background: none;
          border: none;
          color: ${uaColors.slate[500]};
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-settings:hover {
          color: ${uaColors.slate[700]};
          background: ${uaColors.slate[100]};
          transform: translateY(-1px);
        }

        .settings-content {
          padding: 8px 16px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .settings-content::-webkit-scrollbar {
          width: 6px;
        }

        .settings-content::-webkit-scrollbar-track {
          background: ${uaColors.slate[100]};
          border-radius: 3px;
        }

        .settings-content::-webkit-scrollbar-thumb {
          background: ${uaColors.slate[400]};
          border-radius: 3px;
        }

        .settings-content::-webkit-scrollbar-thumb:hover {
          background: ${uaColors.slate[500]};
        }

        .patient-header {
          background: ${uaColors.white};
          border-radius: 12px;
          padding: 16px 20px;
          border: 1px solid ${uaColors.slate[200]};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-align: center;
        }

        .patient-name {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: ${uaColors.arizonaRed};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid ${uaColors.slate[200]};
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .toggle-button {
          background: ${uaColors.white};
          border: 1px solid ${uaColors.slate[300]};
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
        }

        .toggle-button.enabled {
          background: ${uaColors.arizonaRed};
          border-color: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          box-shadow: 0 2px 4px rgba(171, 5, 32, 0.2);
        }

        .toggle-button.disabled {
          background: ${uaColors.slate[100]};
          border-color: ${uaColors.slate[300]};
          color: ${uaColors.slate[500]};
        }

        .toggle-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .toggle-button.enabled:hover {
          box-shadow: 0 4px 12px rgba(171, 5, 32, 0.3);
        }

        .setting-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: ${uaColors.slate[900]};
        }

        .setting-unit {
          font-size: 11px;
          color: ${uaColors.slate[500]};
          min-width: 35px;
          text-align: right;
          font-weight: 500;
        }
        
        .monitor-box {
          background: ${uaColors.white};
          border-radius: 12px;
          padding: 12px;
          border: 1px solid ${uaColors.slate[200]};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

          .monitor-box.grid-layout {
            padding: 6px;
            width: 100%;
            background: ${uaColors.white};
            border-radius: 12px;
            border: 1px solid ${uaColors.slate[200]};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

        .vitals-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto 1fr;
          gap: 4px;
          width: 100%;
        }

        .grid-item {
          background: #2a2a2a;
          border-radius: 6px;
          padding: 4px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          border: 1px solid #3a3a3a;
        }


        .grid-item.anthropometric-grid-item {
          background: #2a2a2a;
        }

        .grid-item.stacked-grid-item {
          background: #2a2a2a;
          padding: 4px;
        }

        .grid-item.compact-vitals-item {
          grid-column: 1 / -1;
          background: #2a2a2a;
          padding: 4px;
        }
        
        .monitor-title {
          font-size: 12px;
          margin-bottom: 4px;
          text-align: left;
        }
        
        .monitor-label {
          font-weight: 600;
          color: ${uaColors.white};
          font-size: 11px;
          text-transform: uppercase;
        }
        
        .monitor-label.ecg {
          color: #39FF14;
          font-size: 14px;
        }
        
        .monitor-unit {
          color: ${uaColors.slate[400]};
          font-size: 10px;
          font-weight: 500;
          text-align: right;
          margin-top: auto;
        }
        
        .monitor-value {
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          margin: auto 0;
          letter-spacing: -0.025em;
        }

        .monitor-value.large {
          font-size: 20px;
          font-weight: 700;
        }

        .monitor-value.bp-value {
          font-size: 14px;
          font-weight: 700;
        }

        .ecg-display-grid {
          background: #000;
          border-radius: 4px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin: 2px 0;
          border: 1px solid #333;
        }

        .ecg-bottom-container {
          margin-top: 4px;
        }

        .ecg-bottom-item {
          background: #1a1a1a;
          border-radius: 6px;
          padding: 6px;
          border: 1px solid #3a3a3a;
        }

        .ecg-display-bottom {
          background: #000;
          border-radius: 4px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin: 4px 0;
          border: 1px solid #333;
          padding: 4px;
          position: relative;
        }

        .ecg-display-bottom > * {
          width: 100%;
          height: 100%;
          max-height: 100%;
          overflow: hidden;
        }

        .bp-units {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .sys-dia {
          color: ${uaColors.slate[400]};
          font-size: 10px;
          font-weight: 500;
        }

        .mmhg {
          color: ${uaColors.slate[400]};
          font-size: 10px;
          font-weight: 500;
        }

        .anthropometric-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 4px 0;
        }

        .anthro-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          padding: 3px 6px;
        }

        .anthro-value {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .anthro-unit {
          font-size: 9px;
          color: ${uaColors.slate[400]};
          font-weight: 500;
        }

        .stacked-item {
          display: flex;
          flex-direction: column;
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          padding: 4px 6px;
          margin-bottom: 3px;
        }

        .stacked-item:last-child {
          margin-bottom: 0;
        }

        .stacked-title {
          font-size: 9px;
          margin-bottom: 2px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }

        .timestamp {
          font-size: 7px;
          color: ${uaColors.slate[500]};
          font-weight: 400;
          opacity: 0.7;
        }

        .stacked-value {
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          margin: 2px 0;
          letter-spacing: -0.025em;
        }

        .stacked-unit {
          font-size: 8px;
          color: ${uaColors.slate[400]};
          font-weight: 500;
          text-align: center;
        }

        .compact-vitals-grid {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 4px;
        }

        .compact-vital {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          padding: 4px 6px;
          flex: 1;
          min-width: 0;
        }

        .compact-title {
          font-size: 10px;
          margin-bottom: 2px;
          text-align: center;
        }

        .compact-value {
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          margin: 2px 0;
          letter-spacing: -0.025em;
        }

        .compact-unit {
          font-size: 8px;
          color: ${uaColors.slate[400]};
          font-weight: 500;
          text-align: center;
        }

        .vital-separator {
          height: 1px;
          background: ${uaColors.slate[200]};
          margin: 16px 0;
        }

        .anthropometric-group {
          margin-bottom: 12px;
        }

        .anthropometric-container {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: space-between;
        }

        .anthropometric-item {
          flex: 1;
          min-width: 70px;
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          background: ${uaColors.slate[50]};
          border: 1px solid ${uaColors.slate[200]};
        }

        .monitor-title.compact {
          margin-bottom: 6px;
          font-size: 12px;
          justify-content: center;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .monitor-value.compact {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 0;
          letter-spacing: -0.025em;
        }
        
        .ecg-display {
          background: ${uaColors.slate[900]};
          border-radius: 8px;
          height: 100px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid ${uaColors.slate[700]};
        }
        
        @media (max-width: 768px) {
          .monitor-left-panel {
            width: calc(100vw - 24px);
            max-height: 220px;
          }
        }
      `}</style>
    </div>
  );
};

export default VitalsMonitor; 