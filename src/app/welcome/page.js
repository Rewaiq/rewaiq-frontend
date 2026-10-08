'use client';
import { useRouter } from 'next/navigation';
import RewaiqLogo from '@/components/RewaiqLogo';
import { ArrowRight, Music2, LogIn, Coins, Headphones, Sparkles, Smartphone } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070F1E',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 8,
          zIndex: 2,
        }}
      >
        <RewaiqLogo size={28} />
      </div>

      {/* Center Showcase Block */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '16px 0',
          zIndex: 2,
        }}
      >
        {/* Modern 3D Floating Ecosystem Visual */}
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Glass Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1.5px dashed rgba(74, 158, 255, 0.25)',
              animation: 'spin 20s linear infinite',
            }}
          />

          {/* Main Core Orb */}
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 30,
              background: 'linear-gradient(135deg, #0E244D 0%, #08142B 100%)',
              border: '1.5px solid rgba(74, 158, 255, 0.35)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.6), inset 0 0 20px rgba(59, 130, 246, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Center Music + Naira Badge */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1A6CFF, #38BDF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(26, 108, 255, 0.5)',
              }}
            >
              <Headphones size={22} color="#fff" />
            </div>

            {/* Audio Wave Indicator Bars */}
            <div style={{ display: 'flex', gap: 3, marginTop: 8, alignItems: 'center' }}>
              <span style={{ width: 3, height: 8, background: '#4a9eff', borderRadius: 2 }} />
              <span style={{ width: 3, height: 14, background: '#38bdf8', borderRadius: 2 }} />
              <span style={{ width: 3, height: 18, background: '#60a5fa', borderRadius: 2 }} />
              <span style={{ width: 3, height: 10, background: '#38bdf8', borderRadius: 2 }} />
              <span style={{ width: 3, height: 6, background: '#4a9eff', borderRadius: 2 }} />
            </div>
          </div>

          {/* Floating Gold Coin Satellite (Earning aspect) */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: 4,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: '2px solid #070F1E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(245, 158, 11, 0.45)',
              fontWeight: 900,
              fontSize: 18,
              color: '#fff',
            }}
          >
            ₦
          </div>

          {/* Floating Sparkle Badge (Rewards aspect) */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: 2,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: '2px solid #070F1E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Sparkles size={16} color="#fff" />
          </div>
        </div>

        {/* Headline & Description */}
        <h1
          style={{
            fontSize: 27,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 10px',
            fontFamily: 'Montserrat, sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          Set Up Your Account
        </h1>

        <p
          style={{
            fontSize: 14,
            color: '#8A9BB0',
            lineHeight: 1.6,
            maxWidth: 310,
            margin: 0,
          }}
        >
          Stream trending tracks, perform tasks, and earn real cash rewards daily.
        </p>
      </div>

      {/* Action Buttons & Install Hint */}
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Main User Earning CTA */}
          <button
            onClick={() => router.push('/register')}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1A6CFF, #38BDF8)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 8px 24px rgba(26, 108, 255, 0.35)',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <span>Join & Start Earning</span>
            <ArrowRight size={18} />
          </button>

          {/* Artist CTA */}
          <button
            onClick={() => router.push('/register?type=artist')}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 14,
              background: 'rgba(212, 160, 23, 0.08)',
              border: '1.5px solid rgba(212, 160, 23, 0.3)',
              color: '#FBBF24',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <Music2 size={17} color="#FBBF24" />
            <span>I'm an Artist — Promote Music</span>
          </button>

          {/* Login CTA */}
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogIn size={16} color="#8A9BB0" />
            <span>Login</span>
          </button>
        </div>

        {/* Minimal Clean Install Prompt */}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: '#64748B',
            fontSize: 11,
          }}
        >
          <Smartphone size={13} color="#4a9eff" />
          <span>Add to Home Screen from browser menu for quick access</span>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#334155',
            marginTop: 8,
            letterSpacing: 0.5,
          }}
        >
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}
