'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Monitor, ShoppingBag, Briefcase, Trophy, UtensilsCrossed, BookOpen, Film, Heart, Palette, DollarSign, Gamepad2, ChevronRight, Sparkles } from 'lucide-react';
import API from '@/lib/api';

const INTERESTS = [
  { id: 'music', label: 'Music', Icon: Music2, desc: 'Stream songs & earn' },
  { id: 'tech', label: 'Technology', Icon: Monitor, desc: 'Tech content & tasks' },
  { id: 'fashion', label: 'Fashion', Icon: ShoppingBag, desc: 'Style campaigns' },
  { id: 'business', label: 'Business', Icon: Briefcase, desc: 'Brand tasks' },
  { id: 'sports', label: 'Sports', Icon: Trophy, desc: 'Sports content' },
  { id: 'food', label: 'Food & Life', Icon: UtensilsCrossed, desc: 'Lifestyle tasks' },
  { id: 'education', label: 'Education', Icon: BookOpen, desc: 'Learn & earn' },
  { id: 'entertainment', label: 'Entertainment', Icon: Film, desc: 'Watch & earn' },
  { id: 'health', label: 'Health', Icon: Heart, desc: 'Wellness content' },
  { id: 'art', label: 'Art & Design', Icon: Palette, desc: 'Creative tasks' },
  { id: 'finance', label: 'Finance', Icon: DollarSign, desc: 'Money content' },
  { id: 'gaming', label: 'Gaming', Icon: Gamepad2, desc: 'Gaming tasks' },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id) => setSelected(p =>
    p.includes(id) ? p.filter(i => i !== id) : [...p, id]
  );

  const handleContinue = async () => {
    setLoading(true);
    try { await API.put('/api/profile/interests', { interests: selected }); } catch {}
    router.push('/home');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 24px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: s <= 3 ? '#4a9eff' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#4a9eff', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          Final Step
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.2 }}>
          What are you into? 🎯
        </h2>
        <p style={{ fontSize: 14, color: '#8A9BB0', lineHeight: 1.6 }}>
          Choose your interests so we show you the best earning opportunities. The more you pick the better your feed.
        </p>
      </div>

      {/* How it helps */}
      <div style={{ margin: '0 24px 20px', background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.15)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Sparkles size={18} color="#4a9eff" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Personalised for you</p>
          <p style={{ fontSize: 12, color: '#8A9BB0', lineHeight: 1.5 }}>We'll show you music, tasks and opportunities matching what you love — so every minute on Rewaiq is worth more.</p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 140 }}>
          {INTERESTS.map(({ id, label, Icon, desc }) => {
            const sel = selected.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  border: `2px solid ${sel ? '#4a9eff' : 'rgba(255,255,255,0.08)'}`,
                  background: sel ? 'rgba(74,158,255,0.12)' : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 8,
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                {sel && (
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
                  </div>
                )}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: sel ? 'rgba(74,158,255,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={sel ? '#4a9eff' : '#8A9BB0'} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: sel ? '#fff' : '#fff', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11, color: sel ? '#4a9eff' : '#8A9BB0', margin: '2px 0 0' }}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 24px 36px', background: 'linear-gradient(to top, #0A1628 70%, transparent)' }}>
        {selected.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#4a9eff', marginBottom: 10, fontWeight: 600 }}>
            {selected.length} selected — great choice! 🎯
          </p>
        )}
        <button
          onClick={handleContinue}
          disabled={selected.length === 0 || loading}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: selected.length === 0 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
            color: selected.length === 0 ? '#8A9BB0' : '#fff',
            fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          {loading ? (
            <>
              <RewaiqMini /> Setting up your feed...
            </>
          ) : (
            <>
              {selected.length === 0 ? 'Select at least one' : `Start Earning →`}
              {selected.length > 0 && <ChevronRight size={18} />}
            </>
          )}
        </button>
        <p
          onClick={() => router.push('/home')}
          style={{ textAlign: 'center', color: '#8A9BB0', fontSize: 13, marginTop: 12, cursor: 'pointer' }}
        >
          Skip — I'll set this up later
        </p>
      </div>
    </div>
  );
}

function RewaiqMini() {
  return (
    <svg width="20" height="16" viewBox="0 0 100 80" style={{ animation: 'rwSpin 1s ease-in-out infinite' }}>
      <path d="M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z" fill="#1a3a8f"/>
      <path d="M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z" fill="#4a9eff"/>
      <path d="M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.0237 71.6257 72.4608 71.6478Z" fill="#2d6be4"/>
      <style>{`@keyframes rwSpin { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }`}</style>
    </svg>
  );
}