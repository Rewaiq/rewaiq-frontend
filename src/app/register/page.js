'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, User, Mail, Phone, Tag, Lock, Sparkles, Music2, UserPlus } from 'lucide-react';
import API from '@/lib/api';
import RewaiqLogo from '@/components/RewaiqLogo';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArtist = searchParams.get('type') === 'artist';

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    referral_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.phone) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await API.post('/api/auth/register', {
        ...form,
        role: isArtist ? 'artist' : 'user',
      });
      localStorage.setItem('rewaiq_pending_email', form.email);
      localStorage.setItem('rewaiq_pending_role', isArtist ? 'artist' : 'user');
      router.push('/verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Full Name', name: 'full_name', type: 'text', placeholder: 'Enter your full name', icon: User },
    { label: 'Email Address', name: 'email', type: 'email', placeholder: 'Enter your email', icon: Mail },
    { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+234 800 000 000', icon: Phone },
    {
      label: isArtist ? 'Promo Code (optional)' : 'Referral Code (optional)',
      name: 'referral_code',
      type: 'text',
      placeholder: isArtist ? 'Enter promo code' : 'Enter referral code',
      icon: Tag,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070F1E',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: -90,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: isArtist
            ? 'radial-gradient(circle, rgba(212, 160, 23, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(74, 158, 255, 0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 2,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </button>
        <RewaiqLogo size={24} />
        <div style={{ width: 22 }} />
      </div>

      {/* Form Content */}
      <div
        style={{
          flex: 1,
          padding: '28px 24px 36px',
          maxWidth: 440,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 2,
        }}
      >
        <div>
          {/* Header Title & Tagline */}
          <div style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 6,
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: -0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isArtist ? (
                <>
                  <Music2 size={24} color="#FBBF24" />
                  <span>Artist Account</span>
                </>
              ) : (
                'Create Account'
              )}
            </h2>
            <p style={{ fontSize: 14, color: '#8A9BB0', margin: 0, lineHeight: 1.5 }}>
              {isArtist
                ? 'Promote your music to thousands of real listeners across Nigeria'
                : 'Join Rewaiq to stream tracks, do tasks, and earn daily'}
            </p>
          </div>

          {/* Artist Highlights Card */}
          {isArtist && (
            <div
              style={{
                background: 'rgba(212,160,23,0.07)',
                border: '1.5px solid rgba(212,160,23,0.25)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={15} color="#FBBF24" />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24', margin: 0 }}>
                  Artist Growth Portal
                </p>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Launch targeted campaigns, drive organic Audiomack/Spotify streams, and monitor metrics with verified analytics.
              </p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
                color: '#F87171',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Input Fields */}
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#CBD5E1',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {f.label}
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                    }}
                  >
                    <Icon size={17} color="#8A9BB0" />
                  </div>
                  <input
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '13px 14px 13px 44px',
                      borderRadius: 12,
                      border: '1.5px solid rgba(255,255,255,0.08)',
                      fontSize: 14,
                      color: '#fff',
                      background: 'rgba(255,255,255,0.04)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Password Field */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#CBD5E1',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                }}
              >
                <Lock size={17} color="#8A9BB0" />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '13px 44px 13px 44px',
                  borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  fontSize: 14,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.04)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={18} color="#8A9BB0" /> : <Eye size={18} color="#8A9BB0" />}
              </button>
            </div>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={() => {
              window.location.href = 'https://rewaiq-backend-production.up.railway.app/api/auth/google';
            }}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 12,
              marginBottom: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Primary Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              background: loading
                ? 'rgba(74, 158, 255, 0.4)'
                : isArtist
                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                : 'linear-gradient(135deg, #1A6CFF, #4a9eff)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: 'Montserrat, sans-serif',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: isArtist
                ? '0 8px 24px rgba(245, 158, 11, 0.3)'
                : '0 8px 24px rgba(26, 108, 255, 0.3)',
            }}
          >
            {isArtist ? <Music2 size={18} /> : <UserPlus size={18} />}
            <span>
              {loading
                ? 'Creating Account...'
                : isArtist
                ? 'Create Artist Account'
                : 'Create Account'}
            </span>
          </button>
        </div>

        {/* Footer Navigation */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#8A9BB0', margin: '14px 0 0' }}>
          Already have an account?{' '}
          <span
            onClick={() => router.push('/login')}
            style={{ color: '#4a9eff', fontWeight: 700, cursor: 'pointer' }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070F1E' }} />}>
      <RegisterContent />
    </Suspense>
  );
}
