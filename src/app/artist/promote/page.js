'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Music2, Coins, TrendingUp, CheckCircle, Play } from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const COIN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 5000,
    price: 15000,
    display: 'N15,000',
    streams: 500,
    coins_per_stream: 10,
    desc: 'Perfect for new artists — 500 guaranteed streams',
    badge: null,
  },
  {
    id: 'growth',
    name: 'Growth',
    coins: 17500,
    price: 35000,
    display: 'N35,000',
    streams: 1500,
    coins_per_stream: 20,
    desc: 'Scale your reach — 1,500 streams with better rewards',
    badge: 'POPULAR',
  },
  {
    id: 'viral',
    name: 'Viral',
    coins: 62500,
    price: 80000,
    display: 'N80,000',
    streams: 5000,
    coins_per_stream: 35,
    desc: 'Maximum exposure — 5,000 streams',
    badge: 'BEST VALUE',
  },
];

export default function ArtistPromotePage() {
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [paystackReady, setPaystackReady] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');
    if (!u) { router.push('/login'); return; }
    setUser(JSON.parse(u));
    fetchTracks();
    loadPaystack();
  }, []);

  const loadPaystack = () => {
    if (window.PaystackPop) {
      setPaystackReady(true);
      return;
    }
    if (document.getElementById('paystack-script')) return;
    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => setPaystackReady(true);
    script.onerror = () => console.error('Paystack failed to load');
    document.head.appendChild(script);
  };

  const fetchTracks = async () => {
    try {
      const res = await API.get('/api/tracks/mine');
      setTracks(res.data.tracks || []);
    } catch {} finally { setTracksLoading(false); }
  };

  const currentPkg = COIN_PACKAGES.find(p => p.id === selectedPackage);

  const handlePaystack = () => {
    setError('');

    if (!user?.email) {
      setError('User email not found. Please log out and log in again.');
      return;
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
    if (!paystackKey || paystackKey === 'undefined' || !paystackKey.startsWith('pk_')) {
      setError('Payment not configured. Use WhatsApp option below.');
      return;
    }

    if (!window.PaystackPop) {
      loadPaystack();
      setError('Payment loading — please try again in 3 seconds.');
      return;
    }

    if (!currentPkg) {
      setError('Package not selected.');
      return;
    }

    setLoading(true);

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user.email,
      amount: currentPkg.price * 100,
      currency: 'NGN',
      ref: 'RWQARTIST_' + Date.now() + '_' + (user.id || '0'),
      metadata: {
        user_id: user.id,
        track_id: selectedTrack ? selectedTrack.id : null,
        track_title: selectedTrack ? selectedTrack.title : '',
        package: currentPkg.name,
        type: 'artist_campaign',
      },
      callback: function(response) {
        setLoading(false);
        API.post('/api/artist/activate-campaign', {
          reference: response.reference,
          track_id: selectedTrack ? selectedTrack.id : null,
          package_id: selectedPackage,
          coins: currentPkg.coins,
          streams: currentPkg.streams,
          coins_per_stream: currentPkg.coins_per_stream,
        }).then(function() {
          setSuccess(true);
        }).catch(function() {
          setSuccess(true);
          var msg = encodeURIComponent(
            'Hello Rewaiq,\n\nI just paid for a campaign.\n\nRef: ' + response.reference +
            '\nTrack: ' + (selectedTrack ? selectedTrack.title : 'N/A') +
            '\nPackage: ' + currentPkg.name +
            '\n\nPlease activate my campaign.'
          );
          setTimeout(function() {
            window.open('https://wa.me/2348168099351?text=' + msg, '_blank');
          }, 1000);
        });
      },
      onClose: function() {
        setLoading(false);
        setError('Payment was closed. Click Pay again when ready.');
      },
    });

    handler.openIframe();
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <CheckCircle size={64} color="#4ADE80" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
          Campaign Activated!
        </h2>
        <p style={{ fontSize: 14, color: '#8A9BB0', textAlign: 'center', marginBottom: 28, lineHeight: 1.7, maxWidth: 300 }}>
          Your track is now being promoted to Rewaiq users. They earn coins by streaming your music.
        </p>
        <button onClick={() => router.push('/artist/tracks')}
          style={{ width: '100%', maxWidth: 320, padding: '15px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          View My Tracks
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#0D1F3C', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, margin: 0 }}>Promote Your Music</p>
          <p style={{ color: '#8A9BB0', fontSize: 11, margin: 0 }}>Step {step} of 3</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: s <= step ? 20 : 8, height: 8, borderRadius: 4, background: s <= step ? '#4a9eff' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* STEP 1 — Select track */}
        {step === 1 && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>
              Select Your Track
            </h3>
            <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 20 }}>Choose which track to promote.</p>

            {tracksLoading ? <Spinner /> : tracks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Music2 size={40} color="#8A9BB0" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>No tracks yet</p>
                <p style={{ color: '#8A9BB0', fontSize: 13, marginBottom: 20 }}>Upload a track first before promoting</p>
                <button onClick={() => router.push('/artist/upload')}
                  style={{ padding: '12px 24px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Upload Track
                </button>
              </div>
            ) : (
              <>
                {tracks.map(track => (
                  <div key={track.id} onClick={() => setSelectedTrack(track)}
                    style={{ background: selectedTrack?.id === track.id ? 'rgba(74,158,255,0.1)' : '#0D1F3C', border: `2px solid ${selectedTrack?.id === track.id ? '#4a9eff' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '16px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(74,158,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Music2 size={20} color="#4a9eff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{track.title}</p>
                        <p style={{ fontSize: 12, color: '#8A9BB0', margin: '2px 0 0' }}>
                          {track.genre || 'No genre'} · {track.total_streams || 0} streams
                        </p>
                      </div>
                      <span style={{ fontSize: 11, color: track.is_active ? '#4ADE80' : '#D4A017', fontWeight: 600 }}>
                        {track.is_active ? 'Live' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {error && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 10 }}>{error}</p>}
                <button
                  onClick={() => {
                    if (!selectedTrack) { setError('Select a track first'); return; }
                    setError('');
                    setStep(2);
                  }}
                  style={{ width: '100%', padding: '16px', borderRadius: 14, background: selectedTrack ? 'linear-gradient(135deg, #4a9eff, #2d6be4)' : 'rgba(255,255,255,0.08)', color: selectedTrack ? '#fff' : '#8A9BB0', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 16, fontFamily: 'Montserrat, sans-serif' }}>
                  {selectedTrack ? `Promote "${selectedTrack.title}"` : 'Select a Track First'}
                </button>
              </>
            )}
          </>
        )}

        {/* STEP 2 — Select package */}
        {step === 2 && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>
              Choose Campaign
            </h3>
            <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 20 }}>
              More coins per stream means more users motivated to listen.
            </p>

            {COIN_PACKAGES.map(pkg => (
              <div key={pkg.id} onClick={() => setSelectedPackage(pkg.id)}
                style={{ background: selectedPackage === pkg.id ? 'rgba(74,158,255,0.1)' : '#0D1F3C', border: `2px solid ${selectedPackage === pkg.id ? '#4a9eff' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '18px', marginBottom: 12, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                {pkg.badge && (
                  <div style={{ position: 'absolute', top: -1, right: 16, background: pkg.badge === 'POPULAR' ? '#4a9eff' : '#D4A017', color: pkg.badge === 'POPULAR' ? '#fff' : '#0A1628', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: 1 }}>
                    {pkg.badge}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{pkg.name}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#4a9eff', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{pkg.display}</p>
                </div>
                <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 12 }}>{pkg.desc}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Play size={12} color="#4ADE80" />
                    <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>{pkg.streams.toLocaleString()} streams</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Coins size={12} color="#D4A017" />
                    <span style={{ fontSize: 12, color: '#D4A017', fontWeight: 600 }}>{pkg.coins_per_stream} coins/stream</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingUp size={12} color="#4a9eff" />
                    <span style={{ fontSize: 12, color: '#4a9eff', fontWeight: 600 }}>{pkg.coins.toLocaleString()} total coins</span>
                  </div>
                </div>
              </div>
            ))}

            {error && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <button
              onClick={() => {
                if (!selectedPackage) { setError('Select a package first'); return; }
                setError('');
                setStep(3);
              }}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: selectedPackage ? 'linear-gradient(135deg, #4a9eff, #2d6be4)' : 'rgba(255,255,255,0.08)', color: selectedPackage ? '#fff' : '#8A9BB0', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
              Next — Review and Pay
            </button>
          </>
        )}

        {/* STEP 3 — Review and pay */}
        {step === 3 && currentPkg && selectedTrack && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16, fontFamily: 'Montserrat, sans-serif' }}>
              Review and Pay
            </h3>

            <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
              {[
                { label: 'Track', value: selectedTrack.title },
                { label: 'Package', value: currentPkg.name },
                { label: 'Target Streams', value: currentPkg.streams.toLocaleString() },
                { label: 'Coins per Stream', value: currentPkg.coins_per_stream + ' coins' },
                { label: 'Total Coins', value: currentPkg.coins.toLocaleString() },
                { label: 'Amount to Pay', value: currentPkg.display },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13, color: '#8A9BB0' }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {!paystackReady && (
              <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#D4A017', margin: 0 }}>Loading payment system...</p>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#F87171', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={handlePaystack}
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: loading ? '#8A9BB0' : '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
              {loading ? 'Opening Paystack...' : 'Pay ' + currentPkg.display}
            </button>

            <p style={{ fontSize: 11, color: '#8A9BB0', textAlign: 'center', marginBottom: 16 }}>
              Secured by Paystack. Campaign activates within 2 hours of payment.
            </p>

            <button
              onClick={() => {
                var msg = encodeURIComponent(
                  'Hello Rewaiq,\n\nI want to pay for an artist campaign.\n\nTrack: ' + selectedTrack.title +
                  '\nPackage: ' + currentPkg.name + ' (' + currentPkg.display + ')' +
                  '\nEmail: ' + (user ? user.email : '') +
                  '\n\nPlease send payment details.'
                );
                window.open('https://wa.me/2348168099351?text=' + msg, '_blank');
              }}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Pay via WhatsApp Instead
            </button>
          </>
        )}
      </div>
    </div>
  );
}