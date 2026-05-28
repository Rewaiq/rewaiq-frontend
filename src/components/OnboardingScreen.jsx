'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  {
    id: 1,
    tag: 'STREAM & EARN',
    title: 'Turn Your\nListening Into\nReal Money',
    sub: 'Stream music, complete brand tasks and earn Rewaiq Coins — redeemable as real NGN to your bank.',
    accent: '#4a9eff',
    illustration: StreamIllustration,
  },
  {
    id: 2,
    tag: 'DISCOVER',
    title: 'Find Jobs,\nGrants &\nOpportunities',
    sub: 'Access jobs, gigs, scholarships and grants — all in one place, built for African youth.',
    accent: '#D4A017',
    illustration: DiscoverIllustration,
  },
  {
    id: 3,
    tag: 'LEARN & GROW',
    title: 'Build Digital\nSkills That\nPay You',
    sub: 'Train at the Rewaiq Innovation Hub in Aba or online. Learn web design, digital marketing and more.',
    accent: '#2d6be4',
    illustration: LearnIllustration,
  },
  {
    id: 4,
    tag: 'JOIN REWAIQ',
    title: 'Africa\'s Digital\nEarning\nPlatform',
    sub: 'Built for youth. Transparent by design. Start earning from day one.',
    accent: '#4a9eff',
    illustration: JoinIllustration,
    isLast: true,
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const router = useRouter();

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent(c => c + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  };

  const handleTouchEnd = (e) => {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setDragging(false);
  };

  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    setDragging(true);
  };

  const handleMouseUp = (e) => {
    const diff = startX.current - e.clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setDragging(false);
  };

  const slide = SLIDES[current];
  const Illustration = slide.illustration;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500&display=swap');

        .onboard-root {
          position: fixed;
          inset: 0;
          background: #0A1628;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
        }

        .slide-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px 0;
          text-align: center;
          transition: all 0.4s ease;
        }

        .slide-tag {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid;
          margin-bottom: 28px;
          opacity: 0;
          animation: slideUp 0.5s ease 0.1s forwards;
        }

        .slide-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 36px;
          font-weight: 900;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 20px;
          white-space: pre-line;
          opacity: 0;
          animation: slideUp 0.5s ease 0.2s forwards;
        }

        .slide-sub {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #8A9BB0;
          line-height: 1.7;
          max-width: 300px;
          opacity: 0;
          animation: slideUp 0.5s ease 0.3s forwards;
        }

        .illustration-wrap {
          opacity: 0;
          animation: slideUp 0.5s ease 0.15s forwards;
          margin-bottom: 28px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .bottom-section {
          padding: 24px 32px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .dot {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.2);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .dot-active {
          width: 24px;
          background: #4a9eff;
        }

        .dot-inactive {
          width: 6px;
        }

        .btn-next {
          width: 100%;
          padding: 17px;
          border-radius: 14px;
          font-family: 'Montserrat', sans-serif;
          font-size: 16px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-skip {
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #8A9BB0;
          cursor: pointer;
          padding: 8px;
        }

        .top-bar {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .progress-bar {
          height: 2px;
          background: rgba(255,255,255,0.08);
          border-radius: 1px;
          overflow: hidden;
          margin: 0 24px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 1px;
          transition: width 0.4s ease;
        }
      `}</style>

      <div
        className="onboard-root"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Top bar */}
        <div className="top-bar">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="24" height="20" viewBox="0 0 100 80">
              <path d="M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z" fill="#1a3a8f"/>
              <path d="M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z" fill="#4a9eff"/>
              <path d="M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.0237 71.6257 72.4608 71.6478Z" fill="#2d6be4"/>
            </svg>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.5px' }}>Rewaiq</span>
          </div>

          {/* Skip */}
          {!slide.isLast && (
            <button className="btn-skip" onClick={onComplete}>
              Skip
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((current + 1) / SLIDES.length) * 100}%`,
              background: slide.accent,
            }}
          />
        </div>

        {/* Slide content — key forces remount on slide change for animation */}
        <div key={current} className="slide-content">
          {/* Illustration */}
          <div className="illustration-wrap">
            <Illustration accent={slide.accent} />
          </div>

          {/* Tag */}
          <div
            className="slide-tag"
            style={{ color: slide.accent, borderColor: `${slide.accent}40` }}
          >
            {slide.tag}
          </div>

          {/* Title */}
          <h1 className="slide-title">{slide.title}</h1>

          {/* Subtitle */}
          <p className="slide-sub">{slide.sub}</p>
        </div>

        {/* Bottom */}
        <div className="bottom-section">
          {/* Dots */}
          <div className="dots">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`dot ${i === current ? 'dot-active' : 'dot-inactive'}`}
                onClick={() => setCurrent(i)}
                style={i === current ? { background: slide.accent } : {}}
              />
            ))}
          </div>

          {/* Button */}
          {slide.isLast ? (
            <button
              className="btn-next"
              onClick={onComplete}
              style={{ background: slide.accent, color: '#fff' }}
            >
              Get Started →
            </button>
          ) : (
            <button
              className="btn-next"
              onClick={next}
              style={{ background: slide.accent, color: '#fff' }}
            >
              Next
            </button>
          )}

          {/* Already have account */}
          {slide.isLast && (
            <button className="btn-skip" onClick={() => {
              onComplete();
              // slight delay then push to login
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }, 100);
            }}>
              Already have an account? Login
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── ILLUSTRATIONS ──

