'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('draw'); // draw → reveal → stabilize → fade

  useEffect(() => {
    // Exact cinematic choreography timing matrix
    const t1 = setTimeout(() => setPhase('reveal'), 900);    // Strokes near completion, fills inject
    const t2 = setTimeout(() => setPhase('stabilize'), 2200); // Shimmer runs, systems stabilize
    const t3 = setTimeout(() => setPhase('fade'), 3400);      // Structural screen fade out
    const t4 = setTimeout(() => onComplete?.(), 4000);       // Component unmount
    
    return () => { 
      clearTimeout(t1); 
      clearTimeout(t2); 
      clearTimeout(t3); 
      clearTimeout(t4); 
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#030712', // Rich black/obsidian space base
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        opacity: phase === 'fade' ? 0 : 1,
        transform: phase === 'fade' ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        pointerEvents: phase === 'fade' ? 'none' : 'auto',
      }}
    >
      {/* Premium Deep Anamorphic Radial Glow */}
      <div style={{
        position: 'absolute',
        width: '140%',
        height: '140%',
        background: 'radial-gradient(circle at 50% 48%, rgba(26,58,143,0.22) 0%, rgba(4,80,228,0.05) 40%, transparent 70%)',
        opacity: phase === 'draw' ? 0.4 : 1,
        transform: phase === 'draw' ? 'scale(0.85)' : 'scale(1)',
        transition: 'opacity 1.4s ease-out, transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
      }} />

      {/* Localized Particle Fields (Emanating out from Center Mark) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #74CDFF, #0450E4)',
              width: p.size,
              height: p.size,
              top: '44%',
              left: '50%',
              opacity: 0,
              transform: 'translate(-50%, -50%)',
              animation: `rwKineticBlast 2.4s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay} forwards`,
            }}
          />
        ))}
      </div>

      {/* Main Structural Assembly Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        position: 'relative',
        transform: phase === 'fade' ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
      }}>
        
        {/* Logo Container with Dynamic Back-lighting Proximity */}
        <div style={{
          position: 'relative',
          filter: phase === 'reveal' || phase === 'stabilize'
            ? 'drop-shadow(0 12px 40px rgba(4,80,228,0.45)) drop-shadow(0 0 100px rgba(116,205,255,0.2))'
            : 'drop-shadow(0 4px 12px rgba(4,80,228,0.15))',
          transition: 'filter 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'rwAnamorphicFloat 7s ease-in-out infinite alternate',
        }}>
          <svg
            viewBox="0 0 109 104"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: 140,
              height: 133,
            }}
          >
            <defs>
              {/* Core Master Gradients */}
              <linearGradient id="rwF1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a3a8f" />
                <stop offset="100%" stopColor="#103272" />
              </linearGradient>
              <linearGradient id="rwF2" gradientUnits="userSpaceOnUse" x1="61.95" y1="36.76" x2="11.09" y2="8.91">
                <stop offset="0%" stopColor="#74CDFF" />
                <stop offset="100%" stopColor="#0450E4" />
              </linearGradient>
              <linearGradient id="rwF3" gradientUnits="userSpaceOnUse" x1="97.55" y1="66.92" x2="37.32" y2="41.59">
                <stop offset="0%" stopColor="#75CEFF" />
                <stop offset="100%" stopColor="#014DE3" />
              </linearGradient>
              <linearGradient id="rwF4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e4db7" />
                <stop offset="100%" stopColor="#123575" />
              </linearGradient>

              {/* Laser Outline Stroke Gradients */}
              <linearGradient id="rwB1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a7df2" />
                <stop offset="100%" stopColor="#1a3a8f" />
              </linearGradient>
              <linearGradient id="rwB2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#bce2ff" />
                <stop offset="50%" stopColor="#5fabff" />
                <stop offset="100%" stopColor="#1a3a8f" />
              </linearGradient>
              <linearGradient id="rwB3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8cd0ff" />
                <stop offset="100%" stopColor="#014DE3" />
              </linearGradient>
              <linearGradient id="rwB4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5c93ff" />
                <stop offset="100%" stopColor="#123575" />
              </linearGradient>

              {/* Shimmer Precision Sweep */}
              <linearGradient id="rwShimG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="30%" stopColor="white" stopOpacity="0.0" />
                <stop offset="50%" stopColor="white" stopOpacity="0.45" />
                <stop offset="70%" stopColor="white" stopOpacity="0.0" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              <clipPath id="rwClip">
                <path d={[SHAPE1, SHAPE2, SHAPE3, SHAPE4].join(' ')} />
              </clipPath>
            </defs>

            {/* Filled Geometric Bodies — Run Once Fluid Interpolation */}
            <path d={SHAPE1} fill="url(#rwF1)" style={{ opacity: 0, animation: 'rwSolidify 1.1s cubic-bezier(0.25, 1, 0.5, 1) 0.6s forwards' }} />
            <path d={SHAPE2} fill="url(#rwF2)" style={{ opacity: 0, animation: 'rwSolidify 1.1s cubic-bezier(0.25, 1, 0.5, 1) 0.8s forwards' }} />
            <path d={SHAPE3} fill="url(#rwF3)" style={{ opacity: 0, animation: 'rwSolidify 1.1s cubic-bezier(0.25, 1, 0.5, 1) 1.0s forwards' }} />
            <path d={SHAPE4} fill="url(#rwF4)" style={{ opacity: 0, animation: 'rwSolidify 1.1s cubic-bezier(0.25, 1, 0.5, 1) 0.7s forwards' }} />

            {/* Micro-Stroke Drawing Engines — Run Once Sequence */}
            <path d={SHAPE1} fill="none" stroke="url(#rwB1)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 320, strokeDashoffset: 320, animation: 'rwDrawOnce 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.0s forwards' }} />
            <path d={SHAPE2} fill="none" stroke="url(#rwB2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 320, strokeDashoffset: 320, animation: 'rwDrawOnce 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards' }} />
            <path d={SHAPE3} fill="none" stroke="url(#rwB3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 320, strokeDashoffset: 320, animation: 'rwDrawOnce 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards' }} />
            <path d={SHAPE4} fill="none" stroke="url(#rwB4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 320, strokeDashoffset: 320, animation: 'rwDrawOnce 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards' }} />

            {/* Sweep Metallic Shimmer — Fires once right at stabilization */}
            <rect x="-100" y="-20" width="120" height="150"
              fill="url(#rwShimG)" clipPath="url(#rwClip)"
              style={{ transform: 'skewX(-25deg)', animation: 'rwSingleShimmer 1.4s cubic-bezier(0.3, 1, 0.4, 1) 1.6s forwards' }} />
          </svg>
        </div>

        {/* Wordmark: Fluid Tracking Spacing Animation */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 40,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#fff',
          opacity: 0,
          mixBlendMode: 'plus-lighter',
          animation: 'rwWordReveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1.1s forwards',
        }}>
          Rewaiq
        </div>

        {/* Loading System Metabar */}
        <div style={{
          width: 140,
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 10,
          overflow: 'hidden',
          opacity: 0,
          animation: 'rwFadeIn 0.6s ease 1.5s forwards',
        }}>
          <div style={{
            height: '100%',
            width: 0,
            background: 'linear-gradient(90deg, #0450E4 0%, #74CDFF 70%, #ffffff 100%)',
            boxShadow: '0 0 10px rgba(116,205,255,0.6)',
            borderRadius: 10,
            animation: 'rwEngineLoad 1.6s cubic-bezier(0.65, 0, 0.35, 1) 1.6s forwards',
          }} />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap');

        /* Kinetic Particle Physics (Burst from center vector) */
        @keyframes rwKineticBlast {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0, 0) scale(0.5);
          }
          15% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(var(--mx), var(--my)) scale(1);
          }
        }

        /* Fluid Macro Floating */
        @keyframes rwAnamorphicFloat {
          0%   { transform: translateY(0) scale(1); }
          100% { transform: translateY(-6px) scale(0.99); }
        }

        /* Non-looping Precise Vector Drawing */
        @keyframes rwDrawOnce {
          0%   { stroke-dashoffset: 320; }
          100% { stroke-dashoffset: 0; }
        }

        /* High-fidelity Fill Injection */
        @keyframes rwSolidify {
          0%   { opacity: 0; filter: brightness(0.4); }
          50%  { opacity: 0.5; filter: brightness(1.6); }
          100% { opacity: 1; filter: brightness(1); }
        }

        /* Dynamic Text Expansion tracking */
        @keyframes rwWordReveal {
          0% {
            opacity: 0;
            letter-spacing: -0.05em;
            filter: blur(8px);
          }
          40% {
            opacity: 0.8;
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            letter-spacing: 0.18em;
          }
        }

        /* Single Elegant Shimmer Highlight Passing Over Shapes */
        @keyframes rwSingleShimmer {
          0%   { transform: translateX(-150px) skewX(-25deg); }
          100% { transform: translateX(250px) skewX(-25deg); }
        }

        /* Nonlinear System Loading Progression */
        @keyframes rwEngineLoad {
          0%   { width: 0%; }
          30%  { width: 45%; }
          75%  { width: 88%; }
          100% { width: 100%; }
        }

        @keyframes rwFadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Refined Particle Spatial Target Matrix ── */
