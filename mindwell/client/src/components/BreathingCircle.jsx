import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// 4-7-8 technique: inhale 4s, hold 7s, exhale 8s
const PHASES = [
  { label: 'Inhale', seconds: 4, scale: 1.55 },
  { label: 'Hold', seconds: 7, scale: 1.55 },
  { label: 'Exhale', seconds: 8, scale: 1 },
];
const CYCLE = PHASES.reduce((sum, p) => sum + p.seconds, 0);

export default function BreathingCircle() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Derive the current phase from total elapsed seconds
  const pos = elapsed % CYCLE;
  let acc = 0;
  let phase = PHASES[0];
  let left = PHASES[0].seconds;
  for (const p of PHASES) {
    if (pos < acc + p.seconds) {
      phase = p;
      left = p.seconds - (pos - acc);
      break;
    }
    acc += p.seconds;
  }
  const cycles = Math.floor(elapsed / CYCLE);

  const toggle = () => {
    if (running) setElapsed(0);
    setRunning((r) => !r);
  };

  const animate = running ? { scale: phase.scale } : { scale: 1 };
  const duration = running ? (phase.label === 'Hold' ? 0 : phase.seconds) : 0.8;

  return (
    <div className="breathe">
      <div className="orb-stage">
        <div className="orb-ring" />
        <motion.div
          className="orb"
          animate={animate}
          transition={{ duration, ease: 'easeInOut' }}
        />
        <div className="orb-text" aria-live="polite">
          {running ? (
            <>
              <strong>{phase.label}</strong>
              <span>{left}</span>
            </>
          ) : (
            <strong>Ready</strong>
          )}
        </div>
      </div>

      <p className="muted">
        {running ? `Cycle ${cycles + 1}` : 'Inhale for 4 seconds, hold for 7, exhale for 8.'}
      </p>
      <button className="btn primary" onClick={toggle}>
        {running ? 'Stop' : 'Begin'}
      </button>
    </div>
  );
}
