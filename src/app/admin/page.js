'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckSquare, Wallet, Music2, BarChart3, LogOut, ChevronRight, X, Check, TrendingUp, Coins } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview');
  const [completions, setCompletions] = useState([]);
  const [cashouts, setCashouts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');
    if (!u) { router.push('/login'); return; }
    API.get('/api/profile').then(res => {
      const freshUser = res.data.user;
      localStorage.setItem('rewaiq_user', JSON.stringify(freshUser));
      if (freshUser.role !== 'admin') { router.push('/home'); return; }
      fetchData();
    }).catch(() => router.push('/login'));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c, ca, u, t] = await Promise.all([
        API.get('/api/admin/stats'),
        API.get('/api/admin/completions/pending'),
        API.get('/api/admin/cashouts/pending'),
        API.get('/api/admin/users'),
        API.get('/api/tracks'),
      ]);
      setStats(s.data.stats);
      setCompletions(c.data.completions || []);
      setCashouts(ca.data.cashouts || []);
      setUsers(u.data.users || []);
      setTracks(t.data.tracks || []);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally { setLoading(false); }
  };

  const action = async (fn, id) => {
    setActionLoading(id);
    await fn();
    setActionLoading(null);
    fetchData();
  };

  const approveCompletion = (id) => action(async () => {
    await API.patch(`/api/admin/completions/${id}/approve`);
  }, id);

  const rejectCompletion = (id) => action(async () => {
    await API.patch(`/api/admin/completions/${id}/reject`, { reason: 'Rejected by admin' });
  }, `r${id}`);

  const approveCashout = (id) => action(async () => {
    await API.patch(`/api/admin/cashouts/${id}/approve`);
  }, `c${id}`);

  const approveTrack = (id) => action(async () => {
    await API.patch(`/api/admin/tracks/${id}/approve`);
  }, `t${id}`);

  const pauseTrack = (id) => action(async () => {
  await API.patch(`/api/admin/tracks/${id}/pause`);
}, `pause${id}`);

