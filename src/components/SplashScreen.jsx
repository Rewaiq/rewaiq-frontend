'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('draw'); // draw → glow → fade

  useEffect(() => {
    // Phase 1: draw signature (1.8s)
    // Phase 2: glow pulse (0.8s)
    // Phase 3: fade out (0.6s)
    const t1 = setTimeout(() => setPhase('glow'), 1800);
    const t2 = setTimeout(() => setPhase('fade'), 2600);
    const t3 = setTimeout(() => onComplete?.(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`splash-root ${phase}`}>
      {/* Animated background particles */}
      <div className="particles">
        {[...Array(12)].map((_, i) => (
          <span key={i} className={`particle p${i}`} />
        ))}
      </div>

      {/* Center logo */}
      <div className="logo-wrap">
        {/* SVG signature draw animation */}
        <svg
          className="logo-svg"
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle
            className="ring"
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#D4A017"
            strokeWidth="2"
            strokeDasharray="339"
            strokeDashoffset="339"
          />
          {/* R letter path — signature style */}
          <path
            className="r-letter"
            d="M38 82 L38 40 Q38 30 50 30 L65 30 Q80 30 80 44 Q80 56 65 58 L80 82"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="220"
            strokeDashoffset="220"
          />
          {/* R leg diagonal — signature tail */}
          <path
            className="r-tail"
            d="M65 58 Q74 68 80 82"
            fill="none"
            stroke="#D4A017"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="30"
            strokeDashoffset="30"
          />
          {/* Glow circle */}
          <circle
            className="glow-ring"
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#D4A017"
            strokeWidth="8"
            opacity="0"
          />
        </svg>

        {/* Brand name fades in after drawing */}
        <div className="brand-name">
          <span className="brand-r">R</span>
          <span className="brand-rest">ewaiq</span>
        </div>
        <p className="brand-tagline">Earn. Discover. Grow.</p>
      </div>

      <style jsx>{`
        .splash-root {
          position: fixed;
          inset: 0;
          background: #0A1628;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: opacity 0.6s ease;
          overflow: hidden;
        }

        .splash-root.fade {
          opacity: 0;
          pointer-events: none;
        }

        /* ── PARTICLES ── */
        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: #D4A017;
          opacity: 0;
          animation: float 3s ease-in-out infinite;
        }

        .p0  { width:4px;  height:4px;  top:10%; left:15%; animation-delay:0.2s; }
        .p1  { width:6px;  height:6px;  top:20%; left:80%; animation-delay:0.5s; }
        .p2  { width:3px;  height:3px;  top:70%; left:10%; animation-delay:0.8s; }
        .p3  { width:5px;  height:5px;  top:80%; left:75%; animation-delay:1.1s; }
        .p4  { width:4px;  height:4px;  top:35%; left:5%;  animation-delay:0.3s; }
        .p5  { width:7px;  height:7px;  top:55%; left:90%; animation-delay:0.6s; }
        .p6  { width:3px;  height:3px;  top:15%; left:50%; animation-delay:0.9s; }
        .p7  { width:5px;  height:5px;  top:85%; left:40%; animation-delay:0.4s; }
        .p8  { width:4px;  height:4px;  top:45%; left:95%; animation-delay:0.7s; }
        .p9  { width:6px;  height:6px;  top:5%;  left:30%; animation-delay:1.0s; }
        .p10 { width:3px;  height:3px;  top:90%; left:60%; animation-delay:0.2s; }
        .p11 { width:5px;  height:5px;  top:60%; left:25%; animation-delay:0.8s; }

        @keyframes float {
          0%   { opacity: 0; transform: translateY(0) scale(1); }
          50%  { opacity: 0.6; transform: translateY(-20px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }

        /* ── LOGO ── */
        .logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .logo-svg {
          width: 140px;
          height: 140px;
          filter: drop-shadow(0 0 20px rgba(212,160,23,0.3));
        }

        /* Ring draws in */
        .ring {
          animation: drawRing 1.2s ease forwards 0.2s;
        }

        @keyframes drawRing {
          to { stroke-dashoffset: 0; }
        }

        /* R letter draws like a signature */
        .r-letter {
          animation: drawR 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.4s;
        }

        @keyframes drawR {
          to { stroke-dashoffset: 0; }
        }

        /* R tail draws after */
        .r-tail {
          animation: drawTail 0.4s ease forwards 1.6s;
        }

        @keyframes drawTail {
          to { stroke-dashoffset: 0; }
        }

        /* Glow pulse when phase = glow */
        .splash-root.glow .glow-ring {
          animation: glowPulse 20s ease-in-out forwards;
        }

        @keyframes glowPulse {
          0%   { opacity: 0; r: 54; }
          50%  { opacity: 0.4; r: 60; }
          100% { opacity: 0; r: 58; }
        }

        /* ── BRAND NAME ── */
        .brand-name {
          display: flex;
          align-items: baseline;
          gap: 1px;
          opacity: 0;
          animation: fadeUp 0.6s ease forwards 1.4s;
        }

        .brand-r {
          font-size: 36px;
          font-weight: 900;
          color: #F0C040;
          font-family: 'Georgia', serif;
          letter-spacing: -1px;
        }

        .brand-rest {
          font-size: 32px;
          font-weight: 700;
          color: #FFFFFF;
          font-family: 'Georgia', serif;
          letter-spacing: 2px;
        }

        .brand-tagline {
          font-size: 12px;
          color: #8A9BB0;
          letter-spacing: 4px;
          text-transform: uppercase;
          opacity: 0;
          animation: fadeUp 0.5s ease forwards 1.7s;
          margin: 0;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
