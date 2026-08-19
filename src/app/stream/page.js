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

const STORAGE_KEY =
  'rewaiq_stream_track';


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
  // TRACK
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
  // UI STATE
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
  // 1 = User must press Play / acknowledge Step 1.
  // 2 = User must press "I've Started Playing".
  //
  // IMPORTANT:
  // There is NO timer.
  // The onboarding cannot automatically disappear.
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

      statusRef.current =
        'completing';


      const response =
        await API.post(
          '/api/streams/end',
          {
            session_id:
              sid
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


      // ---------------------------------------------------
      // OPEN PLAYER
      // ---------------------------------------------------

      setShowEmbed(
        true
      );


      // ---------------------------------------------------
      // START AT STEP 1
      //
      // IMPORTANT:
      // No timer exists.
      // It will remain here until the user acts.
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
  //
  // NO TIMER.
  //
  // The user must explicitly tap the guide action.
  // =======================================================

  function handleAcknowledgePlayTap() {

    if (
      !showOnboarding ||
      onboardingStep !== 1
    ) {
      return;
    }

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

    if (
      !currentSession
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
            'center'
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
              700
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
          40
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

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
            200,

          backdropFilter:
            'blur(12px)'
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
              'pointer'
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
                700
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
                2
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
            '18px 18px'
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
              20,

            padding:
              16,

            marginBottom:
              12,

            border:
              '1px solid rgba(255,255,255,0.06)',

            boxShadow:
              '0 14px 35px rgba(0,0,0,0.20)'
          }}
        >

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                13
            }}
          >

            <div
              style={{
                width:
                  68,

                height:
                  68,

                flexShrink:
                  0,

                borderRadius:
                  15,

                overflow:
                  'hidden',

                background:
                  'linear-gradient(135deg, #193B68, #102440)',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center'
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
                      'cover'
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
                minWidth:
                  0,

                flex:
                  1
              }}
            >

              <p
                style={{
                  fontSize:
                    17,

                  fontWeight:
                    800,

                  margin:
                    '0 0 4px',

                  whiteSpace:
                    'nowrap',

                  overflow:
                    'hidden',

                  textOverflow:
                    'ellipsis'
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
                    0
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
            background:
              '#0D1F3C',

            borderRadius:
              20,

            padding:
              14,

            marginBottom:
              12,

            border:
              '1px solid rgba(255,255,255,0.06)'
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
                9
            }}
          >

            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  7
              }}
            >

              <Volume2
                size={15}
                color="#4a9eff"
              />

              <span
                style={{
                  fontSize:
                    11,

                  color:
                    '#8A9BB0',

                  fontWeight:
                    600
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
                    700
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
                width:
                  '100%',

                height:
                  252,

                overflow:
                  'hidden',

                borderRadius:
                  15,

                background:
                  '#081322',

                border:
                  '1px solid rgba(255,255,255,0.05)',

                position:
                  'relative'
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
                    'block'
                }}
              />


              {/* =================================================
                  STEP 1 GUIDE
              ================================================= */}

              {showOnboarding &&
                onboardingStep === 1 && (

                <div
                  className="stream-lock-overlay"
                  style={{
                    position:
                      'absolute',

                    inset:
                      0,

                    zIndex:
                      10,

                    pointerEvents:
                      'none'
                  }}
                >

                  {/* TOP INSTRUCTION */}

                  <button
                    type="button"
                    onClick={
                      handleAcknowledgePlayTap
                    }
                    className="step-one-card"
                    style={{
                      position:
                        'absolute',

                      top:
                        10,

                      left:
                        10,

                      right:
                        10,

                      padding:
                        '9px 11px',

                      borderRadius:
                        12,

                      background:
                        'rgba(4,11,23,0.96)',

                      border:
                        '1px solid rgba(74,158,255,0.55)',

                      boxShadow:
                        '0 8px 22px rgba(0,0,0,0.42)',

                      color:
                        '#fff',

                      textAlign:
                        'left',

                      cursor:
                        'pointer',

                      pointerEvents:
                        'auto',

                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        9
                    }}
                  >

                    <div
                      className="hand-pulse"
                      style={{
                        width:
                          31,

                        height:
                          31,

                        borderRadius:
                          9,

                        flexShrink:
                          0,

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'center',

                        background:
                          'rgba(74,158,255,0.14)'
                      }}
                    >

                      <Hand
                        size={17}
                        color="#4a9eff"
                      />

                    </div>


                    <div
                      style={{
                        flex:
                          1
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            12,

                          fontWeight:
                            900
                        }}
                      >
                        STEP 1 · PRESS PLAY
                      </div>

                      <div
                        style={{
                          fontSize:
                            10,

                          color:
                            '#9DB0C7',

                          marginTop:
                            2
                        }}
                      >
                        Tap Play in Audiomack, then tap here.
                      </div>

                    </div>


                    <ArrowDown
                      size={18}
                      color="#4a9eff"
                      className="tiny-arrow"
                    />

                  </button>


                  {/* PLAY AREA HIGHLIGHT */}

                  <div
                    className="play-target"
                    style={{
                      position:
                        'absolute',

                      left:
                        '3%',

                      bottom:
                        '9%',

                      width:
                        72,

                      height:
                        72,

                      borderRadius:
                        '50%',

                      border:
                        '3px solid rgba(74,158,255,0.95)',

                      boxShadow:
                        '0 0 0 7px rgba(74,158,255,0.12), 0 0 25px rgba(74,158,255,0.75)',

                      pointerEvents:
                        'none'
                    }}
                  />


                  {/* SHARP ARROW */}

                  <div
                    className="sharp-play-arrow"
                    style={{
                      position:
                        'absolute',

                      left:
                        '13%',

                      bottom:
                        '31%',

                      width:
                        80,

                      height:
                        70,

                      pointerEvents:
                        'none'
                    }}
                  >

                    <svg
                      width="80"
                      height="70"
                      viewBox="0 0 80 70"
                      style={{
                        overflow:
                          'visible'
                      }}
                    >

                      <path
                        d="M68 8 C 52 12, 27 24, 14 49"
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      <path
                        d="M14 49 L14 31"
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      <path
                        d="M14 49 L31 44"
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                    </svg>

                  </div>

                </div>
              )}

            </div>

          ) : (

            <div
              style={{
                height:
                  90,

                borderRadius:
                  15,

                background:
                  'linear-gradient(145deg, rgba(74,158,255,0.08), rgba(255,255,255,0.025))',

                display:
                  'flex',

                flexDirection:
                  'column',

                alignItems:
                  'center',

                justifyContent:
                  'center'
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
                    12
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
            className={
              onboardingStep === 2
                ? 'step-two-active'
                : ''
            }
            style={{
              background:
                onboardingStep === 2
                  ? 'rgba(74,158,255,0.10)'
                  : 'rgba(74,158,255,0.06)',

              border:
                onboardingStep === 2
                  ? '1px solid rgba(74,158,255,0.38)'
                  : '1px solid rgba(74,158,255,0.16)',

              borderRadius:
                17,

              padding:
                14,

              marginBottom:
                12,

              textAlign:
                'center',

              position:
                'relative'
            }}
          >

            {onboardingStep === 2 && (

              <div
                className="step-two-badge"
                style={{
                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  gap:
                    6,

                  padding:
                    '5px 9px',

                  borderRadius:
                    999,

                  background:
                    'rgba(74,158,255,0.13)',

                  color:
                    '#7DBBFF',

                  fontSize:
                    9,

                  fontWeight:
                    900,

                  marginBottom:
                    7
                }}
              >

                <Hand
                  size={13}
                />

                STEP 2

              </div>
            )}


            <ShieldCheck
              size={
                onboardingStep === 2
                  ? 26
                  : 24
              }
              color="#4a9eff"
            />


            <p
              style={{
                margin:
                  '7px 0 4px',

                fontWeight:
                  800,

                fontSize:
                  14
              }}
            >
              Start the music first
            </p>


            <p
              style={{
                margin:
                  '0 auto 11px',

                maxWidth:
                  350,

                color:
                  '#8A9BB0',

                fontSize:
                  11,

                lineHeight:
                  1.45
              }}
            >
              Press Play inside Audiomack.
              Once the music has started,
              confirm below.
            </p>


            {onboardingStep === 2 && (

              <div
                className="confirm-arrow-bounce"
                style={{
                  marginBottom:
                    4,

                  color:
                    '#4a9eff'
                }}
              >

                <ArrowDown
                  size={21}
                  strokeWidth={3}
                />

              </div>
            )}


            <button
              onClick={
                handlePlaybackConfirmation
              }
              disabled={
                onboardingStep !== 2
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
                  onboardingStep === 2
                    ? 'linear-gradient(135deg, #4a9eff, #2d6be4)'
                    : 'rgba(255,255,255,0.06)',

                color:
                  onboardingStep === 2
                    ? '#fff'
                    : '#52677F',

                fontWeight:
                  800,

                fontSize:
                  13,

                cursor:
                  onboardingStep === 2
                    ? 'pointer'
                    : 'not-allowed',

                boxShadow:
                  onboardingStep === 2
                    ? '0 8px 20px rgba(45,107,228,0.28)'
                    : 'none'
              }}
            >
              ✓ I've Started Playing
            </button>

          </section>
        )}


        {/* =================================================
            VERIFICATION STATUS
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
                '9px 12px',

              marginBottom:
                12,

              borderRadius:
                11,

              background:
                'rgba(74,222,128,0.07)',

              border:
                '1px solid rgba(74,222,128,0.13)'
            }}
          >

            <Eye
              size={15}
              color="#4ADE80"
            />

            <span
              style={{
                fontSize:
                  10,

                color:
                  '#9DB0C7'
              }}
            >
              Your listening time is being verified by Rewaiq.
            </span>

          </div>
        )}


        {/* =================================================
            EARNING TIMER
        ================================================= */}

        <section
          style={{
            background:
              '#0D1F3C',

            borderRadius:
              20,

            padding:
              '20px 16px',

            marginBottom:
              12,

            border:
              '1px solid rgba(255,255,255,0.06)',

            textAlign:
              'center'
          }}
        >

          <div
            style={{
              width:
                138,

              height:
                138,

              margin:
                '0 auto 14px',

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
                'background 1s linear'
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
                  'center'
              }}
            >

              <span
                style={{
                  fontSize:
                    32,

                  fontWeight:
                    900,

                  lineHeight:
                    1
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
                      10,

                    color:
                      '#71849B',

                    marginTop:
                      5
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
                '0 0 5px',

              fontSize:
                15,

              fontWeight:
                800
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
                11,

              lineHeight:
                1.45
            }}
          >

            {status ===
              'streaming'
              ? 'Keep the music playing and keep this page visible.'
              : status ===
                'awaiting_play'
              ? 'Your earning time has not started yet.'
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
                15
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
                  'width 1s linear'
              }}
            />

          </div>

        </section>


        {/* =================================================
            SCREENSHOT
        ================================================= */}

        {showScreenshotPrompt &&
          status ===
            'streaming' && (

          <section
            style={{
              padding:
                14,

              borderRadius:
                15,

              background:
                'rgba(255,255,255,0.04)',

              border:
                '1px solid rgba(255,255,255,0.07)',

              marginBottom:
                12
            }}
          >

            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'flex-start',

                gap:
                  10
              }}
            >

              <Camera
                size={22}
                color="#4a9eff"
              />

              <div>

                <p
                  style={{
                    margin:
                      0,

                    fontSize:
                      13,

                    fontWeight:
                      800
                  }}
                >
                  Quick verification
                </p>

                <p
                  style={{
                    margin:
                      '4px 0 0',

                    color:
                      '#8A9BB0',

                    fontSize:
                      10,

                    lineHeight:
                      1.45
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
            ACTION
        ================================================= */}

        {status ===
          'completed' ? (

          <div>

            <div
              style={{
                padding:
                  14,

                borderRadius:
                  15,

                background:
                  'rgba(74,222,128,0.08)',

                border:
                  '1px solid rgba(74,222,128,0.16)',

                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  11,

                marginBottom:
                  12
              }}
            >

              <CheckCircle
                size={27}
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
                      13
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
                      10
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
                  '14px',

                borderRadius:
                  14,

                border:
                  'none',

                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',

                color:
                  '#fff',

                fontWeight:
                  800,

                fontSize:
                  14
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
                '15px',

              borderRadius:
                14,

              background:
                'rgba(248,113,113,0.10)',

              border:
                '1px solid rgba(248,113,113,0.24)',

              color:
                '#F87171',

              fontWeight:
                800,

              fontSize:
                14,

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                8
            }}
          >

            <Square
              size={16}
              fill="#F87171"
            />

            Stop Streaming

          </button>

        ) : status ===
          'awaiting_play' ? (

          <div
            style={{
              padding:
                '11px 12px',

              borderRadius:
                13,

              background:
                onboardingStep === 2
                  ? 'rgba(74,158,255,0.07)'
                  : 'rgba(255,255,255,0.03)',

              border:
                onboardingStep === 2
                  ? '1px solid rgba(74,158,255,0.18)'
                  : '1px solid rgba(255,255,255,0.05)',

              display:
                'flex',

              alignItems:
                'center',

              gap:
                8
            }}
          >

            {onboardingStep === 1 ? (

              <Hand
                size={16}
                color="#4a9eff"
              />

            ) : (

              <AlertTriangle
                size={16}
                color="#FBBF24"
              />

            )}

            <span
              style={{
                fontSize:
                  10,

                color:
                  '#9DB0C7',

                lineHeight:
                  1.45
              }}
            >

              {onboardingStep === 1
                ? 'Follow Step 1 above. This guide will stay here until you take the required action.'
                : 'Step 2 is ready. Tap "I\'ve Started Playing" above to begin verification.'}

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
                '15px',

              borderRadius:
                14,

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
                12,

              padding:
                11,

              borderRadius:
                11,

              background:
                'rgba(248,113,113,0.08)',

              border:
                '1px solid rgba(248,113,113,0.15)'
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
                  11,

                lineHeight:
                  1.45
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
              9,

            lineHeight:
              1.5,

            margin:
              '14px 18px 0'
          }}
        >
          Your listening time is being verified by Rewaiq.
          Keep this page visible and keep the music playing.
        </p>

      </main>


      {/* ===================================================
          ONBOARDING LOCK
          
          Locks the entire page while Step 1/2 is active.
          The header remains above it so Back still works.
          
          We do NOT use this to cover the player itself,
          because the user needs to interact with Audiomack.
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
              150,

            pointerEvents:
              'none',

            background:
              'rgba(0,0,0,0)'
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
            position:
              'fixed',

            inset:
              0,

            background:
              'rgba(3,8,18,0.85)',

            backdropFilter:
              'blur(4px)',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            zIndex:
              300,

            padding:
              18
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
                23,

              borderRadius:
                20,

              background:
                'linear-gradient(145deg, #162E50, #102440)',

              border:
                '1px solid rgba(74,158,255,0.35)',

              textAlign:
                'center',

              boxShadow:
                '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >

            <ShieldCheck
              size={36}
              color="#4a9eff"
            />

            <p
              style={{
                fontSize:
                  18,

                fontWeight:
                  900,

                margin:
                  '12px 0 5px'
              }}
            >
              Quick listening check
            </p>

            <p
              style={{
                color:
                  '#9DB0C7',

                fontSize:
                  12,

                margin:
                  '0 0 14px',

                lineHeight:
                  1.5
              }}
            >
              Are you still listening to the track?
            </p>

            <div
              className="confirm-arrow-bounce"
              style={{
                marginBottom:
                  5,

                color:
                  '#4a9eff'
              }}
            >

              <ArrowDown
                size={21}
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
                  '14px',

                borderRadius:
                  13,

                border:
                  'none',

                background:
                  '#4a9eff',

                color:
                  '#fff',

                fontWeight:
                  800,

                fontSize:
                  14,

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
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }

        }


        .spin {

          animation:
            spin
            1s
            linear
            infinite;

        }


        /* -----------------------------------------------
           Sharp arrow movement
        ----------------------------------------------- */

        @keyframes sharpArrow {

          0%,
          100% {
            transform:
              translate(0, 0)
              scale(1);

            opacity:
              0.72;
          }

          50% {
            transform:
              translate(-5px, 5px)
              scale(1.08);

            opacity:
              1;
          }

        }


        .sharp-play-arrow {

          animation:
            sharpArrow
            0.9s
            ease-in-out
            infinite;

          transform-origin:
            center;

        }


        /* -----------------------------------------------
           Play target pulse
        ----------------------------------------------- */

        @keyframes playTarget {

          0% {
            transform:
              scale(0.88);

            opacity:
              0.55;
          }

          50% {
            transform:
              scale(1.08);

            opacity:
              1;
          }

          100% {
            transform:
              scale(0.88);

            opacity:
              0.55;
          }

        }


        .play-target {

          animation:
            playTarget
            1.15s
            ease-in-out
            infinite;

        }


        /* -----------------------------------------------
           Hand/card pulse
        ----------------------------------------------- */

        @keyframes handPulse {

          0%,
          100% {
            transform:
              scale(1);

            opacity:
              0.75;
          }

          50% {
            transform:
              scale(1.08);

            opacity:
              1;
          }

        }


        .hand-pulse {

          animation:
            handPulse
            1.1s
            ease-in-out
            infinite;

        }


        /* -----------------------------------------------
           Tiny arrow
        ----------------------------------------------- */

        @keyframes tinyArrow {

          0%,
          100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(4px);
          }

        }


        .tiny-arrow {

          animation:
            tinyArrow
            0.8s
            ease-in-out
            infinite;

          flex-shrink:
            0;

        }


        /* -----------------------------------------------
           Step 2 arrow
        ----------------------------------------------- */

        @keyframes bounceDown {

          0%,
          100% {
            transform:
              translateY(0)
              scale(1);

            opacity:
              0.65;
          }

          50% {
            transform:
              translateY(6px)
              scale(1.08);

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
            bounceDown
            0.85s
            ease-in-out
            infinite;

        }


        /* -----------------------------------------------
           Challenge
        ----------------------------------------------- */

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


        /* -----------------------------------------------
           Step 1 card attention
        ----------------------------------------------- */

        @keyframes cardAttention {

          0%,
          100% {
            box-shadow:
              0 8px 22px rgba(0,0,0,0.42);
          }

          50% {
            box-shadow:
              0 8px 28px rgba(74,158,255,0.22);
          }

        }


        .step-one-card {

          animation:
            cardAttention
            1.5s
            ease-in-out
            infinite;

        }


        /* -----------------------------------------------
           Prevent text selection during guide
        ----------------------------------------------- */

        .stream-guide,
        .stream-lock-overlay {

          user-select:
            none;

        }


        /* -----------------------------------------------
           Mobile
        ----------------------------------------------- */

        @media (max-width: 420px) {

          .sharp-play-arrow {
            left:
              11% !important;

            bottom:
              29% !important;
          }

          .play-target {
            width:
              64px !important;

            height:
              64px !important;
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
