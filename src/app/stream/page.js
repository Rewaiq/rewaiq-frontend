'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, Play, Square } from 'lucide-react';
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

  const timerRef = useRef(null);
  const startLockRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const finishingRef = useRef(false);

  /*
   * ============================================================
   * LOAD TRACK
   * ============================================================
   *
   * First try:
   *   GET /api/tracks/:id
   *
   * If that doesn't work, fall back to:
   *   GET /api/tracks
   *
   * This prevents the Stream page from incorrectly saying
   * "Track not found" when the track is actually present in feed.
   */
  useEffect(() => {
    let mounted = true;

    async function loadTrack() {
      setLoading(true);
      setError('');

      if (!trackId) {
        setError('No track ID was provided.');
        setLoading(false);
        return;
      }

      try {
        let foundTrack = null;

        /*
         * METHOD 1
         * Try the single-track endpoint.
         */
        try {
          const res = await API.get(
            `/api/tracks/${encodeURIComponent(trackId)}`
          );

          foundTrack =
            res?.data?.track ||
            res?.data?.data ||
            null;
        } catch (singleError) {
          console.log(
            'Single track endpoint failed. Trying tracks list...',
            singleError
          );
        }

        /*
         * METHOD 2
         * Fallback to the feed/list endpoint.
         */
        if (!foundTrack) {
          try {
            const res = await API.get('/api/tracks');

            const list =
              res?.data?.tracks ||
              res?.data?.data ||
              [];

            foundTrack = list.find((item) => {
              const itemId =
                item?.id ??
                item?._id ??
                item?.track_id;

              return String(itemId) === String(trackId);
            });

            /*
             * Extra fallback:
             * Sometimes the feed may expose the Audiomack ID
             * differently from the database ID.
             */
            if (!foundTrack) {
              foundTrack = list.find(
                (item) =>
                  String(item?.audiomack_id || '') ===
                  String(trackId)
              );
            }
          } catch (listError) {
            console.log(
              'Tracks list fallback failed:',
              listError
            );
          }
        }

        if (!foundTrack) {
          if (mounted) {
            setError(
              'This music could not be loaded. Please go back and try again.'
            );
          }
          return;
        }

        if (mounted) {
          setTrack(foundTrack);
        }
      } catch (err) {
        console.error('Track loading error:', err);

        if (mounted) {
          setError(
            err?.response?.data?.message ||
            'Could not load this track.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTrack();

    return () => {
      mounted = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [trackId]);

  /*
   * ============================================================
   * START STREAMING
   * ============================================================
   */
  function handleStartStreaming() {
    if (startLockRef.current) return;
    if (status !== 'idle') return;
    if (!track) return;

    if (!track.audiomack_id) {
      setError('This track does not have an Audiomack ID.');
      return;
    }

    startLockRef.current = true;
    sessionStartedRef.current = false;
    finishingRef.current = false;

    setError('');
    setSeconds(0);
    setSessionId(null);
    setStatus('starting');

    /*
     * Mount iframe.
     */
    setShowEmbed(true);
  }

  /*
   * ============================================================
   * AUDIO PLAYER LOADED
   * ============================================================
   *
   * We start the earning session once the iframe has loaded.
   */
  async function handleEmbedLoad() {
    if (sessionStartedRef.current) return;
    if (!track) return;

    sessionStartedRef.current = true;

    try {
      const currentTrackId =
        track.id ??
        track._id ??
        track.track_id ??
        trackId;

      const trackUrl =
        track.original_url ||
        track.track_url ||
        track.url ||
        '';

      const res = await API.post('/api/streams/start', {
        track_id: currentTrackId,
        track_url: trackUrl,
      });

      const newSessionId =
        res?.data?.session?.id ||
        res?.data?.session?._id;

      if (!newSessionId) {
        throw new Error('No stream session ID returned.');
      }

      setSessionId(newSessionId);
      setStatus('streaming');
      setSeconds(0);

      /*
       * Start the 60-second earning timer.
       */
      timerRef.current = setInterval(() => {
        setSeconds((previous) => {
          const next = previous + 1;

          if (next >= REQUIRED_SECONDS) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            finishStream(newSessionId);

            return REQUIRED_SECONDS;
          }

          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Could not start stream:', err);

      setStatus('idle');
      setShowEmbed(false);
      sessionStartedRef.current = false;

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Could not start stream. Please try again.'
      );
    } finally {
      startLockRef.current = false;
    }
  }

  /*
   * ============================================================
   * REFRESH USER BALANCE
   * ============================================================
   */
  async function refreshCoinBalance() {
    try {
      const res = await API.get('/api/coins/balance');

      const balance =
        res?.data?.balance ??
        res?.data?.coin_balance ??
        res?.data?.coins ??
        res?.data?.data?.balance ??
        null;

      if (balance !== null) {
        const storedUser =
          localStorage.getItem('rewaiq_user');

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);

            user.coin_balance = balance;

            localStorage.setItem(
              'rewaiq_user',
              JSON.stringify(user)
            );
          } catch {}
        }

        /*
         * Notify other components/pages that balance changed.
         */
        window.dispatchEvent(
          new CustomEvent('rewaiq:balance-updated', {
            detail: {
              balance,
            },
          })
        );
      }
    } catch (err) {
      console.log(
        'Balance refresh failed:',
        err
      );
    }
  }

  /*
   * ============================================================
   * FINISH STREAM
   * ============================================================
   */
  async function finishStream(sid) {
    if (finishingRef.current) return;

    finishingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      /*
       * This endpoint should award the coins.
       */
      const res = await API.post('/api/streams/end', {
        session_id: sid,
      });

      console.log('Stream completed:', res?.data);

      /*
       * Immediately refresh balance.
       */
      await refreshCoinBalance();

      setSessionId(null);
      setStatus('completed');
    } catch (err) {
      console.error(
        'Could not complete stream:',
        err
      );

      setError(
        err?.response?.data?.message ||
        'The stream completed, but the reward could not be confirmed. Please check your wallet.'
      );

      /*
       * Don't pretend the stream failed completely.
       */
      setStatus('streaming');
    } finally {
      finishingRef.current = false;
    }
  }

  /*
   * ============================================================
   * MANUAL STOP
   * ============================================================
   */
  async function handleStopStreaming() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    /*
     * If user stops before 60 seconds, end the session.
     * Backend should NOT reward an incomplete stream.
     */
    if (sessionId && seconds < REQUIRED_SECONDS) {
      try {
        await API.post('/api/streams/end', {
          session_id: sessionId,
        });
      } catch (err) {
        console.log(
          'Could not close incomplete stream:',
          err
        );
      }
    }

    setStatus('idle');
    setShowEmbed(false);
    setSeconds(0);
    setSessionId(null);

    sessionStartedRef.current = false;
    finishingRef.current = false;
    startLockRef.current = false;
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (loading) {
    return <Spinner fullscreen />;
  }

  /*
   * ============================================================
   * TRACK ERROR
   * ============================================================
   */
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
          padding: 24,
          color: '#8A9BB0',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 16,
            marginBottom: 20,
          }}
        >
          {error || 'Track not found'}
        </p>

        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
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
        {/* TRACK CARD */}
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
            {track.artist_name || 'Artist'}
          </p>

          {/* AUDIO */}
          {showEmbed && track.audiomack_id ? (
            <iframe
              key={String(track.audiomack_id)}
              src={
                `https://www.audiomack.com/embed/song/${encodeURIComponent(
                  track.audiomack_id
                )}?background=0&light=0&autoplay=1`
              }
              style={{
                width: '100%',
                height: 140,
                border: 'none',
                borderRadius: 10,
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              onLoad={handleEmbedLoad}
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
              <p
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                }}
              >
                Press Start Streaming to play
              </p>
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
              transform: `rotate(${progress * 3.6}deg)`,
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
            {status === 'streaming'
              ? `${Math.max(
                  0,
                  REQUIRED_SECONDS - seconds
                )}s`
              : status === 'completed'
              ? '✓'
              : `${REQUIRED_SECONDS}s`}
          </p>

          <p
            style={{
              fontSize: 12,
              color: '#8A9BB0',
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

        {/* BUTTONS */}
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
                style={{ marginBottom: 8 }}
              />

              <p
                style={{
                  fontSize: 18,
                  fontWeight
