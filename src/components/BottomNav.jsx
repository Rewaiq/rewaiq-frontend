'use client';
import { useRouter } from 'next/navigation';
import { Home, Music2, Wallet, User } from 'lucide-react';

export default function BottomNav({ active }) {
  const router = useRouter();
  const items = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'stream', icon: Music2, label: 'Stream', path: '/stream' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', path: '/wallet' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, background: '#0A1628',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', padding: '10px 0 16px', zIndex: 50,
    }}>
      {items.map(item => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => router.push(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', padding: '6px 0' }}>
            <Icon size={22} color={isActive ? '#4a9eff' : '#8A9BB0'} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, color: isActive ? '#4a9eff' : '#8A9BB0', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}