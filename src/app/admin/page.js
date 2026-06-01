'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckSquare, Wallet, Music2, BarChart3, LogOut, ChevronRight, X, Check } from 'lucide-react';
import API from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview');
  const [completions, setCompletions] = useState([]);
  const [cashouts, setCashouts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'admin') { router.push('/home'); return; }
    setUser(parsed);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, completionsRes, cashoutsRes, usersRes, tracksRes] = await Promise.all([
        API.get('/api/admin/stats'),
        API.get('/api/admin/completions/pending'),
        API.get('/api/admin/cashouts/pending'),
        API.get('/api/admin/users'),
        API.get('/api/tracks'),
      ]);
      setStats(statsRes.data.stats);
      setCompletions(completionsRes.data.completions || []);
      setCashouts(cashoutsRes.data.cashouts || []);
      setUsers(usersRes.data.users || []);
      setTracks(tracksRes.data.tracks || []);
    } catch {} finally { setLoading(false); }
  };

  const approveCompletion = async (id) => {
    try {
      await API.patch(`/api/admin/completions/${id}/approve`);
      setCompletions(p => p.filter(c => c.id !== id));
      fetchData();
    } catch {}
  };

  const rejectCompletion = async (id) => {
    try {
      await API.patch(`/api/admin/completions/${id}/reject`, { reason: 'Rejected by admin' });
      setCompletions(p => p.filter(c => c.id !== id));
    } catch {}
  };

  const approveCashout = async (id) => {
    try {
      await API.patch(`/api/admin/cashouts/${id}/approve`);
      setCashouts(p => p.filter(c => c.id !== id));
    } catch {}
  };

 
  const approveTrack = async (id) => {
  try {
    await API.patch(`/api/admin/tracks/${id}/approve`);
    fetchData();
  } catch (err) {
    alert('Failed to approve track');
  }
};
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB0' }}>
      Loading admin panel...
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: `Tasks (${completions.length})`, icon: CheckSquare },
    { id: 'cashouts', label: `Cashouts (${cashouts.length})`, icon: Wallet },
    { id: 'tracks', label: 'Tracks', icon: Music2 },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0D1F3C', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>Admin Panel</p>
          <p style={{ fontSize: 12, color: '#8A9BB0' }}>Rewaiq Technologies</p>
        </div>
        <button onClick={() => { localStorage.clear(); router.push('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', color: '#8A9BB0', padding: '7px 12px', borderRadius: 20, fontSize: 12 }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 16px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0D1F3C' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: active ? '#4a9eff' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#8A9BB0', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '20px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Users', value: stats.total_users, icon: Users, color: '#4a9eff' },
                { label: 'Active Tasks', value: stats.active_tasks, icon: CheckSquare, color: '#D4A017' },
                { label: 'Pending Approvals', value: stats.pending_approvals, icon: CheckSquare, color: '#F87171' },
                { label: 'Pending Cashouts', value: stats.pending_cashouts, icon: Wallet, color: '#F87171' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px' }}>
                    <Icon size={20} color={s.color} style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: '#8A9BB0' }}>{s.label}</p>
                  </div>
                );
              })}
            </div>
            {stats.pending_cashout_amount > 0 && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#F87171', fontWeight: 600 }}>
                  ₦{(stats.pending_cashout_amount / 2).toLocaleString()} NGN in pending cashouts
                </p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Review pending tasks', count: completions.length, action: () => setTab('tasks') },
                { label: 'Process cashout requests', count: cashouts.length, action: () => setTab('cashouts') },
                { label: 'Review uploaded tracks', count: tracks.filter(t => !t.is_active).length, action: () => setTab('tracks') },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ background: '#0D1F3C', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 14, color: '#fff' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.count > 0 && <span style={{ background: '#F87171', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{item.count}</span>}
                    <ChevronRight size={16} color="#8A9BB0" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* TASK COMPLETIONS */}
        {tab === 'tasks' && (
          completions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <CheckSquare size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No pending task approvals</p>
            </div>
          ) : completions.map(c => (
            <div key={c.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{c.title}</p>
                <p style={{ fontSize: 12, color: '#8A9BB0' }}>By: {c.full_name} · {c.task_type}</p>
                {c.proof_url && (
                  <p style={{ fontSize: 11, color: '#4a9eff', marginTop: 4 }}>
                    Proof: <a href={c.proof_url} target="_blank" rel="noreferrer" style={{ color: '#4a9eff' }}>View</a>
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => rejectCompletion(c.id)}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={14} /> Reject
                </button>
                <button onClick={() => approveCompletion(c.id)}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(26,122,74,0.15)', border: '1px solid rgba(26,122,74,0.3)', color: '#4ADE80', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={14} /> Approve (+{c.reward_coins} coins)
                </button>
              </div>
            </div>
          ))
        )}

        {/* CASHOUTS */}
        {tab === 'cashouts' && (
          cashouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <Wallet size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No pending cashout requests</p>
            </div>
          ) : cashouts.map(c => (
            <div key={c.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  ₦{(c.amount / 2).toLocaleString()} NGN
                </p>
                <p style={{ fontSize: 12, color: '#8A9BB0' }}>{c.full_name} · {c.email}</p>
                <p style={{ fontSize: 11, color: '#8A9BB0', marginTop: 2 }}>{c.amount} coins · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => approveCashout(c.id)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#4a9eff', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={16} /> Mark as Paid
              </button>
            </div>
          ))
        )}

        {/* TRACKS */}
        {tab === 'tracks' && (
          tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <Music2 size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No tracks uploaded yet</p>
            </div>
          ) : tracks.map(track => (
            <div key={track.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{track.title}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: track.is_active ? '#4ADE80' : '#D4A017', background: `rgba(${track.is_active ? '74,222,128' : '212,160,23'},0.1)`, padding: '3px 8px', borderRadius: 20 }}>
                    {track.is_active ? 'Live' : 'Pending'}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#8A9BB0' }}>{track.content_type} · {track.genre}</p>
                <p style={{ fontSize: 11, color: '#4a9eff', marginTop: 4 }}>
                  <a href={track.original_url} target="_blank" rel="noreferrer" style={{ color: '#4a9eff' }}>
                    Preview track →
                  </a>
                </p>
              </div>
              {!track.is_active && (
                <button onClick={() => approveTrack(track.id)}
                  style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'rgba(74,158,255,0.15)', border: '1px solid rgba(74,158,255,0.3)', color: '#4a9eff', fontSize: 13, fontWeight: 600 }}>
                  Approve Track
                </button>
              )}
            </div>
          ))
        )}

        {/* USERS */}
        {tab === 'users' && (
          users.map(u => (
            <div key={u.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {u.full_name?.[0] || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{u.full_name}</p>
                <p style={{ fontSize: 11, color: '#8A9BB0' }}>{u.email} · {u.role}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4a9eff' }}>{u.coin_balance}</p>
                <p style={{ fontSize: 10, color: '#8A9BB0' }}>coins</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}