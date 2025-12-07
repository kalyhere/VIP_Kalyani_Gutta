import { useState, useEffect, useRef } from 'react';

/**
 * Simulates realistic vital sign updates with appropriate timing patterns
 * Returns dynamically updating vitals based on physiological patterns
 */
export const useVitalsSimulation = (baseVitals = {}) => {
  // Set default baseline values with proper validation
  const safeParseFloat = (value, fallback) => {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : fallback;
  };

  // Force initial HR to 78 regardless of incoming value
  const defaultHR = 78;
  const defaultRR = safeParseFloat(baseVitals?.breathRate, 17);
  const defaultSpO2 = safeParseFloat(baseVitals?.o2Sat, 98);
  const defaultEtCO2 = safeParseFloat(baseVitals?.etCO2, 35);
  const defaultTemp = safeParseFloat(baseVitals?.temperature, 98.6);
  const defaultPain = safeParseFloat(baseVitals?.painScore, 2);

  // Static anthropometrics
  const defaultHeightCm = safeParseFloat(baseVitals?.height, 160);
  const defaultWeightKg = safeParseFloat(baseVitals?.weight, 55);

  const computeBMI = (heightCm, weightKg) => {
    const heightM = heightCm / 100;
    if (!heightM || heightM <= 0) return 0;
    const bmiVal = weightKg / (heightM * heightM);
    return Math.round(bmiVal * 10) / 10; // one decimal place
  };

  const [vitals, setVitals] = useState({
    // Continuous/streaming vitals
    heartRate: defaultHR,
    respiratoryRate: defaultRR,
    oxygenSaturation: defaultSpO2,
    etCO2: defaultEtCO2,

    // Intermittent vitals
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bloodPressure: '120 / 80',
    bpLastMeasured: new Date(),

    // Slow/manual vitals
    temperature: defaultTemp,
    painScore: defaultPain,
    tempLastUpdated: new Date(),
    painLastUpdated: new Date(),

    // Static anthropometrics
    height: defaultHeightCm,
    weight: defaultWeightKg,
    bmi: computeBMI(defaultHeightCm, defaultWeightKg),

    patientName: baseVitals?.patientName || "Victor Jensen"
  });

  const bpCycleInterval = useRef(null);
  // Initialize buffers with baseline values to prevent initial spikes
  const hrBuffer = useRef(Array(4).fill(defaultHR)); // Reduced buffer size for faster response
  const rrBuffer = useRef(Array(2).fill(defaultRR)); // Reduced buffer size for faster response
  const baselineRef = useRef({ defaultHR, defaultRR, defaultSpO2, defaultEtCO2, defaultTemp });

  // Generate realistic variation around baseline
  const addVariation = (base, range, smoothing = 1) => {
    const variation = (Math.random() - 0.5) * range;
    return base + (variation / smoothing);
  };

  const clamp = (value, min, max = Infinity) => Math.max(min, Math.min(max, value));

  // Heart Rate - updates more rapidly with wider variation
  useEffect(() => {
    const baseline = baselineRef.current.defaultHR;
    const hrInterval = setInterval(() => {
      setVitals(prev => {
        const instantHR = clamp(addVariation(baseline, 18, 1.2), 72); // enforce min on samples

        // Shorter rolling average for faster response
        const nextHrBuffer = [...hrBuffer.current, instantHR];
        if (nextHrBuffer.length > 4) nextHrBuffer.shift();
        hrBuffer.current = nextHrBuffer;

        const avgHR = nextHrBuffer.reduce((a, b) => a + b, 0) / nextHrBuffer.length;

        return {
          ...prev,
          heartRate: Math.max(72, Math.round(avgHR)) // enforce min on output
        };
      });
    }, 800); // Update faster: 800ms instead of 1000ms

    return () => clearInterval(hrInterval);
  }, []);

  // Respiratory Rate - updates more rapidly with wider variation
  useEffect(() => {
    const baseline = baselineRef.current.defaultRR;
    const rrInterval = setInterval(() => {
      setVitals(prev => {
        const instantRR = addVariation(baseline, 6, 1.0); // Wider range, less smoothing

        // Rolling average over last 2 breaths for faster response
        const nextRrBuffer = [...rrBuffer.current, instantRR];
        if (nextRrBuffer.length > 2) nextRrBuffer.shift();
        rrBuffer.current = nextRrBuffer;

        const avgRR = nextRrBuffer.reduce((a, b) => a + b, 0) / nextRrBuffer.length;

        return {
          ...prev,
          respiratoryRate: Math.round(avgRR)
        };
      });
    }, 2500); // Update faster: 2.5s instead of 3.5s

    return () => clearInterval(rrInterval);
  }, []);

  // SpO2 - updates every 1-2s with lag/averaging
  useEffect(() => {
    const baseline = baselineRef.current.defaultSpO2;
    const spo2Interval = setInterval(() => {
      setVitals(prev => {
        const newSpo2 = addVariation(baseline, 2, 3); // Highly smoothed

        return {
          ...prev,
          oxygenSaturation: Math.round(Math.max(95, Math.min(100, newSpo2)))
        };
      });
    }, 1500); // Update every 1.5s

    return () => clearInterval(spo2Interval);
  }, []);

  // EtCO2 - static, no changes
  useEffect(() => {
    const baseline = baselineRef.current.defaultEtCO2;
    // Set once and never update
    setVitals(prev => ({
      ...prev,
      etCO2: Math.round(baseline)
    }));
    
    // No interval - EtCO2 stays constant
  }, []);

  // Blood Pressure - realistic variation within normal range
  useEffect(() => {
    const bpCycle = () => {
      setVitals(prev => {
        const baseSys = 120;
        const baseDia = 80;

        // Normal BP range: 90-120 systolic, 60-80 diastolic
        // Add wider variation but clamp to normal range
        const newSys = Math.round(clamp(addVariation(baseSys, 20, 1.5), 100, 130));
        const newDia = Math.round(clamp(addVariation(baseDia, 14, 1.5), 65, 85));

        return {
          ...prev,
          bloodPressureSystolic: newSys,
          bloodPressureDiastolic: newDia,
          bloodPressure: `${newSys} / ${newDia}`,
          bpLastMeasured: new Date()
        };
      });
    };

    // Initial measurement
    bpCycle();

    // Cycle every 10 seconds
    bpCycleInterval.current = setInterval(bpCycle, 10000);

    return () => {
      if (bpCycleInterval.current) {
        clearInterval(bpCycleInterval.current);
      }
    };
  }, []);

  // Temperature - minimal drift
  useEffect(() => {
    const baseline = baselineRef.current.defaultTemp;
    const tempInterval = setInterval(() => {
      setVitals(prev => {
        const newTemp = addVariation(baseline, 0.1, 8); // Very minimal changes

        return {
          ...prev,
          temperature: newTemp.toFixed(1),
          tempLastUpdated: new Date()
        };
      });
    }, 120000); // Update every 2 minutes (rare updates)

    return () => clearInterval(tempInterval);
  }, []);

  // Format time since last measurement
  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return {
    vitals,
    getTimeSince,
    // Allow manual updates for pain and other values
    updatePainScore: (score) => {
      setVitals(prev => ({
        ...prev,
        painScore: score,
        painLastUpdated: new Date()
      }));
    },
    updateTemperature: (temp) => {
      setVitals(prev => ({
        ...prev,
        temperature: temp,
        tempLastUpdated: new Date()
      }));
    },
    triggerBPMeasurement: () => {
      const baseSys = 120;
      const baseDia = 80;

      const newSys = Math.round(clamp(addVariation(baseSys, 20, 1.5), 100, 130));
      const newDia = Math.round(clamp(addVariation(baseDia, 14, 1.5), 65, 85));

      setVitals(prev => ({
        ...prev,
        bloodPressureSystolic: newSys,
        bloodPressureDiastolic: newDia,
        bloodPressure: `${newSys} / ${newDia}`,
        bpLastMeasured: new Date()
      }));
    }
  };
};
