
'use client';

import { useEffect, useState } from 'react';

const WHATSAPP_URL =
  'https://whatsapp.com/channel/0029Vb6ygQNF1YlMxsSoQG0w';

const VOTING_URL =
  'https://votefounderslive.com/?video=57932c57-f700-4ed5-9ecb-f2ff8e52c1bd';

export default function LaunchAnnouncement({ onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  function closeAd() {
    setVisible(false);

    try {
      sessionStorage.setItem('rewaiq-launch-ad-dismissed', 'yes');
    } catch {}

    onClose?.();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewaiq-launch-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        overflowY: 'auto',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background:
          'radial-gradient(ellipse at 50% 15%, rgba(30,90,220,.3), transparent 48%), #030817',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <button
        type="button"
        onClick={closeAd}
        aria-label="Close launch announcement"
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,.25)',
          background: 'rgba(255,255,255,.09)',
          color: '#fff',
          fontSize: 28,
          cursor: 'pointer',
          zIndex: 2,
        }}
      >
        ×
      </button>

      <div
        style={{
          width: '100%',
          maxWidth: 650,
          margin: 'auto',
          textAlign: 'center',
          padding: '30px 0',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '9px 15px',
            border: '1px solid rgba(240,192,64,.55)',
            borderRadius: 30,
            color: '#F0C040',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          THE NEXT WAVE STARTS HERE
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: 7,
            fontWeight: 800,
            marginTop: 30,
            color: '#9BC7FF',
          }}
        >
          DISCOVER. EARN. INFLUENCE.
        </div>

        <h1
          id="rewaiq-launch-title"
          style={{
            margin: '18px 0 12px',
            fontSize: 'clamp(42px, 10vw, 76px)',
            lineHeight: 0.98,
            fontWeight: 900,
            letterSpacing: -3,
            textTransform: 'uppercase',
          }}
        >
          WE'RE
          <br />
          <span
            style={{
              background:
                'linear-gradient(90deg, #FFE7A0, #F0C040, #FFFAE5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            GOING LIVE.
          </span>
        </h1>

        <p
          style={{
            maxWidth: 470,
            margin: '22px auto',
            color: '#C4CEE0',
            fontSize: 16,
            lineHeight: 1.8,
          }}
        >
          A new wave of digital opportunities is here.
          Discover opportunities, take on campaigns, earn rewards,
          and make your influence count. Welcome to Rewaiq.
        </p>

        <div
          style={{
            margin: '26px auto',
            padding: '17px 22px',
            maxWidth: 390,
            borderRadius: 18,
            border: '1px solid rgba(240,192,64,.35)',
            background: 'rgba(240,192,64,.08)',
          }}
        >
          <div
            style={{
              color: '#F0C040',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            OFFICIAL LAUNCH
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            NOVEMBER 2, 2026
          </div>

          <div
            style={{
              color: '#AAB8CE',
              fontSize: 12,
              marginTop: 6,
            }}
          >
            THE MOVEMENT STARTS WITH YOU.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
            gap: 12,
            marginTop: 28,
          }}
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 58,
              padding: '14px 18px',
              boxSizing: 'border-box',
              borderRadius: 12,
              background: 'linear-gradient(100deg, #F0C040, #FFE49A)',
              color: '#10182A',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            JOIN OUR WHATSAPP CHANNEL ↗
          </a>

          <a
            href={VOTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 58,
              padding: '14px 18px',
              boxSizing: 'border-box',
              borderRadius: 12,
              border: '1px solid #4778D9',
              background: 'rgba(35,79,160,.22)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            VOTE FOR REWAIQ ↗
          </a>
        </div>

        <p
          style={{
            color: '#8794AB',
            fontSize: 12,
            lineHeight: 1.7,
            marginTop: 25,
          }}
        >
          Be part of the launch. Share the opportunity.
          <br />
          Your next move starts here.
        </p>

        <button
          type="button"
          onClick={closeAd}
          style={{
            marginTop: 8,
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            color: '#AAB8CE',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: 13,
          }}
        >
          Continue to Rewaiq
        </button>
      </div>
    </div>
  );
}
