'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/api/notifications');
      setNotifications(res.data.notifications || []);
    } catch {} finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await API.patch('/api/notifications/read/all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await API.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const typeColor = (type) => {
    const colors = {
      info: '#4a9eff',
      success: '#1A7A4A',
      warning: '#D4A017',
      error: '#F87171'
    };
    return colors[type] || '#4a9eff';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0A1628', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: '#4a9eff', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: '#4a9eff', fontSize: 13, fontWeight: 600 }}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
        <Spinner />
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Bell size={48} color="#8A9BB0" style={{ marginBottom: 16 }} />
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>No notifications yet</p>
            <p style={{ color: '#8A9BB0', fontSize: 13 }}>We'll notify you about earnings, tasks and updates</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                background: n.is_read ? '#0D1F3C' : 'rgba(74,158,255,0.08)',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 10,
                cursor: n.is_read ? 'default' : 'pointer',
                border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.04)' : 'rgba(74,158,255,0.2)'}`,
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              {/* Icon */}
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${typeColor(n.type)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={18} color={typeColor(n.type)} />
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{n.title}</p>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a9eff', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#8A9BB0', margin: '0 0 6px', lineHeight: 1.5 }}>{n.message}</p>
                <p style={{ fontSize: 11, color: 'rgba(138,155,176,0.6)', margin: 0 }}>
                  {new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}