function StreamIllustration({ accent }) {
  return (
    <svg viewBox="0 0 280 200" width="280" height="180">
      {/* Phone */}
      <rect x="90" y="20" width="100" height="160" rx="16" fill="#0D1F3C" stroke="rgba(74,158,255,0.3)" strokeWidth="1.5"/>
      <rect x="98" y="35" width="84" height="130" rx="8" fill="#142540"/>
      {/* Music bars */}
      <rect x="115" y="110" width="10" height="30" rx="5" fill={accent} opacity="0.9"/>
      <rect x="131" y="95" width="10" height="45" rx="5" fill={accent}/>
      <rect x="147" y="105" width="10" height="35" rx="5" fill={accent} opacity="0.8"/>
      <rect x="163" y="100" width="10" height="40" rx="5" fill={accent} opacity="0.9"/>
      {/* Play button */}
      <circle cx="140" cy="72" r="20" fill={accent} opacity="0.15"/>
      <circle cx="140" cy="72" r="14" fill={accent} opacity="0.3"/>
      <polygon points="136,66 136,78 150,72" fill={accent}/>
      {/* Coin floating */}
      <circle cx="200" cy="60" r="22" fill="#D4A017" opacity="0.15"/>
      <circle cx="200" cy="60" r="16" fill="#D4A017"/>
      <text x="194" y="65" fontSize="14" fill="#0A1628" fontWeight="bold">₦</text>
      {/* Sound waves */}
      <path d="M60 90 Q50 100 60 110" stroke={accent} strokeWidth="2" fill="none" opacity="0.5"/>
      <path d="M52 82 Q36 100 52 118" stroke={accent} strokeWidth="2" fill="none" opacity="0.3"/>
      {/* Coin particles */}
      <circle cx="215" cy="40" r="4" fill="#F0C040" opacity="0.6"/>
      <circle cx="225" cy="75" r="3" fill="#F0C040" opacity="0.4"/>
      <circle cx="195" cy="30" r="3" fill="#F0C040" opacity="0.5"/>
    </svg>
  );
}

