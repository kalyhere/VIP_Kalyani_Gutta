import { useEffect, useRef } from "react";
import "./ECGMonitor.css";

const ECGMonitor = ({ heartRate = 85 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const xOffsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // ECG waveform parameters based on heart rate
    const beatDuration = (60 / heartRate) * 1000; // ms per beat
    const pixelsPerMs = width / 2000; // scroll speed

    // ECG complex points (normalized 0-1)
    const generateECGComplex = (baseX, amplitude = 1) => {
      const points = [];
      const complexWidth = beatDuration * pixelsPerMs;

      // P wave (atrial depolarization)
      for (let i = 0; i < complexWidth * 0.1; i++) {
        const x = baseX + i;
        const pWaveY = height / 2 - Math.sin((i / (complexWidth * 0.1)) * Math.PI) * 3 * amplitude;
        points.push({ x, y: pWaveY });
      }

      // PR segment (flat)
      for (let i = 0; i < complexWidth * 0.1; i++) {
        const x = baseX + complexWidth * 0.1 + i;
        points.push({ x, y: height / 2 });
      }

      // QRS complex (ventricular depolarization)
      const qrsStart = baseX + complexWidth * 0.2;

      // Q wave (small downward)
      for (let i = 0; i < complexWidth * 0.02; i++) {
        const x = qrsStart + i;
        const qY = height / 2 + 2 * amplitude;
        points.push({ x, y: qY });
      }

      // R wave (sharp upward spike)
      for (let i = 0; i < complexWidth * 0.04; i++) {
        const x = qrsStart + complexWidth * 0.02 + i;
        const progress = i / (complexWidth * 0.04);
        const rY = height / 2 - Math.sin(progress * Math.PI) * 20 * amplitude;
        points.push({ x, y: rY });
      }

      // S wave (downward)
      for (let i = 0; i < complexWidth * 0.02; i++) {
        const x = qrsStart + complexWidth * 0.06 + i;
        const sY = height / 2 + 4 * amplitude;
        points.push({ x, y: sY });
      }

      // ST segment (slight elevation/flat)
      for (let i = 0; i < complexWidth * 0.12; i++) {
        const x = qrsStart + complexWidth * 0.08 + i;
        points.push({ x, y: height / 2 - 1 });
      }

      // T wave (ventricular repolarization)
      const tStart = qrsStart + complexWidth * 0.2;
      for (let i = 0; i < complexWidth * 0.15; i++) {
        const x = tStart + i;
        const tY = height / 2 - Math.sin((i / (complexWidth * 0.15)) * Math.PI) * 6 * amplitude;
        points.push({ x, y: tY });
      }

      // Baseline until next beat
      for (let i = 0; i < complexWidth * 0.35; i++) {
        const x = tStart + complexWidth * 0.15 + i;
        points.push({ x, y: height / 2 });
      }

      return points;
    };

    const animate = () => {
      // Clear with fade effect for trailing
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Grid (subtle)
      ctx.strokeStyle = 'rgba(0, 80, 0, 0.3)';
      ctx.lineWidth = 0.5;

      // Vertical grid lines
      for (let x = 0; x < width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw ECG waveform
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const complexWidth = beatDuration * pixelsPerMs;

      // Draw multiple complexes across the screen
      for (let beatNum = -1; beatNum < 4; beatNum++) {
        const baseX = (beatNum * complexWidth - xOffsetRef.current) % (width + complexWidth);
        if (baseX > -complexWidth && baseX < width) {
          const amplitude = 0.9 + Math.random() * 0.2; // Slight variation
          const points = generateECGComplex(baseX, amplitude);

          ctx.beginPath();
          points.forEach((point, idx) => {
            if (point.x >= 0 && point.x <= width) {
              if (idx === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            }
          });
          ctx.stroke();
        }
      }

      // Update offset for scrolling
      xOffsetRef.current += 2; // Scroll speed
      if (xOffsetRef.current > complexWidth) {
        xOffsetRef.current -= complexWidth;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [heartRate]);

  return (
    <div className="ecg-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="ecg-canvas"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default ECGMonitor;
