'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, CheckCircle, Gift } from 'lucide-react';
import API from '@/lib/api';

export default function PromoPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    API.get('/api/promo/status').then(res => {
      setStatus(res.data);
    }).catch(() => {});
  }, []);

  const handleRedeem = async () => {
    if (!code) { setError('Enter a promo code'); return; }
    setLoading(true); setError('');
    try {
      const res = await API.post('/api/promo/redeem', { code });
      setSuccess(res.data);
      setStatus({ has_promo: true, ...res.data });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>Promo Code</span>
      </div>

      <div style={{ padding: '32px 20px' }}>
        {/* Active promo */}
        {status?.has_promo && (
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
            <Gift size={32} color="#4ADE80" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Active Promo</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#4ADE80', fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>
              {status.free_streams_remaining} free streams
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Expires: {new Date(status.expires_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* What you get */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Montserrat, sans-serif' }}>
            Beta Promo Benefits
          </p>
          {[
            { icon: '🎵', title: '2 Free Streams', desc: 'Stream 2 tracks without earning limit' },
            { icon: '⏱', title: '7 Days Access', desc: 'Full platform access for one week' },
            { icon: '💰', title: 'Real Earnings', desc: 'Coins earned are real and cashable' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{item.title}</p>
                <p style={{ fontSize: 12,color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        {!success && !status?.has_promo && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>Enter Promo Code</label>
              <input
                type="text"
                placeholder="e.g. REWAIQ-BETA"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 16, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', fontWeight: 700, letterSpacing: 2, textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>
            {error && <p style={{ fontSize: 13, color: '#F87171', textAlign: 'center', marginBottom: 12 }}>{error}</p>}
            <button onClick={handleRedeem} disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: loading ? '#8A9BB0' : '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Tag size={18} /> {loading ? 'Activating...' : 'Activate Code'}
            </button>
          </>
        )}

        {/* Success */}
        {success && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="#4ADE80" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Code Activated!</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              You have {success.free_streams} free streams for {success.duration_days} days
            </p>
            <button onClick={() => router.push('/home')}
              style={{ padding: '14px 32px', borderRadius: 12, background: '#4a9eff', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Start Streaming
            </button>
          </div>
        )}

        {/* Suggested pricing after promo */}
        <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>After Beta — Subscription Plans</p>
          {[
            { name: 'Basic', price: 'Free', desc: 'Limited streams, standard tasks', color: 'var(--text-secondary)' },
            { name: 'Earner', price: 'N500/month', desc: 'Unlimited streams, all tasks', color: '#4a9eff' },
            { name: 'Pro', price: 'N1,000/month', desc: 'Priority feed, bonus coins, early access', color: '#D4A017' },
          ].map(plan => (
            <div key={plan.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{plan.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{plan.desc}</p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: plan.color }}>{plan.price}</span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, textAlign: 'center' }}>
            Pricing confirmed at full launch
          </p>
        </div>
      </div>
    </div>
  );
}