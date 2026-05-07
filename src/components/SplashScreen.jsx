'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('draw'); // draw → glow → fade

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('glow'), 1800);
    const t2 = setTimeout(() => setPhase('fade'), 2600);
    const t3 = setTimeout(() => onComplete?.(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        opacity: phase === 'fade' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase === 'fade' ? 'none' : 'auto',
      }}
    >
      {/* Ambient radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 55% 45% at 50% 44%, rgba(30,80,200,0.18) 0%, transparent 70%)',
        animation: 'rwBgPulse 5s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: '#4a9eff',
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              opacity: 0,
              animation: `rwFloat 3s ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        position: 'relative',
      }}>
        <svg
          viewBox="0 0 109 104"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: 180,
            height: 170,
            filter: phase === 'glow'
              ? 'drop-shadow(0 0 40px rgba(80,160,255,0.7))'
              : 'drop-shadow(0 0 22px rgba(60,130,255,0.45))',
            transition: 'filter 0.5s ease',
            animation: 'rwFloat2 5s ease-in-out infinite',
          }}
        >
          <defs>
            {/* Fill gradients */}
            <linearGradient id="rwF1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a3a8f" />
              <stop offset="100%" stopColor="#103272" />
            </linearGradient>
            <linearGradient id="rwF2" gradientUnits="userSpaceOnUse"
              x1="61.95" y1="36.76" x2="11.09" y2="8.91">
              <stop offset="0%" stopColor="#74CDFF" />
              <stop offset="100%" stopColor="#0450E4" />
            </linearGradient>
            <linearGradient id="rwF3" gradientUnits="userSpaceOnUse"
              x1="97.55" y1="66.92" x2="37.32" y2="41.59">
              <stop offset="0%" stopColor="#75CEFF" />
              <stop offset="100%" stopColor="#014DE3" />
            </linearGradient>
            <linearGradient id="rwF4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e4db7" />
              <stop offset="100%" stopColor="#123575" />
            </linearGradient>

            {/* Border/stroke gradients */}
            <linearGradient id="rwB1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3a6be0" />
              <stop offset="100%" stopColor="#1a3a8f" />
            </linearGradient>
            <linearGradient id="rwB2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9dd4ff" />
              <stop offset="50%" stopColor="#4a9eff" />
              <stop offset="100%" stopColor="#1a3a8f" />
            </linearGradient>
            <linearGradient id="rwB3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6ab4ff" />
              <stop offset="100%" stopColor="#014DE3" />
            </linearGradient>
            <linearGradient id="rwB4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a80e0" />
              <stop offset="100%" stopColor="#123575" />
            </linearGradient>

            {/* Shimmer sweep */}
            <linearGradient id="rwShimG" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.28" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            <clipPath id="rwClip">
              <path d={[SHAPE1, SHAPE2, SHAPE3, SHAPE4].join(' ')} />
            </clipPath>
          </defs>

          {/* Filled shapes — fade in after initial draw */}
          <path d={SHAPE1} fill="url(#rwF1)" style={{ opacity: 0, animation: 'rwFi 0.6s ease 0.95s forwards' }} />
          <path d={SHAPE2} fill="url(#rwF2)" style={{ opacity: 0, animation: 'rwFi 0.6s ease 1.15s forwards' }} />
          <path d={SHAPE3} fill="url(#rwF3)" style={{ opacity: 0, animation: 'rwFi 0.55s ease 1.35s forwards' }} />
          <path d={SHAPE4} fill="url(#rwF4)" style={{ opacity: 0, animation: 'rwFi 0.6s ease 1.05s forwards' }} />

          {/* Stroke draw paths — loop continuously */}
          <path d={SHAPE1} fill="none" stroke="url(#rwB1)" strokeWidth="1"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 900, strokeDashoffset: 900, animation: 'rwDraw 2s cubic-bezier(.4,0,.2,1) 0.1s infinite' }} />
          <path d={SHAPE2} fill="none" stroke="url(#rwB2)" strokeWidth="1"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 900, strokeDashoffset: 900, animation: 'rwDraw 2.2s cubic-bezier(.4,0,.2,1) 0.35s infinite' }} />
          <path d={SHAPE3} fill="none" stroke="url(#rwB3)" strokeWidth="1"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 900, strokeDashoffset: 900, animation: 'rwDraw 1.9s cubic-bezier(.4,0,.2,1) 0.65s infinite' }} />
          <path d={SHAPE4} fill="none" stroke="url(#rwB4)" strokeWidth="1"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 900, strokeDashoffset: 900, animation: 'rwDraw 2.1s cubic-bezier(.4,0,.2,1) 0.5s infinite' }} />

          {/* Shimmer sweep — loops */}
          <rect x="-40" y="0" width="70" height="104"
            fill="url(#rwShimG)" clipPath="url(#rwClip)"
            style={{ opacity: 0, animation: 'rwShimmer 2.2s ease 1.65s infinite' }} />
        </svg>

        {/* Wordmark */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 52,
          letterSpacing: '-0.02em',
          color: '#fff',
          opacity: 0,
          transform: 'translateY(14px)',
          animation: 'rwWordUp 0.75s cubic-bezier(.2,.8,.3,1) 1.6s forwards',
        }}>
          Rewaiq
        </div>

        {/* Loading bar */}
        <div style={{
          width: 160,
          height: 2,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
          overflow: 'hidden',
          opacity: 0,
          animation: 'rwFi 0.4s ease 1.9s forwards',
        }}>
          <div style={{
            height: '100%',
            width: 0,
            background: 'linear-gradient(90deg, #4a9eff, #7ec8ff)',
            borderRadius: 2,
            animation: 'rwLoadBar 1.4s cubic-bezier(.4,0,.2,1) 2s forwards',
          }} />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap');

        @keyframes rwBgPulse {
          from { opacity: 0.5; }
          to   { opacity: 1; }
        }
        @keyframes rwFloat {
          0%,100% { opacity: 0;    transform: translateY(0)     scale(1);   }
          50%      { opacity: 0.55; transform: translateY(-20px) scale(1.2); }
        }
        @keyframes rwFloat2 {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(-9px); }
        }
        @keyframes rwDraw {
          0%   { stroke-dashoffset: 900; }
          50%  { stroke-dashoffset: 0;   }
          100% { stroke-dashoffset: 900; }
        }
        @keyframes rwFi {
          to { opacity: 1; }
        }
        @keyframes rwShimmer {
          0%   { opacity: 0;   transform: translateX(-60px);  }
          45%  { opacity: 0.4;                                 }
          100% { opacity: 0;   transform: translateX(100px);  }
        }
        @keyframes rwWordUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rwLoadBar {
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ── Shape path data (from official Rewaiq SVG) ── */
const SHAPE1 = 'M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z';
const SHAPE2 = 'M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z';
const SHAPE3 = 'M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.0237 71.6257 72.4608 71.6478Z';
const SHAPE4 = 'M43.3994 11.9088L30.1509 0.75581C29.8654 0.515512 30.0354 0.0498047 30.4085 0.0498047H70.5668C75.2261 0.0498047 80.8853 1.84576 84.7261 3.97949C88.5668 6.11322 92.6025 9.32724 95.0668 14.5498C98.2216 21.2356 98.3844 26.7954 95.2261 33.4795C92.4068 39.4461 84.8727 43.5938 82.6426 44.7581C82.2912 44.9415 81.8726 44.8833 81.5716 44.6254L68.961 33.8163C68.5888 33.4972 68.7249 32.8681 69.1877 32.7063C71.8809 31.7649 78.4652 28.7204 78.0668 21.5498C77.5669 15.0498 70.5669 12.0498 67.5668 12.0498H43.7858C43.6444 12.0498 43.5075 11.9999 43.3994 11.9088Z';

/* ── Particle config ── */
const PARTICLES = [
  { size: '4px', top: '10%', left: '15%', delay: '0.2s' },
  { size: '6px', top: '20%', left: '80%', delay: '0.5s' },
  { size: '3px', top: '70%', left: '10%', delay: '0.8s' },
  { size: '5px', top: '80%', left: '75%', delay: '1.1s' },
  { size: '4px', top: '35%', left: '5%',  delay: '0.3s' },
  { size: '7px', top: '55%', left: '90%', delay: '0.6s' },
  { size: '3px', top: '15%', left: '50%', delay: '0.9s' },
  { size: '5px', top: '85%', left: '40%', delay: '0.4s' },
  { size: '4px', top: '45%', left: '95%', delay: '0.7s' },
  { size: '6px', top: '5%',  left: '30%', delay: '1.0s' },
  { size: '3px', top: '90%', left: '60%', delay: '0.2s' },
  { size: '5px', top: '60%', left: '25%', delay: '0.8s' },
];
