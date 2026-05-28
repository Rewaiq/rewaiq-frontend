'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, TrendingUp, Music2, X } from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCashout, setShowCashout] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        API.get('/api/coins/balance'),
        API.get('/api/coins/history'),
      ]);
      setBalance(balRes.data.coin_balance);
      setTransactions(histRes.data.transactions || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCashout = async () => {
    try {
      await API.post('/api/coins/cashout', { amount: parseInt(cashoutAmount) });
      setShowCashout(false);
      setCashoutAmount('');
      fetchWallet();
      alert('Cashout request submitted! Processing within 24 hours.');
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const naira = Math.floor(balance / 2);

  const txIcon = (type) => {
    if (type === 'stream_earn') return <Music2 size={18} color="#4a9eff" />;
    if (type === 'cashout') return <TrendingUp size={18} color="#F87171" />;
    return <Coins size={18} color="#4a9eff" />;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 80 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>My Wallet</span>
      </div>

      {/* Balance card */}
      <div style={{ margin: '0 20px 24px', background: 'linear-gradient(135deg, #1a3a8f, #4a9eff)', borderRadius: 20, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: 2, textTransform: 'uppercase' }}>Total Balance</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <Coins size={24} color="rgba(255,255,255,0.8)" />
          <p style={{ fontSize: 44, fontWeight: 900, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>
            {loading ? '...' : balance.toLocaleString()}
          </p>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>≈ ₦{naira.toLocaleString()} NGN</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCashout(true)}
            style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
            Cashout
          </button>
          <button onClick={() => router.push('/home')}
            style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
            Earn More
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px', marginBottom: 24 }}>
        {[
          { label: 'Daily Cap', value: '500 coins' },
          { label: 'Min Cashout', value: '1,000 coins' },
          { label: 'Rate', value: '2 = ₦1' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#0D1F3C', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: '#8A9BB0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div style={{ padding: '0 20px' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Transaction History</p>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8A9BB0' }}>
            <Coins size={36} color="#8A9BB0" style={{ marginBottom: 8 }} />
            <p>No transactions yet</p>
          </div>
        ) : transactions.map(tx => (
          <div key={tx.id} style={{ background: '#0D1F3C', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(74,158,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {txIcon(tx.type)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'capitalize', marginBottom: 2 }}>
                {tx.type.replace(/_/g, ' ')}
              </p>
              <p style={{ fontSize: 11, color: '#8A9BB0' }}>{new Date(tx.created_at).toLocaleDateString()}</p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'cashout' ? '#F87171' : '#4a9eff' }}>
              {tx.type === 'cashout' ? '-' : '+'}{tx.amount}
            </p>
          </div>
        ))}
      </div>

{/* Weekly earnings mini chart */}
<div style={{ margin: '0 20px 24px', background: '#0D1F3C', borderRadius: 16, padding: '16px 20px' }}>
  <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
    This Week
  </p>
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 60 }}>
    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
      const heights = [30, 45, 20, 60, 40, 55, 35];
      const isToday = new Date().getDay() === (i + 1) % 7;
      return (
        <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: '100%', height: heights[i], background: isToday ? '#4a9eff' : 'rgba(74,158,255,0.2)', borderRadius: '4px 4px 0 0', transition: 'all 0.3s' }} />
          <span style={{ fontSize: 9, color: isToday ? '#4a9eff' : '#8A9BB0', fontWeight: isToday ? 700 : 400 }}>{day}</span>
        </div>
      );
    })}
  </div>
</div>

      {/* Cashout modal */}
      {showCashout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div style={{ width: '100%', background: '#0D1F3C', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Request Cashout</h3>
              <button onClick={() => setShowCashout(false)} style={{ background: 'none' }}>
                <X size={22} color="#8A9BB0" />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 16 }}>Balance: {balance} coins · Min: 1,000 coins</p>
            <input type="number" placeholder="Enter coins to cashout" value={cashoutAmount}
              onChange={e => setCashoutAmount(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 16, color: '#fff', background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}
            />
            <p style={{ fontSize: 14, color: '#4a9eff', marginBottom: 20 }}>
              = ₦{Math.floor((parseInt(cashoutAmount) || 0) / 2).toLocaleString()} NGN
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCashout(false)} style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#8A9BB0', fontSize: 15, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleCashout} style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 15, fontWeight: 700 }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="wallet" />
    </div>
  );
}