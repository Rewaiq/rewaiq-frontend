'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
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
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0A1628', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', color: '#fff', fontSize: 20 }}>←</button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, fontFamily: 'Montserrat, sans-serif' }}>Welcome Back</span>
      </div>

      <div style={{ flex: 1, padding: '40px 24px', background: '#fff' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0A1628', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>
          Welcome Back 👋
        </h2>
        <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 32 }}>Login to continue earning</p>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#C0392B', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 15, color: '#0A1628', background: '#F8FAFC' }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 15, color: '#0A1628', background: '#F8FAFC' }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', fontSize: 18, color: '#8A9BB0' }}>
              {showPass ? '👁' : '👁‍🗨'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 28 }}>
          <span onClick={() => router.push('/forgot-password')} style={{ fontSize: 13, color: '#4a9eff', cursor: 'pointer', fontWeight: 600 }}>
            Forgot Password?
          </span>
        </div>

        <button
          onClick={() => window.location.href = `https://rewaiq-backend-production.up.railway.app/api/auth/google`}
          style={{ width: '100%', padding: '14px', borderRadius: 10, marginBottom: 12, border: '1.5px solid #E0E8F0', background: '#fff', color: '#0A1628', fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <span>🔵</span> Continue with Google
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '16px', borderRadius: 12, background: loading ? '#ccc' : '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', marginBottom: 16 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#8A9BB0' }}>
          Don't have an account?{' '}
          <span onClick={() => router.push('/register')} style={{ color: '#4a9eff', fontWeight: 600, cursor: 'pointer' }}>
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
}