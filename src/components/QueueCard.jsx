import { useState, useCallback } from 'react';
import CircularTimer from './CircularTimer';

const mono = "'JetBrains Mono', monospace";

export default function QueueCard({ entry, onCancel, onSend }) {
  const [ready, setReady] = useState(entry.status === 'ready');

  const handleComplete = useCallback(() => setReady(true), []);

  const isQueued = entry.status === 'queued' && !ready;
  const isReady = ready || entry.status === 'ready';
  const isSent = entry.status === 'sent';

  return (
    <div style={{
      background: isReady
        ? 'linear-gradient(135deg, rgba(0,255,163,0.06), rgba(0,255,163,0.02))'
        : isSent
        ? 'rgba(255,255,255,0.01)'
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isReady ? 'rgba(0,255,163,0.25)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 16, padding: 20,
      display: 'flex', alignItems: 'center', gap: 18,
      transition: 'all 0.4s ease',
      opacity: isSent ? 0.5 : 1,
    }}>
      {isQueued && (
        <CircularTimer expiresAt={entry.expiresAt} size={72} onComplete={handleComplete} />
      )}

      {isReady && (
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(0,255,163,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>✓</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{entry.type}</span>
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: isReady ? 'rgba(0,255,163,0.12)' : isQueued ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
            color: isReady ? '#00FFA3' : isQueued ? '#FFD700' : 'rgba(255,255,255,0.3)',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {isSent ? 'Sent' : isReady ? 'Ready' : `Waiting ${entry.tier.label}`}
          </span>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
          {entry.amount} SOL → {typeof entry.to === 'string' ? entry.to.slice(0, 4) + '••' + entry.to.slice(-4) : 'Recipient'}
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: mono }}>
            Fee: <span style={{ textDecoration: 'line-through' }}>{entry.savings.baseCostSol.toFixed(6)}</span>
          </span>
          <span style={{ color: '#00FFA3', fontWeight: 600, fontFamily: mono }}>
            → {entry.savings.discountedCostSol.toFixed(6)} SOL ({entry.tier.discount}% off)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isReady && !isSent && (
          <button onClick={() => onSend?.(entry.id)} style={{
            background: 'linear-gradient(135deg, #00FFA3, #00D68F)', border: 'none',
            color: '#060b16', padding: '8px 18px', borderRadius: 10,
            cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
          }}>Send Now</button>
        )}
        {isQueued && (
          <button onClick={() => onCancel?.(entry.id)} style={{
            background: 'none', border: '1px solid rgba(255,107,107,0.25)',
            color: '#FF6B6B', padding: '6px 14px', borderRadius: 10,
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
          }}>Cancel</button>
        )}
      </div>
    </div>
  );
}
