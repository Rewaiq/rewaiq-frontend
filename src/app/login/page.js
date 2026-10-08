'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import API from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/auth/login', form);
      localStorage.setItem('rewaiq_token', res.data.token);
      localStorage.setItem('rewaiq_user', JSON.stringify(res.data.user));
      router.push('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
          top: -100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74, 158, 255, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
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
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          Welcome Back
        </span>
      </div>

      {/* Form Body Container */}
      <div
        style={{
          flex: 1,
          padding: '36px 24px 32px',
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
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 6,
              fontFamily: 'Montserrat, sans-serif',
              letterSpacing: -0.5,
            }}
          >
            Welcome Back 👋
          </h2>
          <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 28, margin: '0 0 28px' }}>
            Login to continue earning and streaming
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 20,
                color: '#F87171',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#CBD5E1',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  fontSize: 15,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.04)',
                  outline: 'none',
                }}
              />
              <Mail
                size={18}
                color="#8A9BB0"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#CBD5E1',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 46px 14px 44px',
                  borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  fontSize: 15,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.04)',
                  outline: 'none',
                }}
              />
              <Lock
                size={18}
                color="#8A9BB0"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
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

          {/* Forgot Password */}
          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <span
              onClick={() => router.push('/forgot-password')}
              style={{
                fontSize: 13,
                color: '#4a9eff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Forgot Password?
            </span>
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={() => (window.location.href = `https://api.rewaiq.com.ng/api/auth/google`)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              marginBottom: 14,
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
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
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
              background: loading ? 'rgba(74, 158, 255, 0.4)' : 'linear-gradient(135deg, #1A6CFF, #4a9eff)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(26,108,255,0.3)',
            }}
          >
            <LogIn size={18} color="#fff" />
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#8A9BB0', marginTop: 24, margin: '24px 0 0' }}>
          Don't have an account?{' '}
          <span
            onClick={() => router.push('/register')}
            style={{ color: '#4a9eff', fontWeight: 700, cursor: 'pointer' }}
          >
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
}
