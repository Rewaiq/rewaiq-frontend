'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Lock,
  HelpCircle,
  ChevronRight,
  Copy,
  LogOut,
  Coins,
  Users,
  Tag,
  Zap,
  Music2,
  List,
  X,
  CheckCircle2,
  Clock,
  Loader2,
  UserCheck,
} from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';
import InstallPrompt from '@/components/InstallPrompt';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Invited Friends Sheet state
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [referralsList, setReferralsList] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('rewaiq_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const u = localStorage.getItem('rewaiq_user');
      if (!u) {
        router.push('/login');
        return;
      }

      const [profileRes, referralRes] = await Promise.all([
        API.get('/api/users/profile').catch(() => API.get('/api/profile')),
        API.get('/api/users/referrals').catch(() => API.get('/api/referrals')),
      ]);

      const freshUser = profileRes?.data?.user || profileRes?.data;
      if (freshUser) {
        localStorage.setItem('rewaiq_user', JSON.stringify(freshUser));
        setUser(freshUser);
      }

      const totalRefs =
        referralRes?.data?.total_referrals ??
        freshUser?.referral_count ??
        referralRes?.data?.referrals?.length ??
        0;

      setReferrals(totalRefs);
    } catch {
      const u = localStorage.getItem('rewaiq_user');
      if (u) setUser(JSON.parse(u));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReferrals = async () => {
    setShowReferralsModal(true);
    setLoadingReferrals(true);
    try {
      const res = await API.get('/api/users/referrals').catch(() =>
        API.get('/api/referrals')
      );
      const list = res.data?.referrals || [];
      setReferralsList(list);
      if (list.length > 0) {
        setReferrals(list.length);
      }
    } catch (err) {
      console.error('Failed to load invited friends:', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleCopy = () => {
    const code =
      user?.referral_code ||
      JSON.parse(localStorage.getItem('rewaiq_user') || '{}')?.referral_code;
    if (code && code !== 'undefined') {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/welcome');
  };

  if (loading) return <Spinner fullscreen />;

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => router.push('/notifications') },
    { icon: Lock, label: 'Change Password', action: () => router.push('/forgot-password') },
    { icon: Tag, label: 'Promo Code', action: () => router.push('/promo') },
    { icon: Zap, label: 'Promote Your Brand', action: () => router.push('/promote') },
    ...(user?.role === 'artist'
      ? [
          { icon: Music2, label: 'Upload Music', action: () => router.push('/artist/upload') },
          { icon: Zap, label: 'Promote My Music', action: () => router.push('/artist/promote') },
          { icon: List, label: 'My Tracks', action: () => router.push('/artist/tracks') },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [{ icon: HelpCircle, label: 'Admin Panel', action: () => router.push('/admin') }]
      : []),
    { icon: HelpCircle, label: 'Help and Support', action: () => {} },
    { icon: LogOut, label: 'Logout', action: handleLogout, danger: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          Profile
        </span>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            color: '#8A9BB0',
            padding: '7px 14px',
            borderRadius: 20,
            fontSize: 13,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Profile card */}
      <div
        style={{
          margin: '20px 20px 16px',
          background: '#0D1F3C',
          borderRadius: 20,
          padding: '28px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4a9eff, #1a3a8f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: '#fff',
            margin: '0 auto 16px',
            overflow: 'hidden',
          }}
        >
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="profile"
              style={{ width: 80, height: 80, objectFit: 'cover' }}
            />
          ) : (
            user?.full_name?.[0] || 'U'
          )}
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 4,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          {user?.full_name || 'User'}
        </h2>
        <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 10 }}>{user?.email}</p>
        <span
          style={{
            fontSize: 11,
            background: 'rgba(74,158,255,0.15)',
            color: '#4a9eff',
            padding: '4px 12px',
            borderRadius: 20,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {user?.role || 'user'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, padding: '0 20px', marginBottom: 16 }}>
        {/* Coins Stat Card */}
        <div
          onClick={() => router.push('/wallet')}
          style={{
            flex: 1,
            background: '#0D1F3C',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <Coins size={22} color="#4a9eff" style={{ marginBottom: 6 }} />
          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 2,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            {(user?.coin_balance || 0).toLocaleString()}
          </p>
          <p style={{ fontSize: 11, color: '#8A9BB0', margin: 0 }}>Coins</p>
        </div>

        {/* Referrals Stat Card - Tapping opens invited friends */}
        <div
          onClick={handleOpenReferrals}
          style={{
            flex: 1,
            background: '#0D1F3C',
            borderRadius: 14,
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(74,158,255,0.22)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Users size={22} color="#4a9eff" style={{ marginBottom: 6 }} />
          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 2,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            {referrals}
          </p>
          <p
            style={{
              fontSize: 11,
              color: '#7DBBFF',
              margin: 0,
              fontWeight: 600,
            }}
          >
            Referrals ↗
          </p>
        </div>
      </div>

      {/* Referral code */}
      <div
        style={{
          margin: '0 20px 16px',
          background: '#0D1F3C',
          borderRadius: 16,
          padding: '18px 20px',
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: '#8A9BB0',
            marginBottom: 8,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          Your Referral Code
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#4a9eff',
              letterSpacing: 3,
              fontFamily: 'Montserrat, sans-serif',
              margin: 0,
            }}
          >
            {user?.referral_code && user.referral_code !== 'undefined'
              ? user.referral_code
              : 'Loading...'}
          </p>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: copied ? 'rgba(26,122,74,0.15)' : 'rgba(74,158,255,0.12)',
              color: copied ? '#4ADE80' : '#4a9eff',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 12 }}>
          Share your code and earn 100 coins for each friend who joins
        </p>
        <button
          onClick={() => {
            const code = user?.referral_code;
            const msg = encodeURIComponent(
              `Join Rewaiq and start earning money online!\n\nUse my referral code: ${code}\n\nSign up at app.rewaiq.com.ng`
            );
            window.open(`https://wa.me/?text=${msg}`, '_blank');
          }}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 10,
            background: 'rgba(37,211,102,0.08)',
            border: '1px solid rgba(37,211,102,0.2)',
            color: '#25D366',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Share on WhatsApp
        </button>
      </div>

      {/* Menu */}
      <div style={{ padding: '0 20px' }}>
        {menuItems.map(({ icon: Icon, label, action, danger }) => (
          <button
            key={label}
            onClick={action}
            style={{
              width: '100%',
              background: '#0D1F3C',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon size={18} color={danger ? '#F87171' : '#8A9BB0'} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: danger ? '#F87171' : '#fff',
                flex: 1,
                textAlign: 'left',
              }}
            >
              {label}
            </span>
            <ChevronRight size={16} color="#8A9BB0" />
          </button>
        ))}
      </div>

      {/* Invited Friends Bottom Sheet Modal */}
      {showReferralsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 9, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            className="referrals-modal-sheet"
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#0D1F3C',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 20px 32px',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                  Invited Friends
                </h3>
                <p style={{ fontSize: 11, color: '#8A9BB0', margin: '3px 0 0' }}>
                  {referralsList.length} friend{referralsList.length === 1 ? '' : 's'} joined with your code
                </p>
              </div>

              <button
                onClick={() => setShowReferralsModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Referrals List Body */}
            <div
              style={{
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {loadingReferrals ? (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <Loader2 size={24} color="#4a9eff" className="spin" style={{ margin: '0 auto' }} />
                  <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 8 }}>
                    Loading friends list...
                  </p>
                </div>
              ) : referralsList.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    background: '#07111F',
                    borderRadius: 16,
                    color: '#8A9BB0',
                  }}
                >
                  <UserCheck size={32} color="#4a9eff" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                    No friends have registered yet
                  </p>
                  <p style={{ margin: 0, fontSize: 11 }}>
                    Share your code on WhatsApp to start earning 100 coins per friend!
                  </p>
                </div>
              ) : (
                referralsList.map((ref) => {
                  const isVerified =
                    (ref.is_email_verified === true || ref.status === 'completed') &&
                    ref.status !== 'pending';

                  return (
                    <div
                      key={ref.referral_id || ref.id}
                      style={{
                        background: '#07111F',
                        borderRadius: 14,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'rgba(74, 158, 255, 0.15)',
                            color: '#4a9eff',
                            fontWeight: 700,
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {(ref.full_name || 'U')[0].toUpperCase()}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {ref.full_name || 'Friend'}
                          </div>
                          <div style={{ fontSize: 10, color: '#8A9BB0', marginTop: 1 }}>
                            Joined {new Date(ref.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {isVerified ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: 'rgba(74, 222, 128, 0.1)',
                              color: '#4ADE80',
                              padding: '4px 8px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={12} /> +{ref.coins_awarded || 100} coins
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: 'rgba(251, 191, 36, 0.1)',
                              color: '#FBBF24',
                              padding: '4px 8px',
                              borderRadius: 8,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            <Clock size={11} /> Pending OTP
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
      <InstallPrompt />

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .referrals-modal-sheet {
          animation: slideUp 0.25s ease-out;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
