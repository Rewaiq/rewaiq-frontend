'use client';

import {
  useState,
  useEffect,
  useRef,
  Suspense,
} from 'react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  ArrowLeft,
  Play,
  Square,
  CheckCircle,
  Music2,
  Volume2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;
const HEARTBEAT_INTERVAL_MS = 5000;

const STORAGE_KEY = 'rewaiq_stream_track';

function getTrackId(track) {
  if (!track) return null;

  return (
    track.id ||
    track._id ||
    track.track_id ||
    track.trackId ||
    null
  );
}

function saveTrackLocally(track) {
  if (typeof window === 'undefined' || !track) return;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(track)
    );
  } catch (error) {
    console.warn(
      'Could not save stream track:',
      error
    );
  }
}

function getSavedTrack() {
  if (typeof window === 'undefined') return null;

  try {
    const saved =
      sessionStorage.getItem(STORAGE_KEY);

    if (!saved) return null;

    return JSON.parse(saved);
  } catch (error) {
    console.warn(
      'Could not read saved stream track:',
      error
    );

    return null;
  }
}

function StreamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTrackId =
    searchParams.get('id') ||
    searchParams.get('track_id') ||
    searchParams.get('trackId');

  const [track, setTrack] = useState(null);

  const [trackId, setTrackId] = useState(
    urlTrackId
      ? String(urlTrackId)
      : null
  );

  const [loading, setLoading] =
    useState(true);

  const [status, setStatus] =
    useState('idle');

  const [showEmbed, setShowEmbed] =
    useState(false);

  const [waitingForPlayback, setWaitingForPlayback] =
    useState(false);

  const [seconds, setSeconds] =
    useState(0);

  const [sessionId, setSessionId] =
    useState(null);

  const [error, setError] =
    useState('');

  const [rewarded, setRewarded] =
    useState(false);

  const [challengeRequired, setChallengeRequired] =
    useState(false);

  const [challengePassed, setChallengePassed] =
    useState(false);

  const [challengeSubmitting, setChallengeSubmitting] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  const heartbeatRef = useRef(null);

  const heartbeatBusyRef =
    useRef(false);

  const endingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /*
   * -------------------------------------------------------
   * Sync URL track ID
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (urlTrackId) {
      setTrackId(String(urlTrackId));
    }
  }, [urlTrackId]);

  /*
   * -------------------------------------------------------
   * Load track
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      const savedTrack =
        getSavedTrack();

      const savedTrackId =
        getTrackId(savedTrack);

      const resolvedId =
        urlTrackId ||
        savedTrackId;

      if (!resolvedId) {
        if (!cancelled) {
          setLoading(false);
          setTrack(null);
          setError(
            'No track selected'
          );
        }

        return;
      }

      const normalizedId =
        String(resolvedId);

      setTrackId(normalizedId);

      /*
       * Show cached track immediately.
       */

      if (
        savedTrack &&
        savedTrackId &&
        String(savedTrackId) ===
          normalizedId
      ) {
        if (!cancelled) {
          setTrack(savedTrack);
          setLoading(false);
        }
      }

      try {
        setError('');

        const response =
          await API.get(
            `/api/tracks/${encodeURIComponent(
              normalizedId
            )}`
          );

        if (cancelled) return;

        const loadedTrack =
          response?.data?.track ||
          response?.data?.data ||
          response?.data;

        if (!loadedTrack) {
          throw new Error(
            'Track not found'
          );
        }

        const loadedId =
          getTrackId(
            loadedTrack
          );

        setTrack(
          loadedTrack
        );

        saveTrackLocally(
          loadedTrack
        );

        setTrackId(
          String(
            loadedId ||
              normalizedId
          )
        );
      } catch (err) {
        console.error(
          'Track loading error:',
          err
        );

        if (!cancelled) {
          if (
            savedTrack &&
            savedTrackId &&
            String(savedTrackId) ===
              normalizedId
          ) {
            setTrack(
              savedTrack
            );

            setError('');
          } else {
            setTrack(null);

            setError(
              err?.response?.data
                ?.message ||
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
  }, [urlTrackId]);

  /*
   * -------------------------------------------------------
   * Audiomack URL
   * -------------------------------------------------------
   */

  function getEmbedUrl() {
    if (!track) return null;

    if (track.embed_url) {
      return track.embed_url;
    }

    if (
      track.original_url &&
      track.original_url.includes(
        'audiomack.com'
      )
    ) {
      const parts =
        track.original_url.split(
          'audiomack.com/'
        )[1];

      if (parts) {
        return `https://audiomack.com/embed/${parts}`;
      }
    }

    return null;
  }

  const embedUrl =
    getEmbedUrl();

  /*
   * -------------------------------------------------------
   * Stop heartbeat
   * -------------------------------------------------------
   */

  function stopHeartbeat() {
    if (heartbeatRef.current) {
      clearInterval(
        heartbeatRef.current
      );

      heartbeatRef.current = null;
    }
  }

  /*
   * -------------------------------------------------------
   * Send heartbeat
   * -------------------------------------------------------
   */

  async function sendHeartbeat(
    challengeResponse = false
  ) {
    if (!sessionId) return;

    if (heartbeatBusyRef.current) {
      return;
    }

    heartbeatBusyRef.current =
      true;

    try {
      const response =
        await API.post(
          '/api/streams/heartbeat',
          {
            session_id:
              sessionId,

            /*
             * Browser visibility.
             */

            visible:
              document.visibilityState ===
              'visible',

            /*
             * Window focus.
             */

            focused:
              document.hasFocus(),

            /*
             * Only true when user
             * explicitly answers the
             * verification challenge.
             */

            challenge_response:
              challengeResponse,
          },
          {
            timeout: 10000,
          }
        );

      const data =
        response?.data || {};

      /*
       * Backend is authoritative.
       */

      const verified =
        Number(
          data.valid_seconds || 0
        );

      setSeconds(
        Math.min(
          verified,
          REQUIRED_SECONDS
        )
      );

      /*
       * Challenge became due.
       */

      if (
        data.challenge_required
      ) {
        setChallengeRequired(
          true
        );
      }

      if (
        data.challenge_passed
      ) {
        setChallengePassed(
          true
        );

        setChallengeRequired(
          false
        );
      }

      /*
       * Backend says everything
       * is verified.
       */

      if (
        data.complete === true
      ) {
        stopHeartbeat();

        await finishStream(
          sessionId
        );
      }
    } catch (err) {
      console.error(
        'Heartbeat error:',
        err
      );

      /*
       * Do not immediately fail
       * the session for one missed
       * heartbeat.
       */

    } finally {
      heartbeatBusyRef.current =
        false;
    }
  }

  /*
   * -------------------------------------------------------
   * Start heartbeat verification
   * -------------------------------------------------------
   */

  function startHeartbeat() {
    stopHeartbeat();

    /*
     * Immediately send one.
     */

    sendHeartbeat(false);

    /*
     * Then every 5 seconds.
     */

    heartbeatRef.current =
      setInterval(() => {
        sendHeartbeat(false);
      }, HEARTBEAT_INTERVAL_MS);
  }

  /*
   * -------------------------------------------------------
   * User confirms Audiomack Play
   * -------------------------------------------------------
   */

  function confirmPlaybackStarted() {
    if (!sessionId) {
      setError(
        'Streaming session was not created.'
      );

      return;
    }

    setError('');

    setWaitingForPlayback(
      false
    );

    setStatus(
      'streaming'
    );

    setSeconds(0);

    /*
     * IMPORTANT:
     *
     * This is the earliest point
     * where verification starts.
     */

    startHeartbeat();
  }

  /*
   * -------------------------------------------------------
   * Finish stream
   * -------------------------------------------------------
   */

  async function finishStream(
    sid
  ) {
    if (
      endingRef.current
    ) {
      return;
    }

    endingRef.current =
      true;

    stopHeartbeat();

    try {
      setStatus(
        'completing'
      );

      const response =
        await API.post(
          '/api/streams/end',
          {
            session_id:
              sid,
          },
          {
            timeout: 15000,
          }
        );

      const data =
        response?.data || {};

      console.log(
        'Stream completed:',
        data
      );

      /*
       * Update local wallet.
       */

      const backendBalance =
        data.coin_balance;

      if (
        backendBalance !==
          undefined &&
        typeof window !==
          'undefined'
      ) {
        const storedUser =
          localStorage.getItem(
            'rewaiq_user'
          );

        if (storedUser) {
          try {
            const user =
              JSON.parse(
                storedUser
              );

            user.coin_balance =
              backendBalance;

            localStorage.setItem(
              'rewaiq_user',
              JSON.stringify(
                user
              )
            );
          } catch (
            storageError
          ) {
            console.warn(
              'Could not update stored user:',
              storageError
            );
          }
        }
      }

      setRewarded(true);

      setSeconds(
        Number(
          data.verified_seconds ||
            REQUIRED_SECONDS
        )
      );

      setChallengePassed(
        true
      );

      setStatus(
        'completed'
      );

      setSessionId(
        null
      );
    } catch (err) {
      console.error(
        'Finish stream error:',
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          'Could not complete stream.'
      );

      setStatus(
        'idle'
      );
    } finally {
      endingRef.current =
        false;
    }
  }

  /*
   * -------------------------------------------------------
   * Challenge
   * -------------------------------------------------------
   */

  async function answerChallenge() {
    if (
      challengeSubmitting ||
      !sessionId
    ) {
      return;
    }

    setChallengeSubmitting(
      true
    );

    try {
      /*
       * Send challenge response
       * through heartbeat.
       */

      await sendHeartbeat(
        true
      );
    } catch (err) {
      console.error(
        'Challenge error:',
        err
      );
    } finally {
      setChallengeSubmitting(
        false
      );
    }
  }

  /*
   * -------------------------------------------------------
   * Start streaming
   * -------------------------------------------------------
   */

  async function handleStartStreaming() {
    if (starting) return;

    if (
      status !== 'idle' &&
      status !== 'completed'
    ) {
      return;
    }

    if (!track) {
      setError(
        'No track selected'
      );

      return;
    }

    const resolvedTrackId =
      getTrackId(track) ||
      trackId;

    if (!resolvedTrackId) {
      setError(
        'This track does not have a valid ID'
      );

      return;
    }

    if (!embedUrl) {
      setError(
        'This track does not have a playable audio source.'
      );

      return;
    }

    setStarting(true);

    try {
      setError('');

      setRewarded(false);

      setSeconds(0);

      setChallengeRequired(
        false
      );

      setChallengePassed(
        false
      );

      setWaitingForPlayback(
        false
      );

      stopHeartbeat();

      saveTrackLocally(
        track
      );

      /*
       * Show Audiomack.
       */

      setShowEmbed(true);

      setStatus(
        'starting'
      );

      const trackUrl =
        track.original_url ||
        embedUrl ||
        '';

      /*
       * Create backend session.
       */

      const response =
        await API.post(
          '/api/streams/start',
          {
            track_id:
              resolvedTrackId,

            track_url:
              trackUrl,
          },
          {
            timeout: 15000,
          }
        );

      console.log(
        'Stream start:',
        response?.data
      );

      const newSessionId =
        response?.data?.session
          ?.id ||
        response?.data
          ?.session_id ||
        response?.data?.id;

      if (!newSessionId) {
        throw new Error(
          'Stream session was not created'
        );
      }

      setSessionId(
        newSessionId
      );

      /*
       * IMPORTANT:
       *
       * Do NOT start the timer.
       * Do NOT start heartbeat
       * verification.
       *
       * Wait for user to press
       * Audiomack Play.
       */

      setStatus(
        'waiting_play'
      );

      setWaitingForPlayback(
        true
      );
    } catch (err) {
      console.error(
        'Start stream error:',
        err
      );

      stopHeartbeat();

      setStatus(
        'idle'
      );

      setShowEmbed(
        false
      );

      setSessionId(
        null
      );

      setSeconds(0);

      setWaitingForPlayback(
        false
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          'Could not start stream.'
      );
    } finally {
      setStarting(false);
    }
  }

  /*
   * -------------------------------------------------------
   * Stop streaming
   * -------------------------------------------------------
   */

  async function handleStopStreaming() {
    if (
      status !== 'streaming' &&
      status !== 'waiting_play' &&
      status !== 'starting'
    ) {
      return;
    }

    stopHeartbeat();

    /*
     * If session exists, end it.
     * Backend will fail it if it
     * doesn't have enough verified time.
     */

    if (sessionId) {
      try {
        await API.post(
          '/api/streams/end',
          {
            session_id:
              sessionId,
          },
          {
            timeout: 10000,
          }
        );
      } catch (err) {
        console.warn(
          'Incomplete stream ended:',
          err
        );
      }
    }

    setStatus(
      'idle'
    );

    setShowEmbed(
      false
    );

    setWaitingForPlayback(
      false
    );

    setSeconds(0);

    setSessionId(
      null
    );

    setRewarded(false);

    setChallengeRequired(
      false
    );

    setChallengePassed(
      false
    );
  }

  /*
   * -------------------------------------------------------
   * Visibility/focus listeners
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (
      status !== 'streaming'
    ) {
      return;
    }

    function handleVisibility() {
      /*
       * Do not immediately add time.
       *
       * Next heartbeat will tell
       * backend whether the page is
       * visible.
       */

      console.log(
        'Visibility:',
        document.visibilityState
      );
    }

    function handleFocus() {
      console.log(
        'Window focused'
      );
    }

    function handleBlur() {
      console.log(
        'Window blurred'
      );
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    window.addEventListener(
      'focus',
      handleFocus
    );

    window.addEventListener(
      'blur',
      handleBlur
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

      window.removeEventListener(
        'focus',
        handleFocus
      );

      window.removeEventListener(
        'blur',
        handleBlur
      );
    };
  }, [status]);

  /*
   * -------------------------------------------------------
   * Cleanup
   * -------------------------------------------------------
   */

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      stopHeartbeat();
    };
  }, []);

  /*
   * -------------------------------------------------------
   * Loading
   * -------------------------------------------------------
   */

  if (
    loading &&
    !track
  ) {
    return (
      <Spinner fullscreen />
    );
  }

  /*
   * -------------------------------------------------------
   * No track
   * -------------------------------------------------------
   */

  if (!track) {
    return (
      <div
        style={{
          minHeight:
            '100vh',
          background:
            '#07111F',
          display:
            'flex',
          flexDirection:
            'column',
          alignItems:
            'center',
          justifyContent:
            'center',
          color:
            '#8A9BB0',
          padding:
            24,
          textAlign:
            'center',
        }}
      >
        <p
          style={{
            marginBottom:
              20,
          }}
        >
          {error ||
            'No track selected'}
        </p>

        <button
          onClick={() =>
            router.back()
          }
          style={{
            padding:
              '12px 20px',
            borderRadius:
              10,
            border:
              'none',
            background:
              '#4a9eff',
            color:
              '#fff',
            fontWeight:
              700,
            cursor:
              'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const progress =
    Math.min(
      (seconds /
        REQUIRED_SECONDS) *
        100,
      100
    );

  const remaining =
    Math.max(
      REQUIRED_SECONDS -
        seconds,
      0
    );

  const title =
    track.title ||
    track.name ||
    'Untitled Track';

  const artist =
    track.artist_name ||
    track.artist ||
    track.artistName ||
    'Unknown Artist';

  /*
   * -------------------------------------------------------
   * UI
   * -------------------------------------------------------
   */

  return (
    <div
      style={{
        minHeight:
          '100vh',
        background:
          'linear-gradient(180deg, #07111F 0%, #0A1628 100%)',
        color:
          '#fff',
        paddingBottom:
          40,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          height:
            64,
          padding:
            '0 20px',
          display:
            'flex',
          alignItems:
            'center',
          gap:
            14,
          background:
            'rgba(13,31,60,0.92)',
          borderBottom:
            '1px solid rgba(255,255,255,0.06)',
          position:
            'sticky',
          top:
            0,
          zIndex:
            20,
          backdropFilter:
            'blur(12px)',
        }}
      >
        <button
          onClick={() =>
            router.back()
          }
          aria-label="Go back"
          style={{
            width:
              38,
            height:
              38,
            borderRadius:
              12,
            background:
              'rgba(255,255,255,0.06)',
            border:
              'none',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            cursor:
              'pointer',
          }}
        >
          <ArrowLeft
            size={21}
            color="#fff"
          />
        </button>

        <div>
          <div
            style={{
              fontSize:
                15,
              fontWeight:
                700,
            }}
          >
            Now Streaming
          </div>

          <div
            style={{
              fontSize:
                11,
              color:
                '#8A9BB0',
              marginTop:
                2,
            }}
          >
            Listen & earn coins
          </div>
        </div>
      </div>

      <main
        style={{
          width:
            '100%',
          maxWidth:
            520,
          margin:
            '0 auto',
          padding:
            '22px 18px',
        }}
      >
        {/* TRACK INFO */}

        <section
          style={{
            background:
              'linear-gradient(145deg, #102747, #0D1F3C)',
            borderRadius:
              22,
            padding:
              18,
            marginBottom:
              16,
            border:
              '1px solid rgba(255,255,255,0.06)',
            boxShadow:
              '0 16px 40px rgba(0,0,0,0.22)',
          }}
        >
          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap:
                14,
            }}
          >
            <div
              style={{
                width:
                  74,
                height:
                  74,
                flexShrink:
                  0,
                borderRadius:
                  16,
                overflow:
                  'hidden',
                background:
                  'linear-gradient(135deg, #193B68, #102440)',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
              }}
            >
              {track.cover_image ? (
                <img
                  src={
                    track.cover_image
                  }
                  alt=""
                  style={{
                    width:
                      '100%',
                    height:
                      '100%',
                    objectFit:
                      'cover',
                  }}
                />
              ) : (
                <Music2
                  size={30}
                  color="#4a9eff"
                />
              )}
            </div>

            <div
              style={{
                minWidth:
                  0,
                flex:
                  1,
              }}
            >
              <p
                style={{
                  fontSize:
                    18,
                  fontWeight:
                    800,
                  margin:
                    '0 0 5px',
                  whiteSpace:
                    'nowrap',
                  overflow:
                    'hidden',
                  textOverflow:
                    'ellipsis',
                }}
              >
                {title}
              </p>

              <p
                style={{
                  fontSize:
                    13,
                  color:
                    '#8A9BB0',
                  margin:
                    0,
                  whiteSpace:
                    'nowrap',
                  overflow:
                    'hidden',
                  textOverflow:
                    'ellipsis',
                }}
              >
                {artist}
              </p>
            </div>
          </div>
        </section>

        {/* AUDIO PLAYER */}

        <section
          style={{
            background:
              '#0D1F3C',
            borderRadius:
              22,
            padding:
              16,
            marginBottom:
              16,
            border:
              '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'space-between',
              marginBottom:
                12,
            }}
          >
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap:
                  7,
              }}
            >
              <Volume2
                size={15}
                color="#4a9eff"
              />

              <span
                style={{
                  fontSize:
                    12,
                  color:
                    '#8A9BB0',
                  fontWeight:
                    600,
                }}
              >
                AUDIO PLAYER
              </span>
            </div>

            {status ===
              'streaming' && (
              <span
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap:
                    5,
                  fontSize:
                    11,
                  color:
                    '#4ADE80',
                  fontWeight:
                    700,
                }}
              >
                <span
                  style={{
                    width:
                      6,
                    height:
                      6,
                    borderRadius:
                      '50%',
                    background:
                      '#4ADE80',
                    boxShadow:
                      '0 0 8px #4ADE80',
                  }}
                />

                VERIFIED
              </span>
            )}
          </div>

          {showEmbed &&
          embedUrl ? (
            <div
              style={{
                width:
                  '100%',
                height:
                  252,
                overflow:
                  'hidden',
                borderRadius:
                  16,
                background:
                  '#081322',
                border:
                  '1px solid rgba(255,255,255,0.05)',
                position:
                  'relative',
              }}
            >
              <iframe
                key={`${sessionId || 'pending'}-${embedUrl}`}
                src={embedUrl}
                title={`${title} - Audiomack`}
                scrolling="no"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{
                  position:
                    'absolute',
                  top:
                    0,
                  left:
                    0,
                  width:
                    '100%',
                  height:
                    '252px',
                  border:
                    'none',
                  display:
                    'block',
                }}
              />

              {/* PLAY POINTER */}

              {waitingForPlayback && (
                <div
                  style={{
                    position:
                      'absolute',
                    left:
                      18,
                    bottom:
                      18,
                    pointerEvents:
                      'none',
                    zIndex:
                      5,
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap:
                      8,
                    animation:
                      'pointToPlay 1s ease-in-out infinite',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        32,
                      filter:
                        'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
                    }}
                  >
                    👆
                  </span>

                  <span
                    style={{
                      background:
                        '#4a9eff',
                      color:
                        '#fff',
                      padding:
                        '7px 10px',
                      borderRadius:
                        9,
                      fontSize:
                        11,
                      fontWeight:
                        800,
                      boxShadow:
                        '0 6px 18px rgba(0,0,0,0.35)',
                    }}
                  >
                    TAP PLAY
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                height:
                  100,
                borderRadius:
                  16,
                background:
                  'linear-gradient(145deg, rgba(74,158,255,0.08), rgba(255,255,255,0.025))',
                border:
                  '1px solid rgba(255,255,255,0.05)',
                display:
                  'flex',
                flexDirection:
                  'column',
                alignItems:
                  'center',
                justifyContent:
                  'center',
              }}
            >
              <Music2
                size={28}
                color="#4a9eff"
              />

              <p
                style={{
                  margin:
                    '8px 0 0',
                  color:
                    '#fff',
                  fontSize:
                    14,
                  fontWeight:
                    700,
                }}
              >
                Ready to stream
              </p>
            </div>
          )}

          {/* ONBOARDING */}

          {waitingForPlayback && (
            <div
              style={{
                marginTop:
                  14,
                padding:
                  '18px 16px',
                borderRadius:
                  16,
                background:
                  'linear-gradient(135deg, rgba(74,158,255,0.14), rgba(74,158,255,0.05))',
                border:
                  '1px solid rgba(74,158,255,0.28)',
                textAlign:
                  'center',
              }}
            >
              <div
                style={{
                  fontSize:
                    34,
                  marginBottom:
                    6,
                  animation:
                    'bounceHand 1s ease-in-out infinite',
                }}
              >
                👆
              </div>

              <p
                style={{
                  margin:
                    '0 0 6px',
                  fontSize:
                    15,
                  fontWeight:
                    800,
                }}
              >
                Step 1 — Press Play
              </p>

              <p
                style={{
                  margin:
                    '0 auto 14px',
                  maxWidth:
                    340,
                  fontSize:
                    12,
                  lineHeight:
                    1.5,
                  color:
                    '#8A9BB0',
                }}
              >
                Tap the{' '}
                <strong
                  style={{
                    color:
                      '#fff',
                  }}
                >
                  Play
                </strong>{' '}
                button inside the
                Audiomack player above.
              </p>

              <div
                style={{
                  padding:
                    '9px 12px',
                  borderRadius:
                    10,
                  background:
                    'rgba(248,113,113,0.08)',
                  border:
                    '1px solid rgba(248,113,113,0.16)',
                  color:
                    '#FCA5A5',
                  fontSize:
                    11,
                  lineHeight:
                    1.45,
                  marginBottom:
                    14,
                }}
              >
                <AlertTriangle
                  size={13}
                  style={{
                    verticalAlign:
                      'middle',
                    marginRight:
                      5,
                  }}
                />

                Do not confirm until
                you have actually pressed
                Play.
              </div>

              <button
                onClick={
                  confirmPlaybackStarted
                }
                style={{
                  width:
                    '100%',
                  padding:
                    '14px',
                  borderRadius:
                    13,
                  border:
                    'none',
                  background:
                    'linear-gradient(135deg, #4a9eff, #2d6be4)',
                  color:
                    '#fff',
                  fontWeight:
                    800,
                  fontSize:
                    14,
                  cursor:
                    'pointer',
                  boxShadow:
                    '0 8px 20px rgba(74,158,255,0.18)',
                }}
              >
                ✓ I've Pressed Play — Start Verification
              </button>
            </div>
          )}

          {status ===
            'starting' && (
            <div
              style={{
                marginTop:
                  10,
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                gap:
                  7,
                color:
                  '#8A9BB0',
                fontSize:
                  11,
              }}
            >
              <Loader2
                size={13}
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />

              Preparing your stream...
            </div>
          )}
        </section>

        {/* CHALLENGE */}

        {challengeRequired &&
          !challengePassed && (
            <section
              style={{
                background:
                  'rgba(250,204,21,0.08)',
                border:
                  '1px solid rgba(250,204,21,0.25)',
                borderRadius:
                  18,
                padding:
                  18,
                marginBottom:
                  16,
                textAlign:
                  'center',
              }}
            >
              <ShieldCheck
                size={30}
                color="#FACC15"
              />

              <p
                style={{
                  margin:
                    '8px 0 5px',
                  fontSize:
                    15,
                  fontWeight:
                    800,
                }}
              >
                Quick listening check
              </p>

              <p
                style={{
                  margin:
                    '0 0 14px',
                  fontSize:
                    12,
                  color:
                    '#A7B4C5',
                  lineHeight:
                    1.5,
                }}
              >
                Are you still listening to
                the track?
              </p>

              <button
                onClick={
                  answerChallenge
                }
                disabled={
                  challengeSubmitting
                }
                style={{
                  width:
                    '100%',
                  padding:
                    '14px',
                  border:
                    'none',
                  borderRadius:
                    13,
                  background:
                    '#FACC15',
                  color:
                    '#111827',
                  fontWeight:
                    900,
                  cursor:
                    challengeSubmitting
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {challengeSubmitting
                  ? 'Verifying...'
                  : 'Yes, I’m Listening'}
              </button>
            </section>
          )}

        {/* TIMER */}

        <section
          style={{
            background:
              '#0D1F3C',
            borderRadius:
              22,
            padding:
              '24px 18px',
            marginBottom:
              16,
            border:
              '1px solid rgba(255,255,255,0.06)',
            textAlign:
              'center',
          }}
        >
          <div
            style={{
              width:
                148,
              height:
                148,
              margin:
                '0 auto 18px',
              borderRadius:
                '50%',
              background:
                `conic-gradient(
                  #4a9eff ${progress}%,
                  rgba(74,158,255,0.10) ${progress}% 100%
                )`,
              padding:
                7,
              transition:
                'background 1s linear',
              boxShadow:
                status ===
                'streaming'
                  ? '0 0 30px rgba(74,158,255,0.12)'
                  : 'none',
            }}
          >
            <div
              style={{
                width:
                  '100%',
                height:
                  '100%',
                borderRadius:
                  '50%',
                background:
                  '#0A1628',
                display:
                  'flex',
                flexDirection:
                  'column',
                alignItems:
                  'center',
                justifyContent:
                  'center',
              }}
            >
              <span
                style={{
                  fontSize:
                    34,
                  fontWeight:
                    900,
                  lineHeight:
                    1,
                }}
              >
                {status ===
                'completed'
                  ? '✓'
                  : remaining}
              </span>

              {status !==
                'completed' && (
                <span
                  style={{
                    fontSize:
                      11,
                    color:
                      '#71849B',
                    marginTop:
                      6,
                  }}
                >
                  verified seconds
                </span>
              )}
            </div>
          </div>

          <p
            style={{
              margin:
                '0 0 6px',
              fontSize:
                16,
              fontWeight:
                800,
            }}
          >
            {status ===
            'waiting_play'
              ? 'Waiting for playback'
              : status ===
                'streaming'
              ? 'Keep listening'
              : status ===
                'completing'
              ? 'Adding your coins...'
              : status ===
                'completed'
              ? 'Stream complete!'
              : '60 seconds to earn'}
          </p>

          <p
            style={{
              margin:
                0,
              color:
                '#71849B',
              fontSize:
                12,
              lineHeight:
                1.5,
            }}
          >
            {status ===
            'waiting_play'
              ? 'Press Play in Audiomack, then confirm below.'
              : status ===
                'streaming'
              ? 'Rewaiq is verifying your listening session.'
              : status ===
                'completed'
              ? 'Your wallet has been updated.'
              : 'Start the stream and complete the verified listening period.'}
          </p>

          <div
            style={{
              height:
                5,
              background:
                'rgba(255,255,255,0.06)',
              borderRadius:
                10,
              overflow:
                'hidden',
              marginTop:
                18,
            }}
          >
            <div
              style={{
                height:
                  '100%',
                width:
                  `${progress}%`,
                background:
                  '#4a9eff',
                borderRadius:
                  10,
                transition:
                  'width 1s linear',
              }}
            />
          </div>
        </section>

        {/* COMPLETED */}

        {status ===
        'completed' ? (
          <div>
            <div
              style={{
                padding:
                  16,
                borderRadius:
                  16,
                background:
                  'rgba(74,222,128,0.08)',
                border:
                  '1px solid rgba(74,222,128,0.16)',
                display:
                  'flex',
                alignItems:
                  'center',
                gap:
                  12,
                marginBottom:
                  14,
              }}
            >
              <CheckCircle
                size={28}
                color="#4ADE80"
              />

              <div>
                <p
                  style={{
                    margin:
                      0,
                    fontWeight:
                      800,
                    fontSize:
                      14,
                  }}
                >
                  Coins Earned!
                </p>

                <p
                  style={{
                    margin:
                      '3px 0 0',
                    color:
                      '#8A9BB0',
                    fontSize:
                      11,
                  }}
                >
                  Your wallet has been
                  updated successfully.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(
                  '/home'
                )
              }
              style={{
                width:
                  '100%',
                padding:
                  '16px',
                borderRadius:
                  15,
                border:
                  'none',
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color:
                  '#fff',
                fontWeight:
                  800,
                fontSize:
                  15,
                cursor:
                  'pointer',
              }}
            >
              Back to Feed
            </button>
          </div>
        ) : (
          <button
            onClick={
              handleStopStreaming
            }
            disabled={
              status ===
                'idle' ||
              status ===
                'completed'
            }
            style={{
              width:
                '100%',
              padding:
                '17px',
              borderRadius:
                15,
              background:
                'rgba(248,113,113,0.10)',
              border:
                '1px solid rgba(248,113,113,0.24)',
              color:
                '#F87171',
              fontWeight:
                800,
              fontSize:
                15,
              cursor:
                status ===
                  'idle'
                  ? 'not-allowed'
                  : 'pointer',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap:
                9,
            }}
          >
            <Square
              size={17}
              fill="#F87171"
            />

            Cancel Streaming
          </button>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginTop:
                14,
              padding:
                12,
              borderRadius:
                12,
              background:
                'rgba(248,113,113,0.08)',
              border:
                '1px solid rgba(248,113,113,0.15)',
            }}
          >
            <p
              style={{
                color:
                  '#F87171',
                textAlign:
                  'center',
                margin:
                  0,
                fontSize:
                  12,
                lineHeight:
                  1.5,
              }}
            >
              {error}
            </p>
          </div>
        )}

        <p
          style={{
            textAlign:
              'center',
            color:
              '#52677F',
            fontSize:
              10,
            lineHeight:
              1.5,
            margin:
              '18px 20px 0',
          }}
        >
          Rewaiq verifies your session
          using server-side heartbeats
          before awarding coins.
        </p>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounceHand {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes pointToPlay {
          0%,
          100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(8px);
          }
        }
      `}</style>
    </div>
  );
}

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
