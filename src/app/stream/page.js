'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, Play, Square } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

function StreamContent() {
  const router = useRouter();
  const params = useSearchParams();
  const trackId = params.get('id');
  const [track, setTrack] = useState(null);
  const [session, setSession] = useState(null);
  const [timer, setTimer] = useState(60);
  const [streaming, setStreaming] = useState(false);
  const [earned, setEarned] = useState(false);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => { if (trackId) fetchTrack(); }, [trackId]);

  useEffect(() => {
    if (streaming && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && streaming) {
      clearInterval(intervalRef.current);
      endStream();
    }
    return () => clearInterval(intervalRef.current);
  }, [streaming, timer]);

  const fetchTrack = async () => {
    try {
      const res = await API.get('/api/tracks');
      const found = res.data.tracks?.find(t => t.id == trackId);
      setTrack(found);
    } catch {}
  };

 const startStream = async () => {
  setLoading(true);
  try {
    const res = await API.post('/api/streams/start', {
      track_id: trackId,
      track_url: track?.original_url || ''
    });
    setSession(res.data.session);
    setTimer(60);
    setStreaming(true); // This triggers iframe reload with autoplay=1
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to start stream');
  } finally { setLoading(false); }
};

  const endStream = async () => {
    if (!session) return;
    try {
      const res = await API.post('/api/streams/end', { session_id: session.id });
      setCoins(res.data.coins_earned);
      setEarned(true);
      setStreaming(false);
    } catch {}
  };

  const progress = ((60 - timer) / 60) * 100;
  const circumference = 2 * Math.PI * 54;

  if (earned) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(74,158,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '2px solid #4a9eff' }}>
          <Coins size={44} color="#4a9eff" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>You earned!</h2>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#4a9eff', marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>+{coins}</div>
        <p style={{ color: '#8A9BB0', marginBottom: 40, fontSize: 15 }}>Rewaiq Coins added to your wallet</p>
        <button onClick={() => router.push('/home')} style={{ width: '100%', maxWidth: 320, padding: '16px', borderRadius: 14, background: '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Back to Feed
        </button>
        <button onClick={() => { setEarned(false); setStreaming(false); setTimer(60); setSession(null); }}
          style={{ background: 'none', color: '#8A9BB0', fontSize: 14, padding: '10px' }}>
          Stream Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Stream & Earn</span>
      </div>

      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Embed player */}
        <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 24, background: '#0D1F3C', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {track?.embed_url ? (
           <iframe
  src={`${track.embed_url || ''}${(track.embed_url || '').includes('?') ? '&' : '?'}autoplay=${streaming ? 1 : 0}`}
  width="100%"
  height="160"
  frameBorder="0"
  allow="autoplay; encrypted-media"
  allowFullScreen
  style={{ display: 'block' }}
/>
          ) : (
            <div style={{ textAlign: 'center', color: '#8A9BB0', padding: 40 }}>
              <Play size={48} color="#8A9BB0" />
              <p style={{ marginTop: 12 }}>Music player</p>
            </div>
          )}
        </div>

        {/* Track info */}
        <div style={{ width: '100%', marginBottom: 32, textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{track?.title || 'Track'}</h3>
          <p style={{ fontSize: 14, color: '#8A9BB0' }}>{track?.artist_name || 'Artist'}</p>
        </div>

        {/* Timer circle */}
        {streaming && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="70" cy="70" r="54" fill="none" stroke="#4a9eff" strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{timer}</span>
                <span style={{ fontSize: 11, color: '#8A9BB0' }}>seconds</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#8A9BB0' }}>Keep streaming to earn coins...</p>
          </div>
        )}

        {/* Earn badge */}
        <div style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)', borderRadius: 14, padding: '14px 28px', marginBottom: 32, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Coins size={20} color="#4a9eff" />
          <div>
            <p style={{ fontSize: 12, color: '#8A9BB0' }}>You will earn</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#4a9eff' }}>+{track?.campaign_coins || 10} coins</p>
          </div>
        </div>

        {/* Button */}
        {!streaming ? (
          <button onClick={startStream} disabled={loading}
            style={{ width: '100%', padding: '16px', borderRadius: 14, background: loading ? '#ccc' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: '#fff', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Play size={20} fill="#fff" /> {loading ? 'Starting...' : 'Start Streaming'}
          </button>
        ) : (
          <button onClick={endStream}
            style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', color: '#8A9BB0', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Square size={16} /> Stop Stream (forfeit coins)
          </button>
        )}
      </div>
    </div>
  );
}

export default function StreamPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB0' }}><Spinner /></div>}>
    <StreamContent />
  </Suspense>;
}