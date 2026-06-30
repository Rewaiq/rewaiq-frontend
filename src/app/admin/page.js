'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckSquare, Wallet, Music2, BarChart3, LogOut, ChevronRight, X, Check, TrendingUp, Coins, Settings, Zap } from 'lucide-react';
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
  const [campaigns, setCampaigns] = useState([]);
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
      const [s, c, ca, u, t, camp] = await Promise.all([
        API.get('/api/admin/stats'),
        API.get('/api/admin/completions/pending'),
        API.get('/api/admin/cashouts/pending'),
        API.get('/api/admin/users'),
        API.get('/api/tracks?admin=true'),
        API.get('/api/campaigns/all'),
      ]);
      setStats(s.data.stats);
      setCompletions(c.data.completions || []);
      setCashouts(ca.data.cashouts || []);
      setUsers(u.data.users || []);
      setTracks(t.data.tracks || []);
      setCampaigns(camp.data.campaigns || []);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally { setLoading(false); }
  };

  const action = async (fn, id) => {
    setActionLoading(id);
    try { await fn(); } catch (err) { console.error(err); }
    setActionLoading(null);
    fetchData();
  };

  const approveCompletion = (id) => action(() => API.patch(`/api/admin/completions/${id}/approve`), id);
  const rejectCompletion = (id) => action(() => API.patch(`/api/admin/completions/${id}/reject`, { reason: 'Rejected by admin' }), `r${id}`);
  const approveCashout = (id) => action(() => API.patch(`/api/admin/cashouts/${id}/approve`), `c${id}`);
  const approveTrack = (id) => action(() => API.patch(`/api/admin/tracks/${id}/approve`), `t${id}`);
  const pauseTrack = (id) => action(() => API.patch(`/api/admin/tracks/${id}/pause`), `pause${id}`);
  const resumeTrack = (id) => action(() => API.patch(`/api/admin/tracks/${id}/resume`), `resume${id}`);
  const approveCampaign = (id) => action(() => API.post(`/api/campaigns/approve/${id}`), `camp${id}`);
  const rejectCampaign = (id, reason) => action(() => API.post(`/api/campaigns/reject/${id}`, { reason }), `rcamp${id}`);

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
    { id: 'campaigns', label: `Campaigns (${campaigns.filter(c => c.status === 'pending').length})`, icon: Zap },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
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
                { label: 'Total Users', value: stats.total_users || 0, icon: Users, color: '#4a9eff' },
                { label: 'Active Tasks', value: stats.active_tasks || 0, icon: CheckSquare, color: '#D4A017' },
                { label: 'Pending Approvals', value: stats.pending_approvals || 0, icon: CheckSquare, color: '#F87171' },
                { label: 'Pending Cashouts', value: stats.pending_cashouts || 0, icon: Wallet, color: '#F87171' },
                { label: 'Total Streams', value: stats.total_streams || 0, icon: TrendingUp, color: '#4ADE80' },
                { label: 'Total Campaigns', value: campaigns.length, icon: Zap, color: '#D4A017' },
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
              { label: 'Review campaign requests', count: campaigns.filter(c => c.status === 'pending').length, tab: 'campaigns' },
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
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2 }}>By: {c.full_name} ({c.email})</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 8 }}>Type: {c.task_type} · Reward: {c.reward_coins} coins</p>
              {c.proof_url && (
                <a href={c.proof_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#4a9eff', display: 'block', marginBottom: 12 }}>
                  View Proof Screenshot
                </a>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => rejectCompletion(c.id)}
                  disabled={actionLoading === `r${c.id}`}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={14} /> {actionLoading === `r${c.id}` ? '...' : 'Reject'}
                </button>
                <button onClick={() => approveCompletion(c.id)}
                  disabled={actionLoading === c.id}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(74,222,128,0.12)', color: '#4ADE80', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={14} /> {actionLoading === c.id ? '...' : `Approve (+${c.reward_coins} coins)`}
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
          ) : cashouts.map(c => {
            const meta = c.metadata ? (typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata) : {};
            return (
              <div key={c.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                    N{Math.floor(c.amount / 2).toLocaleString()} NGN
                  </p>
                  <span style={{ fontSize: 11, background: 'rgba(248,113,113,0.1)', color: '#F87171', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Pending</span>
                </div>
                <p style={{ fontSize: 13, color: '#fff', marginBottom: 2, fontWeight: 600 }}>{c.full_name}</p>
                <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2 }}>{c.email}</p>
                <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 12 }}>{c.amount} coins · {new Date(c.created_at).toLocaleDateString()}</p>

                {meta.account_number && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: '#8A9BB0', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Bank Details</p>
                    <p style={{ fontSize: 13, color: '#fff', margin: '0 0 2px', fontWeight: 600 }}>{meta.bank_name}</p>
                    <p style={{ fontSize: 16, color: '#4a9eff', margin: '0 0 2px', letterSpacing: 3, fontWeight: 700 }}>{meta.account_number}</p>
                    <p style={{ fontSize: 13, color: '#fff', margin: 0 }}>{meta.account_name}</p>
                  </div>
                )}

                <button onClick={() => approveCashout(c.id)}
                  disabled={actionLoading === `c${c.id}`}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#4a9eff', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {actionLoading === `c${c.id}` ? 'Processing...' : <><Check size={16} /> Mark as Paid</>}
                </button>
              </div>
            );
          })
        )}

        {/* TRACKS */}
        {tab === 'tracks' && (
          tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <Music2 size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No tracks yet</p>
            </div>
          ) : tracks.map(track => {
            const total = track.total_streams || 0;
            const target = track.target_streams || 0;
            const progress = target > 0 ? Math.min((total / target) * 100, 100) : 0;
            const hitTarget = progress >= 100;
            const nearTarget = progress >= 75 && !hitTarget;

            return (
              <div key={track.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{track.title}</p>
                    <p style={{ fontSize: 12, color: '#8A9BB0' }}>{track.content_type} · {track.genre || 'No genre'}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: track.is_active ? '#4ADE80' : '#D4A017', background: track.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(212,160,23,0.1)', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                    {track.is_active ? 'Live' : 'Pending'}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#8A9BB0' }}>Campaign progress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: hitTarget ? '#4ADE80' : nearTarget ? '#D4A017' : '#4a9eff' }}>
                      {total} / {target || '—'} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: hitTarget ? '#4ADE80' : nearTarget ? '#D4A017' : '#4a9eff', borderRadius: 3 }} />
                  </div>
                  {nearTarget && <p style={{ fontSize: 11, color: '#D4A017', marginTop: 4 }}>Approaching target</p>}
                  {hitTarget && <p style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>Target reached</p>}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'Streams', value: total, color: '#4a9eff' },
                    { label: 'Coins/stream', value: track.campaign_coins || 0, color: '#D4A017' },
                    { label: 'Paid out (N)', value: Math.floor((total * (track.campaign_coins || 0)) / 2).toLocaleString(), color: '#F87171' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: '#8A9BB0', margin: 0 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {track.original_url && (
                  <a href={track.original_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: '#4a9eff', display: 'block', marginBottom: 10 }}>
                    Preview on {track.content_type}
                  </a>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {!track.is_active ? (
                    <button onClick={() => approveTrack(track.id)}
                      disabled={actionLoading === `t${track.id}`}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(74,222,128,0.12)', color: '#4ADE80', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                      {actionLoading === `t${track.id}` ? '...' : 'Approve and Go Live'}
                    </button>
                  ) : (
                    <button onClick={() => pauseTrack(track.id)}
                      disabled={actionLoading === `pause${track.id}`}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                      {actionLoading === `pause${track.id}` ? '...' : 'Pause Campaign'}
                    </button>
                  )}
                  {track.is_active === false && track.total_streams > 0 && (
                    <button onClick={() => resumeTrack(track.id)}
                      disabled={actionLoading === `resume${track.id}`}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(74,158,255,0.1)', color: '#4a9eff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                      {actionLoading === `resume${track.id}` ? '...' : 'Resume'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* CAMPAIGNS */}
        {tab === 'campaigns' && (
          campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <Zap size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No campaign requests yet</p>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{c.brand_name}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'approved' ? '#4ADE80' : c.status === 'rejected' ? '#F87171' : '#D4A017', background: c.status === 'approved' ? 'rgba(74,222,128,0.1)' : c.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'rgba(212,160,23,0.1)', padding: '3px 10px', borderRadius: 20 }}>
                  {c.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#4a9eff', marginBottom: 4 }}>{c.task_title}</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2 }}>Package: {c.package_name} · N{c.price?.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4 }}>Contact: {c.contact_email}</p>
              {c.paystack_reference && (
                <p style={{ fontSize: 11, color: '#4ADE80', marginBottom: 8 }}>✅ Paid — Ref: {c.paystack_reference}</p>
              )}
              {c.target_url && (
                <a href={c.target_url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#4a9eff', display: 'block', marginBottom: 8 }}>
                  {c.target_url}
                </a>
              )}
              {c.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => approveCampaign(c.id)}
                    disabled={actionLoading === `camp${c.id}`}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: '#4ADE80', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {actionLoading === `camp${c.id}` ? '...' : 'Approve + Create Task'}
                  </button>
                  <button onClick={() => {
                    const reason = prompt('Rejection reason:');
                    if (reason) rejectCampaign(c.id, reason);
                  }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', color: '#F87171', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              )}
              {c.rejection_reason && (
                <p style={{ fontSize: 12, color: '#F87171', marginTop: 8 }}>Reason: {c.rejection_reason}</p>
              )}
            </div>
          ))
        )}

        {/* USERS */}
        {tab === 'users' && (
          users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A9BB0' }}>
              <Users size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
              <p>No users yet</p>
            </div>
          ) : users.map(u => (
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

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20, fontFamily: 'Montserrat, sans-serif' }}>Campaign Pricing</h3>
            {[
              { name: 'Starter', price: 'N15,000', streams: '500 streams', coins: '10 coins/stream' },
              { name: 'Growth', price: 'N35,000', streams: '1,500 streams', coins: '20 coins/stream' },
              { name: 'Viral', price: 'N80,000', streams: '5,000 streams', coins: '35 coins/stream' },
            ].map(pkg => (
              <div key={pkg.name} style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <p style={{ color: '#fff', fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{pkg.name} Package</p>
                <p style={{ color: '#4a9eff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{pkg.price}</p>
                <p style={{ color: '#8A9BB0', fontSize: 12, margin: 0 }}>{pkg.streams} · {pkg.coins}</p>
              </div>
            ))}

            <div style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)', borderRadius: 12, padding: '14px', marginTop: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#4a9eff', margin: 0 }}>To update pricing edit COIN_PACKAGES in src/app/artist/promote/page.js</p>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16, fontFamily: 'Montserrat, sans-serif' }}>Platform Stats</h3>
            <div style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: '#8A9BB0' }}>Total Users</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{stats?.total_users || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: '#8A9BB0' }}>Total Streams</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{stats?.total_streams || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: '#8A9BB0' }}>Active Tasks</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{stats?.active_tasks || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 13, color: '#8A9BB0' }}>Total Campaigns</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{campaigns.length}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}