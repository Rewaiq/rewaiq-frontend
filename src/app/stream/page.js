'use client';

import {
  useState,
  useEffect,
  useRef,
  Suspense
} from 'react';

import {
  useRouter,
  useSearchParams
} from 'next/navigation';

import {
  ArrowLeft,
  Coins,
  Play,
  Square
} from 'lucide-react';

import API from '@/lib/api';
import Spinner from '@/components/Spinner';


function StreamContent() {
  const router = useRouter();
  const params = useSearchParams();

  const trackId = params.get('id');

  const [track, setTrack] =
    useState(null);

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

  const [reward, setReward] =
    useState(null);

  const timerRef =
    useRef(null);

  const startLockRef =
    useRef(false);

  const sessionStartedRef =
    useRef(false);

  const finishingRef =
    useRef(false);

  const REQUIRED_SECONDS = 60;


  /*
   * FETCH TRACK
   */
  useEffect(() => {
    if (!trackId) {
      setError('No track selected');
      setLoading(false);
      return;
    }

    fetchTrack();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [trackId]);


  async function fetchTrack() {
    try {
      const res = await API.get(
        '/api/tracks/' + trackId
      );

      setTrack(
        res.data.track
      );
    } catch (err) {
      setError(
        'Track not found'
      );
    } finally {
      setLoading(false);
    }
  }


  /*
   * START STREAMING
   *
   * The iframe is mounted here.
   * Audiomack receives autoplay=1.
   */
  function handleStartStreaming() {
    if (
      startLockRef.current ||
      status !== 'idle'
    ) {
      return;
    }

    if (!track) {
      setError(
        'Track is still loading.'
      );
      return;
    }

    if (!track.audiomack_id) {
      setError(
        'This track does not have an Audiomack player.'
      );
      return;
    }

    startLockRef.current = true;

    setError('');
    setReward(null);

    setSeconds(0);

    setStatus('starting');

    sessionStartedRef.current =
      false;

    finishingRef.current =
      false;

    /*
     * This mounts the iframe.
     */
    setShowEmbed(true);
  }


  /*
   * AUDIO PLAYER LOADED
   *
   * We don't reward simply because
   * the iframe loaded.
   *
   * Loading only starts the backend
   * stream session + 60 second timer.
   */
  async function handleEmbedLoad() {
    if (
      sessionStartedRef.current
    ) {
      return;
    }

    if (
      !track ||
      !trackId
    ) {
      return;
    }

    sessionStartedRef.current =
      true;

    try {
      const trackUrl =
        track.original_url || '';

      const res =
        await API.post(
          '/api/streams/start',
          {
            track_id: trackId,
            track_url: trackUrl,
          }
        );

      const newSessionId =
        res.data?.session?.id;

      if (!newSessionId) {
        throw new Error(
          'No stream session was returned.'
        );
      }

      setSessionId(
        newSessionId
      );

      setStatus('streaming');

      setSeconds(0);

      /*
       * Start exactly one timer.
       */
      if (timerRef.current) {
        clearInterval(
          timerRef.current
        );
      }

      timerRef.current =
        setInterval(() => {
          setSeconds(prev => {
            const next =
              prev + 1;

            if (
              next >=
              REQUIRED_SECONDS
            ) {
              if (
                timerRef.current
              ) {
                clearInterval(
                  timerRef.current
                );

                timerRef.current =
                  null;
              }

              /*
               * IMPORTANT:
               *
               * Reward only after
               * full 60 seconds.
               */
              finishStream(
                newSessionId
              );

              return REQUIRED_SECONDS;
            }

            return next;
          });
        }, 1000);

    } catch (err) {

      sessionStartedRef.current =
        false;

      setStatus('idle');

      setShowEmbed(false);

      const message =
        err?.response?.data
          ?.message ||
        err?.message ||
        'Could not start stream. Try again.';

      setError(message);

    } finally {
      startLockRef.current =
        false;
    }
  }


  /*
   * STOP BEFORE 60 SECONDS
   *
   * This must NOT give the reward.
   */
  async function handleStopStreaming() {

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }

    const currentSession =
      sessionId;

    if (
      currentSession &&
      seconds <
        REQUIRED_SECONDS
    ) {
      try {
        await API.post(
          '/api/streams/end',
          {
            session_id:
              currentSession,
          }
        );
      } catch {
        // Don't crash UI
      }
    }

    resetStreamState();
  }


  /*
   * COMPLETE STREAM
   *
   * This is the ONLY place where
   * the completed stream is ended.
   */
  async function finishStream(
    sid
  ) {

    if (finishingRef.current) {
      return;
    }

    finishingRef.current =
      true;

    try {

      setStatus(
        'completing'
      );

      /*
       * Tell backend the user
       * completed the full 60 sec.
       */
      const res =
        await API.post(
          '/api/streams/end',
          {
            session_id: sid,
          }
        );

      /*
       * Backend should return the
       * reward if available.
       */
      const earned =
        res.data?.reward ??
        res.data?.coins_earned ??
        res.data?.session
          ?.reward_coins ??
        null;

      if (earned !== null) {
        setReward(earned);
      }

      /*
       * IMPORTANT:
       *
       * Immediately refresh the
       * user's balance.
       */
      await refreshCoinBalance();

      setStatus(
        'completed'
      );

      setSessionId(null);

    } catch (err) {

      const message =
        err?.response?.data
          ?.message ||
        'Could not complete stream';

      setError(message);

      setStatus('idle');

      setShowEmbed(false);

      setSeconds(0);

    } finally {

      finishingRef.current =
        false;

      sessionStartedRef.current =
        false;
    }
  }


  /*
   * REFRESH BALANCE
   *
   * This makes the wallet/header
   * show the newly earned coins
   * immediately.
   */
  async function refreshCoinBalance() {
    try {

      const res =
        await API.get(
          '/api/coins/balance'
        );

      /*
       * Support common response
       * formats.
       */
      const balance =
        res.data?.coin_balance ??
        res.data?.balance ??
        res.data?.coins ??
        res.data?.data
          ?.coin_balance;

      if (
        balance !== undefined &&
        balance !== null
      ) {

        /*
         * Update localStorage user
         */
        const stored =
          localStorage.getItem(
            'rewaiq_user'
          );

        if (stored) {
          try {

            const user =
              JSON.parse(
                stored
              );

            user.coin_balance =
              Number(balance);

            localStorage.setItem(
              'rewaiq_user',
              JSON.stringify(user)
            );

          } catch {
            // Ignore localStorage errors
          }
        }
      }

    } catch {
      /*
       * Balance refresh should
       * never make the stream fail.
       */
    }
  }


  /*
   * RESET
   */
  function resetStreamState() {

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }

    setStatus('idle');

    setShowEmbed(false);

    setSeconds(0);

    setSessionId(null);

    setReward(null);

    sessionStartedRef.current =
      false;

    startLockRef.current =
      false;

    finishingRef.current =
      false;
  }


  /*
   * LOADING
   */
  if (loading) {
    return (
      <Spinner fullscreen />
    );
  }


  /*
   * TRACK ERROR
   */
  if (error && !track) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A9BB0',
          padding: 20,
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    );
  }


  const progress =
    (seconds /
      REQUIRED_SECONDS) *
    100;


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
          padding:
            '16px 20px',
          display: 'flex',
          alignItems:
            'center',
          gap: 12,
          background:
            '#0D1F3C',
        }}
      >
        <button
          onClick={() =>
            router.back()
          }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
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
          padding: 20,
        }}
      >

        {/* TRACK CARD */}
        <div
          style={{
            background:
              '#0D1F3C',
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
              marginBottom: 4,
            }}
          >
            {track?.title}
          </p>

          <p
            style={{
              fontSize: 13,
              color: '#8A9BB0',
              marginBottom: 16,
            }}
          >
            {track?.artist_name}
          </p>


          {/* AUDIO PLAYER */}
          {showEmbed &&
          track?.audiomack_id ? (
            <div>

              <iframe
                key={
                  track.audiomack_id
                }
                src={
                  'https://www.audiomack.com/embed/song/' +
                  track.audiomack_id +
                  '?background=0&light=0&autoplay=1'
                }
                style={{
                  width: '100%',
                  height: 140,
                  border: 'none',
                  borderRadius: 10,
                }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                onLoad={
                  handleEmbedLoad
                }
              />

              <p
                style={{
                  fontSize: 11,
                  color: '#8A9BB0',
                  textAlign:
                    'center',
                  marginTop: 8,
                }}
              >
                If audio doesn't start automatically,
                tap play inside the player.
              </p>

            </div>
          ) : (
            <div
              style={{
                height: 140,
                borderRadius: 10,
                background:
                  'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                }}
              >
                Press Start Streaming to play
              </p>
            </div>
          )}

        </div>


        {/* TIMER CARD */}
        <div
          style={{
            background:
              '#0D1F3C',
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
                status ===
                'streaming'
                  ? '#4a9eff'
                  : 'rgba(74,158,255,0.15)',
              margin:
                '0 auto 16px',
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
            {status ===
            'streaming'
              ? `${Math.max(
                  0,
                  REQUIRED_SECONDS -
                    seconds
                )}s`
              : status ===
                'completed'
              ? '✓'
              : `${REQUIRED_SECONDS}s`}
          </p>


          <p
            style={{
              fontSize: 12,
              color: '#8A9BB0',
              marginTop: 4,
            }}
          >
            {status ===
            'starting'
              ? 'Loading track...'
              : status ===
                'streaming'
              ? 'Keep this screen open to earn coins'
              : status ===
                'completing'
              ? 'Confirming your reward...'
              : status ===
                'completed'
              ? 'Stream complete!'
              : 'Press Start to begin earning'}
          </p>

        </div>


        {/* COMPLETED */}
        {status ===
        'completed' ? (
          <>
            <div
              style={{
                textAlign:
                  'center',
                marginBottom: 16,
              }}
            >

              <Coins
                size={32}
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
                }}
              >
                Coins Earned!
              </p>

              {reward !== null && (
                <p
                  style={{
                    fontSize: 14,
                    color: '#4a9eff',
                    marginTop: 6,
                    fontWeight: 700,
                  }}
                >
                  +{reward} coins
                </p>
              )}

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
                borderRadius: 14,
                background:
                  '#4a9eff',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Back to Feed
            </button>
          </>
        ) : status ===
          'streaming' ? (

          /* STOP */
          <button
            onClick={
              handleStopStreaming
            }
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
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 8,
            }}
          >
            <Square
              size={18}
              fill="#F87171"
            />

            Stop Streaming
          </button>

        ) : (

          /* START */
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
              padding: 18,
              borderRadius: 14,
              background:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg,#4a9eff,#2d6be4)',
              color:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? '#8A9BB0'
                  : '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              cursor:
                status ===
                  'starting' ||
                status ===
                  'completing'
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 8,
            }}
          >

            <Play
              size={18}
              fill={
                status ===
                'starting'
                  ? '#8A9BB0'
                  : '#fff'
              }
            />

            {status ===
            'starting'
              ? 'Loading...'
              : 'Start Streaming'}

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
 * IMPORTANT FOR NEXT.JS 16
 *
 * useSearchParams() MUST be inside
 * a Suspense boundary during build.
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
