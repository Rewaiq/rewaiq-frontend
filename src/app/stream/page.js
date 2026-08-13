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

  /*
   * -------------------------------------------------------
   * FETCH TRACK
   * -------------------------------------------------------
   *
   * First try:
   *   GET /api/tracks/:id
   *
   * If that fails, use:
   *   GET /api/tracks
   *
   * and find the track from the same list used by the feed.
   *
   * This prevents the Stream page from saying "Track not found"
   * when the track is actually visible on the feed.
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
        /*
         * First attempt: individual track endpoint
         */
        try {
          const res = await API.get(
            `/api/tracks/${encodeURIComponent(trackId)}`
          );

          const foundTrack =
            res?.data?.track ||
            res?.data?.data ||
            (res?.data?.id ? res.data : null);

          if (foundTrack) {
            if (!cancelled) {
              setTrack(foundTrack);
              setLoading(false);
            }
            return;
          }
        } catch (detailError) {
          console.log(
            'Individual track endpoint failed. Trying track list...',
            detailError
          );
        }

        /*
         * Fallback: fetch the same track list used by Home.
         */
        const listRes = await API.get('/api/tracks');

        const list =
          listRes?.data?.tracks ||
          listRes?.data?.data ||
          (Array.isArray(listRes?.data) ? listRes.data : []);

        const foundTrack = list.find(
          (item) =>
            String(item.id) === String(trackId) ||
            String(item.track_id) === String(trackId)
        );

        if (!foundTrack) {
          throw new Error('Track does not exist in track list');
        }

        if (!cancelled) {
          setTrack(foundTrack);
          setLoading(false);
        }
      } catch (err) {
        console.error('Unable to load track:', err);

        if (!cancelled) {
          setTrack(null);
          setError(
            err?.response?.data?.message ||
              'Track not found'
          );
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
   * -------------------------------------------------------
   * START STREAMING
   * -------------------------------------------------------
   */
  function handleStartStreaming() {
    if (startLockRef.current) return;
    if (status !== 'idle') return;
    if (!track) {
      setError('Track not available');
      return;
    }

    startLockRef.current = true;
    sessionStartedRef.current = false;

    setError('');
    setSeconds(0);
    setSessionId(null);
    setStatus('starting');
    setShowEmbed(true);
  }

  /*
   * -------------------------------------------------------
   * AUDIO PLAYER LOADED
   * -------------------------------------------------------
   *
   * Once Audiomack iframe loads:
   * 1. Start backend session
   * 2. Start 60-second earning timer
   */
  async function handleEmbedLoad() {
    if (sessionStartedRef.current) {
      return;
    }

    sessionStartedRef.current = true;

    try {
      const trackUrl =
        track?.original_url ||
        track?.url ||
        track?.audio_url ||
        '';

      const res = await API.post('/api/streams/start', {
        track_id: trackId,
        track_url: trackUrl,
      });

      const newSessionId =
        res?.data?.session?.id ||
        res?.data?.id ||
        null;

      if (!newSessionId) {
        throw new Error('Stream session was not created');
      }

      setSessionId(newSessionId);
      setStatus('streaming');
      setSeconds(0);

      /*
       * Make sure there isn't an old timer.
       */
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

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
      setSessionId(null);
      sessionStartedRef.current = false;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not start stream. Try again.';

      setError(message);
    } finally {
      startLockRef.current = false;
    }
  }

  /*
   * -------------------------------------------------------
   * END STREAM
   * -------------------------------------------------------
   */
  async function endStreamOnBackend(sid) {
    if (!sid) {
      return null;
    }

    const res = await API.post('/api/streams/end', {
      session_id: sid,
    });

    return res;
  }

  /*
   * -------------------------------------------------------
   * STOP BEFORE 60 SECONDS
   * -------------------------------------------------------
   */
  async function handleStopStreaming() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const sid = sessionId;

    /*
     * If the user hasn't reached 60 seconds,
     * end the session without rewarding.
     */
    if (sid && seconds < REQUIRED_SECONDS) {
      try {
        await endStreamOnBackend(sid);
      } catch (err) {
        console.log('Could not end incomplete stream:', err);
      }
    }

    setStatus('idle');
    setShowEmbed(false);
    setSeconds(0);
    setSessionId(null);
    sessionStartedRef.current = false;
  }

  /*
   * -------------------------------------------------------
   * COMPLETE 60-SECOND STREAM
   * -------------------------------------------------------
   */
  async function finishStream(sid) {
    try {
      /*
       * The backend should only reward the user here,
       * after the required 60 seconds.
       */
      const res = await endStreamOnBackend(sid);

      console.log('Stream completed:', res?.data);

      setStatus('completed');
      setSeconds(REQUIRED_SECONDS);
      setSessionId(null);
      sessionStartedRef.current = false;

      /*
       * Keep the player visible briefly / don't immediately
       * destroy the completed state.
       */
    } catch (err) {
      console.error('Could not complete stream:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Could not complete stream';

      setError(message);

      setStatus('idle');
      setShowEmbed(false);
      setSeconds(0);
      setSessionId(null);
      sessionStartedRef.current = false;
    }
  }

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */
  if (loading) {
    return <Spinner fullscreen />;
  }

  /*
   * -------------------------------------------------------
   * ERROR / TRACK NOT FOUND
   * -------------------------------------------------------
   */
  if (!track) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A1628',
          color: '#8A9BB0',
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
            fontSize: 16,
            marginBottom: 20,
          }}
        >
          {error || 'Track not found'}
        </p>

        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 20px',
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

  /*
   * -------------------------------------------------------
   * PAGE
   * -------------------------------------------------------
   */
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
            {track.title || 'Untitled Track'}
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

          {/* AUDIO PLAYER */}
          {showEmbed && track.audiomack_id ? (
            <div
              style={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: 10,
              }}
            >
              <iframe
                key={`${track.id}-${sessionId || 'pending'}`}
                src={
                  `https://www.audiomack.com/embed/song/` +
                  `${track.audiomack_id}` +
                  `?background=0&light=0&autoplay=1`
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
                title={`Playing ${track.title || 'track'}`}
              />
            </div>
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
              fontSize: 32,
              fontWeight: 900,
              color: '#fff',
              margin: 0,
            }}
          >
            {status === 'streaming'
              ? `${REQUIRED_SECONDS - seconds}s`
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

        {/* COMPLETED */}
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
                style={{ marginBottom: 
