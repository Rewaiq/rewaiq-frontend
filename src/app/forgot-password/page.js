'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import API from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=email, 2=otp+password, 3=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!email) { setError('Enter your email'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/api/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!otp || !newPassword) { setError('Fill all fields'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/api/auth/reset-password', { email, otp, new_password: newPassword });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <CheckCircle size={64} color="#1A7A4A" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 8, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
          Password Reset!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)'
, marginBottom: 32, textAlign: 'center' }}>
          Your password has been changed successfully. Login with your new password.
        </p>
        <button onClick={() => router.push('/login')}
          style={{ width: '100%', maxWidth: 320, padding: '15px', borderRadius: 12, background: '#4a9eff', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg-primary)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>Reset Password</span>
      </div>

      <div style={{ flex: 1, padding: '40px 24px' }}>
        {step === 1 ? (
          <>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Mail size={32} color="#4a9eff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>
              Forgot Password?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)'
, marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email address and we'll send you a code to reset your password.
            </p>

            {error && <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#C0392B', fontSize: 13 }}>{error}</div>}

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <Mail size={16} color="#8A9BB0" />
                </div>
                <input type="email" placeholder="Enter your email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 15, color: '#0A1628', background: '#F8FAFC' }}
                />
              </div>
            </div>

            <button onClick={handleSendOTP} disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: 12, background: loading ? '#ccc' : '#4a9eff', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>
              Enter New Password
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)'
, marginBottom: 28 }}>
              Enter the code sent to <strong style={{ color: '#4a9eff' }}>{email}</strong> and your new password.
            </p>

            {error && <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#C0392B', fontSize: 13 }}>{error}</div>}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>OTP Code</label>
              <input type="tel" placeholder="Enter 6-digit code" value={otp}
                onChange={e => setOtp(e.target.value)} maxLength={6}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 18, fontWeight: 700, color: '#0A1628', background: '#F8FAFC', letterSpacing: 8, textAlign: 'center' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <Lock size={16} color="#8A9BB0" />
                </div>
                <input type={showPass ? 'text' : 'password'} placeholder="Enter new password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '13px 44px 13px 42px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 15, color: '#0A1628', background: '#F8FAFC' }}
                />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', display: 'flex' }}>
                  {showPass ? <EyeOff size={18} color="#8A9BB0" /> : <Eye size={18} color="#8A9BB0" />}
                </button>
              </div>
            </div>

            <button onClick={handleReset} disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: 12, background: loading ? '#ccc' : '#4a9eff', color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}