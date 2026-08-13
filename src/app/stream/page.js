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
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const [showEmbed, setShowEmbed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const startLockRef = useRef(false);
  const sessionStartedRef = useRef(false);

  const REQUIRED_SECONDS = 60;

  useEffect(() => {
    fetchTrack();
    return function cleanup() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [trackId]);

  async function fetchTrack() {
    try {
      const res = await API.get('/api/tracks/' + trackId);
      setTrack(res.data.track);
    } catch (err) {
      setError('Track not found');
    } finally {
      setLoading(false);
    }
  }

  function handleStartStreaming() {
    if (startLockRef.current) return;
    if (status !== 'idle') return;
    startLockRef.current = true;
    setStatus('starting');
    setError('');
    sessionStartedRef.current = false;
    setShowEmbed(true);
  }

  async function handleEmbedLoad() {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    try {
      const trackUrl = track && track.original_url ? track.original_url : '';
      const res = await API.post('/api/streams/start', {
        track_id: trackId,
        track_url: trackUrl,
      });
      const newSessionId = res.data.session.id;
      setSessionId(newSessionId);
      setStatus('streaming');
      setSeconds(0);

      timerRef.current = setInterval(function tick() {
        setSeconds(function updateSeconds(prev) {
          const next = prev + 1;
          if (next >= REQUIRED_SECONDS) {
            clearInterval(timerRef.current);
            finishStream(newSessionId);
            return REQUIRED_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus('idle');
      setShowEmbed(false);
      const msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Could not start stream. Try again.';
      setError(msg);
    } finally {
      startLockRef.current = false;
    }
  }

  async function handleStopStreaming() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (sessionId && seconds < REQUIRED_SECONDS) {
      try {
        await API.post('/api/streams/end', { session_id: sessionId });
      } catch (err) {
        // ignore — stopping early is not an error state
      }
    }

    setStatus('idle');
    setShowEmbed(false);
    setSeconds(0);
    setSessionId(null);
    sessionStartedRef.current = false;
  }

  async function finishStream(sid) {
    try {
      await API.post('/api/streams/end', { session_id: sid });
      setStatus('completed');
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Could not complete stream';
      setError(msg);
      setStatus('idle');
      setShowEmbed(false);
    }
  }

  if (loading) {
    return <Spinner fullscreen />;
  }

  if (error && !track) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB0' }}>
        {error}
      </div>
    );
  }

  const progress = (seconds / REQUIRED_SECONDS) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#0D1F3C' }}>
        <button onClick={function goBack() { router.back(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Now Streaming</span>
      </div>

      <div style={{ padding: '20px' }}>

        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {track ? track.title : ''}
          </p>
          <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 16 }}>
            {track ? track.artist_name : ''}
          </p>

          {showEmbed && track && track.audiomack_id ? (
            <iframe
              key={sessionId || 'pending'}
              src={'https://www.audiomack.com/embed/song/' + track.audiomack_id + '?background=0&light=0&autoplay=1'}
              style={{ width: '100%', height: 140, border: 'none', borderRadius: 10 }}
              allow="autoplay"
              onLoad={handleEmbedLoad}
            />
          ) : (
            <div style={{ height: 140, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: '#8A9BB0' }}>Press Start Streaming to play</p>
            </div>
          )}
        </div>

        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '6px solid rgba(74,158,255,0.15)',
            borderTopColor: status === 'streaming' ? '#4a9eff' : 'rgba(74,158,255,0.15)',
            margin: '0 auto 16px',
            transform: 'rotate(' + (progress * 3.6) + 'deg)',
            transition: 'transform 1s linear',
          }} />
          <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>
            {status === 'streaming' ? (REQUIRED_SECONDS - seconds) + 's' : status === 'completed' ? '✓' : REQUIRED_SECONDS + 's'}
          </p>
          <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 4 }}>
            {status === 'starting' ? 'Loading track...' : status === 'streaming' ? 'Keep this screen open to earn coins' : status === 'completed' ? 'Stream complete!' : 'Press Start to begin earning'}
          </p>
        </div>

        {status === 'completed' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Coins size={32} color="#4a9eff" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Coins Earned!</p>
            </div>
            <button
              onClick={function goHome() { router.push('/home'); }}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#4a9eff', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            >
              Back to Feed
            </button>
          </div>
        ) : status === 'streaming' ? (
          <button
            onClick={handleStopStreaming}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Square size={18} fill="#F87171" />
            <span>Stop Streaming</span>
          </button>
        ) : (
          <button
            onClick={handleStartStreaming}
            disabled={status === 'starting'}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: status === 'starting' ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: status === 'starting' ? '#8A9BB0' : '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: status === 'starting' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Play size={18} fill={status === 'starting' ? '#8A9BB0' : '#fff'} />
            <span>{status === 'starting' ? 'Loading...' : 'Start Streaming'}</span>
          </button>
        )}

        {error ? (
          <p style={{ color: '#F87171', textAlign: 'center', marginTop: 16, fontSize: 13 }}>{error}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function StreamPage() {
  return (
    <Suspense fallback={<Spinner fullscreen />}>
      <StreamContent />
    </Suspense>
  );
          }      setError('Track not found');
    } finally { setLoading(false); }
  };

  // Click Start Streaming → embed mounts with autoplay=1 → onLoad fires → session+timer start
  const handleStartStreaming = () => {
    if (startLockRef.current || status !== 'idle') return;
    startLockRef.current = true;
    setStatus('starting');
    setError('');
    sessionStartedRef.current = false;
    setShowEmbed(true); // mounting the iframe now triggers autoplay
  };

  // Fires once the Audiomack iframe has loaded — this is our real "playback begun" signal
  const handleEmbedLoad = async () => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    try {
      const res = await API.post('/api/streams/start', {
        track_id: trackId,
        track_url: track?.original_url,
      });
      setSessionId(res.data.session.id);
      setStatus('streaming');
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (next >= REQUIRED_SECONDS) {
            clearInterval(timerRef.current);
            finishStream(res.data.session.id);
            return REQUIRED_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus('idle');
      setShowEmbed(false);
      setError(err.response?.data?.message || 'Could not start stream. Try again.');
    } finally {
      startLockRef.current = false;
    }
  };

  const handleStopStreaming = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (sessionId && seconds < REQUIRED_SECONDS) {
      try { await API.post('/api/streams/end', { session_id: sessionId }); } catch {}
    }

    setStatus('idle');
    setShowEmbed(false);
    setSeconds(0);
    setSessionId(null);
    sessionStartedRef.current = false;
  };

  const finishStream = async (sid) => {
    try {
      await API.post('/api/streams/end', { session_id: sid });
      setStatus('completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete stream');
      setStatus('idle');
      setShowEmbed(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (error && !track) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB0' }}>
      {error}
    </div>
  );

  const progress = (seconds / REQUIRED_SECONDS) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#0D1F3C' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Now Streaming</span>
      </div>

      <div style={{ padding: '20px' }}>

        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{track?.title}</p>
          <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 16 }}>{track?.artist_name}</p>

          {showEmbed && track?.audiomack_id ? (
            <iframe
              key={sessionId || 'pending'}
              src={`https://www.audiomack.com/embed/song/${track.audiomack_id}?background=0&light=0&autoplay=1`}
              style={{ width: '100%', height: 140, border: 'none', borderRadius: 10 }}
              allow="autoplay"
              onLoad={handleEmbedLoad}
            />
          ) : (
            <div style={{ height: 140, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: '#8A9BB0' }}>Press Start Streaming to play</p>
            </div>
          )}
        </div>

        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            border: '6px solid rgba(74,158,255,0.15)',
            borderTopColor: status === 'streaming' ? '#4a9eff' : 'rgba(74,158,255,0.15)',
            margin: '0 auto 16px',
            transform: `rotate(${progress * 3.6}deg)`,
            transition: 'transform 1s linear',
          }} />
          <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>
            {status === 'streaming' ? `${REQUIRED_SECONDS - seconds}s`
              : status === 'completed' ? '✓'
              : `${REQUIRED_SECONDS}s`}
          </p>
          <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 4 }}>
            {status === 'starting' ? 'Loading track...'
              : status === 'streaming' ? 'Keep this screen open to earn coins'
              : status === 'completed' ? 'Stream complete!'
              : 'Press Start to begin earning'}
          </p>
        </div>

        {status === 'completed' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Coins size={32} color="#4a9eff" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Coins Earned!</p>
            </div>
            <button onClick={() => router.push('/home')}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#4a9eff', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Back to Feed
            </button>
          </>
        ) : status === 'streaming' ? (
          <button onClick={handleStopStreaming}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Square size={18} fill="#F87171" /> Stop Streaming
          </button>
        ) : (
          <button onClick={handleStartStreaming}
            disabled={status === 'starting'}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: status === 'starting' ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: status === 'starting' ? '#8A9BB0' : '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: status === 'starting' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Play size={18} fill={status === 'starting' ? '#8A9BB0' : '#fff'} />
            {status === 'starting' ? 'Loading...' : 'Start Streaming'}
          </button>
        )}

        {error && <p style={{ color: '#F87171', textAlign: 'center', marginTop: 16, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}

export default function StreamPage() {
  return (
    <Suspense fallback={<Spinner fullscreen />}>
      <StreamContent />
    </Suspense>
  );
    }
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (next >= REQUIRED_SECONDS) {
            clearInterval(timerRef.current);
            finishStream(res.data.session.id);
            return REQUIRED_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus('idle');
      setShowEmbed(false);
      setError(err.response?.data?.message || 'Could not start stream. Try again.');
    } finally {
      startLockRef.current = false;
    }
  };

  const handleStopStreaming = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (sessionId && seconds < REQUIRED_SECONDS) {
      try { await API.post('/api/streams/end', { session_id: sessionId }); } catch {}
    }

    setStatus('idle');
    setShowEmbed(false);
    setSeconds(0);
    setSessionId(null);
    sessionStartedRef.current = false;
  };

  const finishStream = async (sid) => {
    try {
      await API.post('/api/streams/end', { session_id: sid });
      setStatus('completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete stream');
      setStatus('idle');
      setShowEmbed(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (error && !track) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB0' }}>
      {error}
    </div>
  );

  const progress = (seconds / REQUIRED_SECONDS) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#0D1F3C' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Now Streaming</span>
      </div>

      <div style={{ padding: '20px' }}>

        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{track?.title}</p>
          <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 16 }}>{track?.artist_name}</p>

          {/* Embed only mounts once Start Streaming is pressed — autoplay fires immediately on mount */}
          {showEmbed && track?.audiomack_id ? (
            <iframe
              key={sessionId || 'pending'}
              src={`https://www.audiomack.com/embed/song/${track.audiomack_id}?background=0&light=0&autoplay=1`}
              style={{ width: '100%', height: 140, border: 'none', borderRadius: 10 }}
              allow="autoplay"
              onLoad={handleEmbedLoad}
            />
          ) : (
            <div style={{ height: 140, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: '#8A9BB0' }}>Press Start Streaming to play</p>
            </div>
          )}
        </div>

        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            border: '6px solid rgba(74,158,255,0.15)',
            borderTopColor: status === 'streaming' ? '#4a9eff' : 'rgba(74,158,255,0.15)',
            margin: '0 auto 16px',
            transform: `rotate(${progress * 3.6}deg)`,
            transition: 'transform 1s linear',
          }} />
          <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>
            {status === 'streaming' ? `${REQUIRED_SECONDS - seconds}s`
              : status === 'completed' ? '✓'
              : `${REQUIRED_SECONDS}s`}
          </p>
          <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 4 }}>
            {status === 'starting' ? 'Loading track...'
              : status === 'streaming' ? 'Keep this screen open to earn coins'
              : status === 'completed' ? 'Stream complete!'
              : 'Press Start to begin earning'}
          </p>
        </div>

        {status === 'completed' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Coins size={32} color="#4a9eff" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Coins Earned!</p>
            </div>
            <button onClick={() => router.push('/home')}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#4a9eff', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Back to Feed
            </button>
          </>
        ) : status === 'streaming' ? (
          <button onClick={handleStopStreaming}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Square size={18} fill="#F87171" /> Stop Streaming
          </button>
        ) : (
          <button onClick={handleStartStreaming}
            disabled={status === 'starting'}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: status === 'starting' ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: status === 'starting' ? '#8A9BB0' : '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: status === 'starting' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Play size={18} fill={status === 'starting' ? '#8A9BB0' : '#fff'} />
            {status === 'starting' ? 'Loading...' : 'Start Streaming'}
          </button>
        )}

        {error && <p style={{ color: '#F87171', textAlign: 'center', marginTop: 16, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}