function DiscoverIllustration({ accent }) {
  return (
    <svg viewBox="0 0 280 200" width="280" height="180">
      {/* Central search */}
      <circle cx="140" cy="90" r="40" fill="rgba(212,160,23,0.08)" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="140" cy="90" r="26" fill="#0D1F3C"/>
      {/* Compass */}
      <line x1="140" y1="68" x2="140" y2="112" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <line x1="118" y1="90" x2="162" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <polygon points="140,72 144,84 136,84" fill={accent}/>
      <polygon points="140,108 144,96 136,96" fill="rgba(255,255,255,0.2)"/>
      <circle cx="140" cy="90" r="4" fill={accent}/>

      {/* Opportunity cards floating around */}
      {/* Jobs */}
      <rect x="20" y="30" width="70" height="36" rx="8" fill="#0D1F3C" stroke="rgba(74,158,255,0.2)" strokeWidth="1"/>
      <text x="32" y="47" fontSize="10" fill="#8A9BB0">💼</text>
      <text x="48" y="44" fontSize="9" fill="#fff" fontWeight="700">Jobs</text>
      <text x="48" y="57" fontSize="8" fill="#8A9BB0">New listings</text>

      {/* Grants */}
      <rect x="190" y="30" width="70" height="36" rx="8" fill="#0D1F3C" stroke="rgba(212,160,23,0.2)" strokeWidth="1"/>
      <text x="202" y="47" fontSize="10" fill="#D4A017">🏆</text>
      <text x="218" y="44" fontSize="9" fill="#fff" fontWeight="700">Grants</text>
      <text x="218" y="57" fontSize="8" fill="#8A9BB0">$10K+</text>

      {/* Gigs */}
      <rect x="20" y="135" width="70" height="36" rx="8" fill="#0D1F3C" stroke="rgba(45,107,228,0.2)" strokeWidth="1"/>
      <text x="32" y="152" fontSize="10" fill="#2d6be4">⚡</text>
      <text x="48" y="149" fontSize="9" fill="#fff" fontWeight="700">Gigs</text>
      <text x="48" y="162" fontSize="8" fill="#8A9BB0">Freelance</text>

      {/* Skills */}
      <rect x="190" y="135" width="70" height="36" rx="8" fill="#0D1F3C" stroke="rgba(74,158,255,0.2)" strokeWidth="1"/>
      <text x="202" y="152" fontSize="10" fill={accent}>📚</text>
      <text x="218" y="149" fontSize="9" fill="#fff" fontWeight="700">Skills</text>
      <text x="218" y="162" fontSize="8" fill="#8A9BB0">Training</text>

      {/* Connecting lines */}
      <line x1="90" y1="52" x2="114" y2="75" stroke={accent} strokeWidth="0.5" opacity="0.3"/>
      <line x1="190" y1="52" x2="166" y2="75" stroke="#D4A017" strokeWidth="0.5" opacity="0.3"/>
      <line x1="90" y1="148" x2="114" y2="105" stroke="#2d6be4" strokeWidth="0.5" opacity="0.3"/>
      <line x1="190" y1="148" x2="166" y2="105" stroke={accent} strokeWidth="0.5" opacity="0.3"/>
    </svg>
  );
}

