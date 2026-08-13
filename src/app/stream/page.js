'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Square,
  CheckCircle,
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;
const STORAGE_KEY = 'rewaiq_stream_track';

function StreamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
   * Get the ID from the URL.
   *
   * We support both:
   * /stream?id=123
   * /stream?track_id=123
   */
  const urlTrackId =
    searchParams.get('id') ||
    searchParams.get('track_id');

  const [track, setTrack] = useState(null);
  const [trackId, setTrackId] = useState(urlTrackId || null);

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
   * ---------------------------------------------------------
   * SAVE TRACK LOCALLY
   * ---------------------------------------------------------
   *
   * This prevents the track from disappearing if Next.js
   * recreates the page/component.
   */
  function saveTrackLocally(trackData) {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trackData)
      );
    } catch (err) {
      console.warn(
        'Could not save stream track:',
        err
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * GET SAVED TRACK
   * ---------------------------------------------------------
   */
  function getSavedTrack() {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const saved =
        sessionStorage.getItem(STORAGE_KEY);

      if (!saved) return null;

      return JSON.parse(saved);
    } catch (err) {
      console.warn(
        'Could not read saved stream track:',
        err
      );

      return null;
    }
  }

  /*
   * ---------------------------------------------------------
   * FIND TRACK ID
   * ---------------------------------------------------------
   *
   * Priority:
   *
   * 1. URL
   * 2. Saved track
   *
   * This means the page doesn't suddenly lose the ID.
   */
  useEffect(() => {
    let id = urlTrackId;

    if (!id) {
      const savedTrack = getSavedTrack();

      if (savedTrack) {
        id =
          savedTrack.id ||
          savedTrack._id ||
          savedTrack.track_id ||
          null;
      }
    }

    if (id) {
      setTrackId(String(id));
    }
  }, [urlTrackId]);

  /*
   * ---------------------------------------------------------
   * LOAD TRACK
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      /*
       * First check whether we already have a valid
       * track saved locally.
       */
      const savedTrack = getSavedTrack();

      /*
       * If URL ID is missing but we have saved track,
       * immediately display it.
       */
      if (!trackId && savedTrack) {
        if (!cancelled) {
          setTrack(savedTrack);
          setTrackId(
            String(
              savedTrack.id ||
              savedTrack._id ||
              savedTrack.track_id
            )
          );
          setLoading(false);
        }

        return;
      }

      /*
       * No ID anywhere.
       */
      if (!trackId) {
        if (!cancelled) {
          setLoading(false);
          setError('No track selected');
        }

        return;
      }

      try {
        setLoading(true);
        setError('');

        /*
         * If the saved track is already the same track,
         * show it immediately while the API request runs.
         */
        if (savedTrack) {
          const savedId =
            savedTrack.id ||
            savedTrack._id ||
            savedTrack.track_id;

          if (
            savedId &&
            String(savedId) === String(trackId)
          ) {
            if (!cancelled) {
              setTrack(savedTrack);
              setLoading(false);
            }
          }
        }

        /*
         * Fetch the latest version from backend.
         */
        const response = await API.get(
          `/api/tracks/${encodeURIComponent(trackId)}`
        );

        if (cancelled) return;

        /*
         * Support different possible API response formats.
         */
        const loadedTrack =
          response?.data?.track ||
          response?.data?.data ||
          response?.data;

        if (!loadedTrack) {
          /*
           * IMPORTANT:
           *
           * If we already have a saved track, don't destroy it.
           */
          if (savedTrack) {
            setTrack(savedTrack);
            setLoading(false);
            return;
          }

          throw new Error('Track not found');
        }

        /*
         * Save the successful track.
         */
        setTrack(loadedTrack);
        saveTrackLocally(loadedTrack);

        /*
         * Make sure track ID remains available.
         */
        const resolvedId =
          loadedTrack.id ||
          loadedTrack._id ||
          loadedTrack.track_id ||
          trackId;

        setTrackId(String(resolvedId));

      } catch (err) {
        console.error(
          'Track loading error:',
          err
        );

        /*
         * DO NOT destroy an already loaded track.
         *
         * This is important for the problem you were having.
         */
        if (!cancelled) {
          const existingTrack =
            track || savedTrack;

          if (existingTrack) {
            setTrack(existingTrack);

            /*
             * Don't show "Track not found" over a valid
             * track that is already displayed.
             */
            setError('');
          } else {
            setTrack(null);

            setError(
              err?.response?.data?.message ||
              err?.message ||
              'Track not found'
            );
          }
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
    };
  }, [trackId]);

  /*
   * ---------------------------------------------------------
   * CLEAN TIMER
   * ---------------------------------------------------------
   */
  function clearStreamTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  /*
   * ---------------------------------------------------------
   * START STREAM
   * ---------------------------------------------------------
   */
  async function handleStartStreaming() {
    if (startingRef.current) return;

    if (
      status !== 'idle' &&
      status !== 'completed'
    ) {
      return;
    }

    if (!track) {
      setError('No track selected');
      return;
    }

    startingRef.current = true;

    try {
      setError('');
      setRewarded(false);
      setSeconds(0);

      /*
       * Save the track again before starting.
       */
      saveTrackLocally(track);

      /*
       * Show Audiomack immediately after the user
       * presses Start Streaming.
       */
      setShowEmbed(true);

      setStatus('starting');

      /*
       * Get the correct track ID.
       */
      const resolvedTrackId =
        track.id ||
        track._id ||
        track.track_id ||
        trackId;

      if (!resolvedTrackId) {
        throw new Error(
          'This track does not have a valid ID'
        );
      }

      /*
       * Get Audiomack URL if available.
       */
      const trackUrl =
        track.original_url ||
        track.audio_url ||
        track.url ||
        '';

      /*
       * Start backend earning session.
       */
      const response = await API.post(
        '/api/streams/start',
        {
          track_id: resolvedTrackId,
          track_url: trackUrl,
        }
      );

      console.log(
        'Stream start response:',
        response?.data
      );

      const newSessionId =
        response?.data?.session?.id ||
        response?.data?.session_id ||
        response?.data?.id;

      if (!newSessionId) {
        throw new Error(
          'Stream session was not created'
        );
      }

      setSessionId(newSessionId);
      setStatus('streaming');

      /*
       * Start timer only after backend confirms
       * the streaming session.
       */
      clearStreamTimer();

      let currentSeconds = 0;

      timerRef.current = setInterval(() => {
        currentSeconds += 1;

        setSeconds(currentSeconds);

        /*
         * 60 seconds completed.
         */
        if (
          currentSeconds >=
          REQUIRED_SECONDS
        ) {
          clearStreamTimer();

          finishStream(newSessionId);
        }
      }, 1000);

    } catch (err) {
      console.error(
        'Start stream error:',
        err
      );

      clearStreamTimer();

      setStatus('idle');
      setShowEmbed(false);
      setSessionId(null);
      setSeconds(0);

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
   * ---------------------------------------------------------
   * FINISH STREAM
   * ---------------------------------------------------------
   */
  async function finishStream(sid) {
    if (endingRef.current) return;

    endingRef.current = true;

    try {
      setStatus('completing');

      /*
       * Tell backend that the user completed the
       * required stream duration.
       */
      const response = await API.post(
        '/api/streams/end',
        {
          session_id: sid,
        }
      );

      console.log(
        'Stream completed:',
        response?.data
      );

      /*
       * Refresh wallet.
       */
      try {
        const balanceResponse =
          await API.get(
            '/api/coins/balance'
          );

        console.log(
          'Updated coin balance:',
          balanceResponse?.data
        );

        /*
         * Update stored user.
         */
        if (
          typeof window !== 'undefined'
        ) {
          const storedUser =
            localStorage.getItem(
              'rewaiq_user'
            );

          if (storedUser) {
            try {
              const user =
                JSON.parse(storedUser);

              const newBalance =
                balanceResponse?.data
                  ?.balance ??
                balanceResponse?.data
                  ?.coin_balance ??
                balanceResponse?.data
                  ?.coins ??
                balanceResponse?.data
                  ?.user?.coin_balance;

              if (
                newBalance !== undefined
              ) {
                user.coin_balance =
                  newBalance;

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
        }

      } catch (balanceError) {
        /*
         * Don't undo a completed stream just because
         * the balance refresh failed.
         */
        console.warn(
          'Could not refresh coin balance:',
          balanceError
        );
      }

      setRewarded(true);
      setSeconds(REQUIRED_SECONDS);
      setStatus('completed');

    } catch (err) {
      console.error(
        'Finish stream error:',
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Could not complete stream. Please try again.'
      );

      setStatus('idle');
      setShowEmbed(false);
      setSeconds(0);
      setSessionId(null);

    } finally {
      endingRef.current = false;
    }
  }

  /*
   * ---------------------------------------------------------
   * STOP STREAMING
   * ---------------------------------------------------------
   */
  async function handleStopStreaming() {
    if (
      status !== 'streaming' &&
      status !== 'starting'
    ) {
      return;
    }

    clearStreamTimer();

    /*
     * If there is an active session and the user
     * stopped before 60 seconds, end it.
     */
    if (
      sessionId &&
      seconds < REQUIRED_SECONDS
    ) {
      try {
        await API.post(
          '/api/streams/end',
          {
            session_id: sessionId,
          }
        );
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
   * ---------------------------------------------------------
   * PAGE CLEANUP
   * ---------------------------------------------------------
   */
  useEffect(() => {
    return () => {
      clearStreamTimer();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading && !track) {
    return <Spinner fullscreen />;
  }

  /*
   * ---------------------------------------------------------
   * NO TRACK
   * ---------------------------------------------------------
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
          color: '#8A9BB0',
          fontSize: 18,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            marginBottom: 20,
          }}
        >
          {error || 'No track selected'}
        </p>

        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 20px',
            borderRadius: 10,
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

  /*
   * ---------------------------------------------------------
   * TIMER VALUES
   * ---------------------------------------------------------
   */
  const progress = Math.min(
    (seconds / REQUIRED_SECONDS) * 100,
    100
  );

  const remaining = Math.max(
    REQUIRED_SECONDS - seconds,
    0
  );

  /*
   * ---------------------------------------------------------
   * AUDIO / AUDIOMACK ID
   * ---------------------------------------------------------
   */
  const audiomackId =
    track.audiomack_id ||
    track.audiomackId ||
    track.audiomack_track_id ||
    null;

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
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
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
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

      <div
        style={{
          padding: '20px',
        }}
      >

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
              margin: '0 0 4px',
            }}
          >
            {track.title ||
              track.name ||
              'Untitled Track'}
          </p>

          <p
            style={{
              fontSize: 13,
              color: '#8A9BB0',
              margin: '0 0 16px',
            }}
          >
            {track.artist_name ||
              track.artist ||
              track.artistName ||
              'Unknown Artist'}
          </p>

          {/* AUDIOMACK PLAYER */}
          {showEmbed && audiomackId ? (
            <iframe
              key={`audiomack-${audiomackId}`}
              src={
                `https://www.audiomack.com/embed/song/${encodeURIComponent(
                  audiomackId
                )}?background=0&light=0&autoplay=1`
              }
              title={
                track.title ||
                'Audiomack Player'
              }
              style={{
                width: '100%',
                height: 140,
                border: 'none',
                borderRadius: 10,
                display: 'block',
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

          {/* No Audiomack ID warning */}
          {showEmbed && !audiomackId && (
            <p
              style={{
                color: '#F87171',
                textAlign: 'center',
                fontSize: 12,
                marginTop: 12,
              }}
            >
              This track does not have an Audiomack
              player ID.
            </p>
          )}

        </div>

        {/* TIMER CARD */}
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
                  : status === 'completed'
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
            {status === 'completed'
              ? '✓'
              : `${remaining}s`}
          </p>

          <p
            style={{
              fontSize: 12,
              color: '#8A9BB0',
              marginTop: 4,
              marginBottom: 0,
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

        {/* COMPLETED */}
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
              onClick={() => {
                /*
                 * Keep the stored track until user leaves.
                 */
                router.push('/home');
              }}
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

          /* STOP BUTTON */
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

          /* START BUTTON */
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
                status === 'starting' ||
                status === 'completing'
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
              color:
                status === 'starting' ||
                status === 'completing'
                  ? '#8A9BB0'
                  : '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              cursor:
                status === 'starting' ||
                status === 'completing'
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
                status === 'starting' ||
                status === 'completing'
                  ? '#8A9BB0'
                  : '#fff'
              }
            />

            <span>
              {status === 'starting'
                ? 'Starting...'
                : status === 'completing'
                ? 'Completing...'
                : 'Start Streaming'}
            </span>
          </button>
        )}

        {/* ERROR */}
        {error && (
          <p
            style={{
              color: '#F87171',
              textAlign: 'center',
              marginTop: 16,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}

      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * PAGE WRAPPER
 * ---------------------------------------------------------
 *
 * Next.js 16 requires useSearchParams() to be rendered
 * underneath a Suspense boundary.
 */
export default function StreamPage() {
  return (
    <Suspense
      fallback={
        <Spinner fullscreen />
      }
    >
      <StreamContent />
    </Suspense>
  );
            }