const PARTICLES = [
  { size: '3px', delay: '0.6s', '--mx': '-110px', '--my': '-60px' },
  { size: '5px', delay: '0.7s', '--mx': '130px', '--my': '80px' },
  { size: '2px', delay: '0.5s', '--mx': '-80px', '--my': '90px' },
  { size: '4px', delay: '0.9s', '--mx': '100px', '--my': '-90px' },
  { size: '3px', delay: '0.8s', '--mx': '-140px', '--my': '20px' },
  { size: '5px', delay: '0.6s', '--mx': '150px', '--my': '-30px' },
  { size: '2px', delay: '1.0s', '--mx': '20px', '--my': '-120px' },
  { size: '4px', delay: '0.7s', '--mx': '-40px', '--my': '130px' },
];

/* ── Precise Path Dimensions ── */
const SHAPE1 = 'M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z';
const SHAPE2 = 'M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z';
const SHAPE3 = 'M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.0237 71.6257 72.4608 71.6478Z';
const SHAPE4 = 'M43.3994 11.9088L30.1509 0.75581C29.8654 0.515512 30.0354 0.0498047 30.4085 0.0498047H70.5668C75.2261 0.0498047 80.8853 1.84576 84.7261 3.97949C88.5668 6.11322 92.6025 9.32724 95.0668 14.5498C98.2216 21.2356 98.3844 26.7954 95.2261 33.4795C92.4068 39.4461 84.8727 43.5938 82.6426 44.7581C82.2912 44.9415 81.8726 44.8833 81.5716 44.6254L68.961 33.8163C68.5888 33.4972 68.7249 32.8681 69.1877 32.7063C71.8809 31.7649 78.4652 28.7204 78.0668 21.5498C77.5669 15.0498 70.5669 12.0498 67.5668 12.0498H43.7858C43.6444 12.0498 43.5075 11.9999 43.3994 11.9088Z';