'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Users, TrendingUp, CheckCircle } from 'lucide-react';

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Campaign',
    price: 15000,
    display: 'N15,000',
    reach: '500 users',
    duration: '7 days',
    type: 'follow',
    coins: 30,
    desc: 'Get 500 users to follow, share or engage with your brand',
  },
  {
    id: 'standard',
    name: 'Standard Campaign',
    price: 35000,
    display: 'N35,000',
    reach: '1,500 users',
    duration: '14 days',
    type: 'campaign',
    coins: 50,
    desc: 'Wider reach with more engagement across the platform',
    badge: 'POPULAR',
  },
  {
    id: 'premium',
    name: 'Premium Campaign',
    price: 80000,
    display: 'N80,000',
    reach: '5,000 users',
    duration: '30 days',
    type: 'campaign',
    coins: 80,
    desc: 'Maximum platform exposure for your brand or product',
    badge: 'BEST VALUE',
  },
];

export default function PromotePage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    brand_name: '',
    task_title: '',
    task_description: '',
    target_url: '',
    contact_email: '',
    contact_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handlePaystack = () => {
    if (!form.brand_name || !form.task_title || !form.contact_email) {
      setError('Please fill all required fields'); return;
    }
    setError('');
    setLoading(true);

    const pkg = PACKAGES.find(p => p.id === selected);
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || 'pk_test_xxxxxxxxxx',
      email: form.contact_email,
      amount: pkg.price * 100, // kobo
      currency: 'NGN',
      ref: `RWQCAMPAIGN_${Date.now()}`,
      metadata: {
        brand_name: form.brand_name,
        task_title: form.task_title,
        task_description: form.task_description,
        target_url: form.target_url,
        package: pkg.name,
        coins_per_completion: pkg.coins,
        contact_phone: form.contact_phone,
      },
      callback: async (response) => {
        // Payment successful — notify via WhatsApp + save
        setLoading(false);
        setSuccess(true);

        // Open WhatsApp with payment reference
        const msg = encodeURIComponent(
          `Hello Rewaiq Team,\n\nI just paid for a campaign.\n\nPayment Reference: ${response.reference}\nBrand: ${form.brand_name}\nPackage: ${pkg.name}\nTask: ${form.task_title}\n\nPlease activate my campaign. Thank you.`
        );
        setTimeout(() => {
          window.open(`https://wa.me/2348168099351?text=${msg}`, '_blank');
        }, 1500);
      },
      onClose: () => {
        setLoading(false);
      }
    });
    handler.openIframe();
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <CheckCircle size={64} color="#4ADE80" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>Payment Successful!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8, lineHeight: 1.7 }}>
          Your campaign payment was received. We are setting up your campaign now.
        </p>
        <p style={{ fontSize: 13, color: '#4a9eff', textAlign: 'center', marginBottom: 32 }}>
          A WhatsApp message has been opened with your payment reference. Send it to complete setup.
        </p>
        <button onClick={() => router.push('/home')}
          style={{ padding: '14px 32px', borderRadius: 12, background: '#4a9eff', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const pkg = selected ? PACKAGES.find(p => p.id === selected) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 40 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, margin: 0 }}>Promote Your Brand</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: 0 }}>Step {step} of 2</p>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {step === 1 && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>Choose a Package</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Get your brand in front of thousands of engaged Nigerian youth on Rewaiq.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[
                { icon: <Users size={16} color="#4a9eff" />, value: '500+', label: 'Active Users' },
                { icon: <TrendingUp size={16} color="#D4A017" />, value: '18-30', label: 'Age Range' },
                { icon: <Zap size={16} color="#4ADE80" />, value: '95%', label: 'Engagement' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {PACKAGES.map(pkg => (
              <div key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                style={{ background: selected === pkg.id ? 'rgba(74,158,255,0.1)' : '#0D1F3C', border: `2px solid ${selected === pkg.id ? '#4a9eff' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '18px', marginBottom: 12, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                {pkg.badge && (
                  <div style={{ position: 'absolute', top: -1, right: 16, background: pkg.badge === 'POPULAR' ? '#4a9eff' : '#D4A017', color: 'var(--text-primary)', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: 1 }}>
                    {pkg.badge}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{pkg.name}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#4a9eff', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{pkg.display}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{pkg.desc}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>{pkg.reach}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pkg.duration}</span>
                  <span style={{ fontSize: 12, color: '#D4A017', fontWeight: 600 }}>{pkg.coins} coins per user</span>
                </div>
              </div>
            ))}

            <button
              onClick={() => { if (!selected) { setError('Select a package'); return; } setError(''); setStep(2); }}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: selected ? 'linear-gradient(135deg, #4a9eff, #2d6be4)' : 'rgba(255,255,255,0.08)', color: selected ? '#fff' : '#8A9BB0', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
              {selected ? `Continue with ${PACKAGES.find(p => p.id === selected)?.display}` : 'Select a Package'}
            </button>
            {error && <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</p>}
          </>
        )}

        {step === 2 && pkg && (
          <>
            <div style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{pkg.name}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#4a9eff' }}>{pkg.display}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pkg.reach} · {pkg.duration}</span>
            </div>

            {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#F87171', fontSize: 13 }}>{error}</div>}

            {[
              { key: 'brand_name', label: 'Brand / Business Name *', placeholder: 'e.g. Royal Worth Events' },
              { key: 'task_title', label: 'Task Title *', placeholder: 'e.g. Follow Royal Worth on Instagram' },
              { key: 'task_description', label: 'Task Description', placeholder: 'What do you want users to do?' },
              { key: 'target_url', label: 'Link (Instagram, YouTube, etc)', placeholder: 'https://instagram.com/yourbrand' },
              { key: 'contact_email', label: 'Your Email *', placeholder: 'your@email.com', type: 'email' },
              { key: 'contact_phone', label: 'WhatsApp Number', placeholder: '+2348000000000', type: 'tel' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                {f.key === 'task_description' ? (
                  <textarea
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 14, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', resize: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 14, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)' }}
                  />
                )}
              </div>
            ))}

            {/* WhatsApp alternative */}
            <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#25D366', marginBottom: 4 }}>Prefer WhatsApp?</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Chat with us directly to set up your campaign</p>
              <button onClick={() => {
                const msg = encodeURIComponent(`Hello Rewaiq, I want to promote my brand.\n\nPackage: ${pkg.name} (${pkg.display})\nBrand: ${form.brand_name || 'not filled yet'}\n\nPlease help me set up a campaign.`);
                window.open(`https://wa.me/2348168099351?text=${msg}`, '_blank');
              }}
                style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#25D366', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Chat on WhatsApp
              </button>
            </div>

            <button onClick={handlePaystack} disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: loading ? '#8A9BB0' : '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
              {loading ? 'Opening Paystack...' : `Pay ${pkg.display} with Paystack`}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10 }}>
              Secured by Paystack. Your campaign activates within 2 hours of payment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}