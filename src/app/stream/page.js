'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, Play, Square } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;

function StreamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get('id');

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const startLockRef = useRef(false);

  /*
   * LOAD TRACK
   *
   * Try /api/tracks/:id first.
   * If that fails, load /api/tracks and find the track there.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      setLoading(true);
      setError('');

      if (!trackId) {
        setError('No track selected');
        setLoading(false);
        return;
      }

      try {
        let foundTrack = null;

        try {
          const response = await API.get(
            `/api/tracks/${encodeURIComponent(trackId)}`
          );

          foundTrack =
            response?.data?.track ||
            response?.data?.data ||
            null;
        } catch (err) {
          console.log('Individual track request failed:', err);
        }

        /*
         * Fallback to the same endpoint used by Home.
         */
        if (!foundTrack) {
          const response = await API.get('/api/tracks');

          const tracks =
            response?.data?.tracks ||
            response?.data?.data ||
            [];

          foundTrack = tracks.find(
            (item) =>
              String(item.id) === String(trackId) ||
              String(item.track_id) === String(trackId)
          );
        }

        if (!foundTrack) {
          throw new Error('Track not found');
        }

        if (!cancelled) {
          setTrack(foundTrack);
        }
      } catch (err) {
        console.error('Track loading error:', err);

        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'Track not found'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrack();

    return () => {
      cancelled = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [trackId]);

  /*
   * START
   */
  function handleStartStreaming() {
    if (startLockRef.current) return;
    if (status !== 'idle') return;
    if (!track) return;

    startLockRef.current = true;
    sessionStartedRef.current = false;

    setError('');
    setSeconds(0);
    setSessionId(null);
    setStatus('starting');
    setShowPlayer(true);
  }

  /*
   * PLAYER LOADED
   *
   * The Audiomack iframe has loaded.
   * Start the backend session and the 60 second timer.
   */
  async function handlePlayerLoad() {
    if (sessionStartedRef.current) return;

    sessionStartedRef.current = true;

    try {
      const response = await API.post(
        '/api/streams/start',
        {
          track_id: trackId,
          track_url:
            track?.original_url ||
            track?.url ||
            track?.audio_url ||
            '',
        }
      );

      const id =
        response?.data?.session?.id ||
        response?.data?.id;

      if (!id) {
        throw new Error(
          'Stream session was not created'
        );
      }

      setSessionId(id);
      setStatus('streaming');
      setSeconds(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setSeconds((current) => {
          const next = current + 1;

          if (next >= REQUIRED_SECONDS) {
            clearInterval(timerRef.current);
            timerRef.current = null;

            finishStream(id);

            return REQUIRED_SECONDS;
          }

          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Stream start error:', err);

      setStatus('idle');
      setShowPlayer(false);
      setSessionId(null);
      sessionStartedRef.current = false;

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Could not start stream. Try again.'
      );
    } finally {
      startLockRef.current = false;
    }
  }

  /*
   * COMPLETE STREAM
   *
   * This is called ONLY after 60 seconds.
   */
  async function finishStream(id) {
    try {
      await API.post('/api/streams/end', {
        session_id: id,
      });

      setStatus('completed');
      setSeconds(REQUIRED_SECONDS);
      setSessionId(null);
      sessionStartedRef.current = false;
    } catch (err) {
      console.error('Stream completion error:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Could not complete stream'
      );

      setStatus('idle');
      setShowPlayer(false);
      setSessionId(null);
      sessionStartedRef.current = false;
    }
  }

  /*
   * STOP BEFORE 60 SECONDS
   */
  async function handleStopStreaming() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      sessionId &&
      seconds < REQUIRED_SECONDS
    ) {
      try {
        await API.post('/api/streams/end', {
          session_id: sessionId,
        });
      } catch (err) {
        console.log(
          'Incomplete stream end error:',
          err
        );
      }
    }

    setStatus('idle');
    setShowPlayer(false);
    setSeconds(0);
    setSessionId(null);
    sessionStartedRef.current = false;
  }

  if (loading) {
    return <Spinner fullscreen />;
  }

  if (!track) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A1628',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            color: '#F87171',
            marginBottom: 20,
          }}
        >
          {error || 'Track not found'}
        </p>

        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: 12,
            background: '#4a9eff',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const progress =
    (seconds / REQUIRED_SECONDS) * 100;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        paddingBottom: 40,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#0D1F3C',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </button>

        <span
          style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Now Streaming
        </span>
      </div>

      <div style={{ padding: 20 }}>
        {/* TRACK */}
        <div
          style={{
            background: '#0D1F3C',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              margin: '0 0 4px',
            }}
          >
            {track.title || 'Untitled Track'}
          </p>

          <p
            style={{
              color: '#8A9BB0',
              fontSize: 13,
              margin: '0 0 16px',
            }}
          >
            {track.artist_name || 'Artist'}
          </p>

          {showPlayer && track.audiomack_id ? (
            <iframe
              src={
                `https://www.audiomack.com/embed/song/` +
                `${track.audiomack_id}` +
                `?background=0&light=0&autoplay=1`
              }
              title={track.title || 'Audiomack player'}
              allow="autoplay; encrypted-media"
              style={{
                width: '100%',
                height: 140,
                border: 'none',
                borderRadius: 10,
              }}
              onLoad={handlePlayerLoad}
            />
          ) : (
            <div
              style={{
                height: 140,
                borderRadius: 10,
                background:
                  'rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Play
                size={28}
                color="#4a9eff"
              />

              <span
                style={{
                  color: '#8A9BB0',
                  fontSize: 12,
                }}
              >
                Press Start Streaming to play
              </span>
            </div>
          )}
        </div>

        {/* TIMER */}
        <div
          style={{
            background: '#0D1F3C',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border:
                '6px solid rgba(74,158,255,0.15)',
              borderTopColor:
                status === 'streaming'
                  ? '#4a9eff'
                  : 'rgba(74,158,255,0.15)',
              margin: '0 auto 16px',
              transform:
                `rotate(${progress * 3.6}deg)`,
              transition:
                'transform 1s linear',
            }}
          />

          <p
            style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: 900,
              margin: 0,
            }}
          >
            {status === 'streaming'
              ? `${REQUIRED_SECONDS - seconds}s`
              : status === 'completed'
              ? '✓'
              : '60s'}
          </p>

          <p
            style={{
              color: '#8A9BB0',
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {status === 'starting'
              ? 'Loading track...'
              : status === 'streaming'
              ? 'Keep this screen open to earn coins'
              : status === 'completed'
              ? 'Stream complete!'
              : 'Press Start to begin earning'}
          </p>
        </div>

        {/* BUTTON */}
        {status === 'completed' ? (
          <>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              <Coins
                size={32}
                color="#4a9eff"
              />

              <p
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 700,
                  margin: '8px 0 0',
                }}
              >
                Coins Earned!
              </p>

              <p
                style={{
                  color: '#8A9BB0',
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Your reward has been processed.
              </p>
            </div>

            <button
              onClick={() =>
                router.push('/home')
              }
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 14,
                border: 'none',
                background: '#4a9eff',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Feed
            </button>
          </>
        ) : status === 'streaming' ? (
          <button
            onClick={handleStopStreaming}
            style={{
              width: '100%',
              padding: 18,
              borderRadius: 14,
              background:
                'rgba(248,113,113,0.12)',
              border:
                '1px solid rgba(248,113,113,0.3)',
              color: '#F87171',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Square
              size={18}
              fill="#F87171"
            />
            Stop Streaming
          </button>
        ) : (
          <button
            onClick={handleStartStreaming}
            disabled={status === 'starting'}
            style={{
              width: '100%',
              padding: 18,
              borderRadius: 14,
              border: 'none',
              background:
                status === 'starting'
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
              color:
                status === 'starting'
                  ? '#8A9BB0'
                  : '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor:
                status === 'starting'
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Play
              size={18}
              fill={
                status === 'starting'
                  ? '#8A9BB0'
                  : '#fff'
              }
            />

            {status === 'starting'
              ? 'Loading...'
              : 'Start Streaming'}
          </button>
        )}

        {error && (
          <p
            style={{
              color: '#F87171',
              textAlign: 'center',
              fontSize: 13,
              marginTop: 16,
            }}
          >
            {error}
          </p>
        )}
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
