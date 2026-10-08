'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, TrendingUp, Music2, X, ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Spinner from '@/components/Spinner';

const MIN_CASHOUT_COINS = 500;

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
  { name: 'Kuda Bank', code: '090267' },
  { name: 'Carbon', code: '565' },
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
    coins: '500',
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
    } catch {} finally {
      setLoading(false);
    }
  };

  const naira = Math.floor(balance / 2);
  const coinsToNaira = (coins) => Math.floor(parseInt(coins || 0) / 2);

  const enteredCoins = parseInt(cashoutForm.coins || 0);
  const hasEnteredAmount = cashoutForm.coins !== '' && !isNaN(enteredCoins);
  const isBelowMinimum = hasEnteredAmount && enteredCoins < MIN_CASHOUT_COINS;
  const exceedsBalance = hasEnteredAmount && enteredCoins > balance;
  const isValidAmount = hasEnteredAmount && enteredCoins >= MIN_CASHOUT_COINS && enteredCoins <= balance;
  const balanceTooLowToCashout = balance < MIN_CASHOUT_COINS;

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
        setCashoutForm((f) => ({ ...f, account_name: res.data.account_name }));
      } else {
        setVerifiedName('');
      }
    } catch {
      setVerifiedName('');
    } finally {
      setVerifying(false);
    }
  };

  const handleBankSelect = (bank) => {
    setCashoutForm((f) => ({ ...f, bank_name: bank.name, bank_code: bank.code }));
    if (cashoutForm.account_number?.length === 10) {
      verifyAccount(cashoutForm.account_number, bank.code);
    }
  };

  const handleCashoutSubmit = async () => {
    const { coins, bank_name, bank_code, account_number, account_name } = cashoutForm;
    if (!coins || !bank_name || !account_number || !account_name) {
      setCashoutError('Please fill all fields');
      return;
    }
    if (parseInt(coins) < MIN_CASHOUT_COINS) {
      setCashoutError(`Minimum cashout is ${MIN_CASHOUT_COINS} coins`);
      return;
    }
    if (parseInt(coins) > balance) {
      setCashoutError('Insufficient coin balance');
      return;
    }
    if (account_number.length !== 10) {
      setCashoutError('Account number must be 10 digits');
      return;
    }

    setSubmitting(true);
    setCashoutError('');

    try {
      const res = await API.post('/api/coins/cashout', {
        amount: parseInt(coins),
        bank_code,
        bank_name,
        account_number,
        account_name,
      });

      // Optimistic balance update
      const deducted = parseInt(coins);
      setBalance((prev) => Math.max(0, prev - deducted));

      // Prepend pending cashout to local list
      const newTx = {
        id: res.data.transaction_id || Date.now(),
        type: 'cashout',
        amount: deducted,
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          bank_name,
          account_number,
          account_name,
          naira_amount: coinsToNaira(coins),
        },
      };
      setTransactions((prev) => [newTx, ...prev]);

      setCashoutSuccess(true);
      fetchWallet();
    } catch (err) {
      setCashoutError(err.response?.data?.message || 'Cashout request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const txIcon = (type) => {
    if (type === 'stream_earn') return <Music2 size={16} color="#4a9eff" />;
    if (type === 'cashout') return <TrendingUp size={16} color="#F87171" />;
    return <Coins size={16} color="#4a9eff" />;
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 80 }}>
      {/* Top Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', display: 'flex', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>My Wallet</span>
      </div>

      {/* Hero Balance Card */}
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
          ₦{naira.toLocaleString()} NGN
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setShowCashout(true);
              setStep(1);
              setCashoutSuccess(false);
              setCashoutError('');
              setCashoutForm((f) => ({ ...f, coins: '500'