const resumeTrack = (id) => action(async () => {
  await API.patch(`/api/admin/tracks/${id}/resume`);
}, `resume${id}`);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
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
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>Admin Panel</p>
          <p style={{ fontSize: 11, color: '#8A9BB0', margin: 0 }}>Rewaiq Technologies</p>
        </div>
        <button onClick={() => { localStorage.clear(); router.push('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', color: '#8A9BB0', padding: '7px 12px', borderRadius: 20, fontSize: 12, border: 'none', cursor: 'pointer' }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: active ? '#4a9eff' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#8A9BB0', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
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
                { label: 'Total Streams', value: stats.total_streams, icon: TrendingUp, color: '#4ADE80' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px' }}>
                    <Icon size={18} color={s.color} style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Montserrat, sans-serif', margin: '0 0 4px' }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: '#8A9BB0', margin: 0 }}>{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick actions */}
            {[
              { label: 'Review pending task completions', count: completions.length, tab: 'tasks' },
              { label: 'Process cashout requests', count: cashouts.length, tab: 'cashouts' },
              { label: 'Review uploaded tracks', count: tracks.filter(t => !t.is_active).length, tab: 'tracks' },
            ].map(item => (
              <button key={item.label} onClick={() => setTab(item.tab)}
                style={{ width: '100%', background: '#0D1F3C', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: '#fff' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.count > 0 && <span style={{ background: '#F87171', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{item.count}</span>}
                  <ChevronRight size={16} color="#8A9BB0" />
                </div>
              </button>
            ))}

            {/* Create task button */}
            <button onClick={() => router.push('/admin/create-task')}
              style={{ width: '100%', background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.3)', borderRadius: 12, padding: '14px 16px', color: '#4a9eff', fontSize: 14, fontWeight: 600, marginTop: 8, cursor: 'pointer' }}>
              + Create New Task
            </button>
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
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{c.title}</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4 }}>By: {c.full_name} ({c.email})</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4 }}>Type: {c.task_type} · Reward: {c.reward_coins} coins</p>
              {c.proof_url && (
                <a href={c.proof_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#4a9eff', display: 'block', marginBottom: 12 }}>
                  View proof
                </a>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => rejectCompletion(c.id)}
                  disabled={actionLoading === `r${c.id}`}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={14} /> Reject
                </button>
                <button onClick={() => approveCompletion(c.id)}
                  disabled={actionLoading === c.id}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {actionLoading === c.id ? '...' : <><Check size={14} /> Approve (+{c.reward_coins} coins)</>}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                  N{Math.floor(c.amount / 2).toLocaleString()} NGN
                </p>
                <span style={{ fontSize: 11, background: 'rgba(248,113,113,0.1)', color: '#F87171', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Pending</span>
              </div>
              <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 2 }}>{c.full_name}</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4 }}>{c.email}</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 12 }}>{c.amount} coins · {new Date(c.created_at).toLocaleDateString()}</p>
              <button onClick={() => approveCashout(c.id)}
                disabled={actionLoading === `c${c.id}`}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#4a9eff', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {actionLoading === `c${c.id}` ? 'Processing...' : <><Check size={16} /> Mark as Paid</>}
              </button>
            </div>
          ))
        )}

        {/* TRACKS — with analytics */}
        {tab === 'tracks' && (
          tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <Music2 size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No tracks available</p>
            </div>
          ) : tracks.map(track => {
            const total = track.total_streams || 0;
            const target = track.target_streams || 0;
            const progress = target > 0 ? (total / target) * 100 : 0;
            const hitTarget = progress >= 100;
            const nearTarget = progress >= 75 && progress < 100;

            return (
              <div key={track.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{track.title}</p>
                    <p style={{ fontSize: 12, color: '#8A9BB0' }}>{track.content_type} · {track.genre || 'No genre'}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: track.is_active ? '#4ADE80' : '#D4A017', background: `rgba(${track.is_active ? '74,222,128' : '212,160,23'},0.1)`, padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                    {track.is_active ? 'Live' : 'Pending'}
                  </span>
                </div>

                {/* Campaign progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#8A9BB0' }}>Campaign progress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: hitTarget ? '#4ADE80' : nearTarget ? '#D4A017' : '#4a9eff' }}>
                      {total} / {target || '—'} streams ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: hitTarget ? '#4ADE80' : nearTarget ? '#D4A017' : '#4a9eff', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  {nearTarget && !hitTarget && (
                    <p style={{ fontSize: 11, color: '#D4A017', marginTop: 4 }}>Approaching target — consider pausing or extending</p>
                  )}
                  {hitTarget && (
                    <p style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>Target reached — campaign can be paused</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#4a9eff', margin: 0 }}>{total}</p>
                    <p style={{ fontSize: 10, color: '#8A9BB0', margin: 0 }}>Streams</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#D4A017', margin: 0 }}>{track.campaign_coins || 0}</p>
                    <p style={{ fontSize: 10, color: '#8A9BB0', margin: 0 }}>Coins/stream</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#F87171', margin: 0 }}>
                      N{Math.floor((total * (track.campaign_coins || 0)) / 2).toLocaleString()}
                    </p>
                    <p style={{ fontSize: 10, color: '#8A9BB0', margin: 0 }}>Paid out</p>
                  </div>
                </div>

                <a href={track.original_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#4a9eff', display: 'block', marginBottom: 10 }}>
                  Preview track on {track.content_type}
                </a>

                <div style={{ display: 'flex', gap: 8 }}>
                  {!track.is_active ? (
                    <button onClick={() => approveTrack(track.id)}
                      disabled={actionLoading === `t${track.id}`}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {actionLoading === `t${track.id}` ? '...' : 'Approve Track'}
                    </button>
                  ) : (
                    <button onClick={() => pauseTrack(track.id)}
                      disabled={actionLoading === `pause${track.id}`}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {actionLoading === `pause${track.id}` ? '...' : 'Pause Campaign'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
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
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4a9eff', margin: 0 }}>{u.coin_balance}</p>
                <p style={{ fontSize: 10, color: '#8A9BB0', margin: 0 }}>coins</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}