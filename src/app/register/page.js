'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, User, Mail, Phone, Tag } from 'lucide-react';
import API from '@/lib/api';
import RewaiqLogo from '@/components/RewaiqLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', referral_code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.password || !form.phone) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true); setError('');
    try {
      await API.post('/api/auth/register', form);
      localStorage.setItem('rewaiq_pending_email', form.email);
      router.push('/verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { label: 'Full Name', name: 'full_name', type: 'text', placeholder: 'Enter your full name', icon: User },
    { label: 'Email Address', name: 'email', type: 'email', placeholder: 'Enter your email', icon: Mail },
    { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+234 800 000 0000', icon: Phone },
    { label: 'Referral Code (optional)', name: 'referral_code', type: 'text', placeholder: 'Enter referral code', icon: Tag },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0A1628', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => router.back()} style={{ background: 'none', color: '#fff', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <RewaiqLogo size={22} />
      </div>

      <div style={{ flex: 1, padding: '28px 24px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>Create Account</h2>
        <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 24 }}>Join Rewaiq and start earning today</p>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#C0392B', fontSize: 13 }}>
            {error}
          </div>
        )}

        {fields.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.name} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <Icon size={16} color="#8A9BB0" />
                </div>
                <input name={f.name} type={f.type} placeholder={f.placeholder} value={form[f.name]}
                  onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                  style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 15, color: '#0A1628', background: '#F8FAFC' }}
                />
              </div>
            </div>
          );
        })}

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#0A1628', display: 'block', marginBottom: 6 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} placeholder="Create a password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '13px 44px 13px 14px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 15, color: '#0A1628', background: '#F8FAFC' }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', display: 'flex', alignItems: 'center' }}>
              {showPass ? <EyeOff size={18} color="#8A9BB0" /> : <Eye size={18} color="#8A9BB0" />}
            </button>
          </div>
        </div>

        {/* Google */}
        <button onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
          style={{ width: '100%', padding: '13px', borderRadius: 10, marginBottom: 12, border: '1.5px solid #E0E8F0', background: '#fff', color: '#0A1628', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '15px', borderRadius: 12, background: loading ? '#ccc' : '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 14, fontFamily: 'Montserrat, sans-serif' }}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8A9BB0' }}>
          Already have an account?{' '}
          <span onClick={() => router.push('/login')} style={{ color: '#4a9eff', fontWeight: 600, cursor: 'pointer' }}>Login</span>
        </p>
      </div>
    </div>
  );
}