'use client';
import { useRouter } from 'next/navigation';
import RewaiqLogo from '@/components/RewaiqLogo';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-primary)', padding: '18px 24px', display: 'flex', justifyContent: 'center' }}>
        <RewaiqLogo size={28} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A1628', textAlign: 'center', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
          Set Up Your Account
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.7, maxWidth: 280, marginBottom: 40 }}>
          Sign up to start building, learning and earning money with every engagement
        </p>

        {/* Illustration */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <svg viewBox="0 0 300 220" width="280" height="210">
            <ellipse cx="150" cy="185" rx="60" ry="10" fill="#F0C040" opacity="0.2"/>
            <ellipse cx="150" cy="178" rx="55" ry="10" fill="#D4A017"/>
            <rect x="95" y="142" width="110" height="36" rx="4" fill="#D4A017"/>
            <ellipse cx="150" cy="142" rx="55" ry="10" fill="#F0C040"/>
            <ellipse cx="150" cy="118" rx="50" ry="10" fill="#D4A017"/>
            <rect x="100" y="83" width="100" height="35" rx="4" fill="#D4A017"/>
            <ellipse cx="150" cy="83" rx="50" ry="10" fill="#F0C040"/>
            <circle cx="150" cy="42" r="18" fill="#FFB74D"/>
            <rect x="133" y="60" width="34" height="42" rx="8" fill="#1565C0"/>
            <rect x="119" y="64" width="18" height="28" rx="6" fill="#1565C0"/>
            <rect x="163" y="64" width="18" height="28" rx="6" fill="#1565C0"/>
            <rect x="131" y="102" width="15" height="28" rx="6" fill="#0A1628"/>
            <rect x="154" y="102" width="15" height="28" rx="6" fill="#0A1628"/>
            <circle cx="192" cy="72" r="14" fill="#F0C040"/>
            <text x="186" y="78" fontSize="14" fill="#0A1628" fontWeight="bold">₦</text>
          </svg>
        </div>

        {/* Buttons */}
<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
  <button
    onClick={() => router.push('/register')}
    style={{ width: '100%', padding: '16px', background: '#4a9eff', color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, borderRadius: 12, fontFamily: 'Montserrat, sans-serif' }}
  >
    🎯 Join & Start Earning
  </button>
  <button
    onClick={() => router.push('/register?type=artist')}
    style={{ width: '100%', padding: '16px', background: 'rgba(212,160,23,0.1)', color: '#D4A017', fontSize: 16, fontWeight: 600, borderRadius: 12, fontFamily: 'Montserrat, sans-serif', border: '1.5px solid rgba(212,160,23,0.3)' }}
  >
    🎵 I'm an Artist — Promote My Music
  </button>
  <button
    onClick={() => router.push('/login')}
    style={{ width: '100%', padding: '16px', background: '#F0F4F8', color: '#0A1628', fontSize: 16, fontWeight: 600, borderRadius: 12, fontFamily: 'Montserrat, sans-serif' }}
  >
    Login
  </button>
</div>
        <p style={{ fontSize: 11, color: '#ccc', marginTop: 16 }}>Version 1.0.0</p>
      </div>
    </div>
  );
}
{/* Install hint */}
<p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 16 }}>
  On Android: tap browser menu → "Add to Home Screen"<br/>
  On iPhone: tap Share → "Add to Home Screen"
</p>