'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, TrendingUp, Music2, X, ChevronDown } from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Moniepoint', code: '50515' },
  { name: 'Opay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [verifiedName, setVerifiedName] = useState('');
const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCashout, setShowCashout] = useState(false);
  const [step, setStep] = useState(1);
  const [cashoutForm, setCashoutForm] = useState({
    coins: '',
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [cashoutError, setCashoutError] = useState('');
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');
    if (u) setUser(JSON.parse(u));
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        API.get('/api/coins/balance'),
        API.get('/api/coins/history'),
      ]);
      setBalance(balRes.data.coin_balance || 0);
      setTransactions(histRes.data.transactions || []);
    } catch {} finally { setLoading(false); }
  };

  const naira = Math.floor(balance / 2);
  const coinsToNaira = (coins) => Math.floor(parseInt(coins || 0) / 2);

const verifyAccount = async (number, bankCode) => {
  if (number.length !== 10 || !bankCode) return;

  setVerifying(true);

  try {
    const res = await API.post('/api/coins/verify-account', {
      account_number: number,
      bank_code: bankCode,
    });

    if (res.data.verified) {
      setVerifiedName(res.data.account_name);
      setCashoutForm((f) => ({
        ...f,
        account_name: res.data.account_name,
      }));
    } else {
      setVerifiedName('');
    }
  } catch (err) {
    setVerifiedName('');
  } finally {
    setVerifying(false);
  }
};

  const handleBankSelect = (bank) => {
  setCashoutForm((f) => ({
    ...f,
    bank_name: bank.name,
    bank_code: bank.code,
  }));

  // re-verify if account already entered
  if (cashoutForm.account_number?.length === 10) {
    verifyAccount(cashoutForm.account_number, bank.code);
  }
};

  const handleCashoutSubmit = async () => {
    const { coins, bank_name, account_number, account_name } = cashoutForm;
    if (!coins || !bank_name || !account_number || !account_name) {
      setCashoutError('Please fill all fields'); return;
    }
    if (parseInt(coins) < 10) {
      setCashoutError('Minimum cashout is 1,000 coins (N500)'); return;
    }
    if (parseInt(coins) > balance) {
      setCashoutError('Insufficient coin balance'); return;
    }
    if (account_number.length !== 10) {
      setCashoutError('Account number must be 10 digits'); return;
    }

    setSubmitting(true); setCashoutError('');
    try {
      await API.post('/api/coins/cashout', {
        amount: parseInt(coins),
        bank_code: cashoutForm.bank_code,
        account_number,
        account_name,
      });
      setCashoutSuccess(true);
      fetchWallet();
    } catch (err) {
      setCashoutError(err.response?.data?.message || 'Cashout request failed');
    } finally { setSubmitting(false); }
  };

  const txIcon = (type) => {
    if (type === 'stream_earn') return <Music2 size={16} color="#4a9eff" />;
    if (type === 'cashout') return <TrendingUp size={16} color="#F87171" />;
    return <Coins size={16} color="#4a9eff" />;
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>My Wallet</span>
      </div>

      {/* Balance card */}
      <div style={{ margin: '20px 20px 16px', background: 'linear-gradient(135deg, #1a3a8f, #4a9eff)', borderRadius: 20, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: 2, textTransform: 'uppercase' }}>Total Balance</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <Coins size={22} color="rgba(255,255,255,0.8)" />
          <p style={{ fontSize: 46, fontWeight: 900, color: '#fff', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
            {balance.toLocaleString()}
          </p>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
          N{naira.toLocaleString()} NGN
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setShowCashout(true); setStep(1); setCashoutSuccess(false); setCashoutError(''); }}
            style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Cashout
          </button>
          <button onClick={() => router.push('/home')}
            style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Earn More
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px', marginBottom: 20 }}>
        {[
          { label: 'Daily Cap', value: '500 coins' },
         { label: 'Min Cashout', value: '200 coins' },
{ label: 'Rate', value: '2 coins = N1' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#0D1F3C', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: '#8A9BB0', margin: '4px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Artist payment */}
      {user?.role === 'artist' && (
        <div style={{ margin: '0 20px 20px', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 16, padding: '18px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#D4A017', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Artist Campaign Payment</p>
          <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 12, lineHeight: 1.6 }}>
            To activate your campaign after approval, complete payment below.
          </p>
          {[
            { name: 'Starter', price: 'N15,000', streams: '500 streams' },
            { name: 'Growth', price: 'N35,000', streams: '1,500 streams' },
            { name: 'Viral', price: 'N80,000', streams: '5,000 streams' },
          ].map(pkg => (
            <div key={pkg.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{pkg.name}</span>
              <span style={{ fontSize: 13, color: '#D4A017', fontWeight: 700 }}>{pkg.price}</span>
              <span style={{ fontSize: 12, color: '#8A9BB0' }}>{pkg.streams}</span>
            </div>
          ))}
          <a href="mailto:info@rewaiq.com.ng?subject=Campaign Payment"
            style={{ display: 'block', marginTop: 14, padding: '12px', borderRadius: 10, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', color: '#D4A017', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
            Contact us to pay — info@rewaiq.com.ng
          </a>
        </div>
      )}

      {/* Transaction history */}
      <div style={{ padding: '0 20px' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Transaction History</p>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8A9BB0' }}>
            <Coins size={36} color="#8A9BB0" style={{ marginBottom: 8 }} />
            <p>No transactions yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Start streaming to earn coins</p>
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
              <p style={{ fontSize: 11, color: '#8A9BB0' }}>
                {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'cashout' ? '#F87171' : '#4a9eff', margin: 0 }}>
              {tx.type === 'cashout' ? '-' : '+'}{tx.amount}
            </p>
          </div>
        ))}
      </div>

      {/* Cashout modal */}
      {showCashout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div style={{ width: '100%', background: '#0D1F3C', borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                {cashoutSuccess ? 'Request Submitted' : step === 1 ? 'Enter Amount' : step === 2 ? 'Bank Details' : 'Confirm'}
              </h3>
              <button onClick={() => setShowCashout(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#8A9BB0" />
              </button>
            </div>

            {cashoutSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Coins size={32} color="#4ADE80" />
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Request Submitted!</p>
                <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 8, lineHeight: 1.6 }}>
                  Your cashout request of N{coinsToNaira(cashoutForm.coins).toLocaleString()} NGN has been submitted.
                </p>
                <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 24 }}>
                  Processing within 24-48 hours. You will be notified once complete.
                </p>
                <button onClick={() => setShowCashout(false)}
                  style={{ padding: '13px 32px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Step 1 — Amount */}
                {step === 1 && (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px', marginBottom: 20, textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 4 }}>Available balance</p>
                      <p style={{ fontSize: 28, fontWeight: 900, color: '#4a9eff', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>{balance.toLocaleString()} coins</p>
                      <p style={{ fontSize: 14, color: '#8A9BB0', marginTop: 4 }}>= N{naira.toLocaleString()} NGN</p>
                    </div>

                    <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 8 }}>
                      Coins to cashout (min 1,000)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={cashoutForm.coins}
                      onChange={e => setCashoutForm(f => ({ ...f, coins: e.target.value }))}
                      style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 18, color: '#fff', background: 'rgba(255,255,255,0.05)', marginBottom: 8, fontWeight: 700, textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}
                    />

                    {cashoutForm.coins && (
                      <p style={{ fontSize: 15, color: '#4a9eff', textAlign: 'center', marginBottom: 16, fontWeight: 700 }}>
                        = N{coinsToNaira(cashoutForm.coins).toLocaleString()} NGN
                      </p>
                    )}

                    {/* Quick amounts */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      {[200, 500, 1000, 2000].map(amt => (
                        <button key={amt} onClick={() => setCashoutForm(f => ({ ...f, coins: amt.toString() }))}
                          style={{ flex: 1, padding: '8px 4px', borderRadius: 8, background: cashoutForm.coins == amt ? '#4a9eff' : 'rgba(255,255,255,0.06)', color: cashoutForm.coins == amt ? '#fff' : '#8A9BB0', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {cashoutError && <p style={{ fontSize: 13, color: '#F87171', marginBottom: 12 }}>{cashoutError}</p>}

                    <button onClick={() => {
                      if (!cashoutForm.coins || parseInt(cashoutForm.coins) < 1000) { setCashoutError('Minimum is 1,000 coins'); return; }
                      if (parseInt(cashoutForm.coins) > balance) { setCashoutError('Insufficient balance'); return; }
                      setCashoutError('');
                      setStep(2);
                    }}
                      style={{ width: '100%', padding: '15px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Next — Enter Bank Details
                    </button>
                  </>
                )}

                {/* Step 2 — Bank Details */}
                {step === 2 && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 8 }}>Select Bank</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={cashoutForm.bank_name}
                          onChange={e => {
                            const bank = NIGERIAN_BANKS.find(b => b.name === e.target.value);
                            if (bank) handleBankSelect(bank);
                          }}
                          style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 15, color: cashoutForm.bank_name ? '#fff' : '#8A9BB0', background: '#0A1628', appearance: 'none', cursor: 'pointer' }}
                        >
                          <option value="">Select your bank</option>
                          {NIGERIAN_BANKS.map(b => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} color="#8A9BB0" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 8 }}>Account Number</label>
                      <input
  type="tel"
  placeholder="10-digit account number"
  maxLength={10}
  value={cashoutForm.account_number}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, '');

    setCashoutForm((f) => ({
      ...f,
      account_number: value,
      account_name: '', // reset until verified
    }));

    if (value.length === 10) {
      verifyAccount(value, cashoutForm.bank_code);
    }
  }}
  style={{
    width: '100%',
    padding: '13px 14px',
    borderRadius: 10,
    border: `1.5px solid ${
      verifiedName ? '#4ADE80' : 'rgba(255,255,255,0.1)'
    }`,
    fontSize: 16,
    color: '#fff',
    background: 'rgba(255,255,255,0.05)',
    letterSpacing: 3,
    fontWeight: 700,
  }}
/>
{verifying && (
  <p style={{ fontSize: 12, color: '#4a9eff', marginTop: 6 }}>
    Verifying account...
  </p>
)}

{verifiedName && (
  <div style={{
    background: 'rgba(74,222,128,0.08)',
    border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    marginTop: 8
  }}>
    <p style={{
      fontSize: 13,
      color: '#4ADE80',
      fontWeight: 600,
      margin: 0
    }}>
      Account verified: {verifiedName}
    </p>
  </div>
)}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 8 }}>Account Name</label>
                      <input
                        type="text"
                        placeholder="As it appears on your bank account"
                        value={cashoutForm.account_name}
                        onChange={e => setCashoutForm(f => ({ ...f, account_name: e.target.value }))}
                        style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', fontSize: 15, color: '#fff', background: 'rgba(255,255,255,0.05)' }}
                      />
                    </div>

                    {cashoutError && <p style={{ fontSize: 13, color: '#F87171', marginBottom: 12 }}>{cashoutError}</p>}

                    <button onClick={() => setStep(3)}
                      style={{ width: '100%', padding: '15px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 10 }}>
                      Next — Review
                    </button>
                    <button onClick={() => setStep(1)}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'none', color: '#8A9BB0', fontSize: 14, border: 'none', cursor: 'pointer' }}>
                      Back
                    </button>
                  </>
                )}

                {/* Step 3 — Confirm */}
                {step === 3 && (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '18px', marginBottom: 20 }}>
                      {[
                        { label: 'Amount', value: `${parseInt(cashoutForm.coins).toLocaleString()} coins` },
                        { label: 'You receive', value: `N${coinsToNaira(cashoutForm.coins).toLocaleString()} NGN` },
                        { label: 'Bank', value: cashoutForm.bank_name },
                        { label: 'Account', value: cashoutForm.account_number },
                        { label: 'Name', value: cashoutForm.account_name },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 13, color: '#8A9BB0' }}>{item.label}</span>
                          <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                      <p style={{ fontSize: 12, color: '#8A9BB0', margin: 0, lineHeight: 1.6 }}>
                        Processing takes 24-48 hours. You will receive a notification once your payment is sent. Make sure your bank details are correct.
                      </p>
                    </div>

                    {cashoutError && <p style={{ fontSize: 13, color: '#F87171', marginBottom: 12 }}>{cashoutError}</p>}

                    <button onClick={handleCashoutSubmit} disabled={submitting}
                      style={{ width: '100%', padding: '15px', borderRadius: 12, background: submitting ? 'rgba(255,255,255,0.08)' : '#4a9eff', color: submitting ? '#8A9BB0' : '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 10 }}>
                      {submitting ? 'Submitting...' : 'Confirm Cashout Request'}
                    </button>
                    <button onClick={() => setStep(2)}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'none', color: '#8A9BB0', fontSize: 14, border: 'none', cursor: 'pointer' }}>
                      Back
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav active="wallet" />
    </div>
  );
}
