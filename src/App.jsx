import { useState, useEffect, useCallback } from 'react';
import { useSolflare } from './hooks/useSolflare';
import { QUEUE_TIERS, buildQueuedTransaction, createQueueEntry } from './utils/queue';
import QueueCard from './components/QueueCard';
import clockLogo from './assets/clock-logo.svg';

const mono = "'JetBrains Mono', monospace";
const display = "'Outfit', sans-serif";

// Demo recipient for devnet testing
const DEMO_RECIPIENT = '11111111111111111111111111111112';

export default function App() {
  const {
    connected, connecting, publicKey, balance, error,
    shortenedAddress, connect, disconnect,
    signTransaction, signAndSendTransaction, connection,
  } = useSolflare();

  const [tab, setTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedTier, setSelectedTier] = useState(1);
  const [sendAmount, setSendAmount] = useState('0.001');
  const [sendTo, setSendTo] = useState(DEMO_RECIPIENT);
  const [networkLoad, setNetworkLoad] = useState(68);
  const [sending, setSending] = useState(false);
  const [airdropping, setAirdropping] = useState(false);

  const handleAirdrop = useCallback(async () => {
    if (!publicKey) return;
    setAirdropping(true);
    try {
      const sig = await connection.requestAirdrop(publicKey, 1_000_000_000);
      await connection.confirmTransaction(sig);
    } catch (e) {
      console.error('Airdrop error:', e);
      alert('Airdrop failed: ' + (e.message || 'Unknown error'));
    } finally {
      setAirdropping(false);
    }
  }, [publicKey, connection]);

  // Simulate network load
  useEffect(() => {
    const iv = setInterval(() => setNetworkLoad(55 + Math.floor(Math.random() * 35)), 4000);
    return () => clearInterval(iv);
  }, []);

  // Stats
  const totalSaved = [...history, ...queue].reduce((s, e) => s + (e.savings?.savedSol || 0), 0);
  const totalQueued = history.length + queue.length;

  const handleQueue = useCallback(async () => {
    if (!publicKey) return;
    setSending(true);

    try {
      const { blockhash } = await connection.getLatestBlockhash();
      const { transaction, baseFee, discountedFee, discount, tier } = buildQueuedTransaction({
        fromPubkey: publicKey,
        toPubkey: sendTo || DEMO_RECIPIENT,
        amountSol: parseFloat(sendAmount) || 0.001,
        recentBlockhash: blockhash,
        tierIndex: selectedTier,
      });

      // Sign the transaction now (but don't send yet — that's the whole point)
      const signed = await signTransaction(transaction);

      const entry = createQueueEntry({
        id: Date.now().toString(),
        type: 'SOL Transfer',
        from: shortenedAddress,
        to: sendTo || DEMO_RECIPIENT,
        amount: sendAmount,
        tierIndex: selectedTier,
        transaction: signed,
      });

      setQueue(prev => [entry, ...prev]);
      setShowNew(false);
    } catch (e) {
      console.error('Queue error:', e);
      alert('Error: ' + (e.message || 'Failed to sign transaction'));
    } finally {
      setSending(false);
    }
  }, [publicKey, connection, signTransaction, selectedTier, sendAmount, sendTo, shortenedAddress]);

  const handleSend = useCallback(async (id) => {
    const entry = queue.find(e => e.id === id);
    if (!entry?.transaction) return;

    try {
      // Re-fetch blockhash since the original may have expired
      const { blockhash } = await connection.getLatestBlockhash();
      entry.transaction.recentBlockhash = blockhash;

      const sig = await signAndSendTransaction(entry.transaction);
      console.log('Sent:', sig);

      setQueue(prev => prev.filter(e => e.id !== id));
      setHistory(prev => [{ ...entry, status: 'sent', signature: sig, sentAt: Date.now() }, ...prev]);
    } catch (e) {
      console.error('Send error:', e);
      alert('Send failed: ' + (e.message || 'Unknown error'));
    }
  }, [queue, connection, signAndSendTransaction]);

  const handleCancel = useCallback((id) => {
    setQueue(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#060b16', color: '#fff',
      fontFamily: display, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060b16; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,163,0.2); border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(0,255,163,0.08)} 50%{box-shadow:0 0 40px rgba(0,255,163,0.18)} }
        input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 14px; color: #fff; font-size: 14px;
          font-family: 'JetBrains Mono', monospace; outline: none; width: 100%; }
        input:focus { border-color: rgba(0,255,163,0.3); }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position:'absolute',top:-200,right:-200,width:500,height:500,
        background:'radial-gradient(circle,rgba(0,255,163,0.05) 0%,transparent 70%)',
        borderRadius:'50%',pointerEvents:'none' }} />
      <div style={{ position:'absolute',bottom:-300,left:-100,width:600,height:600,
        background:'radial-gradient(circle,rgba(108,92,231,0.04) 0%,transparent 70%)',
        borderRadius:'50%',pointerEvents:'none' }} />

      {/* Header */}
      <header style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'18px 28px', borderBottom:'1px solid rgba(255,255,255,0.04)',
        backdropFilter:'blur(20px)', position:'relative', zIndex:10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:34,height:34,borderRadius:9,
            background:'linear-gradient(135deg,#00FFA3,#00D68F)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:17,fontWeight:800,color:'#060b16',
          }}><img src={clockLogo} alt="Wait a Minute" style={{width:24,height:24}} /></div>
          <div>
            <div style={{ fontSize:16,fontWeight:700,letterSpacing:-0.5 }}>Wait a Minute</div>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.25)',letterSpacing:2,textTransform:'uppercase' }}>
              Queue · Save · Support Solana
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {/* Network load */}
          <div style={{
            display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:20,
            background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width:6,height:6,borderRadius:'50%',
              background: networkLoad>80?'#FF6B6B':networkLoad>60?'#FFD700':'#00FFA3',
              animation:'pulse 2s infinite',
            }} />
            <span style={{ fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:mono }}>
              {networkLoad}%
            </span>
          </div>

          {connected ? (
            <>
              <button onClick={handleAirdrop} disabled={airdropping} style={{
                padding:'7px 14px',borderRadius:11,cursor:'pointer',
                background:'rgba(108,92,231,0.08)',border:'1px solid rgba(108,92,231,0.2)',
                color:'#a29bfe',fontSize:13,fontFamily:mono,opacity:airdropping?0.5:1,
              }}>
                {airdropping ? 'Airdropping...' : '💧 Airdrop 1 SOL'}
              </button>
              <button onClick={disconnect} style={{
                display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:11,
                background:'rgba(0,255,163,0.05)',border:'1px solid rgba(0,255,163,0.12)',
                color:'#00FFA3',fontSize:13,fontFamily:mono,cursor:'pointer',
              }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'#00FFA3' }} />
                {shortenedAddress}
                {balance !== null && (
                  <span style={{ color:'rgba(255,255,255,0.35)',marginLeft:6 }}>
                    {balance.toFixed(3)} SOL
                  </span>
                )}
              </button>
            </>
          ) : (
            <button onClick={connect} disabled={connecting} style={{
              background:'linear-gradient(135deg,#00FFA3,#00D68F)',border:'none',
              color:'#060b16',padding:'9px 22px',borderRadius:11,cursor:'pointer',
              fontSize:13,fontWeight:700,opacity:connecting?0.6:1,
            }}>
              {connecting ? 'Connecting...' : 'Connect Solflare'}
            </button>
          )}
        </div>
      </header>

      <div style={{ maxWidth:840,margin:'0 auto',padding:'28px 22px',position:'relative',zIndex:5 }}>

        {/* Error banner */}
        {error && (
          <div style={{
            padding:'12px 18px',borderRadius:12,marginBottom:20,
            background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.2)',
            color:'#FF6B6B',fontSize:13,
          }}>
            {error}
          </div>
        )}

        {!connected ? (
          /* ========== LANDING ========== */
          <div style={{ textAlign:'center',paddingTop:70,animation:'slideUp 0.5s ease' }}>
            <div style={{ fontSize:10,color:'#00FFA3',letterSpacing:4,textTransform:'uppercase',marginBottom:18,fontFamily:mono }}>
              Frontier Hackathon 2026 × Solflare Track
            </div>
            <h1 style={{ fontSize:48,fontWeight:800,lineHeight:1.1,marginBottom:18 }}>
              Good things come<br/>to those who <span style={{color:'#00FFA3'}}>wait</span>.
            </h1>
            <p style={{ fontSize:16,color:'rgba(255,255,255,0.4)',maxWidth:480,margin:'0 auto 36px',lineHeight:1.7,fontWeight:300 }}>
              Opt to delay your transactions. Reduce network congestion.
              Earn fee discounts. Help Solana breathe.
            </p>
            <button onClick={connect} disabled={connecting} style={{
              background:'linear-gradient(135deg,#00FFA3,#00D68F)',border:'none',
              color:'#060b16',padding:'14px 36px',borderRadius:13,cursor:'pointer',
              fontSize:15,fontWeight:700,animation:'glow 3s infinite',
            }}>
              {connecting ? 'Connecting...' : 'Connect Solflare to Start'}
            </button>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginTop:70 }}>
              {[
                { icon:'🔘', title:"Press 'I Can Wait'", desc:'Before any transaction, opt into the queue' },
                { icon:'⏱️', title:'Pick Your Delay', desc:'15s to 2min — longer wait, bigger discount' },
                { icon:'💰', title:'Save on Fees', desc:'Up to 30% off priority fees as a reward' },
              ].map((s,i) => (
                <div key={i} style={{
                  padding:24,borderRadius:14,background:'rgba(255,255,255,0.02)',
                  border:'1px solid rgba(255,255,255,0.04)',textAlign:'center',
                  animation:`slideUp ${0.4+i*0.12}s ease`,
                }}>
                  <div style={{ fontSize:28,marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:13,fontWeight:600,marginBottom:5,color:'#fff' }}>{s.title}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)',lineHeight:1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ========== DASHBOARD ========== */
          <div style={{ animation:'slideUp 0.4s ease' }}>

            {/* Stats */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24 }}>
              {[
                { label:'Total Saved', value:totalSaved.toFixed(6)+' SOL', color:'#00FFA3' },
                { label:'Txns Queued', value:totalQueued, color:'#FFD700' },
                { label:'Network Relief', value:'~'+(totalQueued*0.4).toFixed(1)+' TPS', color:'#6C5CE7' },
              ].map((s,i) => (
                <div key={i} style={{
                  padding:18,borderRadius:13,background:'rgba(255,255,255,0.02)',
                  border:'1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ fontSize:9,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:2,marginBottom:5,fontFamily:mono }}>{s.label}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:s.color,fontFamily:mono }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex',gap:3,marginBottom:22,background:'rgba(255,255,255,0.02)',borderRadius:11,padding:3 }}>
              {['queue','history','impact'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex:1,padding:'9px 0',borderRadius:9,border:'none',cursor:'pointer',
                  background:tab===t?'rgba(0,255,163,0.08)':'transparent',
                  color:tab===t?'#00FFA3':'rgba(255,255,255,0.35)',
                  fontSize:13,fontWeight:600,textTransform:'capitalize',fontFamily:display,
                }}>{t}</button>
              ))}
            </div>

            {/* ---- QUEUE TAB ---- */}
            {tab === 'queue' && (
              <div>
                {!showNew ? (
                  <button onClick={() => setShowNew(true)} style={{
                    width:'100%',padding:16,borderRadius:13,cursor:'pointer',
                    background:'rgba(0,255,163,0.03)',border:'2px dashed rgba(0,255,163,0.12)',
                    color:'#00FFA3',fontSize:14,fontWeight:600,marginBottom:18,fontFamily:display,
                  }}>
                    <img src={clockLogo} alt="" style={{width:18,height:18,marginRight:8,verticalAlign:'middle'}} />
                    I Can Wait — Queue a Transaction
                  </button>
                ) : (
                  <div style={{
                    padding:22,borderRadius:15,marginBottom:18,
                    background:'rgba(0,255,163,0.02)',border:'1px solid rgba(0,255,163,0.1)',
                  }}>
                    <div style={{ fontSize:14,fontWeight:600,marginBottom:14,color:'#fff' }}>
                      New Queued Transaction
                    </div>

                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
                      <div>
                        <label style={{ fontSize:10,color:'rgba(255,255,255,0.3)',display:'block',marginBottom:4,letterSpacing:1,textTransform:'uppercase' }}>
                          Amount (SOL)
                        </label>
                        <input
                          type="number" step="0.001" min="0.001"
                          value={sendAmount}
                          onChange={e => setSendAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize:10,color:'rgba(255,255,255,0.3)',display:'block',marginBottom:4,letterSpacing:1,textTransform:'uppercase' }}>
                          Recipient
                        </label>
                        <input
                          value={sendTo}
                          onChange={e => setSendTo(e.target.value)}
                          placeholder="Public key..."
                        />
                      </div>
                    </div>

                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:8 }}>
                      How long can you wait?
                    </div>
                    <div style={{ display:'flex',gap:8,marginBottom:16 }}>
                      {QUEUE_TIERS.map((d,i) => (
                        <button key={i} onClick={() => setSelectedTier(i)} style={{
                          flex:1,padding:'12px 0',borderRadius:11,cursor:'pointer',
                          background:selectedTier===i?'rgba(0,255,163,0.1)':'rgba(255,255,255,0.02)',
                          border:`1px solid ${selectedTier===i?'rgba(0,255,163,0.25)':'rgba(255,255,255,0.05)'}`,
                          color:selectedTier===i?'#00FFA3':'rgba(255,255,255,0.4)',
                          fontFamily:mono,fontSize:14,fontWeight:600,
                        }}>
                          <div>{d.label}</div>
                          <div style={{ fontSize:10,marginTop:3,opacity:0.5 }}>{d.discount}% off</div>
                        </button>
                      ))}
                    </div>

                    <div style={{ display:'flex',gap:8 }}>
                      <button onClick={handleQueue} disabled={sending} style={{
                        flex:1,padding:13,borderRadius:11,border:'none',cursor:'pointer',
                        background:'linear-gradient(135deg,#00FFA3,#00D68F)',
                        color:'#060b16',fontSize:14,fontWeight:700,
                        opacity:sending?0.6:1,
                      }}>
                        {sending ? 'Signing...' : 'Sign & Queue'}
                      </button>
                      <button onClick={() => setShowNew(false)} style={{
                        padding:'13px 22px',borderRadius:11,cursor:'pointer',
                        background:'none',border:'1px solid rgba(255,255,255,0.08)',
                        color:'rgba(255,255,255,0.4)',fontSize:13,
                      }}>Cancel</button>
                    </div>
                  </div>
                )}

                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {queue.map(e => (
                    <QueueCard key={e.id} entry={e} onCancel={handleCancel} onSend={handleSend} />
                  ))}
                  {queue.length === 0 && (
                    <div style={{ textAlign:'center',padding:50,color:'rgba(255,255,255,0.15)',fontSize:13 }}>
                      No transactions queued. Press "I Can Wait" to get started.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---- HISTORY TAB ---- */}
            {tab === 'history' && (
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {history.length === 0 && (
                  <div style={{ textAlign:'center',padding:50,color:'rgba(255,255,255,0.15)',fontSize:13 }}>
                    No transactions sent yet. Queue one and send it after the countdown.
                  </div>
                )}
                {history.map((h,i) => (
                  <div key={i} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'13px 16px',borderRadius:11,
                    background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div>
                      <div style={{ fontSize:14,fontWeight:500,color:'#fff' }}>{h.type}</div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.25)' }}>
                        {h.amount} SOL · waited {h.tier.label}
                        {h.signature && (
                          <span> · <a
                            href={`https://explorer.solana.com/tx/${h.signature}?cluster=devnet`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color:'rgba(0,255,163,0.6)' }}
                          >view tx</a></span>
                        )}
                      </div>
                    </div>
                    <div style={{ color:'#00FFA3',fontSize:12,fontWeight:600,fontFamily:mono }}>
                      -{h.savings.savedSol.toFixed(6)} SOL
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ---- IMPACT TAB ---- */}
            {tab === 'impact' && (
              <div style={{ textAlign:'center',padding:36 }}>
                <div style={{ fontSize:44,marginBottom:8 }}>🌿</div>
                <div style={{ fontSize:20,fontWeight:700,marginBottom:6,color:'#00FFA3' }}>
                  Your Network Impact
                </div>
                <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',marginBottom:28,lineHeight:1.7 }}>
                  By queuing transactions you help smooth demand spikes
                  and keep Solana running at peak efficiency.
                </p>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  {[
                    { label:'TPS Freed', value:(totalQueued*0.4).toFixed(1), unit:'avg' },
                    { label:'Peak Spikes Avoided', value:Math.max(1,Math.floor(totalQueued/2)), unit:'spikes' },
                    { label:'Total Fees Saved', value:totalSaved.toFixed(6), unit:'SOL' },
                    { label:'Transactions Queued', value:totalQueued, unit:'all-time' },
                  ].map((m,i) => (
                    <div key={i} style={{
                      padding:22,borderRadius:13,background:'rgba(255,255,255,0.02)',
                      border:'1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize:26,fontWeight:700,color:'#fff',fontFamily:mono }}>{m.value}</div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:3 }}>{m.unit}</div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:7,fontWeight:500 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop:50,paddingTop:18,borderTop:'1px solid rgba(255,255,255,0.03)',
          display:'flex',justifyContent:'space-between',fontSize:10,
          color:'rgba(255,255,255,0.15)',
        }}>
          <span><img src={clockLogo} alt="" style={{width:14,height:14,marginRight:4,verticalAlign:'middle'}} />
          Wait a Minute · Solflare × Eitherway · Frontier 2026</span>
          <span>Solana Devnet</span>
        </div>
      </div>
    </div>
  );
}
