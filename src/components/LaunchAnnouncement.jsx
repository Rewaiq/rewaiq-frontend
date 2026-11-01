
'use client';

import { useEffect, useState } from 'react';

const WHATSAPP_URL =
  'https://whatsapp.com/channel/0029Vb6ygQNF1YlMxsSoQG0w';

const VOTING_URL =
  'https://votefounderslive.com/?video=57932c57-f700-4ed5-9ecb-f2ff8e52c1bd';

const SITE_URL = 'https://rewaiq.com.ng';

// November 2, 2026, 2:00 PM Nigeria time (WAT, UTC+1)
const LAUNCH_TIME = new Date('2026-11-02T14:00:00+01:00').getTime();

const SHARE_MESSAGE =
  'Rewaiq is going live! Discover digital opportunities, campaigns and rewards. Support our Founders Live journey by voting for Rewaiq and sharing our campaign: ' +
  VOTING_URL +
  '\n\nDiscover. Earn. Influence.\n' +
  SITE_URL;

function getTimeLeft() {
  const difference = Math.max(0, LAUNCH_TIME - Date.now());

  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    seconds: Math.floor((difference % 60000) / 1000),
    locked: difference > 0,
  };
}

export default function LaunchAnnouncement({ onClose }) {
  const [visible, setVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const updateCountdown = () => setTimeLeft(getTimeLeft());

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, []);

  function closeAd() {
    // Do not allow the announcement to close before launch.
    if (Date.now() < LAUNCH_TIME) return;

    setVisible(false);

    try {
      sessionStorage.setItem('rewaiq-launch-ad-dismissed', 'yes');
    } catch {}

    onClose?.();
  }

  async function shareRewaiq() {
    setShareMessage('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Rewaiq Is Going Live',
          text: SHARE_MESSAGE,
          url: SITE_URL,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_MESSAGE);
        setShareMessage('Copied! Share Rewaiq with your friends and community.');
      } else {
        window.open(
          'https://wa.me/?text=' + encodeURIComponent(SHARE_MESSAGE),
          '_blank',
          'noopener,noreferrer'
        );
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        window.open(
          'https://wa.me/?text=' + encodeURIComponent(SHARE_MESSAGE),
          '_blank',
          'noopener,noreferrer'
        );
      }
    }
  }

  if (!visible) return null;

  const countdownItems = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewaiq-launch-title"
      onContextMenu={(event) => event.preventDefault()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        overflowY: 'auto',
        display: 'grid',
        placeItems: 'center',
        padding: '22px',
        boxSizing: 'border-box',
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(38,94,220,.38), transparent 48%), radial-gradient(ellipse at 50% 100%, rgba(240,192,64,.12), transparent 45%), #030817',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <style jsx>{`
        @keyframes reveal {
          from {
            opacity: 0;
            transform: translateY(22px) scale(.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 12px rgba(240,192,64,.12);
          }
          50% {
            box-shadow: 0 0 30px rgba(240,192,64,.32);
          }
        }

        .launch-content {
          animation: reveal 800ms ease-out both;
        }

        .launch-countdown {
          animation: glow 3s ease-in-out infinite;
        }

        .launch-action {
          transition: transform .2s ease, filter .2s ease;
        }

        .launch-action:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .launch-content, .launch-countdown {
            animation: none;
          }
        }
      `}</style>

      <main
        className="launch-content"
        style={{
          width: '100%',
          maxWidth: 660,
          margin: 'auto',
          textAlign: 'center',
          padding: '20px 0',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '9px 15px',
            border: '1px solid rgba(240,192,64,.6)',
            borderRadius: 30,
            color: '#F0C040',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          THE NEXT WAVE STARTS HERE
        </div>

        <div
          style={{
            width: 86,
            height: 86,
            display: 'grid',
            placeItems: 'center',
            margin: '24px auto 10px',
            borderRadius: '50%',
            border: '2px solid rgba(240,192,64,.65)',
            boxShadow: '0 0 35px rgba(240,192,64,.18)',
            color: '#F0C040',
            fontSize: 42,
            fontWeight: 900,
          }}
        >
          R
        </div>

        <div
          style={{
            marginTop: 12,
            color: '#9BC7FF',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 4,
          }}
        >
          DISCOVER. EARN. INFLUENCE.
        </div>

        <h1
          id="rewaiq-launch-title"
          style={{
            margin: '22px 0 14px',
            fontSize: 'clamp(38px, 9vw, 72px)',
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: -2,
            textTransform: 'uppercase',
          }}
        >
          IT'S FINALLY
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #FFE7A0, #F0C040, #FFFAE5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            COMING THROUGH.
          </span>
        </h1>

        <p
          style={{
            maxWidth: 480,
            margin: '20px auto',
            color: '#C4CEE0',
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          The wait is almost over. A new chapter of digital opportunities,
          campaigns, rewards and influence is about to begin. You are here
          before the big moment. Be part of the unveiling.
        </p>

        <section
          className="launch-countdown"
          aria-label="Countdown to Rewaiq launch"
          style={{
            maxWidth: 460,
            margin: '28px auto',
            padding: '23px 16px',
            borderRadius: 20,
            border: '1px solid rgba(240,192,64,.48)',
            background: 'linear-gradient(135deg, rgba(240,192,64,.11), rgba(35,79,160,.18))',
          }}
        >
          <div
            style={{
              color: '#F0C040',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 3,
            }}
          >
            REWAIQ OPENS
          </div>

          <div
            style={{
              marginTop: 9,
              fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 900,
            }}
          >
            NOVEMBER 2 · 2:00 PM
          </div>

          <div style={{ color: '#AAB8CE', fontSize: 12, marginTop: 6 }}>
            NIGERIA TIME (WAT)
          </div>

          {timeLeft.locked ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 8,
                marginTop: 23,
              }}
            >
              {countdownItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    minWidth: 0,
                    padding: '13px 3px',
                    borderRadius: 11,
                    background: 'rgba(3,8,23,.65)',
                    border: '1px solid rgba(255,255,255,.1)',
                  }}
                >
                  <div
                    style={{
                      color: '#FFE49A',
                      fontSize: 'clamp(21px, 5vw, 31px)',
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      color: '#AAB8CE',
                      fontSize: 9,
                      marginTop: 5,
                      letterSpacing: 1,
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 20, color: '#FFE49A', fontWeight: 900 }}>
              THE WAIT IS OVER. REWAIQ IS OPENING!
            </div>
          )}

          <p
            style={{
              color: '#B9C7DE',
              fontSize: 12,
              lineHeight: 1.7,
              margin: '18px 0 0',
            }}
          >
            {timeLeft.locked
              ? 'Get ready. Share the news and help us spread the word.'
              : 'The launch time has arrived. Welcome to Rewaiq.'}
          </p>
        </section>

        <section
          style={{
            maxWidth: 500,
            margin: '22px auto',
            padding: 17,
            borderRadius: 15,
            border: '1px solid rgba(255,255,255,.12)',
            background: 'rgba(255,255,255,.045)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              color: '#F0C040',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            HELP US MAKE SOME NOISE
          </div>
          <p
            style={{
              color: '#D6DEEC',
              fontSize: 14,
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            Rewaiq has qualified through the Nigeria/Africa stage of Founders
            Live. Support our journey by voting for Rewaiq and sharing our
            campaign with your friends, student groups and communities.
          </p>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
            gap: 12,
            marginTop: 24,
          }}
        >
          <a
            className="launch-action"
            href={VOTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 55,
              padding: 14,
              boxSizing: 'border-box',
              borderRadius: 12,
              background: 'linear-gradient(100deg, #F0C040, #FFE49A)',
              color: '#10182A',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            VOTE FOR REWAIQ ↗
          </a>

          <button
            className="launch-action"
            type="button"
            onClick={shareRewaiq}
            style={{
              minHeight: 55,
              padding: 14,
              borderRadius: 12,
              border: '1px solid #4778D9',
              background: 'rgba(35,79,160,.22)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            SHARE THE MOVEMENT
          </button>

          <a
            className="launch-action"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 50,
              padding: 12,
              boxSizing: 'border-box',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.17)',
              background: 'rgba(255,255,255,.06)',
              color: '#E5EDFA',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            JOIN OUR WHATSAPP CHANNEL ↗
          </a>
        </div>

        {shareMessage && (
          <p role="status" style={{ color: '#FFE49A', fontSize: 12, marginTop: 12 }}>
            {shareMessage}
          </p>
        )}

        <div
          style={{
            marginTop: 25,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,.1)',
          }}
        >
          {timeLeft.locked ? (
            <>
              <div style={{ color: '#AAB8CE', fontSize: 12, lineHeight: 1.8 }}>
                The doors open at launch time.
                <br />
                Come back for the unveiling.
              </div>
              <button
                type="button"
                disabled
                style={{
                  marginTop: 15,
                  width: '100%',
                  maxWidth: 320,
                  padding: '14px 20px',
                  border: '1px solid rgba(255,255,255,.12)',
                  borderRadius: 11,
                  background: 'rgba(255,255,255,.05)',
                  color: '#8794AB',
                  fontWeight: 900,
                  cursor: 'not-allowed',
                }}
              >
                REWAIQ OPENS AT 2:00 PM
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={closeAd}
              style={{
                width: '100%',
                maxWidth: 320,
                marginTop: 5,
                padding: '15px 22px',
                border: 'none',
                borderRadius: 11,
                background: 'linear-gradient(100deg, #F0C040, #FFE49A)',
                color: '#10182A',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              ENTER REWAIQ →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
