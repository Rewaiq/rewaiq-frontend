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
  ShieldCheck,
  Eye,
  Radio,
  Coins,
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;
const HEARTBEAT_INTERVAL = 5000;

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

    return saved
      ? JSON.parse(saved)
      : null;
  } catch {
    return null;
  }
}

function StreamContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const urlTrackId =
    searchParams.get('id') ||
    searchParams.get('track_id') ||
    searchParams.get('trackId');

  const [track, setTrack] =
    useState(null);

  const [trackId, setTrackId] =
    useState(
      urlTrackId
        ? String(urlTrackId)
        : null
    );

  const [loading, setLoading] =
    useState(true);

  const [status, setStatus] =
    useState('idle');

  const [error, setError] =
    useState('');

  const [showEmbed, setShowEmbed] =
    useState(false);

  const [playbackStarted, setPlaybackStarted] =
    useState(false);

  const [verifiedSeconds, setVerifiedSeconds] =
    useState(0);

  const [sessionId, setSessionId] =
    useState(null);

  const [rewarded, setRewarded] =
    useState(false);

  const [showOnboarding, setShowOnboarding] =
    useState(false);

  const [onboardingStep, setOnboardingStep] =
    useState(1);

  const [challengeVisible, setChallengeVisible] =
    useState(false);

  const [challengeSubmitting, setChallengeSubmitting] =
    useState(false);

  const [challengeOffsetX, setChallengeOffsetX] =
    useState(0);

  const [coinBursts, setCoinBursts] =
    useState([]);

  const [milestoneFlash, setMilestoneFlash] =
    useState(false);

  const [confetti, setConfetti] =
    useState([]);

  const sessionIdRef =
    useRef(null);

  const playbackStartedRef =
    useRef(false);

  const statusRef =
    useRef('idle');

  const heartbeatRef =
    useRef(null);

  const heartbeatBusyRef =
    useRef(false);

  const startingRef =
    useRef(false);

  const endingRef =
    useRef(false);

  const coinIdRef =
    useRef(0);

  const previousVerifiedRef =
    useRef(0);

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

  useEffect(() => {
    if (urlTrackId) {
      setTrackId(
        String(urlTrackId)
      );
    }
  }, [urlTrackId]);

  // =========================================================
  // LOAD TRACK
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadTrack() {
      const savedTrack =
        getSavedTrack();

      const savedId =
        getTrackId(savedTrack);

      const resolvedId =
        urlTrackId ||
        savedId;

      if (!resolvedId) {
        setLoading(false);
        setError(
          'No track selected.'
        );
        return;
      }

      const normalizedId =
        String(resolvedId);

      setTrackId(
        normalizedId
      );

      if (
        savedTrack &&
        savedId &&
        String(savedId) ===
          normalizedId
      ) {
        setTrack(
          savedTrack
        );
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
            'Track not found.'
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

        if (loadedId) {
          setTrackId(
            String(loadedId)
          );
        }
      } catch (err) {
        console.error(
          'Track loading error:',
          err
        );

        if (
          !savedTrack ||
          !savedId ||
          String(savedId) !==
            normalizedId
        ) {
          setTrack(null);

          setError(
            err?.response?.data?.message ||
            err?.message ||
            'Track not found.'
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
    };
  }, [urlTrackId]);

  // =========================================================
  // EMBED URL
  // =========================================================

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
        return `https://audiomack.com/embed/${parts}`;
      }
    }

    return null;
  }

  const embedUrl =
    getEmbedUrl();

  // =========================================================
  // HEARTBEAT
  // =========================================================

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

  async function sendHeartbeat(
    challengeAnswer = undefined
  ) {
    const sid =
      sessionIdRef.current;

    if (
      !sid ||
      !playbackStartedRef.current ||
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
        session_id: sid,
        visible,
        focused,
        playback_started: true,
      };

      if (
        challengeAnswer !==
        undefined
      ) {
        payload.challenge_answer =
          challengeAnswer;
      }

      const response =
        await API.post(
          '/api/streams/heartbeat',
          payload,
          {
            timeout: 15000,
          }
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
        data.challenge_passed
      ) {
        setChallengeVisible(
          false
        );
      }

      if (
        data.complete
      ) {
        clearHeartbeat();

        await finishStream(
          sid
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

  function startHeartbeatLoop() {
    clearHeartbeat();

    // First heartbeat establishes server-side timing.
    sendHeartbeat();

    heartbeatRef.current =
      setInterval(() => {
        sendHeartbeat();
      }, HEARTBEAT_INTERVAL);
  }

  // =========================================================
  // FINISH
  // =========================================================

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
            session_id: sid,
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

      setChallengeVisible(
        false
      );

      setShowOnboarding(
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

      // Refresh wallet.
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
          const stored =
            localStorage.getItem(
              'rewaiq_user'
            );

          if (stored) {
            try {
              const user =
                JSON.parse(stored);

              user.coin_balance =
                newBalance;

              localStorage.setItem(
                'rewaiq_user',
                JSON.stringify(user)
              );
            } catch {}
          }
        }
      } catch (balanceError) {
        console.warn(
          'Wallet refresh failed:',
          balanceError
        );
      }
    } catch (err) {
      console.error(
        'Finish stream error:',
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Could not complete stream.'
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

  // =========================================================
  // START
  // =========================================================

  async function handleStartStreaming() {
    if (
      startingRef.current
    ) {
      return;
    }

    if (
      status !== 'idle'
    ) {
      return;
    }

    if (!track) {
      setError(
        'No track selected.'
      );
      return;
    }

    const resolvedTrackId =
      getTrackId(track) ||
      trackId;

    if (!resolvedTrackId) {
      setError(
        'This track does not have a valid ID.'
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

      setVerifiedSeconds(0);
      setRewarded(false);
      setChallengeVisible(false);

      setPlaybackStarted(false);

      playbackStartedRef.current =
        false;

      setStatus('starting');

      statusRef.current =
        'starting';

      const response =
        await API.post(
          '/api/streams/start',
          {
            track_id:
              resolvedTrackId,

            track_url:
              track.original_url ||
              embedUrl,
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
          'Stream session was not created.'
        );
      }

      sessionIdRef.current =
        newSessionId;

      setSessionId(
        newSessionId
      );

      setShowEmbed(
        true
      );

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

      setSessionId(null);

      sessionIdRef.current =
        null;

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Could not start stream.'
      );
    } finally {
      startingRef.current =
        false;
    }
  }

  // =========================================================
  // STEP 1
  // =========================================================

  function handleAcknowledgePlayTap() {
    if (
      onboardingStep !== 1 ||
      !sessionIdRef.current
    ) {
      return;
    }

    setOnboardingStep(
      2
    );
  }

  // =========================================================
  // STEP 2
  // =========================================================

  function handlePlaybackConfirmation() {
    if (
      !sessionIdRef.current
    ) {
      setError(
        'Streaming session is not ready.'
      );

      return;
    }

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

    setStatus(
      'streaming'
    );

    statusRef.current =
      'streaming';

    setError('');

    startHeartbeatLoop();
  }

  // =========================================================
  // LISTENING CHALLENGE
  // =========================================================

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
      /*
       * Normal TAP.
       *
       * Server decides whether this is accepted.
       */
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

  // =========================================================
  // STOP
  // =========================================================

  async function handleStopStreaming() {
    clearHeartbeat();

    const sid =
      sessionIdRef.current;

    if (sid) {
      try {
        await API.post(
          '/api/streams/end',
          {
            session_id: sid,
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

    setSessionId(null);

    setPlaybackStarted(false);

    setStatus('idle');

    statusRef.current =
      'idle';

    setShowEmbed(false);

    setShowOnboarding(false);

    setChallengeVisible(false);

    setVerifiedSeconds(0);

    setRewarded(false);

    setCoinBursts([]);

    setError('');
  }

  // =========================================================
  // VISIBILITY
  // =========================================================

  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState ===
        'visible' &&
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

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      clearHeartbeat();

      sessionIdRef.current =
        null;

      playbackStartedRef.current =
        false;
    };
  }, []);

  // =========================================================
  // COIN ANIMATION
  // =========================================================

  useEffect(() => {
    if (
      status !== 'streaming'
    ) {
      previousVerifiedRef.current =
        verifiedSeconds;

      return;
    }

    if (
      verifiedSeconds >
      previousVerifiedRef.current
    ) {
      const id =
        coinIdRef.current++;

      setCoinBursts(
        previous => [
          ...previous,
          {
            id,
            offset:
              Math.floor(
                Math.random() * 46
              ) - 23,
          },
        ]
      );

      const timer =
        setTimeout(() => {
          setCoinBursts(
            previous =>
              previous.filter(
                coin =>
                  coin.id !== id
              )
          );
        }, 900);

      previousVerifiedRef.current =
        verifiedSeconds;

      return () =>
        clearTimeout(timer);
    }

    previousVerifiedRef.current =
      verifiedSeconds;
  }, [
    verifiedSeconds,
    status,
  ]);

  // =========================================================
  // MILESTONE
  // =========================================================

  useEffect(() => {
    if (
      [15, 30, 45].includes(
        verifiedSeconds
      )
    ) {
      setMilestoneFlash(true);

      const timer =
        setTimeout(() => {
          setMilestoneFlash(false);
        }, 650);

      return () =>
        clearTimeout(timer);
    }
  }, [verifiedSeconds]);

  // =========================================================
  // RANDOM CHALLENGE POSITION
  // =========================================================

  useEffect(() => {
    if (challengeVisible) {
      setChallengeOffsetX(
        Math.floor(
          Math.random() * 80
        ) - 40
      );
    }
  }, [challengeVisible]);

  // =========================================================
  // CONFETTI
  // =========================================================

  useEffect(() => {
    if (
      status === 'completed'
    ) {
      setConfetti(
        Array.from({
          length: 18,
        }).map(
          (_, i) => ({
            id: i,
            left:
              Math.random() * 100,
            delay:
              Math.random() * 0.35,
            duration:
              1.1 +
              Math.random() * 0.6,
          })
        )
      );
    } else {
      setConfetti([]);
    }
  }, [status]);

  // =========================================================
  // VALUES
  // =========================================================

  const progress =
    Math.min(
      (verifiedSeconds /
        REQUIRED_SECONDS) *
        100,
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

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading &&
    !track
  ) {
    return (
      <Spinner fullscreen />
    );
  }

  if (!track) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#07111F',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <p>
          {error ||
            'No track selected.'}
        </p>

        <button
          onClick={() =>
            router.back()
          }
          style={{
            padding:
              '12px 20px',
            border: 'none',
            borderRadius: 10,
            background:
              '#4a9eff',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg,#07111F 0%,#0A1628 100%)',
        color: '#fff',
        paddingBottom: 40,
        position: 'relative',
      }}
    >
      <header
        style={{
          height: 64,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background:
            'rgba(13,31,60,.95)',
          borderBottom:
            '1px solid rgba(255,255,255,.06)',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          backdropFilter:
            'blur(12px)',
        }}
      >
        <button
          onClick={() =>
            router.back()
          }
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background:
              'rgba(255,255,255,.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Now Streaming
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#8A9BB0',
            }}
          >
            Listen & earn coins
          </div>
        </div>
      </header>

      <main
        style={{
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          padding: '18px',
        }}
      >
        {/* TRACK */}

        <section
          style={{
            background:
              'linear-gradient(145deg,#102747,#0D1F3C)',
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
            opacity:
              showOnboarding
                ? 0.35
                : 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 15,
                overflow: 'hidden',
                background:
                  '#102440',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {track.cover_image ? (
                <img
                  src={
                    track.cover_image
                  }
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit:
                      'cover',
                  }}
                />
              ) : (
                <Music2
                  size={28}
                  color="#4a9eff"
                />
              )}
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin:
                    '0 0 4px',
                  fontSize: 17,
                  fontWeight: 800,
                  overflow: 'hidden',
                  textOverflow:
                    'ellipsis',
                  whiteSpace:
                    'nowrap',
                }}
              >
                {title}
              </p>

              <p
                style={{
                  margin: 0,
                  color: '#8A9BB0',
                  fontSize: 12,
                }}
              >
                {artist}
              </p>
            </div>
          </div>
        </section>

        {/* PLAYER */}

        <section
          style={{
            background:
              '#0D1F3C',
            borderRadius: 20,
            padding: 14,
            marginBottom: 12,
            border:
              showOnboarding &&
              onboardingStep === 1
                ? '2px solid rgba(74,158,255,.85)'
                : '1px solid rgba(255,255,255,.06)',
            boxShadow:
              showOnboarding &&
              onboardingStep === 1
                ? '0 0 35px rgba(74,158,255,.35)'
                : 'none',
            position:
              'relative',
            zIndex:
              showOnboarding
                ? 102
                : 1,
            opacity:
              showOnboarding &&
              onboardingStep === 2
                ? 0.35
                : 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginBottom: 9,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 7,
              }}
            >
              <Volume2
                size={15}
                color="#4a9eff"
              />

              <span
                style={{
                  fontSize: 11,
                  color: '#8A9BB0',
                }}
              >
                AUDIO PLAYER
              </span>
            </div>

            {status ===
              'streaming' && (
              <span
                style={{
                  color:
                    '#4ADE80',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                ● VERIFIED
              </span>
            )}
          </div>

          {showEmbed &&
          embedUrl ? (
            <div
              style={{
                width: '100%',
                height: 252,
                overflow: 'hidden',
                borderRadius: 15,
                background:
                  '#081322',
                position:
                  'relative',
              }}
            >
              <iframe
                key={`${sessionId}-${embedUrl}`}
                src={embedUrl}
                title={`${title} - Audiomack`}
                scrolling="no"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{
                  position:
                    'absolute',
                  inset: 0,
                  width: '100%',
                  height: 252,
                  border: 'none',
                }}
              />

              {showOnboarding &&
                onboardingStep ===
                  1 && (
                  <div
                    style={{
                      position:
                        'absolute',
                      inset: 0,
                      pointerEvents:
                        'none',
                    }}
                  >
                    <div
                      style={{
                        position:
                          'absolute',
                        top: 8,
                        left: 8,
                        right: 8,
                        background:
                          'rgba(4,11,23,.94)',
                        border:
                          '1px solid rgba(74,158,255,.55)',
                        borderRadius: 12,
                        padding:
                          '9px 12px',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <Hand
                        size={16}
                        color="#4a9eff"
                      />

                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          STEP 1 · PRESS PLAY
                        </div>

                        <div
                          style={{
                            fontSize: 9,
                            color:
                              '#9DB0C7',
                          }}
                        >
                          Tap Play inside the player.
                        </div>
                      </div>
                    </div>

                    <div
                      className="play-ring"
                      style={{
                        position:
                          'absolute',
                        left: '3.5%',
                        bottom: '9%',
                        width: 72,
                        height: 72,
                        borderRadius:
                          '50%',
                        border:
                          '2.5px solid #4a9eff',
                        boxShadow:
                          '0 0 0 6px rgba(74,158,255,.18),0 0 25px rgba(74,158,255,.85)',
                      }}
                    />

                    <div
                      className="play-arrow"
                      style={{
                        position:
                          'absolute',
                        left: '20%',
                        bottom: '13%',
                      }}
                    >
                      <ArrowDown
                        size={34}
                        color="#4a9eff"
                        strokeWidth={4}
                      />
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div
              style={{
                height: 90,
                display: 'flex',
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
            </div>
          )}
        </section>

        {/* ONBOARDING */}

        {status ===
          'awaiting_play' && (
          <section
            style={{
              background:
                '#102747',
              border:
                '1px solid rgba(74,158,255,.6)',
              borderRadius: 17,
              padding: 16,
              marginBottom: 12,
              textAlign: 'center',
              position:
                'relative',
              zIndex: 102,
            }}
          >
            <div
              style={{
                marginBottom: 12,
                fontSize: 11,
                color: '#7DBBFF',
                fontWeight: 800,
              }}
            >
              STEP {onboardingStep} OF 2
            </div>

            {onboardingStep ===
            1 ? (
              <>
                <p
                  style={{
                    fontWeight: 900,
                    fontSize: 15,
                    margin:
                      '0 0 6px',
                  }}
                >
                  Press Play in the player
                </p>

                <p
                  style={{
                    color:
                      '#8A9BB0',
                    fontSize: 11,
                    lineHeight: 1.5,
                    margin:
                      '0 0 14px',
                  }}
                >
                  Tap the Play button
                  inside the Audiomack
                  player, then confirm
                  below.
                </p>

                <button
                  onClick={
                    handleAcknowledgePlayTap
                  }
                  style={{
                    width: '100%',
                    padding: 14,
                    border: 'none',
                    borderRadius: 13,
                    background:
                      'linear-gradient(135deg,#4a9eff,#2d6be4)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  ✓ I've Pressed Play
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    display:
                      'inline-flex',
                    alignItems:
                      'center',
                    gap: 6,
                    padding:
                      '5px 10px',
                    borderRadius: 999,
                    background:
                      'rgba(74,158,255,.15)',
                    color:
                      '#7DBBFF',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  <Radio size={12} />
                  START VERIFICATION
                </div>

                <p
                  style={{
                    fontWeight: 900,
                    fontSize: 15,
                    margin:
                      '10px 0 6px',
                  }}
                >
                  Ready to verify your listening
                </p>

                <p
                  style={{
                    color:
                      '#8A9BB0',
                    fontSize: 11,
                    lineHeight: 1.5,
                    margin:
                      '0 0 10px',
                  }}
                >
                  Keep the music playing
                  and tap the button below.
                </p>

                <ArrowDown
                  className="down-arrow"
                  size={22}
                  color="#4a9eff"
                />

                <button
                  onClick={
                    handlePlaybackConfirmation
                  }
                  style={{
                    width: '100%',
                    padding: 14,
                    marginTop: 8,
                    border: 'none',
                    borderRadius: 13,
                    background:
                      'linear-gradient(135deg,#4a9eff,#2d6be4)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  ✓ I've Started Playing
                </button>
              </>
            )}
          </section>
        )}

        {/* VERIFIED STATUS */}

        {status ===
          'streaming' && (
          <div
            style={{
              display: 'flex',
              alignItems:
                'center',
              gap: 8,
              padding: 10,
              marginBottom: 12,
              borderRadius: 11,
              background:
                'rgba(74,222,128,.07)',
            }}
          >
            <Eye
              size={15}
              color="#4ADE80"
            />

            <span
              style={{
                fontSize: 10,
                color:
                  '#9DB0C7',
              }}
            >
              Your listening time is
              being verified by Rewaiq.
            </span>
          </div>
        )}

        {/* TIMER */}

        <section
          style={{
            background:
              '#0D1F3C',
            borderRadius: 20,
            padding:
              '20px 16px',
            marginBottom: 12,
            textAlign: 'center',
            opacity:
              showOnboarding
                ? 0.35
                : 1,
          }}
        >
          <div
            className={
              milestoneFlash
                ? 'ring-glow'
                : ''
            }
            style={{
              width: 138,
              height: 138,
              margin:
                '0 auto 14px',
              borderRadius:
                '50%',
              background:
                `conic-gradient(#4a9eff ${progress}%,rgba(74,158,255,.1) ${progress}% 100%)`,
              padding: 7,
              position:
                'relative',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius:
                  '50%',
                background:
                  '#0A1628',
                display: 'flex',
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
                  fontSize: 32,
                  fontWeight: 900,
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
                    fontSize: 10,
                    color:
                      '#71849B',
                  }}
                >
                  seconds left
                </span>
              )}
            </div>

            {coinBursts.map(
              coin => (
                <div
                  key={coin.id}
                  className="coin-fly"
                  style={{
                    position:
                      'absolute',
                    left:
                      `calc(50% + ${coin.offset}px)`,
                    bottom: '38%',
                  }}
                >
                  <Coins
                    size={16}
                    color="#FBBF24"
                  />
                </div>
              )
            )}
          </div>

          <p
            style={{
              margin:
                '0 0 5px',
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            {status ===
              'starting'
              ? 'Preparing stream...'
              : status ===
                'awaiting_play'
              ? 'Press Play to begin'
              : status ===
                'streaming'
              ? 'Keep listening 🎧'
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
              margin: 0,
              color:
                '#71849B',
              fontSize: 11,
            }}
          >
            {status ===
            'streaming'
              ? 'Keep this page visible and keep the music playing.'
              : status ===
                'completed'
              ? 'Your wallet has been updated.'
              : 'Listen for 60 verified seconds to earn.'}
          </p>

          <div
            style={{
              height: 5,
              background:
                'rgba(255,255,255,.06)',
              borderRadius: 10,
              overflow:
                'hidden',
              marginTop: 15,
            }}
          >
            <div
              style={{
                height: '100%',
                width:
                  `${progress}%`,
                background:
                  '#4a9eff',
                transition:
                  'width 1s linear',
              }}
            />
          </div>
        </section>

        {/* ACTION */}

        {status ===
        'completed' ? (
          <div>
            <div
              style={{
                padding: 14,
                borderRadius: 15,
                background:
                  'rgba(74,222,128,.08)',
                display: 'flex',
                alignItems:
                  'center',
                gap: 11,
                marginBottom: 12,
                position:
                  'relative',
              }}
            >
              {confetti.map(
                piece => (
                  <div
                    key={piece.id}
                    className="confetti"
                    style={{
                      position:
                        'absolute',
                      left:
                        `${piece.left}%`,
                      top: -10,
                      width: 6,
                      height: 6,
                      animationDelay:
                        `${piece.delay}s`,
                      animationDuration:
                        `${piece.duration}s`,
                    }}
                  />
                )
              )}

              <CheckCircle
                size={27}
                color="#4ADE80"
              />

              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: 13,
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
                    fontSize: 10,
                  }}
                >
                  Your wallet has
                  been updated.
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
                width: '100%',
                padding: 14,
                border: 'none',
                borderRadius: 14,
                background:
                  'linear-gradient(135deg,#4a9eff,#2d6be4)',
                color: '#fff',
                fontWeight: 800,
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
              width: '100%',
              padding: 15,
              borderRadius: 14,
              background:
                'rgba(248,113,113,.1)',
              border:
                '1px solid rgba(248,113,113,.24)',
              color: '#F87171',
              fontWeight: 800,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 8,
            }}
          >
            <Square
              size={16}
              fill="#F87171"
            />
            Stop Streaming
          </button>
        ) : status ===
          'awaiting_play' ? null : (
          <button
            onClick={
              handleStartStreaming
            }
            disabled={
              status ===
              'starting'
            }
            style={{
              width: '100%',
              padding: 15,
              border: 'none',
              borderRadius: 14,
              background:
                'linear-gradient(135deg,#4a9eff,#2d6be4)',
              color: '#fff',
              fontWeight: 800,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 8,
            }}
          >
            {status ===
            'starting' ? (
              <Loader2
                size={18}
                className="spin"
              />
            ) : (
              <Play
                size={18}
                fill="#fff"
              />
            )}

            {status ===
            'starting'
              ? 'Preparing...'
              : 'Start Streaming'}
          </button>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 11,
              borderRadius: 11,
              background:
                'rgba(248,113,113,.08)',
            }}
          >
            <p
              style={{
                color:
                  '#F87171',
                textAlign:
                  'center',
                margin: 0,
                fontSize: 11,
              }}
            >
              {error}
            </p>
          </div>
        )}
      </main>

      {/* PAGE LOCK */}

      {showOnboarding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background:
              'rgba(3,9,20,.82)',
            backdropFilter:
              'blur(4px)',
          }}
        />
      )}

      {/* CHALLENGE */}

      {challengeVisible &&
        status ===
          'streaming' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background:
              'rgba(3,8,18,.85)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 18,
          }}
        >
          <div
            className="challenge-pop"
            style={{
              width: '100%',
              maxWidth: 350,
              padding: 23,
              borderRadius: 20,
              background:
                'linear-gradient(145deg,#162E50,#102440)',
              textAlign: 'center',
            }}
          >
            <ShieldCheck
              size={36}
              color="#4a9eff"
            />

            <p
              style={{
                fontSize: 18,
                fontWeight: 900,
                margin:
                  '12px 0 5px',
              }}
            >
              Quick listening check
            </p>

            <p
              style={{
                color:
                  '#9DB0C7',
                fontSize: 12,
                margin:
                  '0 0 14px',
              }}
            >
              Are you still listening
              to the track?
            </p>

            <ArrowDown
              className="down-arrow"
              size={21}
              color="#4a9eff"
            />

            <div
              style={{
                transform:
                  `translateX(${challengeOffsetX}px)`,
                marginTop: 8,
              }}
            >
              <button
                onClick={
                  handleChallenge
                }
                disabled={
                  challengeSubmitting
                }
                style={{
                  width: '100%',
                  padding: 14,
                  border: 'none',
                  borderRadius: 13,
                  background:
                    'linear-gradient(135deg,#4a9eff,#2d6be4)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  opacity:
                    challengeSubmitting
                      ? 0.6
                      : 1,
                }}
              >
                {challengeSubmitting
                  ? 'Checking...'
                  : "✓ I'm Still Listening"}
              </button>
            </div>
          </div>
        </div>
      )}

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

        @keyframes pulse {
          0%,100% {
            transform: scale(.92);
            opacity: .65;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }

        .play-ring {
          animation: pulse 1.2s infinite;
        }

        .play-arrow {
          animation: pulse .8s infinite;
        }

        .down-arrow {
          animation: bounce 0.8s infinite;
        }

        @keyframes bounce {
          0%,100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }

        .challenge-pop {
          animation: challengePop .25s ease-out;
        }

        @keyframes challengePop {
          from {
            transform: scale(.92);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .ring-glow {
          animation: glow .65s ease-out;
        }

        @keyframes glow {
          0% {
            box-shadow: 0 0 0 rgba(74,158,255,0);
          }
          50% {
            box-shadow: 0 0 26px rgba(74,158,255,.75);
          }
          100% {
            box-shadow: 0 0 0 rgba(74,158,255,0);
          }
        }

        .coin-fly {
          animation: coinFly .9s ease-out forwards;
        }

        @keyframes coinFly {
          from {
            transform:
              translateY(0)
              scale(.8);
            opacity: 0;
          }
          to {
            transform:
              translateY(-58px)
              scale(1);
            opacity: 0;
          }
        }

        .confetti {
          background: #4a9eff;
          animation:
            confettiFall 1.4s ease-out forwards;
        }

        @keyframes confettiFall {
          from {
            transform:
              translateY(0)
              rotate(0);
            opacity: 1;
          }
          to {
            transform:
              translateY(90px)
              rotate(360deg);
            opacity: 0;
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
