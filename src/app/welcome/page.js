'use client';
import { useRouter } from 'next/navigation';
import RewaiqLogo from '@/components/RewaiqLogo';
import { ArrowRight, Music2, LogIn, Sparkles, Smartphone } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#070F1E',
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Ambient Top Glow */}
      <div style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 360,
        height: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74, 158, 255, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <RewaiqLogo size={30} />
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        padding: '36px 24px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 440,
        margin: '0 auto',
        width: '100%',
      }}>
        
        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 10,
            fontFamily: 'Montserrat, sans-serif',
            letterSpacing: -0.5,
          }}>
            Set Up Your Account
          </h1>
          <p style={{
            fontSize: 14,
            color: '#8A9BB0',
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 300,
            margin: '0 auto',
          }}>
            Sign up to start building, learning, and earning money with every engagement.
          </p>
        </div>

        {/* Polished Center Graphic */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px 0 32px',
        }}>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: 32,
            background: 'linear-gradient(145deg, rgba(26,108,255,0.18), rgba(13,31,60,0.6))',
            border: '1.5px solid rgba(74,158,255,0.3)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 0 24px rgba(74,158,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Naira Emblem */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 900,
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
            }}>
              ₦
            </div>

            {/* Sparkle Floating Badge */}
            <div style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#1A6CFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(26,108,255,0.6)',
              border: '2px solid #070F1E',
            }}>
              <Sparkles size={18} color="#FFFFFF" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* User Earning Button */}
          <button
            onClick={() => router.push('/register')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #1A6CFF, #4a9eff)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 14,
              fontFamily: 'Montserrat, sans-serif',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 8px 24px rgba(26,108,255,0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>🎯 Join & Start Earning</span>
            <ArrowRight size={18} />
          </button>

          {/* Artist Button */}
          <button
            onClick={() => router.push('/register?type=artist')}
            style={{
              width: '100%',
              padding: '15px',
              background: 'rgba(212,160,23,0.08)',
              color: '#FBBF24',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 14,
              fontFamily: 'Montserrat, sans-serif',
              border: '1.5px solid rgba(212,160,23,0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Music2 size={18} color="#FBBF24" />
            <span>I'm an Artist — Promote My Music</span>
          </button>

          {/* Login Button */}
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(255,255,255,0.04)',
              color: '#CBD5E1',
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 14,
              fontFamily: 'Montserrat, sans-serif',
              border: '1px solid rgba(255,255,255,0.08)',
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

        {/* Install Hint Card */}
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Smartphone size={14} color="#4a9eff" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4a9eff', letterSpacing: 0.5, textTransform: 'uppercase' }}>Install App</span>
          </div>
          <p style={{ fontSize: 12, color: '#8A9BB0', lineHeight: 1.5, margin: 0 }}>
            On Android: tap browser menu (⋮) → <strong style={{ color: '#fff' }}>"Add to Home Screen"</strong><br />
            On iPhone: tap Share (<span style={{ fontSize: 14 }}>⎋</span>) → <strong style={{ color: '#fff' }}>"Add to Home Screen"</strong>
          </p>
        </div>

        <p style={{ fontSize: 11, color: '#475569', marginTop: 18, letterSpacing: 1 }}>
          Version 1.0.0
        </p>

      </div>
    </div>
  );
}
