'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Lock, HelpCircle, FileText, ChevronRight, Copy, LogOut, Coins, Users } from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, referralRes] = await Promise.all([
        API.get('/api/profile'),
        API.get('/api/referrals'),
      ]);
      setUser(profileRes.data.user);
      setReferrals(referralRes.data.total_referrals || 0);
    } catch {} finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(user?.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/welcome');
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => router.push('/notifications') },
    { icon: Lock, label: 'Change Password', action: () => router.push('/forgot-password') },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: FileText, label: 'Terms of Service', action: () => {} },
{ icon: Lock, label: 'Upload Music — Artist Portal', action: () => router.push('/artist/upload') },
  ];
if (loading) return <Spinner />;
<Spinner />

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Profile</span>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', color: '#8A9BB0', padding: '7px 14px', borderRadius: 20, fontSize: 13 }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Profile card */}
      <div style={{ margin: '0 20px 20px', background: '#0D1F3C', borderRadius: 20, padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #4a9eff, #1a3a8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 auto 16px', overflow: 'hidden' }}>
          {user?.profile_picture
            ? <img src={user.profile_picture} style={{ width: 80, height: 80, objectFit: 'cover' }} />
            : user?.full_name?.[0] || 'U'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{user?.full_name}</h2>
        <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 8 }}>{user?.email}</p>
        <span style={{ fontSize: 11, background: 'rgba(74,158,255,0.15)', color: '#4a9eff', padding: '4px 12px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' }}>
          {user?.role || 'user'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, padding: '0 20px', marginBottom: 20 }}>
        {[
          { label: 'Coins', value: user?.coin_balance || 0, Icon: Coins, color: '#4a9eff' },
          { label: 'Referrals', value: referrals, Icon: Users, color: '#4a9eff' },
        ].map(s => {
          const Icon = s.Icon;
          return (
            <div key={s.label} style={{ flex: 1, background: '#0D1F3C', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <Icon size={22} color={s.color} style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{s.value.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: '#8A9BB0' }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Referral code */}
      <div style={{ margin: '0 20px 20px', background: '#0D1F3C', borderRadius: 16, padding: '18px 20px' }}>
        <p style={{ fontSize: 11, color: '#8A9BB0', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Your Referral Code</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#4a9eff', letterSpacing: 3 }}>{user?.referral_code || '---'}</p>
          <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,158,255,0.12)', color: copied ? '#1A7A4A' : '#4a9eff', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 8 }}>Earn 100 coins for each friend you refer</p>
      </div>

      {/* Menu */}
      <div style={{ padding: '0 20px' }}>
        {menuItems.map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action}
            style={{ width: '100%', background: '#0D1F3C', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon size={18} color="#8A9BB0" />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fff', flex: 1, textAlign: 'left' }}>{label}</span>
            <ChevronRight size={16} color="#8A9BB0" />
          </button>
        ))}
      </div>

      <BottomNav active="profile" />
    </div>
  );
}