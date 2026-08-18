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
  ShieldCheck,
  Eye,
  AlertTriangle,
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';


const REQUIRED_SECONDS = 60;

const HEARTBEAT_INTERVAL_MS = 5000;

const STORAGE_KEY =
  'rewaiq_stream_track';


// ============================================================
// TRACK HELPERS
// ============================================================

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

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);

  } catch (error) {

    console.warn(
      'Could not read saved track:',
      error
    );

    return null;
  }
}


// ============================================================
// MAIN CONTENT
// ============================================================

function StreamContent() {

  const router =
    useRouter();

  const searchParams =
    useSearchParams();


  // ----------------------------------------------------------
  // URL track
  // ----------------------------------------------------------

  const urlTrackId =
    searchParams.get('id') ||
    searchParams.get('track_id') ||
    searchParams.get('trackId');


  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

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

  const [showEmbed, setShowEmbed] =
    useState(false);

  const [sessionId, setSessionId] =
    useState(null);

  const [verifiedSeconds, setVerifiedSeconds] =
    useState(0);

  const [error, setError] =
    useState('');

  const [rewarded, setRewarded] =
    useState(false);

  const [onboarding, setOnboarding] =
    useState(false);

  const [playConfirmed, setPlayConfirmed] =
    useState(false);

  const [challengeVisible, setChallengeVisible] =
    useState(false);

  const [challengeSubmitting, setChallengeSubmitting] =
    useState(false);

  const [warning, setWarning] =
    useState('');

  const [pageVisible, setPageVisible] =
    useState(true);

  const [pageFocused, setPageFocused] =
    useState(true);


  // ----------------------------------------------------------
  // Refs
  // ----------------------------------------------------------

  const heartbeatRef =
    useRef(null);

  const startingRef =
    useRef(false);

  const endingRef =
    useRef(false);

  const challengeAnsweredRef =
    useRef(false);


  // ==========================================================
  // URL SYNC
  // ==========================================================

  useEffect(() => {

    if (urlTrackId) {

      setTrackId(
        String(urlTrackId)
      );

    }

  }, [urlTrackId]);


  // ==========================================================
  // PAGE VISIBILITY
  // ==========================================================

  useEffect(() => {

    function handleVisibility() {

      const visible =
        document.visibilityState ===
        'visible';

      setPageVisible(
        visible
      );

      if (!visible) {

        setWarning(
          'Keep Rewaiq open while streaming. Your hidden time will not be credited.'
        );

      } else {

        setWarning('');
      }
    }


    function handleFocus() {

      setPageFocused(
        true
      );
    }


    function handleBlur() {

      setPageFocused(
        false
      );

      setWarning(
        'Keep this page focused while streaming.'
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

  }, []);


  // ==========================================================
  // LOAD TRACK
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadTrack() {

      const savedTrack =
        getSavedTrack();

      const savedTrackId =
        getTrackId(
          savedTrack
        );


      const resolvedId =
        urlTrackId ||
        savedTrackId;


      if (!resolvedId) {

        if (!cancelled) {

          setLoading(false);

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


      // ------------------------------------------------------
      // Show cached track immediately
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // Fetch latest track
      // ------------------------------------------------------

      try {

        setError('');

        const response =
          await API.get(
            `/api/tracks/${encodeURIComponent(
              normalizedId
            )}`
          );


        if (cancelled) {
          return;
        }


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


  // ==========================================================
  // EMBED URL
  // ==========================================================

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


  // ==========================================================
  // CLEAR HEARTBEAT
  // ==========================================================

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


  // ==========================================================
  // SEND HEARTBEAT
  // ==========================================================

  async function sendHeartbeat(
    challengeResponse = false
  ) {

    if (!sessionId) {
      return;
    }


    try {

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
              challengeResponse
          }
        );


      const data =
        response?.data;


      if (!data) {
        return;
      }


      // ------------------------------------------------------
      // Backend is authoritative
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // Challenge
      // ------------------------------------------------------

      if (
        data.challenge_required &&
        !data.challenge_passed
      ) {

        setChallengeVisible(
          true
        );

      }


      // ------------------------------------------------------
      // Complete
      // ------------------------------------------------------

      if (
        data.complete
      ) {

        clearHeartbeat();

        await finishStream(
          sessionId
        );
      }


    } catch (err) {

      console.warn(
        'Heartbeat failed:',
        err
      );

    }
  }


  // ==========================================================
  // START HEARTBEATS
  // ==========================================================

  function startHeartbeatLoop() {

    clearHeartbeat();


    // Send immediately.
    sendHeartbeat(
      false
    );


    heartbeatRef.current =
      setInterval(() => {

        sendHeartbeat(
          false
        );

      }, HEARTBEAT_INTERVAL_MS);
  }


  // ==========================================================
  // START STREAM
  // ==========================================================

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

      setWarning('');

      setRewarded(false);

      setVerifiedSeconds(0);

      setPlayConfirmed(false);

      setChallengeVisible(false);

      challengeAnsweredRef.current =
        false;


      saveTrackLocally(
        track
      );


      // ------------------------------------------------------
      // Create server session
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // Save session
      // ------------------------------------------------------

      setSessionId(
        newSessionId
      );


      // ------------------------------------------------------
      // Show player
      // ------------------------------------------------------

      setShowEmbed(
        true
      );


      /*
       * IMPORTANT:
       *
       * We DO NOT start heartbeat here.
       *
       * User must first click Play and confirm.
       */

      setStatus(
        'awaiting_play'
      );


      setOnboarding(
        true
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

      setVerifiedSeconds(
        0
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


  // ==========================================================
  // USER CONFIRMS PLAY
  // ==========================================================

  function handlePlayConfirmed() {

    if (!sessionId) {

      setError(
        'Streaming session is missing. Please try again.'
      );

      return;
    }


    setOnboarding(
      false
    );


    setPlayConfirmed(
      true
    );


    setStatus(
      'streaming'
    );


    setWarning(
      'Keep the music playing and keep this page open.'
    );


    /*
     * THIS is the point where verification begins.
     */
    startHeartbeatLoop();
  }


  // ==========================================================
  // CHALLENGE
  // ==========================================================

  async function handleChallengeConfirm() {

    if (
      challengeSubmitting ||
      challengeAnsweredRef.current
    ) {
      return;
    }


    if (!sessionId) {
      return;
    }


    setChallengeSubmitting(
      true
    );


    try {

      challengeAnsweredRef.current =
        true;


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
              true
          }
        );


      const data =
        response?.data;


      if (
        typeof data?.valid_seconds ===
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
        data?.challenge_passed
      ) {

        setChallengeVisible(
          false
        );


        challengeAnsweredRef.current =
          false;


        setWarning(
          'Verification passed. Keep listening.'
        );


        if (data.complete) {

          clearHeartbeat();

          await finishStream(
            sessionId
          );
        }


      } else {

        challengeAnsweredRef.current =
          false;

        setChallengeVisible(
          true
        );

        setError(
          'Please confirm that you are still listening.'
        );
      }


    } catch (err) {

      challengeAnsweredRef.current =
        false;


      console.error(
        'Challenge error:',
        err
      );


      setError(
        err?.response?.data?.message ||
        'Could not verify your response.'
      );

    } finally {

      setChallengeSubmitting(
        false
      );
    }
  }


  // ==========================================================
  // FINISH STREAM
  // ==========================================================

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


      const data =
        response?.data;


      console.log(
        'Stream completed:',
        data
      );


      // ------------------------------------------------------
      // Update local wallet
      // ------------------------------------------------------

      const backendBalance =
        data?.coin_balance;


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

          } catch (storageError) {

            console.warn(
              'Could not update stored user:',
              storageError
            );
          }
        }
      }


      // ------------------------------------------------------
      // Refresh balance
      // ------------------------------------------------------

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
                JSON.stringify(
                  user
                )
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
          'Could not refresh balance:',
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


      setSessionId(
        null
      );


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


      setShowEmbed(
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


  // ==========================================================
  // STOP STREAM
  // ==========================================================

  async function handleStopStreaming() {

    if (
      status !== 'streaming' &&
      status !== 'awaiting_play'
    ) {
      return;
    }


    clearHeartbeat();


    if (sessionId) {

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


    setVerifiedSeconds(
      0
    );


    setRewarded(
      false
    );


    setPlayConfirmed(
      false
    );


    setOnboarding(
      false
    );
  }


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {

    return () => {

      clearHeartbeat();

    };

  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !track
  ) {

    return (
      <Spinner
        fullscreen
      />
    );
  }


  // ==========================================================
  // NO TRACK
  // ==========================================================

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
            padding:
              '12px 20px',
            borderRadius: 10,
            border: 'none',
            background:
              '#4a9eff',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>

      </div>
    );
  }


  // ==========================================================
  // DISPLAY VALUES
  // ==========================================================

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
    track.title ||
    track.name ||
    'Untitled Track';


  const artist =
    track.artist_name ||
    track.artist ||
    track.artistName ||
    'Unknown Artist';


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #07111F 0%, #0A1628 100%)',
        color: '#fff',
        paddingBottom: 40
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          height: 64,
          padding:
            '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background:
            'rgba(13,31,60,0.92)',
          borderBottom:
            '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
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
          padding:
            '22px 18px'
        }}
      >

        {/* ===================================================
            TRACK INFO
        ==================================================== */}

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
                  src={
                    track.cover_image
                  }
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
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
                minWidth: 0,
                flex: 1
              }}
            >

              <p
                style={{
                  fontSize: 18,
                  fontWeight: 800,
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
                  fontSize: 13,
                  color: '#8A9BB0',
                  margin: 0,
                  whiteSpace:
                    'nowrap',
                  overflow:
                    'hidden',
                  textOverflow:
                    'ellipsis'
                }}
              >
                {artist}
              </p>

            </div>

          </div>

        </section>


        {/* ===================================================
            AUDIO PLAYER
        ==================================================== */}

        <section
          style={{
            background:
              '#0D1F3C',
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
              justifyContent:
                'space-between',
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


            {status ===
              'streaming' && (

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
                    borderRadius:
                      '50%',
                    background:
                      '#4ADE80',
                    boxShadow:
                      '0 0 8px #4ADE80'
                  }}
                />

                VERIFYING

              </span>

            )}

          </div>


          {showEmbed &&
          embedUrl ? (

            <div
              style={{
                width: '100%',
                height: 252,
                overflow:
                  'hidden',
                borderRadius: 16,
                background:
                  '#081322',
                border:
                  '1px solid rgba(255,255,255,0.05)',
                position:
                  'relative'
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
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 252,
                  border: 'none',
                  display: 'block'
                }}
              />


              {/* --------------------------------------------
                  PLAY GUIDANCE
              --------------------------------------------- */}

              {status ===
                'awaiting_play' && (

                <div
                  style={{
                    position:
                      'absolute',
                    inset: 0,
                    background:
                      'rgba(3,10,20,0.38)',
                    display: 'flex',
                    alignItems:
                      'flex-start',
                    justifyContent:
                      'center',
                    pointerEvents:
                      'none'
                  }}
                >

                  <div
                    style={{
                      marginTop: 12,
                      padding:
                        '8px 12px',
                      borderRadius:
                        10,
                      background:
                        '#4a9eff',
                      color:
                        '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      boxShadow:
                        '0 8px 20px rgba(0,0,0,0.3)'
                    }}
                  >
                    👆 Tap Play in Audiomack
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
                border:
                  '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection:
                  'column',
                alignItems:
                  'center',
                justifyContent:
                  'center'
              }}
            >

              <Music2
                size={26}
                color="#4a9eff"
              />


              <p
                style={{
                  margin:
                    '8px 0 0',
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                Ready to stream
              </p>

            </div>

          )}

        </section>


        {/* ===================================================
            VERIFICATION STATUS
        ==================================================== */}

        <section
          style={{
            background:
              '#0D1F3C',
            borderRadius: 22,
            padding:
              '24px 18px',
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
              margin:
                '0 auto 18px',
              borderRadius:
                '50%',
              background:
                `conic-gradient(
                  #4a9eff ${progress}%,
                  rgba(74,158,255,0.10) ${progress}% 100%
                )`,
              padding: 7,
              transition:
                'background 1s linear',
              boxShadow:
                status ===
                'streaming'
                  ? '0 0 30px rgba(74,158,255,0.12)'
                  : 'none'
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
                  'center'
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
                  : verifiedSeconds}

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
              margin:
                '0 0 6px',
              fontSize: 16,
              fontWeight: 800
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
              ? 'Listening verification active'
              : status ===
                'completing'
              ? 'Adding your coins...'
              : status ===
                'completed'
              ? 'Stream complete!'
              : '60 verified seconds to earn'}

          </p>


          <p
            style={{
              margin: 0,
              color: '#71849B',
              fontSize: 12,
              lineHeight: 1.5
            }}
          >

            {status ===
              'awaiting_play'
              ? 'Play the music in Audiomack, then confirm below.'
              : status ===
                'streaming'
              ? `Keep listening. ${remaining} verified seconds remaining.`
              : status ===
                'completed'
              ? 'Your wallet has been updated.'
              : 'You must listen for 60 verified seconds to earn.'}

          </p>


          {/* Progress */}

          <div
            style={{
              height: 5,
              background:
                'rgba(255,255,255,0.06)',
              borderRadius: 10,
              overflow:
                'hidden',
              marginTop: 18
            }}
          >

            <div
              style={{
                height: '100%',
                width:
                  `${progress}%`,
                background:
                  '#4a9eff',
                borderRadius: 10,
                transition:
                  'width 1s linear'
              }}
            />

          </div>


          {/* Verification indicators */}

          {status ===
            'streaming' && (

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'center',
                gap: 16,
                marginTop: 14,
                fontSize: 10,
                color: '#71849B'
              }}
            >

              <span>
                <Eye
                  size={12}
                  style={{
                    verticalAlign:
                      'middle',
                    marginRight: 4
                  }}
                />
                Page visible
              </span>


              <span>
                <ShieldCheck
                  size={12}
                  style={{
                    verticalAlign:
                      'middle',
                    marginRight: 4
                  }}
                />
                Server verified
              </span>

            </div>

          )}

        </section>


        {/* ===================================================
            WARNING
        ==================================================== */}

        {warning && (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background:
                'rgba(251,191,36,0.08)',
              border:
                '1px solid rgba(251,191,36,0.18)',
              marginBottom: 14,
              display: 'flex',
              alignItems:
                'center',
              gap: 9
            }}
          >

            <AlertTriangle
              size={18}
              color="#FBBF24"
            />


            <span
              style={{
                color: '#FBBF24',
                fontSize: 11,
                lineHeight: 1.5
              }}
            >
              {warning}
            </span>

          </div>
        )}


        {/* ===================================================
            COMPLETED
        ==================================================== */}

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
                alignItems:
                  'center',
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
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  Coins Earned!
                </p>


                <p
                  style={{
                    margin:
                      '3px 0 0',
                    color: '#8A9BB0',
                    fontSize: 11
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
                width: '100%',
                padding: 16,
                borderRadius: 15,
                border: 'none',
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer'
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
              padding: 17,
              borderRadius: 15,
              background:
                'rgba(248,113,113,0.10)',
              border:
                '1px solid rgba(248,113,113,0.24)',
              color: '#F87171',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
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

          <button
            onClick={
              handlePlayConfirmed
            }
            style={{
              width: '100%',
              padding: 17,
              borderRadius: 15,
              border: 'none',
              background:
                'linear-gradient(135deg, #4a9eff, #2d6be4)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 9,
              boxShadow:
                '0 10px 25px rgba(74,158,255,0.18)'
            }}
          >

            <Hand
              size={18}
            />

            I've Pressed Play — Start Verification

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
              width: '100%',
              padding: 17,
              borderRadius: 15,
              border: 'none',
              background:
                'linear-gradient(135deg, #4a9eff, #2d6be4)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 9
            }}
          >

            {status ===
            'starting' ? (

              <Loader2
                size={18}
                style={{
                  animation:
                    'spin 1s linear infinite'
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
              ? 'Preparing...'
              : 'Start Streaming'}

          </button>

        )}


        {/* ===================================================
            ERROR
        ==================================================== */}

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
                textAlign:
                  'center',
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5
              }}
            >
              {error}
            </p>

          </div>

        )}


        {/* ===================================================
            INFO
        ==================================================== */}

        <p
          style={{
            textAlign: 'center',
            color: '#52677F',
            fontSize: 10,
            lineHeight: 1.5,
            margin:
              '18px 20px 0'
          }}
        >
          Rewaiq verifies your listening activity using server-side heartbeats, page visibility and focus before awarding coins.
        </p>

      </main>


      {/* =====================================================
          ONBOARDING OVERLAY
      ====================================================== */}

      {onboarding && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background:
              'rgba(2,8,18,0.78)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: 400,
              background:
                '#102440',
              borderRadius: 24,
              padding: 24,
              border:
                '1px solid rgba(255,255,255,0.08)',
              boxShadow:
                '0 30px 80px rgba(0,0,0,0.45)'
            }}
          >

            <div
              style={{
                width: 54,
                height: 54,
                borderRadius:
                  '50%',
                background:
                  'rgba(74,158,255,0.12)',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                margin:
                  '0 auto 16px'
              }}
            >

              <Hand
                size={27}
                color="#4a9eff"
              />

            </div>


            <h2
              style={{
                textAlign:
                  'center',
                margin:
                  '0 0 10px',
                fontSize: 21,
                fontWeight: 900
              }}
            >
              One quick step
            </h2>


            <p
              style={{
                textAlign:
                  'center',
                color: '#8A9BB0',
                fontSize: 13,
                lineHeight: 1.6,
                margin:
                  '0 0 20px'
              }}
            >
              Your stream session is ready. Now start the music in Audiomack.
            </p>


            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: 12,
                marginBottom: 20
              }}
            >

              <div
                style={{
                  display: 'flex',
                  gap: 11,
                  alignItems:
                    'center',
                  padding: 12,
                  borderRadius: 13,
                  background:
                    'rgba(255,255,255,0.04)'
                }}
              >

                <strong
                  style={{
                    width: 25,
                    height: 25,
                    borderRadius:
                      '50%',
                    background:
                      '#4a9eff',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    fontSize: 12
                  }}
                >
                  1
                </strong>


                <span
                  style={{
                    fontSize: 12,
                    color: '#D5DFEB'
                  }}
                >
                  Tap <b>Play</b> in the Audiomack player.
                </span>

              </div>


              <div
                style={{
                  display: 'flex',
                  gap: 11,
                  alignItems:
                    'center',
                  padding: 12,
                  borderRadius: 13,
                  background:
                    'rgba(255,255,255,0.04)'
                }}
              >

                <strong
                  style={{
                    width: 25,
                    height: 25,
                    borderRadius:
                      '50%',
                    background:
                      '#4a9eff',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    fontSize: 12
                  }}
                >
                  2
                </strong>


                <span
                  style={{
                    fontSize: 12,
                    color: '#D5DFEB'
                  }}
                >
                  Keep the music playing.
                </span>

              </div>


              <div
                style={{
                  display: 'flex',
                  gap: 11,
                  alignItems:
                    'center',
                  padding: 12,
                  borderRadius: 13,
                  background:
                    'rgba(248,113,113,0.07)',
                  border:
                    '1px solid rgba(248,113,113,0.12)'
                }}
              >

                <AlertTriangle
                  size={22}
                  color="#F87171"
                />


                <span
                  style={{
                    fontSize: 11,
                    color: '#FCA5A5',
                    lineHeight: 1.5
                  }}
                >
                  <b>Important:</b> If you don't press Play, your listening time will not be verified.
                </span>

              </div>

            </div>


            <button
              onClick={
                handlePlayConfirmed
              }
              style={{
                width: '100%',
                padding: 15,
                border: 'none',
                borderRadius: 14,
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              I've Pressed Play
            </button>


            <button
              onClick={
                handleStopStreaming
              }
              style={{
                width: '100%',
                padding:
                  '12px',
                marginTop: 8,
                border: 'none',
                background:
                  'transparent',
                color: '#71849B',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

          </div>

        </div>

      )}


      {/* =====================================================
          CHALLENGE MODAL
      ====================================================== */}

      {challengeVisible && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background:
              'rgba(2,8,18,0.82)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 20
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: 380,
              background:
                '#102440',
              borderRadius: 22,
              padding: 24,
              border:
                '1px solid rgba(255,255,255,0.08)',
              textAlign:
                'center',
              boxShadow:
                '0 30px 80px rgba(0,0,0,0.45)'
            }}
          >

            <div
              style={{
                width: 58,
                height: 58,
                borderRadius:
                  '50%',
                background:
                  'rgba(74,158,255,0.12)',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                margin:
                  '0 auto 15px'
              }}
            >

              <ShieldCheck
                size={30}
                color="#4a9eff"
              />

            </div>


            <h2
              style={{
                margin:
                  '0 0 9px',
                fontSize: 20,
                fontWeight: 900
              }}
            >
              Still listening?
            </h2>


            <p
              style={{
                color: '#8A9BB0',
                fontSize: 12,
                lineHeight: 1.6,
                margin:
                  '0 0 20px'
              }}
            >
              Rewaiq needs to confirm that you are still actively listening before continuing to count your verified time.
            </p>


            <button
              disabled={
                challengeSubmitting
              }
              onClick={
                handleChallengeConfirm
              }
              style={{
                width: '100%',
                padding: 15,
                border: 'none',
                borderRadius: 14,
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor:
                  challengeSubmitting
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  challengeSubmitting
                    ? 0.7
                    : 1
              }}
            >

              {challengeSubmitting
                ? 'Verifying...'
                : 'Yes, I’m Listening'}

            </button>

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

      `}</style>

    </div>
  );
}


// ============================================================
// PAGE WRAPPER
// ============================================================

export default function StreamPage() {

  return (
    <Suspense
      fallback={
        <Spinner
          fullscreen
        />
      }
    >
      <StreamContent />
    </Suspense>
  );
    }
