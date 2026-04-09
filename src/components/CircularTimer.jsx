import { useState, useEffect } from 'react';

export default function CircularTimer({ expiresAt, size = 80, onComplete }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= expiresAt) {
        clearInterval(iv);
        onComplete?.();
      }
    }, 100);
    return () => clearInterval(iv);
  }, [expiresAt, onComplete]);

  const total = expiresAt - (expiresAt - 120000); // rough max
  const remaining = Math.max(0, (expiresAt - now) / 1000);
  const elapsed = Math.max(0, now - (expiresAt - 120000)) / 1000;
  // Calculate as fraction of original duration
  const originalDuration = remaining + elapsed;
  const progress = originalDuration > 0 ? Math.min(elapsed / originalDuration, 1) : 1;

  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  const color = progress < 0.7 ? '#00FFA3' : progress < 0.9 ? '#FFD700' : '#FF6B6B';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size > 60 ? 22 : 16,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#fff',
        }}>
          {Math.ceil(remaining)}s
        </span>
      </div>
    </div>
  );
}
