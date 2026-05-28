'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import API from '@/lib/api';

export default function VerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const refs = useRef([]);
  const [email, setEmail] = useState('');

useEffect(() => {
  const storedEmail = localStorage.getItem('rewaiq_pending_email');

  if (storedEmail) {
    setEmail(storedEmail);
  } else {
    router.push('/register');
  }
}, [router]);
  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(p => p - 1), 1000); return () => clearTimeout(t); }
  }, [timer]);

  const handleChange = (val, i) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[i] = val.slice(-1); setOtp(n);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const res = await API.post('/api/auth/verify-otp', { email, otp: code });
      localStorage.setItem('rewaiq_token', res.data.token);
      localStorage.setItem('rewaiq_user', JSON.stringify(res.data.user));
      router.push('/interests');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try { await API.post('/api/auth/resend-otp', { email }); setTimer(60); } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0A1628', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Verify Email</span>
      </div>

      <div style={{ flex: 1, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Mail size={32} color="#4a9eff" />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 8, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
          We sent you a code
        </h2>
        <p style={{ fontSize: 13, color: '#8A9BB0', textAlign: 'center', marginBottom: 4 }}>Enter the 6-digit code sent to</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#4a9eff', marginBottom: 36 }}>{email}</p>

        {error && <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#C0392B', fontSize: 13, width: '100%', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          {otp.map((digit, i) => (
            <input key={i} ref={el => refs.current[i] = el} type="tel" maxLength={1} value={digit}
              onChange={e => handleChange(e.target.value, i)} onKeyDown={e => handleKeyDown(e, i)}
              style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, borderRadius: 10, border: `2px solid ${digit ? '#4a9eff' : '#E0E8F0'}`, background: digit ? '#EFF6FF' : '#F8FAFC', color: '#0A1628' }}
            />
          ))}
        </div>

        <button onClick={handleVerify} disabled={loading}
          style={{ width: '100%', padding: '15px', borderRadius: 12, background: loading ? '#ccc' : '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <p style={{ fontSize: 13, color: '#8A9BB0' }}>
          {timer > 0 ? `Resend code in ${timer}s` :
            <span onClick={handleResend} style={{ color: '#4a9eff', cursor: 'pointer', fontWeight: 600 }}>Resend Code</span>}
        </p>
      </div>
    </div>
  );
}