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
  Eye,
  AlertCircle,
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
    urlTrackId ? String(urlTrackId) : null
  );

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');

  const [showEmbed, setShowEmbed] =
    useState(false);

  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] =
    useState(null);

  const [error, setError] = useState('');
  const [rewarded, setRewarded] =
    useState(false);

  const [isVisible, setIsVisible] =
    useState(true);

  const [isFocused, setIsFocused] =
    useState(true);

  const [challengeRequired, setChallengeRequired] =
    useState(false);

  const [challengePassed, setChallengePassed] =
    useState(false);

  const [heartbeatCount, setHeartbeatCount] =
    useState(0);

  const heartbeatRef = useRef(null);
  const startingRef = useRef(false);
  const endingRef = useRef(false);
  const stoppingRef = useRef(false);

  /*
   * =======================================================
   * PAGE VISIBILITY
   * =======================================================
   */

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(
        document.visibilityState === 'visible'
      );
    }

    function updateFocus() {
      setIsFocused(
        document.hasFocus()
      );
    }

    updateVisibility();
    updateFocus();

    document.addEventListener(
      'visibilitychange',
      updateVisibility
    );

    window.addEventListener(
      'focus',
      updateFocus
    );

    window.addEventListener(
      'blur',
      updateFocus
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        updateVisibility
      );

      window.removeEventListener(
        'focus',
        updateFocus
      );

      window.removeEventListener(
        'blur',
        updateFocus
      );
    };
  }, []);

  /*
   * =======================================================
   * SYNC TRACK ID
   * =======================================================
   */

  useEffect(() => {
    if (urlTrackId) {
      setTrackId(String(urlTrackId));
    }
  }, [urlTrackId]);

  /*
   * =======================================================
   * LOAD TRACK
   * =======================================================
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
       * Display locally cached track
       * immediately.
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
        setLoading(!savedTrack);
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
          getTrackId(loadedTrack);

        setTrack(loadedTrack);

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
            setTrack(savedTrack);
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
  }, [urlTrackId]);

  /*
   * =======================================================
   * AUDIO EMBED
   * =======================================================
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
   * =======================================================
   * CLEAR HEARTBEAT
   * =======================================================
   */

  function clearHeartbeat() {
    if (heartbeatRef.current) {
      clearInterval(
        heartbeatRef.current
      );

      heartbeatRef.current = null;
    }
  }

  /*
   * =======================================================
   * UPDATE LOCAL WALLET
   * =======================================================
   */

  function updateStoredBalance(
    balance
  ) {
    if (
      balance === undefined ||
      balance === null ||
      typeof window ===
        'undefined'
    ) {
      return;
    }

    try {
      const storedUser =
        localStorage.getItem(
          'rewaiq_user'
        );

      if (!storedUser) return;

      const user =
        JSON.parse(
          storedUser
        );

      user.coin_balance =
        balance;

      localStorage.setItem(
        'rewaiq_user',
        JSON.stringify(user)
      );
    } catch (error) {
      console.warn(
        'Could not update stored balance:',
        error
      );
    }
  }

  /*
   * =======================================================
   * REFRESH WALLET
   * =======================================================
   */

  async function refreshWallet() {
    try {
      const response =
        await API.get(
          '/api/coins/balance'
        );

      const balance =
        response?.data?.balance ??
        response?.data
          ?.coin_balance ??
        response?.data?.coins ??
        response?.data?.user
          ?.coin_balance;

      if (
        balance !== undefined
      ) {
        updateStoredBalance(
          balance
        );
      }

      return balance;
    } catch (error) {
      console.warn(
        'Could not refresh wallet:',
        error
      );

      return null;
    }
  }

  /*
   * =======================================================
   * FINISH STREAM
   * =======================================================
   */

  async function finishStream(
    sid
  ) {
    if (
      endingRef.current
    ) {
      return;
    }

    endingRef.current = true;

    clearHeartbeat();

    try {
      setStatus(
        'completing'
      );

      const response =
        await API.post(
          '/api/streams/end',
          {
            session_id: sid,
          },
          {
            timeout: 15000,
          }
        );

      console.log(
        'Stream completed:',
        response?.data
      );

      const backendBalance =
        response?.data
          ?.coin_balance;

      if (
        backendBalance !==
        undefined
      ) {
        updateStoredBalance(
          backendBalance
        );
      }

      await refreshWallet();

      setRewarded(true);
      setSeconds(
        REQUIRED_SECONDS
      );

      setChallengeRequired(
        false
      );

      setStatus(
        'completed'
      );

      setSessionId(null);
    } catch (err) {
      console.error(
        'Finish stream error:',
        err
      );

      /*
       * If the backend says the
       * challenge is missing, keep
       * the player alive.
       */

      const message =
        err?.response?.data
          ?.message ||
        err?.message ||
        'Could not complete stream. Please try again.';

      const backendValidSeconds =
        err?.response?.data
          ?.valid_seconds;

      if (
        backendValidSeconds !==
        undefined
      ) {
        setSeconds(
          Number(
            backendValidSeconds
          )
        );
      }

      if (
        message
          .toLowerCase()
          .includes(
            'confirm'
          ) ||
        message
          .toLowerCase()
          .includes(
            'challenge'
          )
      ) {
        setChallengeRequired(
          true
        );

        setStatus(
          'streaming'
        );

        /*
         * Restart heartbeat.
         */

        startHeartbeat(sid);

        setError(
          'Please confirm that you are still listening.'
        );
      } else {
        setError(message);

        setStatus(
          'idle'
        );

        setShowEmbed(
          false
        );

        setSeconds(0);
        setSessionId(null);
      }
    } finally {
      endingRef.current = false;
    }
  }

  /*
   * =======================================================
   * HEARTBEAT
   * =======================================================
   */

  async function sendHeartbeat(
    sid
  ) {
    if (!sid) return;

    /*
     * Do not send another heartbeat
     * while the stream is completing.
     */

    if (
      endingRef.current
    ) {
      return;
    }

    try {
      const response =
        await API.post(
          '/api/streams/heartbeat',
          {
            session_id: sid,
            visible: isVisible,
            focused: isFocused,

            /*
             * The challenge is answered
             * by the button below.
             *
             * Once passed, we don't
             * need to send true again.
             */
            challenge_response:
              challengePassed
                ? true
                : false,
          },
          {
            timeout: 10000,
          }
        );

      const data =
        response?.data || {};

      const serverSeconds =
        Number(
          data.valid_seconds || 0
        );

      /*
       * IMPORTANT:
       * The server is authoritative.
       */

      setSeconds(
        Math.min(
          serverSeconds,
          REQUIRED_SECONDS
        )
      );

      setHeartbeatCount(
        (count) => count + 1
      );

      /*
       * Challenge became available.
       */

      if (
        data.challenge_required ===
        true
      ) {
        setChallengeRequired(
          true
        );
      }

      if (
        data.challenge_passed ===
        true
      ) {
        setChallengePassed(
          true
        );

        setChallengeRequired(
          false
        );
      }

      /*
       * Server says we are
       * completely verified.
       */

      if (
        data.complete === true &&
        data.valid_seconds >=
          REQUIRED_SECONDS
      ) {
        clearHeartbeat();

        await finishStream(
          sid
        );
      }
    } catch (err) {
      console.warn(
        'Heartbeat failed:',
        err
      );

      /*
       * Don't immediately kill the
       * session for one failed
       * heartbeat.
       *
       * The next heartbeat can
       * recover it.
       */

      if (
        err?.response?.status ===
          404 ||
        err?.response?.status ===
          400
      ) {
        const message =
          err?.response?.data
            ?.message;

        if (message) {
          setError(message);
        }
      }
    }
  }

  /*
   * =======================================================
   * START HEARTBEAT LOOP
   * =======================================================
   */

  function startHeartbeat(
    sid
  ) {
    clearHeartbeat();

    /*
     * Send immediately.
     */

    sendHeartbeat(sid);

    /*
     * Then every 5 seconds.
     */

    heartbeatRef.current =
      setInterval(() => {
        sendHeartbeat(sid);
      }, HEARTBEAT_INTERVAL_MS);
  }

  /*
   * =======================================================
   * START STREAM
   * =======================================================
   */

  async function handleStartStreaming() {
    if (
      startingRef.current
    ) {
      return;
    }

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

    startingRef.current = true;

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

      setHeartbeatCount(0);

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
        'Stream start response:',
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

      setStatus(
        'streaming'
      );

      /*
       * Start verified heartbeat.
       */

      startHeartbeat(
        newSessionId
      );
    } catch (err) {
      console.error(
        'Start stream error:',
        err
      );

      clearHeartbeat();

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

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          'Could not start stream. Please try again.'
      );
    } finally {
      startingRef.current = false;
    }
  }

  /*
   * =======================================================
   * STOP STREAM
   * =======================================================
   */

  async function handleStopStreaming() {
    if (
      stoppingRef.current
    ) {
      return;
    }

    if (
      status !== 'streaming' &&
      status !== 'starting'
    ) {
      return;
    }

    stoppingRef.current = true;

    clearHeartbeat();

    const sid =
      sessionId;

    try {
      if (sid) {
        await API.post(
          '/api/streams/end',
          {
            session_id: sid,
          },
          {
            timeout: 10000,
          }
        );
      }
    } catch (err) {
      /*
       * A failed/incomplete session
       * is expected to return 400.
       */

      console.warn(
        'Incomplete stream ended:',
        err
      );
    } finally {
      setStatus(
        'idle'
      );

      setShowEmbed(
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

      stoppingRef.current = false;
    }
  }

  /*
   * =======================================================
   * CHALLENGE
   * =======================================================
   */

  async function handleChallenge() {
    if (!sessionId) {
      return;
    }

    try {
      setError('');

      const response =
        await API.post(
          '/api/streams/heartbeat',
          {
            session_id:
              sessionId,

            visible:
              document.visibilityState ===
              'visible',

            focused:
              document.hasFocus(),

            challenge_response:
              true,
          },
          {
            timeout: 10000,
          }
        );

      const data =
        response?.data || {};

      if (
        data.challenge_passed ===
        true
      ) {
        setChallengePassed(
          true
        );

        setChallengeRequired(
          false
        );

        if (
          data.valid_seconds !==
          undefined
        ) {
          setSeconds(
            Math.min(
              Number(
                data.valid_seconds
              ),
              REQUIRED_SECONDS
            )
          );
        }

        /*
         * If 60 seconds are already
         * verified, finish immediately.
         */

        if (
          data.complete === true
        ) {
          clearHeartbeat();

          await finishStream(
            sessionId
          );
        }
      } else {
        setError(
          'Please remain on the streaming page and try again.'
        );
      }
    } catch (err) {
      console.error(
        'Challenge error:',
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          'Could not verify your response.'
      );
    }
  }

  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  useEffect(() => {
    return () => {
      clearHeartbeat();
    };
  }, []);

  /*
   * =======================================================
   * PAGE UNMOUNT / LEAVING
   * =======================================================
   *
   * We intentionally don't automatically call /end here.
   * The backend session will remain active until the user
   * explicitly stops it or starts another session.
   */

  /*
   * =======================================================
   * LOADING
   * =======================================================
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
   * =======================================================
   * NO TRACK
   * =======================================================
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

  /*
   * =======================================================
   * DISPLAY VALUES
   * =======================================================
   */

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
   * =======================================================
   * MAIN UI
   * =======================================================
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

                STREAMING
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
                src={
                  embedUrl
                }
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
            </div>
          ) : (
            <div
              style={{
                height:
                  252,

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
              <div
                style={{
                  width:
                    58,

                  height:
                    58,

                  borderRadius:
                    '50%',

                  background:
                    'rgba(74,158,255,0.12)',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  marginBottom:
                    12,
                }}
              >
                <Play
                  size={26}
                  color="#4a9eff"
                  fill="#4a9eff"
                />
              </div>

              <p
                style={{
                  margin:
                    0,

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

              <p
                style={{
                  margin:
                    '5px 0 0',

                  color:
                    '#71849B',

                  fontSize:
                    11,
                }}
              >
                Press Start Streaming below
              </p>
            </div>
          )}

          {showEmbed &&
            status ===
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

        {/* VERIFICATION STATUS */}

        {status ===
          'streaming' && (
          <div
            style={{
              marginBottom:
                16,

              padding:
                12,

              borderRadius:
                14,

              background:
                isVisible &&
                isFocused
                  ? 'rgba(74,222,128,0.07)'
                  : 'rgba(251,191,36,0.08)',

              border:
                isVisible &&
                isFocused
                  ? '1px solid rgba(74,222,128,0.14)'
                  : '1px solid rgba(251,191,36,0.16)',

              display:
                'flex',

              alignItems:
                'center',

              gap:
                10,
            }}
          >
            {isVisible &&
            isFocused ? (
              <Eye
                size={17}
                color="#4ADE80"
              />
            ) : (
              <AlertCircle
                size={17}
                color="#FBBF24"
              />
            )}

            <div
              style={{
                flex:
                  1,
              }}
            >
              <div
                style={{
                  fontSize:
                    12,

                  fontWeight:
                    700,
                }}
              >
                {isVisible &&
                isFocused
                  ? 'Listening session verified'
                  : 'Keep this page open'}
              </div>

              <div
                style={{
                  fontSize:
                    10,

                  color:
                    '#71849B',

                  marginTop:
                    2,
                }}
              >
                {isVisible &&
                isFocused
                  ? 'Your listening time is being verified.'
                  : 'Time is not being credited while the page is inactive.'}
              </div>
            </div>
          </div>
        )}

        {/* EARNING TIMER */}

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
                  seconds
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
            'starting'
              ? 'Starting your stream...'
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
            'streaming'
              ? 'Keep the music playing until your verified time reaches 60 seconds.'
              : status ===
                'completed'
              ? 'Your wallet has been updated.'
              : 'Start the stream and listen for 60 verified seconds to earn your reward.'}
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

          {status ===
            'streaming' && (
            <div
              style={{
                marginTop:
                  12,

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap:
                  6,

                color:
                  '#52677F',

                fontSize:
                  9,
              }}
            >
              <ShieldCheck
                size={12}
              />

              Server verified •{' '}
              {heartbeatCount}{' '}
              heartbeats
            </div>
          )}
        </section>

        {/* CHALLENGE */}

        {challengeRequired &&
          status ===
            'streaming' && (
            <section
              style={{
                marginBottom:
                  16,

                padding:
                  18,

                borderRadius:
                  18,

                background:
                  'linear-gradient(145deg, rgba(74,158,255,0.12), rgba(74,158,255,0.04))',

                border:
                  '1px solid rgba(74,158,255,0.20)',

                textAlign:
                  'center',
              }}
            >
              <div
                style={{
                  width:
                    48,

                  height:
                    48,

                  margin:
                    '0 auto 10px',

                  borderRadius:
                    '50%',

                  background:
                    'rgba(74,158,255,0.12)',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',
                }}
              >
                <ShieldCheck
                  size={25}
                  color="#4a9eff"
                />
              </div>

              <p
                style={{
                  margin:
                    '0 0 5px',

                  fontSize:
                    15,

                  fontWeight:
                    800,
                }}
              >
                Are you still listening?
              </p>

              <p
                style={{
                  margin:
                    '0 0 14px',

                  color:
                    '#71849B',

                  fontSize:
                    11,

                  lineHeight:
                    1.5,
                }}
              >
                Confirm that you are still
                listening to continue earning
                coins.
              </p>

              <button
                onClick={
                  handleChallenge
                }
                style={{
                  width:
                    '100%',

                  padding:
                    '13px',

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
                    13,

                  cursor:
                    'pointer',
                }}
              >
                Yes, I'm Still Listening
              </button>
            </section>
          )}

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

                    color:
                      '#fff',

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
                  Your wallet has been updated
                  successfully.
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

                boxShadow:
                  '0 10px 25px rgba(74,158,255,0.18)',
              }}
            >
              Back to Feed
            </button>
          </div>
        ) : status ===
          'streaming' ? (
          <button
            onClick={
              handleStopStreaming
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
                'pointer',

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

            Stop Streaming
          </button>
        ) : (
          <button
            onClick={
              handleStartStreaming
            }
            disabled={
              status ===
                'starting' ||
              status ===
                'completing'
            }
            style={{
              width:
                '100%',

              padding:
                '17px',

              borderRadius:
                15,

              border:
                'none',

              background:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #4a9eff, #2d6be4)',

              color:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? '#71849B'
                  : '#fff',

              fontWeight:
                800,

              fontSize:
                15,

              cursor:
                status ===
                  'starting' ||
                status ===
                  'completing'
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

              boxShadow:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? 'none'
                  : '0 10px 25px rgba(74,158,255,0.18)',
            }}
          >
            {status ===
            'starting' ? (
              <Loader2
                size={18}
                style={{
                  animation:
                    'spin 1s linear infinite',
                }}
              />
            ) : (
              <Play
                size={18}
                fill="#fff"
              />
            )}

            {status ===
            'starting'
              ? 'Starting...'
              : status ===
                'completing'
              ? 'Completing...'
              : 'Start Streaming'}
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

        {/* INFO */}

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
          Rewaiq verifies your listening
          activity through server-side
          heartbeats before awarding coins.
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