function LearnIllustration({ accent }) {
  return (
    <svg viewBox="0 0 280 200" width="280" height="180">
      {/* Hub building */}
      <rect x="80" y="80" width="120" height="100" rx="4" fill="#0D1F3C" stroke={accent} strokeWidth="1.5"/>
      <rect x="95" y="95" width="35" height="30" rx="3" fill="#142540"/>
      <rect x="140" y="95" width="35" height="30" rx="3" fill="#142540"/>
      <rect x="95" y="135" width="35" height="45" rx="3" fill="#4a9eff" opacity="0.2"/>
      <rect x="140" y="135" width="35" height="45" rx="3" fill="#142540"/>
      {/* Door */}
      <rect x="115" y="150" width="22" height="30" rx="3" fill="#4a9eff" opacity="0.4"/>
      <circle cx="131" cy="166" r="2" fill={accent}/>
      {/* Roof / triangle */}
      <polygon points="70,82 140,30 210,82" fill="#0A1628" stroke={accent} strokeWidth="1.5"/>
      {/* Rewaiq text on building */}
      <text x="108" y="75" fontSize="8" fill={accent} fontWeight="700" letterSpacing="1">REWAIQ HUB</text>
      {/* People/students */}
      <circle cx="50" cy="155" r="10" fill="#FFB74D"/>
      <rect x="42" y="165" width="16" height="20" rx="4" fill="#4a9eff"/>
      <circle cx="230" cy="155" r="10" fill="#FFB74D"/>
      <rect x="222" y="165" width="16" height="20" rx="4" fill="#2d6be4"/>
      {/* Code symbols floating */}
      <text x="30" y="110" fontSize="12" fill={accent} opacity="0.6">{'</>'}</text>
      <text x="220" y="100" fontSize="12" fill={accent} opacity="0.5">{'{ }'}</text>
      <text x="215" y="130" fontSize="10" fill="#D4A017" opacity="0.5">#</text>
      {/* Certificate */}
      <rect x="185" y="50" width="50" height="35" rx="4" fill="#0D1F3C" stroke="#D4A017" strokeWidth="1"/>
      <text x="195" y="63" fontSize="8" fill="#D4A017">★ CERT</text>
      <line x1="193" y1="70" x2="227" y2="70" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="196" y="80" fontSize="7" fill="#8A9BB0">Rewaiq Hub</text>
    </svg>
  );
}

function JoinIllustration({ accent }) {
  return (
    <svg viewBox="0 0 280 200" width="280" height="180">
      {/* Africa map outline (simplified) */}
      <path d="M120 30 L160 25 L180 40 L190 70 L185 100 L175 130 L165 155 L150 170 L135 165 L120 145 L105 120 L100 90 L105 60 Z"
        fill="rgba(74,158,255,0.08)" stroke={accent} strokeWidth="1" strokeDasharray="3 2"/>
      {/* Nigeria dot */}
      <circle cx="148" cy="105" r="6" fill={accent}/>
      <circle cx="148" cy="105" r="12" fill={accent} opacity="0.2"/>
      <circle cx="148" cy="105" r="18" fill={accent} opacity="0.1"/>
      {/* Rewaiq logo centered */}
      <svg x="130" y="87" width="36" height="29" viewBox="0 0 100 80">
        <path d="M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z" fill="#1a3a8f"/>
        <path d="M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z" fill="#4a9eff"/>
        <path d="M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.0237 71.6257 72.4608 71.6478Z" fill="#2d6be4"/>
      </svg>
      {/* Stats */}
      <rect x="20" y="40" width="70" height="40" rx="8" fill="#0D1F3C" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <text x="35" y="57" fontSize="16" fill={accent} fontWeight="900" fontFamily="Montserrat,sans-serif">133M</text>
      <text x="30" y="72" fontSize="8" fill="#8A9BB0">Nigerian Youth</text>
      <rect x="190" y="40" width="70" height="40" rx="8" fill="#0D1F3C" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <text x="200" y="57" fontSize="16" fill="#D4A017" fontWeight="900" fontFamily="Montserrat,sans-serif">₦0</text>
      <text x="197" y="72" fontSize="8" fill="#8A9BB0">Cost to join</text>
      <rect x="20" y="140" width="70" height="40" rx="8" fill="#0D1F3C" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <text x="30" y="157" fontSize="14" fill="#4ADE80" fontWeight="900" fontFamily="Montserrat,sans-serif">Day 1</text>
      <text x="28" y="172" fontSize="8" fill="#8A9BB0">Start earning</text>
      <rect x="190" y="140" width="70" height="40" rx="8" fill="#0D1F3C" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <text x="200" y="157" fontSize="14" fill={accent} fontWeight="900" fontFamily="Montserrat,sans-serif">Real</text>
      <text x="200" y="172" fontSize="8" fill="#8A9BB0">NGN cashout</text>
    </svg>
  );
}