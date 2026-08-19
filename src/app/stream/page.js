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
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;
const HEARTBEAT_INTERVAL = 5000;

const PLAY_STEP_DURATION_MS = 8000;

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
// MAIN STREAM CONTENT
// =========================================================

function StreamContent() {

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const urlTrackId =
    searchParams.get('id') ||
    searchParams.get('track_id') ||
    searchParams.get('trackId');


  // -------------------------------------------------------
  // Track
  // -------------------------------------------------------

  const [track, setTrack] =
    useState(null);

  const [trackId, setTrackId] =
    useState(
      urlTrackId
        ? String(urlTrackId)
        : null
    );


  // -------------------------------------------------------
  // UI state
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
  // Verification
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
  // Onboarding
  //
  // STEP 1:
  // User must press the actual Audiomack Play button.
  //
  // Then they tap the compact instruction card.
  //
  // STEP 2:
  // User taps "I've Started Playing".
  //
  // During either step, the page is locked except Back.
  // -------------------------------------------------------

  const [showOnboarding, setShowOnboarding] =
    useState(false);

  const [onboardingStep, setOnboardingStep] =
    useState(1);

  const [showScreenshotPrompt, setShowScreenshotPrompt] =
    useState(false);

  const [challengeVisible, setChallengeVisible] =
    useState(false);

  const [challengeSubmitting, setChallengeSubmitting] =
    useState(false);


  // -------------------------------------------------------
  // Refs
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
  // KEEP REFS SYNCHRONIZED
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
      // Cached track
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
      // Fresh track
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
  // CLEAR HEARTBEAT
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
        focused: true
      };

    }

    return {

      visible:
        document.visibilityState ===
        'visible',

      focused:
        document.hasFocus()

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
        focused
      } =
        getPageState();

      const payload = {

        session_id:
          currentSessionId,

        visible,

        focused,

        playback_started:
          true

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


      const response =
        await API.post(
          '/api/streams/end',
          {
            session_id:
              sid
          }
        );


      const backendBalance =
        response?.data
          ?.coin_balance;


      // ---------------------------------------------------
      // Update local user
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

          } catch (storageError) {

            console.warn(
              'Could not update stored user:',
              storageError
            );

          }

        }

      }


      // ---------------------------------------------------
      // Refresh balance
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

            } catch (storageError) {

              console.warn(
                'Could not update stored wallet:',
                storageError
              );

            }

          }

        }

      } catch (balanceError) {

        console.warn(
          'Could not refresh coin balance:',
          balanceError
        );

      }


      setVerifiedSeconds(
        REQUIRED_SECONDS
      );

      setRewarded(
        true
      );

      setStatus(
        'completed'
      );

      setShowScreenshotPrompt(
        false
      );

      setChallengeVisible(
        false
      );


      sessionIdRef.current =
        null;

      playbackStartedRef.current =
        false;

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
  // START STREAM
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

      setRewarded(false);

      setVerifiedSeconds(0);

      setPlaybackStarted(false);

      playbackStartedRef.current =
        false;

      setChallengeVisible(false);

      saveTrackLocally(track);


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
              trackUrl
          },
          {
            timeout: 15000
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


      setShowEmbed(true);

      setStatus(
        'awaiting_play'
      );

      statusRef.current =
        'awaiting_play';


      setOnboardingStep(1);

      setShowOnboarding(true);

    } catch (err) {

      console.error(
        'Start stream error:',
        err
      );

      setStatus('idle');

      statusRef.current =
        'idle';

      setShowEmbed(false);

      setSessionId(null);

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
  // STEP 1 AUTO ADVANCE
  //
  // This does NOT unlock the page.
  // It only moves the guide from Step 1 to Step 2.
  //
  // The actual page remains locked until the user taps
  // the Step 1 instruction card.
  // =======================================================

  useEffect(() => {

    if (
      !showOnboarding ||
      onboardingStep !== 1
    ) {
      return;
    }

    const timer =
      setTimeout(() => {

        setOnboardingStep(2);

      }, PLAY_STEP_DURATION_MS);

    return () => {

      clearTimeout(timer);

    };

  }, [
    showOnboarding,
    onboardingStep
  ]);


  // =======================================================
  // USER ACKNOWLEDGES PLAY
  // =======================================================

  function handleAcknowledgePlayTap() {

    if (
      onboardingStep !== 1
    ) {
      return;
    }

    setOnboardingStep(2);

  }


  // =======================================================
  // PLAYBACK CONFIRMATION
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


    setShowOnboarding(false);

    setOnboardingStep(1);


    playbackStartedRef.current =
      true;

    setPlaybackStarted(true);


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

    setChallengeSubmitting(true);

    try {

      const result =
        await sendHeartbeat(true);


      if (
        result?.challenge_passed
      ) {

        setChallengeVisible(false);

        setError('');

      } else {

        setError(
          'Please confirm that you are still listening.'
        );

      }

    } finally {

      setChallengeSubmitting(false);

    }

  }


  // =======================================================
  // STOP STREAM
  // =======================================================

  async function handleStopStreaming() {

    clearHeartbeat();

    const currentSession =
      sessionIdRef.current;


    if (currentSession) {

      try {

        await API.post(
          '/api/streams/end',
          {
            session_id:
              currentSession
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


    setStatus('idle');

    statusRef.current =
      'idle';

    setShowEmbed(false);

    setSessionId(null);

    setPlaybackStarted(false);

    setVerifiedSeconds(0);

    setRewarded(false);

    setChallengeVisible(false);

    setShowOnboarding(false);

    setOnboardingStep(1);

  }


  // =======================================================
  // PAGE VISIBILITY
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
  // VALUES
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
          minHeight: '100vh',
          background: '#07111F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A9BB0',
          padding: 24,
          textAlign: 'center'
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
            padding: '12px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#4a9eff',
            color: '#fff',
            fontWeight: 700
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
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #07111F 0%, #0A1628 100%)',
        color: '#fff',
        paddingBottom: 40,
        position: 'relative'
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          height: 64,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background:
            'rgba(13,31,60,0.92)',
          borderBottom:
            '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)'
        }}
      >

        <button
          onClick={() =>
            router.back()
          }
          aria-label="Go back"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background:
              'rgba(255,255,255,0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
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
              fontWeight: 700
            }}
          >
            Now Streaming
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#8A9BB0',
              marginTop: 2
            }}
          >
            Listen & earn coins
          </div>

        </div>

      </div>


      <main
        style={{
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          padding: '22px 18px'
        }}
      >

        {/* =================================================
            TRACK INFO
        ================================================= */}

        <section
          style={{
            background:
              'linear-gradient(145deg, #102747, #0D1F3C)',
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
            border:
              '1px solid rgba(255,255,255,0.06)',
            boxShadow:
              '0 16px 40px rgba(0,0,0,0.22)'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >

            <div
              style={{
                width: 74,
                height: 74,
                flexShrink: 0,
                borderRadius: 16,
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, #193B68, #102440)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >

              {track.cover_image ? (

                <img
                  src={track.cover_image}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
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
                minWidth: 0,
                flex: 1
              }}
            >

              <p
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  margin: '0 0 5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {title}
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: '#8A9BB0',
                  margin: 0
                }}
              >
                {artist}
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            AUDIO PLAYER
        ================================================= */}

        <section
          style={{
            background: '#0D1F3C',
            borderRadius: 22,
            padding: 16,
            marginBottom: 16,
            border:
              '1px solid rgba(255,255,255,0.06)'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >

              <Volume2
                size={15}
                color="#4a9eff"
              />

              <span
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                  fontWeight: 600
                }}
              >
                AUDIO PLAYER
              </span>

            </div>


            {status === 'streaming' && (

              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: '#4ADE80',
                  fontWeight: 700
                }}
              >

                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ADE80',
                    boxShadow:
                      '0 0 8px #4ADE80'
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
                width: '100%',
                height: 252,
                overflow: 'hidden',
                borderRadius: 16,
                background: '#081322',
                border:
                  '1px solid rgba(255,255,255,0.05)',
                position: 'relative'
              }}
            >

              <iframe
                key={
                  `${sessionId || 'pending'}-${embedUrl}`
                }
                src={embedUrl}
                title={`${title} - Audiomack`}
                scrolling="no"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '252px',
                  border: 'none',
                  display: 'block'
                }}
              />


              {/* =================================================
                  COMPACT STEP 1 GUIDE
              ================================================= */}

              {showOnboarding &&
                onboardingStep === 1 && (

                <div
                  className="stream-guide"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >

                  {/* Compact instruction pill */}

                  <button
                    onClick={
                      handleAcknowledgePlayTap
                    }
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      right: 12,
                      minHeight: 48,
                      padding:
                        '8px 11px',
                      borderRadius: 12,
                      border:
                        '1px solid rgba(74,158,255,0.55)',
                      background:
                        'rgba(4,11,23,0.94)',
                      color: '#fff',
                      boxShadow:
                        '0 8px 25px rgba(0,0,0,0.45)',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      textAlign: 'left',
                      backdropFilter:
                        'blur(8px)'
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >

                      <div
                        className="hand-pulse"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 9,
                          background:
                            'rgba(74,158,255,0.16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >

                        <Hand
                          size={16}
                          color="#4a9eff"
                        />

                      </div>


                      <div
                        style={{
                          minWidth: 0
                        }}
                      >

                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            lineHeight: 1.2
                          }}
                        >
                          Tap Play in Audiomack
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            color: '#9DB0C7',
                            marginTop: 2
                          }}
                        >
                          Then tap this message
                        </div>

                      </div>

                    </div>

                  </button>


                  {/* Sharp directional arrow */}

                  <div
                    className="sharp-play-pointer"
                    style={{
                      position: 'absolute',
                      left: 12,
                      bottom: 42,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      pointerEvents: 'none'
                    }}
                  >

                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        border:
                          '2px solid #4a9eff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow:
                          '0 0 0 5px rgba(74,158,255,0.10), 0 0 22px rgba(74,158,255,0.55)'
                      }}
                    >

                      <ArrowDown
                        size={25}
                        strokeWidth={3.5}
                        color="#4a9eff"
                      />

                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: '#fff',
                        background:
                          'rgba(4,11,23,0.88)',
                        padding:
                          '4px 7px',
                        borderRadius: 7,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      TAP HERE
                    </span>

                  </div>

                </div>

              )}

            </div>

          ) : (

            <div
              style={{
                height: 100,
                borderRadius: 16,
                background:
                  'linear-gradient(145deg, rgba(74,158,255,0.08), rgba(255,255,255,0.025))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >

              <Music2
                size={30}
                color="#4a9eff"
              />

              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 13
                }}
              >
                Ready to stream
              </p>

            </div>

          )}

        </section>


        {/* =================================================
            STEP 2
        ================================================= */}

        {status ===
          'awaiting_play' && (

          <section
            style={{
              background:
                'rgba(74,158,255,0.07)',
              border:
                '1px solid rgba(74,158,255,0.22)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 14,
              textAlign: 'center'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 6
              }}
            >

              <ShieldCheck
                size={20}
                color="#4a9eff"
              />

              <strong
                style={{
                  fontSize: 13
                }}
              >
                {onboardingStep === 1
                  ? 'Play the music first'
                  : 'Confirm playback'}
              </strong>

            </div>


            <p
              style={{
                margin:
                  '0 auto 10px',
                maxWidth: 340,
                color: '#8A9BB0',
                fontSize: 10.5,
                lineHeight: 1.4
              }}
            >
              {onboardingStep === 1
                ? 'Tap Play inside Audiomack.'
                : 'Music should now be playing. Tap below to start verification.'}
            </p>


            {showOnboarding &&
              onboardingStep === 2 && (

              <div
                className="confirm-guide"
                style={{
                  marginBottom: 3,
                  color: '#4a9eff'
                }}
              >

                <ArrowDown
                  size={20}
                  strokeWidth={3}
                />

              </div>

            )}


            <button
              onClick={
                handlePlaybackConfirmation
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                background:
                  onboardingStep === 2
                    ? 'linear-gradient(135deg, #4a9eff, #2d6be4)'
                    : 'rgba(74,158,255,0.25)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor:
                  onboardingStep === 2
                    ? 'pointer'
                    : 'not-allowed',
                opacity:
                  onboardingStep === 2
                    ? 1
                    : 0.45
              }}
              disabled={
                onboardingStep !== 2
              }
            >
              ✓ I've Started Playing
            </button>

          </section>

        )}


        {/* =================================================
            VERIFICATION
        ================================================= */}

        {status ===
          'streaming' && (

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 13px',
              marginBottom: 14,
              borderRadius: 12,
              background:
                'rgba(74,222,128,0.07)',
              border:
                '1px solid rgba(74,222,128,0.13)'
            }}
          >

            <Eye
              size={16}
              color="#4ADE80"
            />

            <span
              style={{
                fontSize: 11,
                color: '#9DB0C7'
              }}
            >
              Your listening time is
              being verified by Rewaiq.
            </span>

          </div>

        )}


        {/* =================================================
            TIMER
        ================================================= */}

        <section
          style={{
            background: '#0D1F3C',
            borderRadius: 22,
            padding: '24px 18px',
            marginBottom: 16,
            border:
              '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center'
          }}
        >

          <div
            style={{
              width: 148,
              height: 148,
              margin: '0 auto 18px',
              borderRadius: '50%',
              background:
                `conic-gradient(
                  #4a9eff ${progress}%,
                  rgba(74,158,255,0.10) ${progress}% 100%
                )`,
              padding: 7,
              transition:
                'background 1s linear'
            }}
          >

            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#0A1628',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >

              <span
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  lineHeight: 1
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
                    fontSize: 11,
                    color: '#71849B',
                    marginTop: 6
                  }}
                >
                  verified seconds
                </span>

              )}

            </div>

          </div>


          <p
            style={{
              margin: '0 0 6px',
              fontSize: 16,
              fontWeight: 800
            }}
          >

            {status === 'starting'
              ? 'Preparing stream...'
              : status === 'awaiting_play'
              ? 'Press Play to begin'
              : status === 'streaming'
              ? 'Keep listening'
              : status === 'completing'
              ? 'Adding your coins...'
              : status === 'completed'
              ? 'Stream complete!'
              : '60 seconds to earn'}

          </p>


          <p
            style={{
              margin: 0,
              color: '#71849B',
              fontSize: 12,
              lineHeight: 1.5
            }}
          >

            {status === 'streaming'
              ? 'Keep the music playing and keep this page visible.'
              : status === 'awaiting_play'
              ? 'Your earning time has not started yet.'
              : status === 'completed'
              ? 'Your wallet has been updated.'
              : 'Start the stream and listen for 60 verified seconds to earn your reward.'}

          </p>


          <div
            style={{
              height: 5,
              background:
                'rgba(255,255,255,0.06)',
              borderRadius: 10,
              overflow: 'hidden',
              marginTop: 18
            }}
          >

            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#4a9eff',
                borderRadius: 10,
                transition:
                  'width 1s linear'
              }}
            />

          </div>

        </section>


        {/* =================================================
            SCREENSHOT
        ================================================= */}

        {showScreenshotPrompt &&
          status === 'streaming' && (

          <section
            style={{
              padding: 16,
              borderRadius: 16,
              background:
                'rgba(255,255,255,0.04)',
              border:
                '1px solid rgba(255,255,255,0.07)',
              marginBottom: 16
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}
            >

              <Camera
                size={24}
                color="#4a9eff"
              />

              <div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 800
                  }}
                >
                  Quick verification
                </p>

                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#8A9BB0',
                    fontSize: 11,
                    lineHeight: 1.5
                  }}
                >
                  If requested during
                  onboarding, take a
                  screenshot showing
                  the Audiomack player.
                </p>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            ACTION
        ================================================= */}

        {status ===
          'completed' ? (

          <div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background:
                  'rgba(74,222,128,0.08)',
                border:
                  '1px solid rgba(74,222,128,0.16)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 14
              }}
            >

              <CheckCircle
                size={28}
                color="#4ADE80"
              />

              <div>

                <p
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  Coins Earned!
                </p>

                <p
                  style={{
                    margin: '3px 0 0',
                    color: '#8A9BB0',
                    fontSize: 11
                  }}
                >
                  Your wallet has
                  been updated
                  successfully.
                </p>

              </div>

            </div>


            <button
              onClick={() =>
                router.push('/home')
              }
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 15,
                border: 'none',
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15
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
              padding: '17px',
              borderRadius: 15,
              background:
                'rgba(248,113,113,0.10)',
              border:
                '1px solid rgba(248,113,113,0.24)',
              color: '#F87171',
              fontWeight: 800,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9
            }}
          >

            <Square
              size={17}
              fill="#F87171"
            />

            Stop Streaming

          </button>

        ) : status ===
          'awaiting_play' ? (

          <div
            style={{
              padding: 13,
              borderRadius: 14,
              background:
                'rgba(255,255,255,0.03)',
              border:
                '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 9
            }}
          >

            <AlertTriangle
              size={17}
              color="#FBBF24"
            />

            <span
              style={{
                fontSize: 11,
                color: '#9DB0C7',
                lineHeight: 1.5
              }}
            >
              Your earning timer has
              not started. Follow the
              steps above.
            </span>

          </div>

        ) : (

          <button
            onClick={
              handleStartStreaming
            }
            disabled={
              status === 'starting' ||
              status === 'completing'
            }
            style={{
              width: '100%',
              padding: '17px',
              borderRadius: 15,
              border: 'none',
              background:
                'linear-gradient(135deg, #4a9eff, #2d6be4)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              opacity:
                status === 'starting'
                  ? 0.6
                  : 1
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


            {status === 'starting'
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
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background:
                'rgba(248,113,113,0.08)',
              border:
                '1px solid rgba(248,113,113,0.15)'
            }}
          >

            <p
              style={{
                color: '#F87171',
                textAlign: 'center',
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5
              }}
            >
              {error}
            </p>

          </div>

        )}


        <p
          style={{
            textAlign: 'center',
            color: '#52677F',
            fontSize: 10,
            lineHeight: 1.5,
            margin: '18px 20px 0'
          }}
        >
          Your listening time is
          being verified by Rewaiq.
          Keep this page visible and
          keep the music playing.
        </p>

      </main>


      {/* ===================================================
          ONBOARDING LOCK
          
          IMPORTANT:
          This layer exists ONLY during the two-step guide.
          
          It blocks the entire page from interaction.
          The Back button remains above it because the header
          has z-index 50 while this lock has z-index 40.
          
          The Audiomack iframe is also protected by the guide
          itself, but the actual Play area must remain clickable.
      =================================================== */}

      {showOnboarding && (

        <div
          className="onboarding-lock"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'none',
            background:
              'rgba(0,0,0,0.08)'
          }}
        />

      )}


      {/* ===================================================
          LISTENING CHALLENGE
      =================================================== */}

      {challengeVisible &&
        status === 'streaming' && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(3,8,18,0.85)',
            backdropFilter:
              'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
        >

          <div
            className="challenge-pop"
            style={{
              width: '100%',
              maxWidth: 360,
              padding: 26,
              borderRadius: 22,
              background:
                'linear-gradient(145deg, #162E50, #102440)',
              border:
                '1px solid rgba(74,158,255,0.35)',
              textAlign: 'center',
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >

            <ShieldCheck
              size={38}
              color="#4a9eff"
            />

            <p
              style={{
                fontSize: 19,
                fontWeight: 900,
                margin: '14px 0 6px'
              }}
            >
              Quick listening check
            </p>

            <p
              style={{
                color: '#9DB0C7',
                fontSize: 13,
                margin: '0 0 18px',
                lineHeight: 1.5
              }}
            >
              Are you still listening
              to the track?
            </p>

            <div
              className="confirm-arrow-bounce"
              style={{
                marginBottom: 8,
                color: '#4a9eff'
              }}
            >

              <ArrowDown
                size={22}
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
                width: '100%',
                padding: '15px',
                borderRadius: 14,
                border: 'none',
                background: '#4a9eff',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                opacity:
                  challengeSubmitting
                    ? 0.6
                    : 1
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
          GLOBAL CSS
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

          animation:
            spin
            1s
            linear
            infinite;

        }


        /* ================================================
           SHARP PLAY POINTER
        ================================================= */

        @keyframes sharpPointer {

          0%,
          100% {
            transform:
              translateY(0)
              scale(1);

            opacity:
              0.8;
          }

          50% {
            transform:
              translateY(7px)
              scale(1.08);

            opacity:
              1;
          }

        }


        .sharp-play-pointer {

          animation:
            sharpPointer
            0.9s
            ease-in-out
            infinite;

        }


        /* ================================================
           HAND PULSE
        ================================================= */

        @keyframes handPulse {

          0%,
          100% {
            transform:
              scale(1);
          }

          50% {
            transform:
              scale(1.12);
          }

        }


        .hand-pulse {

          animation:
            handPulse
            1s
            ease-in-out
            infinite;

        }


        /* ================================================
           CONFIRM ARROW
        ================================================= */

        @keyframes bounceDown {

          0%,
          100% {
            transform:
              translateY(0);

            opacity:
              0.65;
          }

          50% {
            transform:
              translateY(6px);

            opacity:
              1;
          }

        }


        .confirm-guide {

          display:
            flex;

          justify-content:
            center;

          animation:
            bounceDown
            0.8s
            ease-in-out
            infinite;

        }


        .confirm-arrow-bounce {

          display:
            flex;

          justify-content:
            center;

          animation:
            bounceDown
            1s
            ease-in-out
            infinite;

        }


        /* ================================================
           CHALLENGE
        ================================================= */

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
            challengePop
            0.25s
            ease-out;

        }


        /* ================================================
           SMALL SCREEN TUNING
        ================================================= */

        @media (max-width: 480px) {

          .sharp-play-pointer {

            left: 8px !important;
            bottom: 38px !important;

          }

          .sharp-play-pointer > div {

            width: 36px !important;
            height: 36px !important;

          }

          .sharp-play-pointer svg {

            width: 21px;
            height: 21px;

          }

        }

      `}</style>

    </div>
  );
}


// =========================================================
// PAGE
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
