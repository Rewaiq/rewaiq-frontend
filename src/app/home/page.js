'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, SlidersHorizontal, Play, CheckCircle, Circle } from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import RewaiqLogo from '@/components/RewaiqLogo';

export default function HomePage() {
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('for-you');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');
    if (!u) { router.push('/welcome'); return; }
    setUser(JSON.parse(u));
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const [tracksRes, tasksRes] = await Promise.all([
        API.get('/api/tracks'),
        API.get('/api/feed/tasks'),
      ]);
      setTracks(tracksRes.data.tracks || []);
      setTasks(tasksRes.data.tasks || []);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0A1628', position: 'sticky', top: 0, zIndex: 10 }}>
        <RewaiqLogo size={24} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,158,255,0.12)', padding: '7px 14px', borderRadius: 20, border: '1px solid rgba(74,158,255,0.2)' }}>
            <Coins size={15} color="#4a9eff" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4a9eff' }}>{user?.coin_balance || 0}</span>
          </div>
          <div onClick={() => router.push('/profile')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {user?.full_name?.[0] || 'U'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', marginBottom: 20, gap: 8 }}>
        {['for-you', 'tasks', 'trending'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 20, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0A1628' : '#8A9BB0', fontSize: 13, fontWeight: 600 }}>
            {t === 'for-you' ? 'For You' : t === 'tasks' ? 'Tasks' : 'Trending'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <SlidersHorizontal size={18} color="#8A9BB0" />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>Loading feed...</div>
        ) : tab === 'tasks' ? (
          tasks.length === 0 ? (
            <Empty icon="📋" title="No tasks yet" sub="Tasks will appear here" />
          ) : tasks.map(task => <TaskCard key={task.id} task={task} router={router} />)
        ) : (
          tracks.length === 0 ? (
            <Empty icon="🎵" title="No tracks yet" sub="Artists will upload music soon" />
          ) : tracks.map(track => <TrackCard key={track.id} track={track} router={router} />)
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 13 }}>{sub}</p>
    </div>
  );
}

function TrackCard({ track, router }) {
  return (
    <div onClick={() => router.push(`/stream?id=${track.id}`)} style={{ background: '#0D1F3C', borderRadius: 16, marginBottom: 16, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ height: 180, background: 'linear-gradient(135deg, #0D1F3C, #1a3a8f, #0D1F3C)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={24} color="#fff" fill="#fff" />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: '#4a9eff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Coins size={12} /> +{track.campaign_coins}
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {track.artist_name?.[0] || 'A'}
          </div>
          <span style={{ fontSize: 13, color: '#8A9BB0' }}>{track.artist_name || 'Artist'}</span>
          <span style={{ fontSize: 11, color: '#8A9BB0', marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>{track.content_type}</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{track.title}</p>
        {track.description && <p style={{ fontSize: 12, color: '#8A9BB0', lineHeight: 1.5 }}>{track.description?.slice(0, 80)}...</p>}
      </div>
    </div>
  );
}

function TaskCard({ task, router }) {
  return (
    <div onClick={() => !task.completed && router.push(`/task?id=${task.id}`)}
      style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, cursor: task.completed ? 'default' : 'pointer', opacity: task.completed ? 0.6 : 1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,158,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {task.completed ? <CheckCircle size={24} color="#1A7A4A" /> : <Circle size={24} color="#4a9eff" />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{task.title}</p>
        <p style={{ fontSize: 12, color: '#8A9BB0' }}>{task.task_type} · {task.reward_coins} coins</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Coins size={14} color="#4a9eff" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#4a9eff' }}>+{task.reward_coins}</span>
      </div>
    </div>
  );
}