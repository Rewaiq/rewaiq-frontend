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
  ArrowDown,
  Play,
  Square,
  CheckCircle,
  Music2,
  Volume2,
  Loader2,
  Hand,
  Camera,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Radio,
  MousePointer2,
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;
const HEARTBEAT_INTERVAL = 5000;
const STORAGE_KEY = 'rewaiq_stream_track';

// =========================================================
// TRACK HELPERS
// =========================================================

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
  if (
    typeof window === 'undefined' ||
    !track
  ) {
    return;
  }

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
  if (
    typeof window === 'undefined'
  ) {
    return null;
  }

  try {
    const saved =
      sessionStorage.getItem(
        STORAGE_KEY
      );

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

// =========================================================
// MAIN CONTENT
// =========================================================

function StreamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTrackId =
    searchParams.get('id') ||
    searchParams.get('track_id') ||
    searchParams.get('trackId');

  // -------------------------------------------------------
  // TRACK
  // -------------------------------------------------------

  const [track, setTrack] = useState(null);

  const [trackId, setTrackId] = useState(
    urlTrackId
      ? String(urlTrackId)
      : null
  );

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------

  const [loading, setLoading] =
    useState(true);

  const [status, setStatus] =
    useState('idle');

  const [error, setError] =
    useState('');

  const [showEmbed, setShowEmbed] =
    useState(false);

  // -------------------------------------------------------
  // VERIFICATION
  // -------------------------------------------------------

  const [playbackStarted, setPlaybackStarted] =
    useState(false);

  const [verifiedSeconds, setVerifiedSeconds] =
    useState(0);

  const [sessionId, setSessionId] =
    useState(null);

  const [rewarded, setRewarded] =
    useState(false);

  // -------------------------------------------------------
  // ONBOARDING
  //
  // STEP 1:
  // User presses Play inside Audiomack.
  //
  // STEP 2:
  // User confirms that music has started.
  //
  // Nothing auto-closes.
  // -------------------------------------------------------

  const [showOnboarding, setShowOnboarding] =
    useState(false);

  const [onboardingStep, setOnboardingStep] =
    useState(1);

  const [showScreenshotPrompt, setShowScreenshotPrompt] =
    useState(false);

  // -------------------------------------------------------
  // CHALLENGE
  // -------------------------------------------------------

  const [challengeVisible, setChallengeVisible] =
    useState(false);

  const [challengeSubmitting, setChallengeSubmitting] =
    useState(false);

  // -------------------------------------------------------
  // REFS
  // -------------------------------------------------------

  const sessionIdRef =
    useRef(null);

  const playbackStartedRef =
    useRef(false);

  const statusRef =
    useRef('idle');

  const heartbeatRef =
    useRef(null);

  const startingRef =
    useRef(false);

  const endingRef =
    useRef(false);

  const heartbeatBusyRef =
    useRef(false);

  // =======================================================
  // REF SYNCHRONIZATION
  // =======================================================

  useEffect(() => {
    sessionIdRef.current =
      sessionId;
  }, [sessionId]);

  useEffect(() => {
    playbackStartedRef.current =
      playbackStarted;
  }, [playbackStarted]);

  useEffect(() => {
    statusRef.current =
      status;
  }, [status]);

  // =======================================================
  // URL TRACK ID
  // =======================================================

  useEffect(() => {
    if (urlTrackId) {
      setTrackId(
        String(urlTrackId)
      );
    }
  }, [urlTrackId]);

  // =======================================================
  // LOAD TRACK
  // =======================================================

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

      setTrackId(
        normalizedId
      );

      // ---------------------------------------------------
      // USE CACHED TRACK IMMEDIATELY
      // ---------------------------------------------------

      if (
        savedTrack &&
        savedTrackId &&
        String(savedTrackId) ===
          normalizedId
      ) {
        if (!cancelled) {
          setTrack(
            savedTrack
          );

          setLoading(false);
        }
      }

      // ---------------------------------------------------
      // FETCH FRESH TRACK
      // ---------------------------------------------------

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

        setTrack(
          loadedTrack
        );

        saveTrackLocally(
          loadedTrack
        );

        const loadedId =
          getTrackId(
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

  // =======================================================
  // EMBED URL
  // =======================================================

  function getEmbedUrl() {
    if (!track) {
      return null;
    }

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
        return (
          `https://audiomack.com/embed/${parts}`
        );
      }
    }

    return null;
  }

  const embedUrl =
    getEmbedUrl();

  // =======================================================
  // HEARTBEAT CLEANUP
  // =======================================================

  function clearHeartbeat() {
    if (
      heartbeatRef.current
    ) {
      clearInterval(
        heartbeatRef.current
      );

      heartbeatRef.current =
        null;
    }
  }

  // =======================================================
  // PAGE STATE
  // =======================================================

  function getPageState() {
    if (
      typeof document ===
      'undefined'
    ) {
      return {
        visible: true,
        focused: true,
      };
    }

    return {
      visible:
        document.visibilityState ===
        'visible',

      focused:
        document.hasFocus(),
    };
  }

  // =======================================================
  // HEARTBEAT
  // =======================================================

  async function sendHeartbeat(
    challengeResponse = undefined
  ) {
    const currentSessionId =
      sessionIdRef.current;

    const currentPlaybackStarted =
      playbackStartedRef.current;

    if (
      !currentSessionId ||
      !currentPlaybackStarted ||
      heartbeatBusyRef.current
    ) {
      return null;
    }

    heartbeatBusyRef.current =
      true;

    try {
      const {
        visible,
        focused,
      } =
        getPageState();

      const payload = {
        session_id:
          currentSessionId,

        visible,

        focused,

        playback_started:
          true,
      };

      if (
        challengeResponse !==
        undefined
      ) {
        payload.challenge_response =
          challengeResponse;
      }

      const response =
        await API.post(
          '/api/streams/heartbeat',
          payload
        );

      const data =
        response?.data || {};

      if (
        typeof data.valid_seconds ===
        'number'
      ) {
        setVerifiedSeconds(
          Math.min(
            data.valid_seconds,
            REQUIRED_SECONDS
          )
        );
      }

      if (
        data.challenge_required &&
        !data.challenge_passed
      ) {
        setChallengeVisible(
          true
        );
      }

      if (
        data.complete
      ) {
        clearHeartbeat();

        await finishStream(
          currentSessionId
        );
      }

      return data;
    } catch (err) {
      console.warn(
        'Heartbeat failed:',
        err
      );

      return null;
    } finally {
      heartbeatBusyRef.current =
        false;
    }
  }

  // =======================================================
  // HEARTBEAT LOOP
  // =======================================================

  function startHeartbeatLoop() {
    clearHeartbeat();

    sendHeartbeat();

    heartbeatRef.current =
      setInterval(
        () => {
          sendHeartbeat();
        },
        HEARTBEAT_INTERVAL
      );
  }

  // =======================================================
  // FINISH STREAM
  // =======================================================

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

    clearHeartbeat();

    try {
      setStatus(
        'completing'
      );

      statusRef.current =
        'completing';

      const response =
        await API.post(
          '/api/streams/end',
          {
            session_id:
              sid,
          }
        );

      console.log(
        'Stream completed:',
        response?.data
      );

      const backendBalance =
        response?.data
          ?.coin_balance;

      // ---------------------------------------------------
      // UPDATE LOCAL USER
      // ---------------------------------------------------

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
              JSON.stringify(user)
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

      // ---------------------------------------------------
      // REFRESH WALLET
      // ---------------------------------------------------

      try {
        const balanceResponse =
          await API.get(
            '/api/coins/balance'
          );

        const newBalance =
          balanceResponse?.data?.balance ??
          balanceResponse?.data?.coin_balance ??
          balanceResponse?.data?.coins ??
          balanceResponse?.data?.user
            ?.coin_balance;

        if (
          newBalance !==
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
                newBalance;

              localStorage.setItem(
                'rewaiq_user',
                JSON.stringify(user)
              );
            } catch (
              storageError
            ) {
              console.warn(
                'Could not update stored wallet:',
                storageError
              );
            }
          }
        }
      } catch (
        balanceError
      ) {
        console.warn(
          'Could not refresh coin balance:',
          balanceError
        );
      }

      // ---------------------------------------------------
      // FINAL UI
      // ---------------------------------------------------

      setVerifiedSeconds(
        REQUIRED_SECONDS
      );

      setRewarded(
        true
      );

      setStatus(
        'completed'
      );

      statusRef.current =
        'completed';

      setShowScreenshotPrompt(
        false
      );

      setChallengeVisible(
        false
      );

      setShowOnboarding(
        false
      );

      setOnboardingStep(
        1
      );

      sessionIdRef.current =
        null;

      playbackStartedRef.current =
        false;

      setSessionId(
        null
      );

      setPlaybackStarted(
        false
      );
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

      setStatus(
        'idle'
      );

      statusRef.current =
        'idle';

      setShowEmbed(
        false
      );

      setSessionId(
        null
      );

      sessionIdRef.current =
        null;

      setPlaybackStarted(
        false
      );

      playbackStartedRef.current =
        false;

      setVerifiedSeconds(
        0
      );
    } finally {
      endingRef.current =
        false;
    }
  }

  // =======================================================
  // START STREAMING
  // =======================================================

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

    startingRef.current =
      true;

    try {
      setError('');

      setRewarded(
        false
      );

      setVerifiedSeconds(
        0
      );

      setPlaybackStarted(
        false
      );

      playbackStartedRef.current =
        false;

      setChallengeVisible(
        false
      );

      saveTrackLocally(
        track
      );

      setStatus(
        'starting'
      );

      statusRef.current =
        'starting';

      const trackUrl =
        track.original_url ||
        embedUrl ||
        '';

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

      const newSessionId =
        response?.data?.session?.id ||
        response?.data?.session_id ||
        response?.data?.id;

      if (!newSessionId) {
        throw new Error(
          'Stream session was not created'
        );
      }

      sessionIdRef.current =
        newSessionId;

      setSessionId(
        newSessionId
      );

      // ---------------------------------------------------
      // SHOW PLAYER
      // ---------------------------------------------------

      setShowEmbed(
        true
      );

      // ---------------------------------------------------
      // IMPORTANT:
      // DO NOT AUTO ADVANCE OR CLOSE.
      // ---------------------------------------------------

      setStatus(
        'awaiting_play'
      );

      statusRef.current =
        'awaiting_play';

      setOnboardingStep(
        1
      );

      setShowOnboarding(
        true
      );
    } catch (err) {
      console.error(
        'Start stream error:',
        err
      );

      setStatus(
        'idle'
      );

      statusRef.current =
        'idle';

      setShowEmbed(
        false
      );

      setSessionId(
        null
      );

      sessionIdRef.current =
        null;

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Could not start stream. Please try again.'
      );
    } finally {
      startingRef.current =
        false;
    }
  }

  // =======================================================
  // STEP 1
  // =======================================================

  function handleAcknowledgePlayTap() {
    if (
      !showOnboarding ||
      onboardingStep !== 1
    ) {
      return;
    }

    // Explicit user action.
    // Nothing automatically closes.
    setOnboardingStep(
      2
    );
  }

  // =======================================================
  // STEP 2
  // =======================================================

  function handlePlaybackConfirmation() {
    const currentSession =
      sessionIdRef.current;

    if (!currentSession) {
      setError(
        'Streaming session is not ready.'
      );

      return;
    }

    // Explicitly close onboarding only
    // after Step 2 is confirmed.
    setShowOnboarding(
      false
    );

    setOnboardingStep(
      1
    );

    playbackStartedRef.current =
      true;

    setPlaybackStarted(
      true
    );

    statusRef.current =
      'streaming';

    setStatus(
      'streaming'
    );

    setError('');

    startHeartbeatLoop();
  }

  // =======================================================
  // CHALLENGE
  // =======================================================

  async function handleChallenge() {
    if (
      challengeSubmitting ||
      !sessionIdRef.current
    ) {
      return;
    }

    setChallengeSubmitting(
      true
    );

    try {
      const result =
        await sendHeartbeat(
          true
        );

      if (
        result?.challenge_passed
      ) {
        setChallengeVisible(
          false
        );

        setError('');
      } else {
        setError(
          'Please confirm that you are still listening.'
        );
      }
    } finally {
      setChallengeSubmitting(
        false
      );
    }
  }

  // =======================================================
  // STOP STREAMING
  // =======================================================

  async function handleStopStreaming() {
    clearHeartbeat();

    const currentSession =
      sessionIdRef.current;

    if (
      currentSession
    ) {
      try {
        await API.post(
          '/api/streams/end',
          {
            session_id:
              currentSession,
          }
        );
      } catch (err) {
        console.warn(
          'Could not end stream:',
          err
        );
      }
    }

    sessionIdRef.current =
      null;

    playbackStartedRef.current =
      false;

    setStatus(
      'idle'
    );

    statusRef.current =
      'idle';

    setShowEmbed(
      false
    );

    setSessionId(
      null
    );

    setPlaybackStarted(
      false
    );

    setVerifiedSeconds(
      0
    );

    setRewarded(
      false
    );

    setChallengeVisible(
      false
    );

    setShowOnboarding(
      false
    );

    setOnboardingStep(
      1
    );
  }

  // =======================================================
  // VISIBILITY
  // =======================================================

  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState !==
        'visible'
      ) {
        return;
      }

      if (
        statusRef.current ===
          'streaming' &&
        playbackStartedRef.current
      ) {
        sendHeartbeat();
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, []);

  // =======================================================
  // CLEANUP
  // =======================================================

  useEffect(() => {
    return () => {
      clearHeartbeat();

      sessionIdRef.current =
        null;

      playbackStartedRef.current =
        false;
    };
  }, []);

  // =======================================================
  // DISPLAY VALUES
  // =======================================================

  const progress =
    Math.min(
      (
        verifiedSeconds /
        REQUIRED_SECONDS
      ) * 100,
      100
    );

  const remaining =
    Math.max(
      REQUIRED_SECONDS -
        verifiedSeconds,
      0
    );

  const title =
    track?.title ||
    track?.name ||
    'Untitled Track';

  const artist =
    track?.artist_name ||
    track?.artist ||
    track?.artistName ||
    'Unknown Artist';

  // =======================================================
  // LOADING
  // =======================================================

  if (
    loading &&
    !track
  ) {
    return (
      <Spinner fullscreen />
    );
  }

  // =======================================================
  // NO TRACK
  // =======================================================

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
        <p>
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

  // =======================================================
  // MAIN UI
  // =======================================================

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

        position:
          'relative',
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header
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
            'rgba(13,31,60,0.96)',

          borderBottom:
            '1px solid rgba(255,255,255,0.06)',

          position:
            'sticky',

          top:
            0,

          zIndex:
            500,

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
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main
        style={{
          width:
            '100%',

          maxWidth:
            520,

          margin:
            '0 auto',

          padding:
            '16px 16px',

          position:
            'relative',
        }}
      >
        {/* =================================================
            TRACK INFO
        ================================================= */}

        <section
          style={{
            background:
              'linear-gradient(145deg, #102747, #0D1F3C)',

            borderRadius:
              18,

            padding:
              14,

            marginBottom:
              10,

            border:
              '1px solid rgba(255,255,255,0.06)',

            boxShadow:
              '0 12px 30px rgba(0,0,0,0.18)',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                12,
            }}
          >
            <div
              style={{
                width:
                  62,

                height:
                  62,

                flexShrink:
                  0,

                borderRadius:
                  14,

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
                  size={27}
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
                    16,

                  fontWeight:
                    800,

                  margin:
                    '0 0 3px',

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
                    12,

                  color:
                    '#8A9BB0',

                  margin:
                    0,
                }}
              >
                {artist}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            PLAYER
        ================================================= */}

        <section
          className={
            showOnboarding &&
            onboardingStep === 1
              ? 'player-highlight'
              : ''
          }
          style={{
            background:
              '#0D1F3C',

            borderRadius:
              18,

            padding:
              12,

            marginBottom:
              10,

            border:
              showOnboarding &&
              onboardingStep === 1
                ? '1px solid rgba(74,158,255,0.85)'
                : '1px solid rgba(255,255,255,0.06)',

            boxShadow:
              showOnboarding &&
              onboardingStep === 1
                ? '0 0 0 2px rgba(74,158,255,0.12), 0 0 30px rgba(74,158,255,0.24)'
                : 'none',

            position:
              'relative',

            zIndex:
              showOnboarding &&
              onboardingStep === 1
                ? 450
                : 1,
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
                8,
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
                    10,

                  color:
                    '#8A9BB0',

                  fontWeight:
                    700,

                  letterSpacing:
                    '0.04em',
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
                    10,

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
              className="audiomack-player-wrap"
              style={{
                width:
                  '100%',

                height:
                  252,

                overflow:
                  'hidden',

                borderRadius:
                  14,

                background:
                  '#081322',

                border:
                  '1px solid rgba(255,255,255,0.05)',

                position:
                  'relative',
              }}
            >
              <iframe
                key={
                  `${sessionId || 'pending'}-${embedUrl}`
                }
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

                  zIndex:
                    2,
                }}
              />

              {/* =========================================
                  STEP 1 GUIDE
              ========================================= */}

              {showOnboarding &&
                onboardingStep === 1 && (
                <div
                  className="step-one-guide"
                  style={{
                    position:
                      'absolute',

                    inset:
                      0,

                    zIndex:
                      20,

                    pointerEvents:
                      'none',
                  }}
                >
                  {/* TOP GUIDE */}

                  <div
                    className="guide-banner"
                    style={{
                      position:
                        'absolute',

                      top:
                        9,

                      left:
                        9,

                      right:
                        9,

                      pointerEvents:
                        'none',
                    }}
                  >
                    <div
                      style={{
                        background:
                          'rgba(3,10,22,0.96)',

                        border:
                          '1px solid rgba(74,158,255,0.65)',

                        borderRadius:
                          12,

                        padding:
                          '8px 10px',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          9,

                        boxShadow:
                          '0 8px 22px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div
                        className="guide-hand"
                        style={{
                          width:
                            29,

                          height:
                            29,

                          flexShrink:
                            0,

                          borderRadius:
                            9,

                          background:
                            'rgba(74,158,255,0.14)',

                          display:
                            'flex',

                          alignItems:
                            'center',

                          justifyContent:
                            'center',
                        }}
                      >
                        <Hand
                          size={16}
                          color="#4a9eff"
                        />
                      </div>

                      <div
                        style={{
                          minWidth:
                            0,

                          flex:
                            1,
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              10,

                            fontWeight:
                              900,

                            lineHeight:
                              1.2,

                            color:
                              '#fff',
                          }}
                        >
                          STEP 1 · PRESS PLAY
                        </div>

                        <div
                          style={{
                            fontSize:
                              8.5,

                            color:
                              '#91A6BE',

                            marginTop:
                              2,

                            lineHeight:
                              1.2,
                          }}
                        >
                          Tap the Play button in the player
                        </div>
                      </div>

                      <div
                        className="tap-badge"
                        style={{
                          padding:
                            '5px 8px',

                          borderRadius:
                            7,

                          background:
                            '#4a9eff',

                          color:
                            '#fff',

                          fontSize:
                            9,

                          fontWeight:
                            900,

                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        TAP PLAY
                      </div>
                    </div>
                  </div>

                  {/* SHARP POINTER */}

                  <div
                    className="sharp-pointer"
                    style={{
                      position:
                        'absolute',

                      left:
                        '7%',

                      bottom:
                        '12%',

                      width:
                        95,

                      height:
                        100,
                    }}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      width="100%"
                      height="100%"
                      style={{
                        overflow:
                          'visible',
                      }}
                    >
                      {/* Arrow shadow */}

                      <path
                        d="M82 12 C68 18 42 30 18 67"
                        fill="none"
                        stroke="rgba(0,0,0,0.55)"
                        strokeWidth="7"
                        strokeLinecap="round"
                      />

                      {/* Main arrow */}

                      <path
                        d="M82 12 C68 18 42 30 18 67"
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      {/* Sharp arrow head */}

                      <path
                        d="M18 67 L20 48"
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      <path
                        d="M18 67 L37 63"
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      {/* Arrow head highlight */}

                      <circle
                        cx="18"
                        cy="67"
                        r="4"
                        fill="#4a9eff"
                      />
                    </svg>
                  </div>

                  {/* TARGET RING */}

                  <div
                    className="play-target-ring"
                    style={{
                      position:
                        'absolute',

                      left:
                        '2.8%',

                      bottom:
                        '7%',

                      width:
                        66,

                      height:
                        66,

                      borderRadius:
                        '50%',

                      border:
                        '3px solid #4a9eff',

                      boxShadow:
                        '0 0 0 5px rgba(74,158,255,0.14), 0 0 22px rgba(74,158,255,0.8)',

                      pointerEvents:
                        'none',
                    }}
                  />

                  {/* CLICK DOT */}

                  <div
                    className="click-dot"
                    style={{
                      position:
                        'absolute',

                      left:
                        'calc(2.8% + 28px)',

                      bottom:
                        'calc(7% + 28px)',

                      width:
                        10,

                      height:
                        10,

                      borderRadius:
                        '50%',

                      background:
                        '#fff',

                      boxShadow:
                        '0 0 0 5px rgba(74,158,255,0.3), 0 0 15px #4a9eff',
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                height:
                  90,

                borderRadius:
                  14,

                background:
                  'linear-gradient(145deg, rgba(74,158,255,0.08), rgba(255,255,255,0.025))',

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
                    '7px 0 0',

                  fontSize:
                    12,
                }}
              >
                Ready to stream
              </p>
            </div>
          )}
        </section>

        {/* =================================================
            ONBOARDING CARD
        ================================================= */}

        {status ===
          'awaiting_play' && (
          <section
            className={
              onboardingStep === 2
                ? 'step-two-card'
                : 'step-one-confirm-card'
            }
            style={{
              background:
                onboardingStep === 2
                  ? 'linear-gradient(145deg, #122B4B, #0D2039)'
                  : 'rgba(255,255,255,0.035)',

              border:
                onboardingStep === 2
                  ? '1px solid rgba(74,158,255,0.55)'
                  : '1px solid rgba(255,255,255,0.07)',

              borderRadius:
                16,

              padding:
                13,

              marginBottom:
                10,

              textAlign:
                'center',

              position:
                'relative',

              zIndex:
                onboardingStep === 2
                  ? 450
                  : 451,

              boxShadow:
                onboardingStep === 2
                  ? '0 12px 30px rgba(0,0,0,0.3), 0 0 25px rgba(74,158,255,0.18)'
                  : 'none',
            }}
          >
            {/* STEP INDICATOR */}

            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap:
                  5,

                marginBottom:
                  8,
              }}
            >
              <span
                className={
                  onboardingStep === 1
                    ? 'active-step-dot'
                    : 'done-step-dot'
                }
              >
                {onboardingStep === 1
                  ? '1'
                  : '✓'}
              </span>

              <span
                className="step-line"
              />

              <span
                className={
                  onboardingStep === 2
                    ? 'active-step-dot'
                    : 'inactive-step-dot'
                }
              >
                2
              </span>
            </div>

            {/* STEP 1 */}

            {onboardingStep === 1 ? (
              <>
                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'center',

                    marginBottom:
                      5,
                  }}
                >
                  <MousePointer2
                    size={22}
                    color="#4a9eff"
                  />
                </div>

                <p
                  style={{
                    margin:
                      '2px 0 3px',

                    fontWeight:
                      900,

                    fontSize:
                      14,
                  }}
                >
                  Press Play in the player
                </p>

                <p
                  style={{
                    margin:
                      '0 auto 9px',

                    maxWidth:
                      330,

                    color:
                      '#8A9BB0',

                    fontSize:
                      10.5,

                    lineHeight:
                      1.4,
                  }}
                >
                  Tap the Play button above.
                  Once the music starts, come back here.
                </p>

                <button
                  type="button"
                  onClick={
                    handleAcknowledgePlayTap
                  }
                  style={{
                    width:
                      '100%',

                    padding:
                      '12px',

                    borderRadius:
                      12,

                    border:
                      'none',

                    background:
                      'linear-gradient(135deg, #4a9eff, #2d6be4)',

                    color:
                      '#fff',

                    fontWeight:
                      900,

                    fontSize:
                      12,

                    cursor:
                      'pointer',

                    boxShadow:
                      '0 7px 18px rgba(45,107,228,0.32)',
                  }}
                >
                  ✓ I've Pressed Play
                </button>
              </>
            ) : (
              /* STEP 2 */

              <>
                <div
                  className="step2-icon"
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'center',

                    marginBottom:
                      4,
                  }}
                >
                  <Radio
                    size={25}
                    color="#4a9eff"
                  />
                </div>

                <div
                  style={{
                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap:
                      5,

                    padding:
                      '3px 8px',

                    borderRadius:
                      999,

                    background:
                      'rgba(74,158,255,0.13)',

                    color:
                      '#7DBBFF',

                    fontSize:
                      8.5,

                    fontWeight:
                      900,

                    marginBottom:
                      5,
                  }}
                >
                  STEP 2 · START VERIFICATION
                </div>

                <p
                  style={{
                    margin:
                      '2px 0 3px',

                    fontWeight:
                      900,

                    fontSize:
                      14,
                  }}
                >
                  Is the music playing?
                </p>

                <p
                  style={{
                    margin:
                      '0 auto 7px',

                    maxWidth:
                      330,

                    color:
                      '#8A9BB0',

                    fontSize:
                      10.5,

                    lineHeight:
                      1.4,
                  }}
                >
                  Confirm below to start your
                  60-second verified listening session.
                </p>

                <div
                  className="step2-arrow"
                  style={{
                    height:
                      20,

                    display:
                      'flex',

                    justifyContent:
                      'center',

                    alignItems:
                      'center',

                    color:
                      '#4a9eff',
                  }}
                >
                  <ArrowDown
                    size={20}
                    strokeWidth={3}
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    handlePlaybackConfirmation
                  }
                  style={{
                    width:
                      '100%',

                    padding:
                      '12px',

                    borderRadius:
                      12,

                    border:
                      'none',

                    background:
                      'linear-gradient(135deg, #4a9eff, #2d6be4)',

                    color:
                      '#fff',

                    fontWeight:
                      900,

                    fontSize:
                      12,

                    cursor:
                      'pointer',

                    boxShadow:
                      '0 8px 20px rgba(45,107,228,0.35)',
                  }}
                >
                  ✓ I've Started Playing
                </button>
              </>
            )}
          </section>
        )}

        {/* =================================================
            STREAMING STATUS
        ================================================= */}

        {status ===
          'streaming' && (
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                8,

              padding:
                '8px 11px',

              marginBottom:
                10,

              borderRadius:
                10,

              background:
                'rgba(74,222,128,0.07)',

              border:
                '1px solid rgba(74,222,128,0.13)',
            }}
          >
            <Eye
              size={14}
              color="#4ADE80"
            />

            <span
              style={{
                fontSize:
                  10,

                color:
                  '#9DB0C7',
              }}
            >
              Your listening time is being verified by Rewaiq.
            </span>
          </div>
        )}

        {/* =================================================
            TIMER
        ================================================= */}

        <section
          style={{
            background:
              '#0D1F3C',

            borderRadius:
              18,

            padding:
              '18px 15px',

            marginBottom:
              10,

            border:
              '1px solid rgba(255,255,255,0.06)',

            textAlign:
              'center',
          }}
        >
          <div
            style={{
              width:
                132,

              height:
                132,

              margin:
                '0 auto 12px',

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
                    31,

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
                      9,

                    color:
                      '#71849B',

                    marginTop:
                      5,
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
                '0 0 4px',

              fontSize:
                14,

              fontWeight:
                800,
            }}
          >
            {status ===
              'starting'
              ? 'Preparing stream...'
              : status ===
                'awaiting_play'
              ? onboardingStep === 1
                ? 'Press Play to begin'
                : 'Confirm playback'
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
                10.5,

              lineHeight:
                1.45,
            }}
          >
            {status ===
              'streaming'
              ? 'Keep the music playing and keep this page visible.'
              : status ===
                'awaiting_play'
              ? onboardingStep === 1
                ? 'Your earning time has not started yet.'
                : 'Tap the confirmation button to begin verified listening.'
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
                13,
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

        {/* =================================================
            SCREENSHOT PROMPT
        ================================================= */}

        {showScreenshotPrompt &&
          status ===
            'streaming' && (
          <section
            style={{
              padding:
                12,

              borderRadius:
                14,

              background:
                'rgba(255,255,255,0.04)',

              border:
                '1px solid rgba(255,255,255,0.07)',

              marginBottom:
                10,
            }}
          >
            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'flex-start',

                gap:
                  9,
              }}
            >
              <Camera
                size={21}
                color="#4a9eff"
              />

              <div>
                <p
                  style={{
                    margin:
                      0,

                    fontSize:
                      12,

                    fontWeight:
                      800,
                  }}
                >
                  Quick verification
                </p>

                <p
                  style={{
                    margin:
                      '3px 0 0',

                    color:
                      '#8A9BB0',

                    fontSize:
                      9.5,

                    lineHeight:
                      1.45,
                  }}
                >
                  If requested during onboarding,
                  take a screenshot showing the
                  Audiomack player.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        {status ===
          'completed' ? (
          <div>
            <div
              style={{
                padding:
                  13,

                borderRadius:
                  14,

                background:
                  'rgba(74,222,128,0.08)',

                border:
                  '1px solid rgba(74,222,128,0.16)',

                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  10,

                marginBottom:
                  10,
              }}
            >
              <CheckCircle
                size={26}
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
                      12.5,
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
                      9.5,
                  }}
                >
                  Your wallet has been updated successfully.
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
                '14px',

              borderRadius:
                13,

              background:
                'rgba(248,113,113,0.10)',

              border:
                '1px solid rgba(248,113,113,0.24)',

              color:
                '#F87171',

              fontWeight:
                800,

              fontSize:
                13,

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                8,

              cursor:
                'pointer',
            }}
          >
            <Square
              size={15}
              fill="#F87171"
            />

            Stop Streaming
          </button>
        ) : status ===
          'awaiting_play' ? (
          <div
            style={{
              padding:
                '10px 11px',

              borderRadius:
                12,

              background:
                'rgba(255,255,255,0.03)',

              border:
                '1px solid rgba(255,255,255,0.05)',

              display:
                'flex',

              alignItems:
                'center',

              gap:
                8,
            }}
          >
            {onboardingStep === 1 ? (
              <Hand
                size={15}
                color="#4a9eff"
              />
            ) : (
              <AlertTriangle
                size={15}
                color="#FBBF24"
              />
            )}

            <span
              style={{
                fontSize:
                  9.5,

                color:
                  '#9DB0C7',

                lineHeight:
                  1.45,
              }}
            >
              {onboardingStep === 1
                ? 'Tap Play in the player, then press "I\'ve Pressed Play" above.'
                : 'Confirm "I\'ve Started Playing" above to begin your verified stream.'}
            </span>
          </div>
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
                13,

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                8,

              opacity:
                status ===
                  'starting'
                  ? 0.6
                  : 1,

              cursor:
                status ===
                  'starting'
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {status ===
              'starting' ? (
              <Loader2
                size={17}
                className="spin"
              />
            ) : (
              <Play
                size={17}
                fill="#fff"
              />
            )}

            {status ===
              'starting'
              ? 'Preparing...'
              : 'Start Streaming'}
          </button>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              marginTop:
                10,

              padding:
                10,

              borderRadius:
                10,

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
                  10.5,

                lineHeight:
                  1.45,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* =================================================
            INFO
        ================================================= */}

        <p
          style={{
            textAlign:
              'center',

            color:
              '#52677F',

            fontSize:
              8.5,

            lineHeight:
              1.5,

            margin:
              '12px 16px 0',
          }}
        >
          Your listening time is being verified by Rewaiq.
          Keep this page visible and keep the music playing.
        </p>
      </main>

      {/* ===================================================
          ONBOARDING LOCK

          This prevents the rest of the page from being
          interacted with while onboarding is active.

          The highlighted player/card are deliberately
          above the lock.
      =================================================== */}

      {showOnboarding && (
        <div
          className="onboarding-page-lock"
          aria-hidden="true"
          style={{
            position:
              'fixed',

            inset:
              0,

            zIndex:
              400,

            pointerEvents:
              'auto',

            background:
              'rgba(2,7,17,0.70)',

            backdropFilter:
              'blur(2px)',

            WebkitBackdropFilter:
              'blur(2px)',
          }}
        />
      )}

      {/* ===================================================
          STEP 1 CONFIRM BUTTON
          
          This is rendered above the lock so it remains
          clickable while the rest of the page stays locked.
      =================================================== */}

      {showOnboarding &&
        onboardingStep === 1 && (
        <div
          className="floating-step1-confirm"
          style={{
            position:
              'fixed',

            left:
              '50%',

            bottom:
              22,

            transform:
              'translateX(-50%)',

            width:
              'calc(100% - 32px)',

            maxWidth:
              488,

            zIndex:
              550,

            pointerEvents:
              'auto',
          }}
        >
          <div
            style={{
              background:
                'rgba(5,14,29,0.98)',

              border:
                '1px solid rgba(74,158,255,0.5)',

              borderRadius:
                15,

              padding:
                10,

              boxShadow:
                '0 18px 45px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  8,

                marginBottom:
                  7,
              }}
            >
              <div
                className="floating-hand"
                style={{
                  width:
                    27,

                  height:
                    27,

                  borderRadius:
                    8,

                  background:
                    'rgba(74,158,255,0.14)',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  flexShrink:
                    0,
                }}
              >
                <Hand
                  size={15}
                  color="#4a9eff"
                />
              </div>

              <div
                style={{
                  flex:
                    1,
                }}
              >
                <div
                  style={{
                    fontSize:
                      10,

                    fontWeight:
                      900,
                  }}
                >
                  STEP 1 OF 2
                </div>

                <div
                  style={{
                    fontSize:
                      9,

                    color:
                      '#8A9BB0',

                    marginTop:
                      1,
                  }}
                >
                  After pressing Play, confirm here
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleAcknowledgePlayTap
              }
              style={{
                width:
                  '100%',

                padding:
                  '11px',

                borderRadius:
                  11,

                border:
                  'none',

                background:
                  'linear-gradient(135deg, #4a9eff, #2563eb)',

                color:
                  '#fff',

                fontSize:
                  11,

                fontWeight:
                  900,

                cursor:
                  'pointer',

                boxShadow:
                  '0 6px 18px rgba(37,99,235,0.35)',
              }}
            >
              ✓ I've Pressed Play
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          STEP 2 FLOATING CARD
          
          Appears only after explicit Step 1 confirmation.
      =================================================== */}

      {showOnboarding &&
        onboardingStep === 2 && (
        <div
          className="floating-step2-card"
          style={{
            position:
              'fixed',

            left:
              '50%',

            bottom:
              22,

            transform:
              'translateX(-50%)',

            width:
              'calc(100% - 32px)',

            maxWidth:
              488,

            zIndex:
              550,

            pointerEvents:
              'auto',
          }}
        >
          <div
            style={{
              background:
                'rgba(7,18,35,0.99)',

              border:
                '1px solid rgba(74,158,255,0.65)',

              borderRadius:
                16,

              padding:
                12,

              boxShadow:
                '0 20px 55px rgba(0,0,0,0.65), 0 0 30px rgba(74,158,255,0.16)',

              textAlign:
                'center',
            }}
          >
            <div
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap:
                  5,

                padding:
                  '4px 9px',

                borderRadius:
                  999,

                background:
                  'rgba(74,158,255,0.13)',

                color:
                  '#7DBBFF',

                fontSize:
                  8.5,

                fontWeight:
                  900,

                marginBottom:
                  6,
              }}
            >
              <Radio
                size={11}
              />

              STEP 2 · READY
            </div>

            <p
              style={{
                margin:
                  '0 0 3px',

                fontSize:
                  13,

                fontWeight:
                  900,
              }}
            >
              Music playing?
            </p>

            <p
              style={{
                margin:
                  '0 0 5px',

                fontSize:
                  9.5,

                color:
                  '#8A9BB0',
              }}
            >
              Confirm to start your 60-second verified timer.
            </p>

            <div
              className="floating-confirm-arrow"
              style={{
                height:
                  18,

                display:
                  'flex',

                justifyContent:
                  'center',

                alignItems:
                  'center',

                color:
                  '#4a9eff',
              }}
            >
              <ArrowDown
                size={19}
                strokeWidth={3}
              />
            </div>

            <button
              type="button"
              onClick={
                handlePlaybackConfirmation
              }
              style={{
                width:
                  '100%',

                padding:
                  '11px',

                borderRadius:
                  11,

                border:
                  'none',

                background:
                  'linear-gradient(135deg, #4a9eff, #2563eb)',

                color:
                  '#fff',

                fontSize:
                  11,

                fontWeight:
                  900,

                cursor:
                  'pointer',

                boxShadow:
                  '0 7px 20px rgba(37,99,235,0.35)',
              }}
            >
              ✓ I've Started Playing
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          LISTENING CHALLENGE
      =================================================== */}

      {challengeVisible &&
        status === 'streaming' && (
        <div
          style={{
            position:
              'fixed',

            inset:
              0,

            background:
              'rgba(3,8,18,0.86)',

            backdropFilter:
              'blur(4px)',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            zIndex:
              800,

            padding:
              18,
          }}
        >
          <div
            className="challenge-pop"
            style={{
              width:
                '100%',

              maxWidth:
                350,

              padding:
                22,

              borderRadius:
                20,

              background:
                'linear-gradient(145deg, #162E50, #102440)',

              border:
                '1px solid rgba(74,158,255,0.35)',

              textAlign:
                'center',

              boxShadow:
                '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            <ShieldCheck
              size={35}
              color="#4a9eff"
            />

            <p
              style={{
                fontSize:
                  17,

                fontWeight:
                  900,

                margin:
                  '11px 0 5px',
              }}
            >
              Quick listening check
            </p>

            <p
              style={{
                color:
                  '#9DB0C7',

                fontSize:
                  11.5,

                margin:
                  '0 0 12px',

                lineHeight:
                  1.5,
              }}
            >
              Are you still listening to the track?
            </p>

            <div
              className="confirm-arrow-bounce"
              style={{
                marginBottom:
                  4,

                color:
                  '#4a9eff',
              }}
            >
              <ArrowDown
                size={20}
                strokeWidth={3}
              />
            </div>

            <button
              onClick={
                handleChallenge
              }
              disabled={
                challengeSubmitting
              }
              style={{
                width:
                  '100%',

                padding:
                  '13px',

                borderRadius:
                  12,

                border:
                  'none',

                background:
                  '#4a9eff',

                color:
                  '#fff',

                fontWeight:
                  800,

                fontSize:
                  13,

                cursor:
                  challengeSubmitting
                    ? 'not-allowed'
                    : 'pointer',

                opacity:
                  challengeSubmitting
                    ? 0.6
                    : 1,
              }}
            >
              {challengeSubmitting
                ? 'Checking...'
                : "Yes, I'm Still Listening"}
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          GLOBAL ANIMATIONS
      =================================================== */}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        /* -----------------------------------------------
           PLAY TARGET
        ------------------------------------------------ */

        @keyframes playTargetPulse {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.55;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        .play-target-ring {
          animation:
            playTargetPulse 1.1s ease-in-out infinite;
        }

        /* -----------------------------------------------
           SHARP ARROW
        ------------------------------------------------ */

        @keyframes sharpArrowMove {
          0%,
          100% {
            transform:
              translate(3px, -3px)
              scale(0.96);

            opacity: 0.72;
          }

          50% {
            transform:
              translate(-3px, 3px)
              scale(1.05);

            opacity: 1;
          }
        }

        .sharp-pointer {
          animation:
            sharpArrowMove 0.9s ease-in-out infinite;
          transform-origin:
            center;
        }

        /* -----------------------------------------------
           CLICK DOT
        ------------------------------------------------ */

        @keyframes clickDotPulse {
          0%,
          100% {
            transform:
              scale(0.8);
            opacity:
              0.5;
          }

          50% {
            transform:
              scale(1.3);
            opacity:
              1;
          }
        }

        .click-dot {
          animation:
            clickDotPulse 0.9s ease-in-out infinite;
        }

        /* -----------------------------------------------
           GUIDE HAND
        ------------------------------------------------ */

        @keyframes handTap {
          0%,
          100% {
            transform:
              translateY(0)
              rotate(0deg);
          }

          50% {
            transform:
              translateY(-3px)
              rotate(-5deg);
          }
        }

        .guide-hand,
        .floating-hand {
          animation:
            handTap 0.8s ease-in-out infinite;
        }

        /* -----------------------------------------------
           TAP BADGE
        ------------------------------------------------ */

        @keyframes tapBadgePulse {
          0%,
          100% {
            transform:
              scale(1);
          }

          50% {
            transform:
              scale(1.05);
          }
        }

        .tap-badge {
          animation:
            tapBadgePulse 1s ease-in-out infinite;
        }

        /* -----------------------------------------------
           PLAYER HIGHLIGHT
        ------------------------------------------------ */

        @keyframes playerGlow {
          0%,
          100% {
            box-shadow:
              0 0 0 2px
                rgba(74,158,255,0.08),
              0 0 20px
                rgba(74,158,255,0.14);
          }

          50% {
            box-shadow:
              0 0 0 3px
                rgba(74,158,255,0.15),
              0 0 32px
                rgba(74,158,255,0.28);
          }
        }

        .player-highlight {
          animation:
            playerGlow 1.5s ease-in-out infinite;
        }

        /* -----------------------------------------------
           STEP DOTS
        ------------------------------------------------ */

        .active-step-dot,
        .done-step-dot,
        .inactive-step-dot {
          width:
            22px;

          height:
            22px;

          border-radius:
            50%;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          font-size:
            9px;

          font-weight:
            900;
        }

        .active-step-dot {
          background:
            #4a9eff;

          color:
            #fff;

          box-shadow:
            0 0 0 4px
              rgba(74,158,255,0.12),
            0 0 14px
              rgba(74,158,255,0.5);
        }

        .done-step-dot {
          background:
            #4ADE80;

          color:
            #07111F;
        }

        .inactive-step-dot {
          background:
            rgba(255,255,255,0.08);

          color:
            #60758D;
        }

        .step-line {
          width:
            32px;

          height:
            2px;

          background:
            rgba(255,255,255,0.10);
        }

        /* -----------------------------------------------
           STEP 2
        ------------------------------------------------ */

        @keyframes step2IconPulse {
          0%,
          100% {
            transform:
              scale(1);
            opacity:
              0.75;
          }

          50% {
            transform:
              scale(1.12);
            opacity:
              1;
          }
        }

        .step2-icon {
          animation:
            step2IconPulse 1s ease-in-out infinite;
        }

        @keyframes step2Arrow {
          0%,
          100% {
            transform:
              translateY(0);
            opacity:
              0.55;
          }

          50% {
            transform:
              translateY(5px);
            opacity:
              1;
          }
        }

        .step2-arrow,
        .floating-confirm-arrow {
          animation:
            step2Arrow 0.8s ease-in-out infinite;
        }

        /* -----------------------------------------------
           FLOATING CARDS
        ------------------------------------------------ */

        @keyframes floatingCardIn {
          from {
            opacity:
              0;

            transform:
              translate(-50%, 18px)
              scale(0.97);
          }

          to {
            opacity:
              1;

            transform:
              translate(-50%, 0)
              scale(1);
          }
        }

        .floating-step1-confirm,
        .floating-step2-card {
          animation:
            floatingCardIn 0.22s ease-out;
        }

        /* -----------------------------------------------
           CHALLENGE
        ------------------------------------------------ */

        @keyframes challengePop {
          from {
            transform:
              scale(0.92);

            opacity:
              0;
          }

          to {
            transform:
              scale(1);

            opacity:
              1;
          }
        }

        .challenge-pop {
          animation:
            challengePop 0.25s ease-out;
        }

        @keyframes confirmArrowBounce {
          0%,
          100% {
            transform:
              translateY(0);
            opacity:
              0.7;
          }

          50% {
            transform:
              translateY(5px);
            opacity:
              1;
          }
        }

        .confirm-arrow-bounce {
          display:
            flex;

          justify-content:
            center;

          animation:
            confirmArrowBounce 0.8s ease-in-out infinite;
        }

        /* -----------------------------------------------
           MOBILE
        ------------------------------------------------ */

        @media (max-width: 420px) {
          .sharp-pointer {
            left:
              4% !important;

            bottom:
              10% !important;

            width:
              85px !important;

            height:
              90px !important;
          }

          .play-target-ring {
            left:
              2% !important;

            bottom:
              6% !important;

            width:
              58px !important;

            height:
              58px !important;
          }

          .click-dot {
            left:
              calc(2% + 24px) !important;

            bottom:
              calc(6% + 24px) !important;
          }

          .guide-banner {
            top:
              7px !important;

            left:
              7px !important;

            right:
              7px !important;
          }

          .floating-step1-confirm,
          .floating-step2-card {
            width:
              calc(100% - 24px) !important;

            bottom:
              12px !important;
          }
        }

        /* -----------------------------------------------
           REDUCE MOTION
        ------------------------------------------------ */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:
              0.001ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior:
              auto !important;
          }
        }
      `}</style>
    </div>
  );
}

// =========================================================
// PAGE EXPORT
// =========================================================

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
