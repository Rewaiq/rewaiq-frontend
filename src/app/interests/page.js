'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Monitor, ShoppingBag, Briefcase, Trophy, UtensilsCrossed, BookOpen, Film, Heart, Palette, DollarSign, Gamepad2, ChevronRight } from 'lucide-react';
import API from '@/lib/api';

const INTERESTS = [
  { id: 'music', label: 'Music', Icon: Music2 },
  { id: 'tech', label: 'Technology', Icon: Monitor },
  { id: 'fashion', label: 'Fashion', Icon: ShoppingBag },
  { id: 'business', label: 'Business', Icon: Briefcase },
  { id: 'sports', label: 'Sports', Icon: Trophy },
  { id: 'food', label: 'Food & Life', Icon: UtensilsCrossed },
  { id: 'education', label: 'Education', Icon: BookOpen },
  { id: 'entertainment', label: 'Entertainment', Icon: Film },
  { id: 'health', label: 'Health', Icon: Heart },
  { id: 'art', label: 'Art & Design', Icon: Palette },
  { id: 'finance', label: 'Finance', Icon: DollarSign },
  { id: 'gaming', label: 'Gaming', Icon: Gamepad2 },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleContinue = async () => {
    setLoading(true);
    try { await API.put('/api/profile/interests', { interests: selected }); } catch {}
    router.push('/home');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '40px 24px 20px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
          What's your niche? 🎯
        </h2>
        <p style={{ fontSize: 14, color: '#8A9BB0', lineHeight: 1.6 }}>
          Select your interests to personalize your feed and earning opportunities.
        </p>
      </div>

      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 120 }}>
          {INTERESTS.map(({ id, label, Icon }) => {
            const sel = selected.includes(id);
            return (
              <button key={id} onClick={() => toggle(id)} style={{ padding: '18px 12px', borderRadius: 14, border: `2px solid ${sel ? '#4a9eff' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(74,158,255,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
                <Icon size={26} color={sel ? '#4a9eff' : '#8A9BB0'} strokeWidth={1.8} />
                <span style={{ fontSize: 13, fontWeight: 600, color: sel ? '#4a9eff' : '#fff' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 24px 28px', background: 'linear-gradient(to top, #0A1628 80%, transparent)' }}>
        <button onClick={handleContinue} disabled={selected.length === 0 || loading}
          style={{ width: '100%', padding: '15px', borderRadius: 12, background: selected.length === 0 ? 'rgba(255,255,255,0.08)' : '#4a9eff', color: selected.length === 0 ? '#8A9BB0' : '#fff', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? 'Saving...' : `Continue${selected.length > 0 ? ` (${selected.length} selected)` : ''}`}
          {!loading && selected.length > 0 && <ChevronRight size={18} />}
        </button>
        <p onClick={() => router.push('/home')} style={{ textAlign: 'center', color: '#8A9BB0', fontSize: 13, marginTop: 12, cursor: 'pointer' }}>
          Skip for now
        </p>
      </div>
    </div>
  );
}