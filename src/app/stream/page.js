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
  // -------------------------------------------------------

  const [showOnboarding, setShowOnboarding] =
    useState(false);

  const [showScreenshotPrompt, setShowScreenshotPrompt] =
    useState(false);

  const [challengeVisible, setChallengeVisible] =
    useState(false);

  const [challengeSubmitting, setChallengeSubmitting] =
    useState(false);


  // -------------------------------------------------------
  // Refs
  // -------------------------------------------------------

  const heartbeatRef =
    useRef(null);

  const startingRef =
    useRef(false);

  const endingRef =
    useRef(false);

  const heartbeatBusyRef =
    useRef(false);


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
      // Show cached track immediately
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
      // Fetch fresh track
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
  // GET PAGE VISIBILITY
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

    if (
      !sessionId ||
      !playbackStarted ||
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
          sessionId,

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


      // ---------------------------------------------------
      // Challenge
      // ---------------------------------------------------

      if (
        data.challenge_required &&
        !data.challenge_passed
      ) {

        setChallengeVisible(
          true
        );
      }


      // ---------------------------------------------------
      // Complete
      // ---------------------------------------------------

      if (
        data.complete
      ) {

        clearHeartbeat();

        await finishStream(
          sessionId
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
  // START HEARTBEATS
  // =======================================================

  function startHeartbeatLoop() {

    clearHeartbeat();

    // Send first heartbeat immediately.
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
            session_id: sid
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
      // Refresh wallet
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

      setShowScreenshotPrompt(
        false
      );

      setChallengeVisible(
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

      setChallengeVisible(
        false
      );

      saveTrackLocally(
        track
      );


      // ---------------------------------------------------
      // Create backend session FIRST
      // ---------------------------------------------------

      setStatus(
        'starting'
      );

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


      setSessionId(
        newSessionId
      );


      // ---------------------------------------------------
      // NOW show player
      // ---------------------------------------------------

      setShowEmbed(
        true
      );

      setStatus(
        'awaiting_play'
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

      setShowEmbed(
        false
      );

      setSessionId(
        null
      );

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
  // USER CONFIRMS PLAYBACK
  // =======================================================

  function handlePlaybackConfirmation() {

    if (
      !sessionId
    ) {

      setError(
        'Streaming session is not ready.'
      );

      return;
    }

    setShowOnboarding(
      false
    );

    setPlaybackStarted(
      true
    );

    setStatus(
      'streaming'
    );

    setError('');

    startHeartbeatLoop();
  }


  // =======================================================
  // CHALLENGE RESPONSE
  // =======================================================

  async function handleChallenge() {

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

    if (
      sessionId
    ) {

      try {

        await API.post(
          '/api/streams/end',
          {
            session_id:
              sessionId
          }
        );

      } catch (err) {

        console.warn(
          'Could not end stream:',
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
        status === 'streaming' &&
        playbackStarted
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

  }, [
    status,
    playbackStarted,
    sessionId
  ]);


  // =======================================================
  // CLEANUP
  // =======================================================

  useEffect(() => {

    return () => {
      clearHeartbeat();
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
            20,

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
              'center'
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
            '22px 18px'
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
              22,

            padding:
              18,

            marginBottom:
              16,

            border:
              '1px solid rgba(255,255,255,0.06)',

            boxShadow:
              '0 16px 40px rgba(0,0,0,0.22)'
          }}
        >

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                14
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
                  1
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
                    'ellipsis'
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
              22,

            padding:
              16,

            marginBottom:
              16,

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
                12
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
                    12,

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
                    11,

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
                  16,

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


              {/* -----------------------------------------
                  PLAY GUIDE
              ----------------------------------------- */}

              {showOnboarding && (

                <div
                  className="stream-guide"
                  style={{
                    position:
                      'absolute',

                    inset:
                      0,

                    pointerEvents:
                      'none',

                    zIndex:
                      5
                  }}
                >

                  <div
                    style={{
                      position:
                        'absolute',

                      top:
                        16,

                      left:
                        16,

                      right:
                        16,

                      padding:
                        '11px 13px',

                      borderRadius:
                        12,

                      background:
                        'rgba(5,12,24,0.94)',

                      border:
                        '1px solid rgba(74,158,255,0.35)',

                      boxShadow:
                        '0 10px 30px rgba(0,0,0,0.35)'
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          8
                      }}
                    >

                      <Hand
                        size={18}
                        color="#4a9eff"
                      />

                      <strong
                        style={{
                          fontSize:
                            13
                        }}
                      >
                        Step 1: Press Play
                      </strong>

                    </div>

                    <div
                      style={{
                        fontSize:
                          11,

                        color:
                          '#9DB0C7',

                        marginTop:
                          5,

                        lineHeight:
                          1.45
                      }}
                    >
                      Tap the Play button
                      inside the Audiomack
                      player below.
                    </div>

                  </div>


                  {/* Animated pointer */}

                  <div
                    className="play-pointer"
                    style={{
                      position:
                        'absolute',

                      left:
                        '50%',

                      top:
                        '58%',

                      transform:
                        'translate(-50%, -50%)',

                      width:
                        64,

                      height:
                        64,

                      borderRadius:
                        '50%',

                      border:
                        '3px solid #4a9eff',

                      boxShadow:
                        '0 0 0 10px rgba(74,158,255,0.12), 0 0 30px rgba(74,158,255,0.35)'
                    }}
                  />

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
                size={30}
                color="#4a9eff"
              />

              <p
                style={{
                  margin:
                    '8px 0 0',

                  fontSize:
                    13
                }}
              >
                Ready to stream
              </p>

            </div>
          )}

        </section>


        {/* =================================================
            PLAYBACK CONFIRMATION
        ================================================= */}

        {status ===
          'awaiting_play' && (

          <section
            style={{
              background:
                'rgba(74,158,255,0.08)',

              border:
                '1px solid rgba(74,158,255,0.20)',

              borderRadius:
                18,

              padding:
                18,

              marginBottom:
                16,

              textAlign:
                'center'
            }}
          >

            <ShieldCheck
              size={30}
              color="#4a9eff"
            />

            <p
              style={{
                margin:
                  '10px 0 5px',

                fontWeight:
                  800,

                fontSize:
                  15
              }}
            >
              Start the music first
            </p>

            <p
              style={{
                margin:
                  '0 auto 14px',

                maxWidth:
                  360,

                color:
                  '#8A9BB0',

                fontSize:
                  12,

                lineHeight:
                  1.5
              }}
            >
              Press Play inside the
              Audiomack player. Once
              the music has started,
              tap the button below.
            </p>

            <button
              onClick={
                handlePlaybackConfirmation
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
                  14
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
                '10px 13px',

              marginBottom:
                14,

              borderRadius:
                12,

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
                fontSize:
                  11,

                color:
                  '#9DB0C7'
              }}
            >
              Your listening time is
              being verified by Rewaiq.
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
              22,

            padding:
              '24px 18px',

            marginBottom:
              16,

            border:
              '1px solid rgba(255,255,255,0.06)',

            textAlign:
              'center'
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
                    34,

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
                      11,

                    color:
                      '#71849B',

                    marginTop:
                      6
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
                12,

              lineHeight:
                1.5
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
                18
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
            CHALLENGE
        ================================================= */}

        {challengeVisible &&
          status ===
            'streaming' && (

          <section
            style={{
              padding:
                18,

              borderRadius:
                18,

              background:
                'linear-gradient(145deg, #162E50, #102440)',

              border:
                '1px solid rgba(74,158,255,0.30)',

              marginBottom:
                16,

              textAlign:
                'center',

              boxShadow:
                '0 15px 35px rgba(0,0,0,0.25)'
            }}
          >

            <ShieldCheck
              size={32}
              color="#4a9eff"
            />

            <p
              style={{
                fontSize:
                  17,

                fontWeight:
                  900,

                margin:
                  '10px 0 5px'
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
                  '0 0 15px'
              }}
            >
              Are you still listening
              to the track?
            </p>

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

                opacity:
                  challengeSubmitting
                    ? 0.6
                    : 1
              }}
            >

              {challengeSubmitting
                ? 'Checking...'
                : "Yes, I'm Listening"}

            </button>

          </section>
        )}


        {/* =================================================
            SCREENSHOT CHECKPOINT
        ================================================= */}

        {showScreenshotPrompt &&
          status ===
            'streaming' && (

          <section
            style={{
              padding:
                16,

              borderRadius:
                16,

              background:
                'rgba(255,255,255,0.04)',

              border:
                '1px solid rgba(255,255,255,0.07)',

              marginBottom:
                16
            }}
          >

            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'flex-start',

                gap:
                  12
              }}
            >

              <Camera
                size={24}
                color="#4a9eff"
              />

              <div>

                <p
                  style={{
                    margin:
                      0,

                    fontSize:
                      14,

                    fontWeight:
                      800
                  }}
                >
                  Quick verification
                </p>

                <p
                  style={{
                    margin:
                      '5px 0 0',

                    color:
                      '#8A9BB0',

                    fontSize:
                      11,

                    lineHeight:
                      1.5
                  }}
                >
                  If requested during
                  onboarding, take a
                  screenshot showing
                  the Audiomack player.
                  This is an additional
                  verification step.
                </p>

              </div>

            </div>

          </section>
        )}


        {/* =================================================
            COMPLETED
        ================================================= */}

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
                  14
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
                      14
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
                      11
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
                  15
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

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                9
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
              padding:
                13,

              borderRadius:
                14,

              background:
                'rgba(255,255,255,0.03)',

              border:
                '1px solid rgba(255,255,255,0.05)',

              display:
                'flex',

              alignItems:
                'center',

              gap:
                9
            }}
          >

            <AlertTriangle
              size={17}
              color="#FBBF24"
            />

            <span
              style={{
                fontSize:
                  11,

                color:
                  '#9DB0C7',

                lineHeight:
                  1.5
              }}
            >
              Your earning timer has
              not started. Press Play
              in Audiomack first.
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
                '17px',

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

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                9,

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
                14,

              padding:
                12,

              borderRadius:
                12,

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
                  12,

                lineHeight:
                  1.5
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
              10,

            lineHeight:
              1.5,

            margin:
              '18px 20px 0'
          }}
        >
          Rewaiq verifies your
          streaming session using
          server-side heartbeats,
          page visibility and
          listening challenges.
        </p>

      </main>


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


        @keyframes pulsePlay {

          0% {
            transform:
              translate(-50%, -50%)
              scale(0.90);

            opacity:
              0.6;
          }

          50% {
            transform:
              translate(-50%, -50%)
              scale(1.05);

            opacity:
              1;
          }

          100% {
            transform:
              translate(-50%, -50%)
              scale(0.90);

            opacity:
              0.6;
          }

        }


        .play-pointer {

          animation:
            pulsePlay
            1.5s
            ease-in-out
            infinite;

        }


        .spin {

          animation:
            spin
            1s
            linear
            infinite;

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
