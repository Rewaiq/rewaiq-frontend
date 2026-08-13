'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, Play, Square, CheckCircle } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;

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
  const [rewarded, setRewarded] = useState(false);

  const timerRef = useRef(null);
  const startingRef = useRef(false);
  const endingRef = useRef(false);

  /*
   * Load track
   */
  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      if (!trackId) {
        setError('No track selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const res = await API.get(
          '/api/tracks/' + encodeURIComponent(trackId)
        );

        if (cancelled) return;

        const loadedTrack = res.data?.track;

        if (!loadedTrack) {
          throw new Error('Track not found');
        }

        setTrack(loadedTrack);
      } catch (err) {
        console.error('Track loading error:', err);

        if (!cancelled) {
          setTrack(null);
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
   * Start stream
   *
   * IMPORTANT:
   * We do NOT wait for the Audiomack iframe.
   * The backend session and timer start immediately.
   */
  async function handleStartStreaming() {
    if (startingRef.current) return;
    if (status !== 'idle') return;
    if (!track) return;

    startingRef.current = true;

    try {
      setError('');
      setStatus('starting');
      setSeconds(0);
      setRewarded(false);

      /*
       * Show Audiomack immediately.
       */
      setShowEmbed(true);

      /*
       * Start backend session immediately.
       */
      const trackUrl = track.original_url || '';

      const res = await API.post('/api/streams/start', {
        track_id: track.id || trackId,
        track_url: trackUrl,
      });

      const newSessionId = res.data?.session?.id;

      if (!newSessionId) {
        throw new Error('Stream session was not created');
      }

      setSessionId(newSessionId);
      setStatus('streaming');

      /*
       * Start the 60-second countdown immediately.
       */
      let currentSeconds = 0;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        currentSeconds += 1;

        setSeconds(currentSeconds);

        /*
         * Full 60 seconds completed.
         */
        if (currentSeconds >= REQUIRED_SECONDS) {
          clearInterval(timerRef.current);
          timerRef.current = null;

          finishStream(newSessionId);
        }
      }, 1000);

    } catch (err) {
      console.error('Start stream error:', err);

      setStatus('idle');
      setShowEmbed(false);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Could not start stream. Please try again.'
      );
    } finally {
      startingRef.current = false;
    }
  }

  /*
   * Finish stream after the COMPLETE 60 seconds.
   */
  async function finishStream(sid) {
    if (endingRef.current) return;

    endingRef.current = true;

    try {
      setStatus('completing');

      /*
       * Tell backend the stream has ended.
       */
      const res = await API.post('/api/streams/end', {
        session_id: sid,
      });

      console.log('Stream completed:', res.data);

      /*
       * IMPORTANT:
       * Refresh wallet immediately.
       */
      try {
        const balanceRes = await API.get('/api/coins/balance');

        console.log(
          'Updated coin balance:',
          balanceRes.data
        );

        /*
         * Update stored user balance if the API returns it.
         */
        const storedUser = localStorage.getItem('rewaiq_user');

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);

            const newBalance =
              balanceRes.data?.balance ??
              balanceRes.data?.coin_balance ??
              balanceRes.data?.coins ??
              balanceRes.data?.user?.coin_balance;

            if (newBalance !== undefined) {
              user.coin_balance = newBalance;

              localStorage.setItem(
                'rewaiq_user',
                JSON.stringify(user)
              );
            }
          } catch (storageError) {
            console.warn(
              'Could not update stored user:',
              storageError
            );
          }
        }
      } catch (balanceError) {
        /*
         * The stream itself already completed.
         * Balance refresh failing should not undo the reward.
         */
        console.warn(
          'Could not refresh coin balance:',
          balanceError
        );
      }

      setRewarded(true);
      setStatus('completed');
      setSeconds(REQUIRED_SECONDS);

    } catch (err) {
      console.error('Finish stream error:', err);

      setError(
        err?.response?.data?.message ||
        'Could not complete stream. Please try again.'
      );

      setStatus('idle');
      setShowEmbed(false);
      setSeconds(0);

    } finally {
      endingRef.current = false;
    }
  }

  /*
   * User manually stops before 60 seconds.
   *
   * No reward should be given.
   */
  async function handleStopStreaming() {
    if (status !== 'streaming') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    /*
     * End incomplete session.
     * Backend should NOT reward it because it is below 60 seconds.
     */
    if (sessionId && seconds < REQUIRED_SECONDS) {
      try {
        await API.post('/api/streams/end', {
          session_id: sessionId,
        });
      } catch (err) {
        console.warn(
          'Could not end incomplete stream:',
          err
        );
      }
    }

    setStatus('idle');
    setShowEmbed(false);
    setSeconds(0);
    setSessionId(null);
    setRewarded(false);
  }

  /*
   * Cleanup.
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A9BB0',
          fontSize: 18,
        }}
      >
        {error || 'Track not found'}
      </div>
    );
  }

  const progress =
    (seconds / REQUIRED_SECONDS) * 100;

  const remaining =
    Math.max(
      REQUIRED_SECONDS - seconds,
      0
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        paddingBottom: 40,
      }}
    >

      {/* Header */}
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
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft
            size={22}
            color="#fff"
          />
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

      <div style={{ padding: '20px' }}>

        {/* Track */}
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
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 4,
            }}
          >
            {track.title}
          </p>

          <p
            style={{
              fontSize: 13,
              color: '#8A9BB0',
              marginBottom: 16,
            }}
          >
            {track.artist_name}
          </p>

          {/* Audiomack */}
          {showEmbed && track.audiomack_id ? (
            <iframe
              src={
                'https://www.audiomack.com/embed/song/' +
                track.audiomack_id +
                '?background=0&light=0&autoplay=1'
              }
              title={track.title}
              style={{
                width: '100%',
                height: 140,
                border: 'none',
                borderRadius: 10,
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div
              style={{
                height: 140,
                borderRadius: 10,
                background:
                  'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <Play
                  size={36}
                  color="#4a9eff"
                  style={{
                    marginBottom: 8,
                  }}
                />

                <p
                  style={{
                    fontSize: 12,
                    color: '#8A9BB0',
                    margin: 0,
                  }}
                >
                  Press Start Streaming to play
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Timer */}
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
                'rotate(' +
                progress * 3.6 +
                'deg)',
              transition:
                'transform 1s linear',
            }}
          />

          <p
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#fff',
              margin: 0,
            }}
          >
            {status === 'completed'
              ? '✓'
              : remaining + 's'}
          </p>

          <p
            style={{
              fontSize: 12,
              color: '#8A9BB0',
              marginTop: 4,
            }}
          >
            {status === 'starting'
              ? 'Starting stream...'
              : status === 'streaming'
              ? 'Keep listening to earn coins'
              : status === 'completing'
              ? 'Adding your coins...'
              : status === 'completed'
              ? 'Stream complete — coins added!'
              : 'Press Start to begin earning'}
          </p>
        </div>

        {/* Completed */}
        {status === 'completed' ? (
          <div>

            <div
              style={{
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              <CheckCircle
                size={36}
                color="#4a9eff"
                style={{
                  marginBottom: 8,
                }}
              />

              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                }}
              >
                Coins Earned!
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                  marginTop: 6,
                }}
              >
                Your wallet has been updated.
              </p>
            </div>

            <button
              onClick={() => router.push('/home')}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 14,
                background: '#4a9eff',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Back to Feed
            </button>

          </div>

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
              fontWeight: 700,
              fontSize: 16,
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

            <span>
              Stop Streaming
            </span>
          </button>

        ) : (

          <button
            onClick={handleStartStreaming}
            disabled={
              status === 'starting' ||
              status === 'completing'
            }
            style={{
              width: '100%',
              padding: 18,
              borderRadius: 14,
              background:
                status === 'starting'
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
              color:
                status === 'starting'
                  ? '#8A9BB0'
                  : '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
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

            <span>
              {status === 'starting'
                ? 'Starting...'
                : 'Start Streaming'}
            </span>
          </button>
        )}

        {error && (
          <p
            style={{
              color: '#F87171',
              textAlign: 'center',
              marginTop: 16,
              fontSize: 13,
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
    <Suspense
      fallback={<Spinner fullscreen />}
    >
      <StreamContent />
    </Suspense>
  );
}
