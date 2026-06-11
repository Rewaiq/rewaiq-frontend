'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Music2, TrendingUp, Coins } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';
import BottomNav from '@/components/BottomNav';

export default function MyTracksPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    try {
      const res = await API.get('/api/tracks/mine');
      setTracks(res.data.tracks || []);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 80 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>My Tracks</span>
        </div>
        <button onClick={() => router.push('/artist/upload')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4a9eff', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Upload
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {tracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Music2 size={48} color="#8A9BB0" style={{ marginBottom: 16 }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>No tracks yet</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Upload your first track to start getting streams</p>
            <button onClick={() => router.push('/artist/upload')}
              style={{ padding: '13px 28px', borderRadius: 12, background: '#4a9eff', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Upload First Track
            </button>
          </div>
        ) : tracks.map(track => {
          const progress = track.target_streams > 0
            ? Math.min((track.total_streams / track.target_streams) * 100, 100)
            : 0;
          return (
            <div key={track.id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{track.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{track.genre || 'No genre'} · {track.content_type}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: track.is_active ? '#4ADE80' : '#D4A017', background: track.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(212,160,23,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                  {track.is_active ? 'Live' : 'Pending Review'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Campaign progress</span>
                  <span style={{ fontSize: 11, color: '#4a9eff', fontWeight: 600 }}>
                    {track.total_streams || 0} / {track.target_streams || 0} streams
                  </span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? '#4ADE80' : '#4a9eff', borderRadius: 3 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} color="#8A9BB0" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{track.total_streams || 0} streams</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Coins size={14} color="#4a9eff" />
                  <span style={{ fontSize: 12, color: '#4a9eff' }}>{track.campaign_coins} coins/stream</span>
                </div>
              </div>

              {track.is_active && (
                <button onClick={() => router.push('/artist/promote')}
                  style={{ width: '100%', marginTop: 12, padding: '11px', borderRadius: 10, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', color: '#D4A017', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Boost Campaign
                </button>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav active="profile" />
    </div>
  );
}