'use client';

import { useRouter } from 'next/navigation';
import {
  Home,
  CheckSquare,
  Music,
  Wallet,
  User
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/home',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    path: '/home?tab=tasks',
  },
  {
    id: 'stream',
    label: 'Stream',
    icon: Music,
    path: '/stream',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    path: '/wallet',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
  },
];

export default function BottomNav({ active }) {
  const router = useRouter();
  const [pressed, setPressed] =
    useState(null);

  const handlePress = (item) => {
    setPressed(item.id);

    setTimeout(() => {
      setPressed(null);
    }, 200);

    router.push(item.path);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background:
          'rgba(10,22,40,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter:
          'blur(20px)',
        borderTop:
          '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          'space-around',
        padding: '8px 0 16px',
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;

        const isActive =
          active === item.id;

        const isPressed =
          pressed === item.id;

        return (
          <button
            key={item.id}
            onClick={() =>
              handlePress(item)
            }
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 16px',
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              background: isActive
                ? 'rgba(74,158,255,0.12)'
                : isPressed
                ? 'rgba(255,255,255,0.08)'
                : 'transparent',
              transform: isPressed
                ? 'scale(0.88)'
                : 'scale(1)',
              transition:
                'all 0.15s ease',
              outline: 'none',
              WebkitTapHighlightColor:
                'transparent',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
              }}
            >
              <Icon
                size={22}
                color={
                  isActive
                    ? '#4a9eff'
                    : '#8A9BB0'
                }
                strokeWidth={
                  isActive ? 2.5 : 1.8
                }
              />

              {isActive && (
                <div
                  style={{
                    position:
                      'absolute',
                    bottom: -6,
                    left: '50%',
                    transform:
                      'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius:
                      '50%',
                    background:
                      '#4a9eff',
                    boxShadow:
                      '0 0 6px rgba(74,158,255,0.8)',
                  }}
                />
              )}
            </div>

            <span
              style={{
                fontSize: 10,
                fontWeight: isActive
                  ? 700
                  : 500,
                color: isActive
                  ? '#4a9eff'
                  : '#8A9BB0',
                fontFamily:
                  'Inter, sans-serif',
                letterSpacing: 0.2,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
