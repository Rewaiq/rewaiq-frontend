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
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const REQUIRED_SECONDS = 60;
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
  if (typeof window === 'undefined') {
    return null;
  }

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

  const [seconds, setSeconds] =
    useState(0);

  const [sessionId, setSessionId] =
    useState(null);

  const [error, setError] =
    useState('');

  const [rewarded, setRewarded] =
    useState(false);

  const timerRef =
    useRef(null);

  const startingRef =
    useRef(false);

  const endingRef =
    useRef(false);

  /*
   * Keep track ID synchronized with URL.
   */
  useEffect(() => {
    if (urlTrackId) {
      setTrackId(String(urlTrackId));
    }
  }, [urlTrackId]);

  /*
   * Load track.
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
       * Show saved track immediately.
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
            setTrack(savedTrack);
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
   * Use the embed_url already stored
   * in the Railway tracks table.
   *
   * We do NOT depend on audiomack_id.
   */
  const getEmbedUrl = () => {
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
  };

  const embedUrl =
    getEmbedUrl();

  /*
   * Clear timer.
   */
  function clearStreamTimer() {
    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }
  }

  /*
   * Finish stream.
   */
  async function finishStream(
    sid
  ) {
    if (endingRef.current) {
      return;
    }

    endingRef.current = true;

    try {
      setStatus(
        'completing'
      );

      const response =
        await API.post(
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
       * Refresh wallet balance.
       */
      try {
        const balanceResponse =
          await API.get(
            '/api/coins/balance'
          );

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
            } catch {}
          }
        }
      } catch (balanceError) {
        console.warn(
          'Could not refresh coin balance:',
          balanceError
        );
      }

      setRewarded(true);
      setSeconds(
        REQUIRED_SECONDS
      );

      setStatus(
        'completed'
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
   * Start streaming.
   */
  async function handleStartStreaming() {
    if (startingRef.current) {
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
      setSeconds(0);

      saveTrackLocally(
        track
      );

      /*
       * Show Audiomack player.
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

      clearStreamTimer();

      let currentSeconds =
        0;

      timerRef.current =
        setInterval(() => {
          currentSeconds +=
            1;

          setSeconds(
            currentSeconds
          );

          if (
            currentSeconds >=
            REQUIRED_SECONDS
          ) {
            clearStreamTimer();

            finishStream(
              newSessionId
            );
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
        err?.response?.data
          ?.message ||
          err?.message ||
          'Could not start stream. Please try again.'
      );
    } finally {
      startingRef.current =
        false;
    }
  }

  /*
   * Stop streaming.
   */
  async function handleStopStreaming() {
    if (
      status !== 'streaming' &&
      status !== 'starting'
    ) {
      return;
    }

    clearStreamTimer();

    if (
      sessionId &&
      seconds <
        REQUIRED_SECONDS
    ) {
      try {
        await API.post(
          '/api/streams/end',
          {
            session_id:
              sessionId,
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
   * Cleanup.
   */
  useEffect(() => {
    return () => {
      clearStreamTimer();
    };
  }, []);

  /*
   * Loading.
   */
  if (loading && !track) {
    return (
      <Spinner fullscreen />
    );
  }

  /*
   * No track.
   */
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
          textAlign: 'center',
        }}
      >
        <p
          style={{
            marginBottom: 20,
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
            borderRadius: 10,
            border: 'none',
            background:
              '#4a9eff',
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
   * Main UI.
   */
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #07111F 0%, #0A1628 100%)',
        color: '#fff',
        paddingBottom: 40,
      }}
    >
      {/* HEADER */}
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
          position:
            'sticky',
          top: 0,
          zIndex: 20,
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
            width: 38,
            height: 38,
            borderRadius: 12,
            background:
              'rgba(255,255,255,0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            cursor: 'pointer',
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
              color:
                '#8A9BB0',
              marginTop: 2,
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
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
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
              gap: 14,
            }}
          >
            {/* COVER */}
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
                minWidth: 0,
                flex: 1,
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
                    'ellipsis',
                }}
              >
                {title}
              </p>

              <p
                style={{
                  fontSize: 13,
                  color:
                    '#8A9BB0',
                  margin: 0,
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

        {/* PLAYER */}
        <section
          style={{
            background:
              '#0D1F3C',
            borderRadius: 22,
            padding: 16,
            marginBottom: 16,
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
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display:
                  'flex',
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
                  fontSize: 12,
                  color:
                    '#8A9BB0',
                  fontWeight: 600,
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
                  gap: 5,
                  fontSize: 11,
                  color:
                    '#4ADE80',
                  fontWeight: 700,
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
                overflow:
                  'hidden',
                borderRadius: 14,
                background:
                  '#081322',
              }}
            >
              <iframe
                key={
                  `${sessionId || 'pending'}-${embedUrl}`
                }
                src={embedUrl}
                title={
                  `${title} - Audiomack`
                }
                style={{
                  width:
                    '100%',
                  height: 150,
                  border:
                    'none',
                  display:
                    'block',
                }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              style={{
                height: 150,
                borderRadius: 14,
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
                  width: 54,
                  height: 54,
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
                    10,
                }}
              >
                <Play
                  size={24}
                  color="#4a9eff"
                  fill="#4a9eff"
                />
              </div>

              <p
                style={{
                  margin: 0,
                  color:
                    '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Ready to stream
              </p>

              <p
                style={{
                  margin:
                    '4px 0 0',
                  color:
                    '#71849B',
                  fontSize: 11,
                }}
              >
                Press Start Streaming below
              </p>
            </div>
          )}
        </section>

        {/* EARNING TIMER */}
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
            textAlign:
              'center',
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
              background: `conic-gradient(
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
                  fontSize: 34,
                  fontWeight: 900,
                  lineHeight: 1,
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
                    color:
                      '#71849B',
                    marginTop: 6,
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
              fontSize: 16,
              fontWeight: 800,
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
              margin: 0,
              color:
                '#71849B',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {status ===
            'streaming'
              ? 'Keep the music playing until the timer finishes.'
              : status ===
                'completed'
              ? 'Your wallet has been updated.'
              : 'Start the stream and listen for 60 seconds to earn your reward.'}
          </p>

          {/* SMALL PROGRESS BAR */}
          <div
            style={{
              height: 5,
              background:
                'rgba(255,255,255,0.06)',
              borderRadius: 10,
              overflow:
                'hidden',
              marginTop: 18,
            }}
          >
            <div
              style={{
                height:
                  '100%',
                width: `${progress}%`,
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
                padding: 16,
                borderRadius: 16,
                background:
                  'rgba(74,222,128,0.08)',
                border:
                  '1px solid rgba(74,222,128,0.16)',
                display:
                  'flex',
                alignItems:
                  'center',
                gap: 12,
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
                    margin: 0,
                    color:
                      '#fff',
                    fontWeight: 800,
                    fontSize: 14,
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
                    fontSize: 11,
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
                  '16px',
                borderRadius: 15,
                border:
                  'none',
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color:
                  '#fff',
                fontWeight: 800,
                fontSize: 15,
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
              borderRadius: 15,
              background:
                'rgba(248,113,113,0.10)',
              border:
                '1px solid rgba(248,113,113,0.24)',
              color:
                '#F87171',
              fontWeight: 800,
              fontSize: 15,
              cursor:
                'pointer',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 9,
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
              borderRadius: 15,
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
              fontWeight: 800,
              fontSize: 15,
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
              gap: 9,
              boxShadow:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? 'none'
                  : '0 10px 25px rgba(74,158,255,0.18)',
            }}
          >
            <Play
              size={18}
              fill={
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? '#71849B'
                  : '#fff'
              }
            />

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
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
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
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5,
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
            fontSize: 10,
            lineHeight: 1.5,
            margin:
              '18px 20px 0',
          }}
        >
          Rewaiq verifies your streaming
          session before awarding coins.
        </p>
      </main>
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