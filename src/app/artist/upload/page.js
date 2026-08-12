'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  Info,
  TrendingUp,
  Coins,
  Search,
  Gift
} from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const ARTIST_BETA_CODE = 'ARTIST2026';

const parseAudiomackUrl = (url) => {
  try {
    const u = new URL(url);

    if (!u.hostname.includes('audiomack.com')) {
      return {
        valid: false,
        error: 'Please use an Audiomack link'
      };
    }

    const parts = u.pathname.split('/').filter(Boolean);

    if (parts.length < 2) {
      return {
        valid: false,
        error: 'Invalid Audiomack link. Copy the full URL from the song page.'
      };
    }

    const title = parts[2]
      ? parts[2]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
      : '';

    const artist = parts[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    return {
      valid: true,
      artist,
      title,
      type: parts[1],
      embed: `https://audiomack.com/embed/${parts.join('/')}`,
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL. Please paste a valid Audiomack link.'
    };
  }
};

const CAMPAIGN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 10,
    streams: 500,
    price: '₦15,000',
    desc: 'Perfect for new artists'
  },
  {
    id: 'growth',
    name: 'Growth',
    coins: 20,
    streams: 1500,
    price: '₦35,000',
    desc: 'Boost your reach',
    badge: 'POPULAR'
  },
  {
    id: 'viral',
    name: 'Viral',
    coins: 35,
    streams: 5000,
    price: '₦80,000',
    desc: 'Maximum exposure',
    badge: 'BEST VALUE'
  },
];

export default function ArtistUploadPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [urlInfo, setUrlInfo] = useState(null);
  const [urlError, setUrlError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    content_type: 'audiomack',
    original_url: '',
    embed_url: '',
    campaign_coins: 10,
    target_streams: 500,
    beta_code: '',
  });

  const [selectedPackage, setSelectedPackage] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [betaSuccess, setBetaSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const isArtistBeta =
    form.beta_code.trim().toUpperCase() === ARTIST_BETA_CODE;

  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');

    if (!u) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(u));
    } catch {
      localStorage.removeItem('rewaiq_user');
      router.push('/login');
    }
  }, [router]);

  const handleUrlChange = (val) => {
    setUrl(val);
    setUrlError('');
    setUrlInfo(null);

    if (val.includes('audiomack.com')) {
      const info = parseAudiomackUrl(val);

      if (info.valid) {
        setUrlInfo(info);

        setForm(f => ({
          ...f,
          original_url: val,
          embed_url: info.embed,
          title: info.title || f.title,
        }));
      } else {
        setUrlError(info.error);
      }
    }
  };

  const handlePackageSelect = (pkg) => {
    if (isArtistBeta) return;

    setSelectedPackage(pkg.id);

    setForm(f => ({
      ...f,
      campaign_coins: pkg.coins,
      target_streams: pkg.streams
    }));
  };

  const handleBetaCodeChange = (value) => {
    const code = value.trim().toUpperCase();

    setForm(f => ({
      ...f,
      beta_code: code,
      ...(code === ARTIST_BETA_CODE
        ? {
            campaign_coins: 20,
            target_streams: 200
          }
        : {})
    }));

    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setBetaSuccess(false);

    try {
      /*
       * IMPORTANT:
       * beta_code is sent to the backend.
       *
       * The backend MUST verify:
       * req.user.role === 'artist'
       * AND beta_code === 'ARTIST2026'
       *
       * before bypassing payment.
       */
      const response = await API.post('/api/tracks/upload', {
        ...form,
        beta_code: form.beta_code.trim().toUpperCase(),

        // These are sent for convenience,
        // but the backend must determine the final values.
        ...(isArtistBeta
          ? {
              campaign_coins: 20,
              target_streams: 200
            }
          : {})
      });

      const responseData = response?.data || {};

      if (
        isArtistBeta ||
        responseData.beta_access === true ||
        responseData.is_active === true
      ) {
        setBetaSuccess(true);
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Upload failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setBetaSuccess(false);
    setStep(1);
    setUrl('');
    setUrlInfo(null);
    setUrlError('');

    setForm({
      title: '',
      description: '',
      genre: '',
      content_type: 'audiomack',
      original_url: '',
      embed_url: '',
      campaign_coins: 10,
      target_streams: 500,
      beta_code: '',
    });

    setSelectedPackage('starter');
    setError('');
  };

  /*
   * SUCCESS SCREEN
   */
  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A1628',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: betaSuccess
              ? 'rgba(74,222,128,0.15)'
              : 'rgba(26,122,74,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            border: betaSuccess
              ? '2px solid rgba(74,222,128,0.3)'
              : '2px solid rgba(26,122,74,0.3)'
          }}
        >
          {betaSuccess ? (
            <Gift size={50} color="#4ADE80" />
          ) : (
            <CheckCircle size={50} color="#4ADE80" />
          )}
        </div>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 8,
            fontFamily: 'Montserrat, sans-serif',
            textAlign: 'center'
          }}
        >
          {betaSuccess ? 'Track Is Live!' : 'Track Submitted'}
        </h2>

        {betaSuccess ? (
          <>
            <p
              style={{
                fontSize: 14,
                color: '#8A9BB0',
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 1.7,
                maxWidth: 320
              }}
            >
              Your Artist Beta track has been automatically approved and is
              now active in the Stream Feed.
            </p>

            <div
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 32,
                width: '100%',
                maxWidth: 360,
                textAlign: 'center'
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: '#4ADE80',
                  margin: 0,
                  fontWeight: 700
                }}
              >
                ARTIST BETA ACTIVATED
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                  margin: '6px 0 0'
                }}
              >
                20 coins per stream • 200 target streams
              </p>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: 14,
                color: '#8A9BB0',
                textAlign: 'center',
                marginBottom: 12,
                lineHeight: 1.7,
                maxWidth: 280
              }}
            >
              Your track is under review. Once approved it goes live in the
              Stream Feed and users start earning coins by listening.
            </p>

            <div
              style={{
                background: 'rgba(74,158,255,0.08)',
                border: '1px solid rgba(74,158,255,0.2)',
                borderRadius: 12,
                padding: '14px 20px',
                marginBottom: 32,
                width: '100%',
                textAlign: 'center'
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: '#4a9eff',
                  margin: 0
                }}
              >
                Approval within 24 hours
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                  margin: '4px 0 0'
                }}
              >
                You will be notified once it is live
              </p>
            </div>
          </>
        )}

        <button
          onClick={() => router.push('/artist/tracks')}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: '15px',
            borderRadius: 12,
            background: '#4a9eff',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12
          }}
        >
          View My Tracks
        </button>

        <button
          onClick={resetForm}
          style={{
            background: 'none',
            color: '#8A9BB0',
            fontSize: 14,
            padding: '10px'
          }}
        >
          Upload Another Track
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        paddingBottom: 40
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#0A1628',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <button
          onClick={() =>
            step > 1 ? setStep(s => s - 1) : router.back()
          }
          style={{
            background: 'none',
            display: 'flex'
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </button>

        <div style={{ flex: 1 }}>
          <p
            style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              margin: 0
            }}
          >
            Artist Portal
          </p>

          <p
            style={{
              color: '#8A9BB0',
              fontSize: 11,
              margin: 0
            }}
          >
            Step {step} of 3
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6
          }}
        >
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                width: s <= step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  s <= step
                    ? '#4a9eff'
                    : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* =========================
            STEP 1
        ========================== */}

        {step === 1 && (
          <>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 6,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Add Your Track
            </h3>

            <p
              style={{
                fontSize: 14,
                color: '#8A9BB0',
                marginBottom: 24,
                lineHeight: 1.6
              }}
            >
              Paste your Audiomack link below. We will automatically detect
              your track details.
            </p>

            {/* HOW TO GET LINK */}
            <div
              style={{
                background: 'rgba(74,158,255,0.06)',
                border: '1px solid rgba(74,158,255,0.15)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#4a9eff',
                  marginBottom: 8
                }}
              >
                How to get your Audiomack link
              </p>

              {[
                'Open Audiomack and go to your track',
                'Tap the share button on the track',
                'Select Copy Link',
                'Paste it below',
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 6,
                    alignItems: 'flex-start'
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#4a9eff',
                      background: 'rgba(74,158,255,0.15)',
                      padding: '1px 7px',
                      borderRadius: 10,
                      flexShrink: 0
                    }}
                  >
                    {i + 1}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: '#8A9BB0'
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* URL INPUT */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  display: 'block',
                  marginBottom: 8
                }}
              >
                Audiomack Track Link
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type="url"
                  placeholder="https://audiomack.com/your-name/song/track-title"
                  value={url}
                  onChange={e => handleUrlChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${
                      urlInfo
                        ? '#4ADE80'
                        : urlError
                        ? '#F87171'
                        : 'rgba(255,255,255,0.1)'
                    }`,
                    fontSize: 14,
                    color: '#fff',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  {urlInfo ? (
                    <CheckCircle size={18} color="#4ADE80" />
                  ) : (
                    <Search size={18} color="#8A9BB0" />
                  )}
                </div>
              </div>

              {urlError && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#F87171',
                    marginTop: 6
                  }}
                >
                  {urlError}
                </p>
              )}
            </div>

            {/* AUTO DETECTED INFO */}
            {urlInfo && (
              <div
                style={{
                  background: 'rgba(74,222,128,0.06)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 20
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#4ADE80',
                    marginBottom: 12
                  }}
                >
                  Track detected
                </p>

                <div style={{ marginBottom: 8 }}>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#8A9BB0',
                      margin: '0 0 2px'
                    }}
                  >
                    Artist
                  </p>

                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#fff',
                      margin: 0
                    }}
                  >
                    {urlInfo.artist}
                  </p>
                </div>

                {urlInfo.title && (
                  <div style={{ marginBottom: 8 }}>
                    <p
                      style={{
                        fontSize: 11,
                        color: '#8A9BB0',
                        margin: '0 0 2px'
                      }}
                    >
                      Track
                    </p>

                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#fff',
                        margin: 0
                      }}
                    >
                      {urlInfo.title}
                    </p>
                  </div>
                )}

                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#8A9BB0',
                      margin: '0 0 2px'
                    }}
                  >
                    Type
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      color: '#fff',
                      margin: 0,
                      textTransform: 'capitalize'
                    }}
                  >
                    {urlInfo.type}
                  </p>
                </div>
              </div>
            )}

            {/* TITLE */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  display: 'block',
                  marginBottom: 6
                }}
              >
                Track Title
              </label>

              <input
                type="text"
                placeholder="Confirm or enter track title"
                value={form.title}
                onChange={e =>
                  setForm({
                    ...form,
                    title: e.target.value
                  })
                }
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  fontSize: 14,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.05)'
                }}
              />
            </div>

            {/* GENRE */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  display: 'block',
                  marginBottom: 6
                }}
              >
                Genre
              </label>

              <input
                type="text"
                placeholder="e.g. Afrobeats, Highlife, Gospel, Amapiano"
                value={form.genre}
                onChange={e =>
                  setForm({
                    ...form,
                    genre: e.target.value
                  })
                }
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  fontSize: 14,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.05)'
                }}
              />
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  display: 'block',
                  marginBottom: 6
                }}
              >
                About This Track
              </label>

              <textarea
                placeholder="Tell listeners what this track is about..."
                value={form.description}
                onChange={e =>
                  setForm({
                    ...form,
                    description: e.target.value
                  })
                }
                rows={3}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  fontSize: 14,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.05)',
                  resize: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            {/* NEXT */}
            <button
              onClick={() => {
                if (!urlInfo) {
                  setUrlError(
                    'Please paste a valid Audiomack link first'
                  );
                  return;
                }

                if (!form.title) {
                  setUrlError('Please enter a track title');
                  return;
                }

                setStep(2);
              }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                background: urlInfo
                  ? 'linear-gradient(135deg, #4a9eff, #2d6be4)'
                  : 'rgba(255,255,255,0.08)',
                color: urlInfo ? '#fff' : '#8A9BB0',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Next — Choose Campaign
            </button>
          </>
        )}

        {/* =========================
            STEP 2
        ========================== */}

        {step === 2 && (
          <>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 6,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Choose Your Campaign
            </h3>

            <p
              style={{
                fontSize: 14,
                color: '#8A9BB0',
                marginBottom: 20,
                lineHeight: 1.6
              }}
            >
              Select how aggressively you want to promote your track.
              More coins means more users will stream it.
            </p>

            {/* =========================
                ARTIST BETA CODE
            ========================== */}

            <div
              style={{
                background: isArtistBeta
                  ? 'rgba(74,222,128,0.08)'
                  : 'rgba(74,158,255,0.06)',
                border: isArtistBeta
                  ? '1px solid rgba(74,222,128,0.3)'
                  : '1px solid rgba(74,158,255,0.15)',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 22
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10
                }}
              >
                <Gift
                  size={18}
                  color={isArtistBeta ? '#4ADE80' : '#4a9eff'}
                />

                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0
                  }}
                >
                  Artist Beta Access
                </p>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: '#8A9BB0',
                  margin: '0 0 12px',
                  lineHeight: 1.5
                }}
              >
                Have an Artist Beta code? Enter it below to upload your
                track without campaign payment.
              </p>

              <input
                type="text"
                placeholder="Enter beta code"
                value={form.beta_code}
                onChange={e =>
                  handleBetaCodeChange(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${
                    isArtistBeta
                      ? '#4ADE80'
                      : 'rgba(255,255,255,0.1)'
                  }`,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.05)',
                  textTransform: 'uppercase'
                }}
              />

              {isArtistBeta && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '12px',
                    borderRadius: 10,
                    background: 'rgba(74,222,128,0.08)'
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: '#4ADE80',
                      fontWeight: 700,
                      margin: '0 0 5px'
                    }}
                  >
                    ✓ ARTIST BETA ACTIVATED
                  </p>

                  <p
                    style={{
                      fontSize: 11,
                      color: '#8A9BB0',
                      margin: 0,
                      lineHeight: 1.5
                    }}
                  >
                    No campaign payment required.
                    Your track will be automatically activated with
                    20 coins per stream and a 200-stream target.
                  </p>
                </div>
              )}
            </div>

            {/* =========================
                CAMPAIGN PACKAGES
            ========================== */}

            {!isArtistBeta && (
              <>
                {CAMPAIGN_PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    style={{
                      background:
                        selectedPackage === pkg.id
                          ? 'rgba(74,158,255,0.1)'
                          : '#0D1F3C',
                      border: `2px solid ${
                        selectedPackage === pkg.id
                          ? '#4a9eff'
                          : 'rgba(255,255,255,0.06)'
                      }`,
                      borderRadius: 16,
                      padding: '16px 18px',
                      marginBottom: 12,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pkg.badge && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -1,
                          right: 16,
                          background:
                            pkg.badge === 'POPULAR'
                              ? '#4a9eff'
                              : '#D4A017',
                          color:
                            pkg.badge === 'POPULAR'
                              ? '#fff'
                              : '#0A1628',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '0 0 8px 8px',
                          letterSpacing: 1
                        }}
                      >
                        {pkg.badge}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8
                      }}
                    >
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#fff',
                          margin: 0
                        }}
                      >
                        {pkg.name}
                      </p>

                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: '#4a9eff',
                          margin: 0
                        }}
                      >
                        {pkg.price}
                      </p>
                    </div>

                    <p
                      style={{
                        fontSize: 13,
                        color: '#8A9BB0',
                        marginBottom: 10
                      }}
                    >
                      {pkg.desc}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        gap: 16
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Coins size={13} color="#D4A017" />

                        <span
                          style={{
                            fontSize: 12,
                            color: '#D4A017',
                            fontWeight: 600
                          }}
                        >
                          {pkg.coins} coins per stream
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <TrendingUp
                          size={13}
                          color="#4a9eff"
                        />

                        <span
                          style={{
                            fontSize: 12,
                            color: '#4a9eff',
                            fontWeight: 600
                          }}
                        >
                          {pkg.streams.toLocaleString()} streams
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* CUSTOM COINS */}
                <div
                  style={{
                    background: '#0D1F3C',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 24,
                    marginTop: 8
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 10
                    }}
                  >
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fff'
                      }}
                    >
                      Custom coins per stream
                    </label>

                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#4a9eff'
                      }}
                    >
                      {form.campaign_coins}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={form.campaign_coins}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        campaign_coins: parseInt(
                          e.target.value
                        )
                      }))
                    }
                    style={{
                      width: '100%',
                      accentColor: '#4a9eff'
                    }}
                  />

                  <p
                    style={{
                      fontSize: 11,
                      color: '#8A9BB0',
                      marginTop: 6,
                      textAlign: 'center'
                    }}
                  >
                    Each user earns approximately N
                    {(form.campaign_coins / 2).toFixed(0)}
                    {' '}per stream
                  </p>
                </div>
              </>
            )}

            {/* BETA SUMMARY */}
            {isArtistBeta && (
              <div
                style={{
                  background: '#0D1F3C',
                  borderRadius: 14,
                  padding: '16px',
                  marginBottom: 24
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: '#8A9BB0',
                    margin: '0 0 12px'
                  }}
                >
                  Your Beta Campaign
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: '#8A9BB0'
                    }}
                  >
                    Coins per stream
                  </span>

                  <strong
                    style={{
                      color: '#4ADE80'
                    }}
                  >
                    20
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: '#8A9BB0'
                    }}
                  >
                    Target streams
                  </span>

                  <strong
                    style={{
                      color: '#4a9eff'
                    }}
                  >
                    200
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: '#8A9BB0'
                    }}
                  >
                    Campaign payment
                  </span>

                  <strong
                    style={{
                      color: '#4ADE80'
                    }}
                  >
                    FREE
                  </strong>
                </div>
              </div>
            )}

            {/* NEXT */}
            <button
              onClick={() => setStep(3)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                background:
                  'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Next — Review and Submit
            </button>
          </>
        )}

        {/* =========================
            STEP 3
        ========================== */}

        {step === 3 && (
          <>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 6,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Review and Submit
            </h3>

            <p
              style={{
                fontSize: 14,
                color: '#8A9BB0',
                marginBottom: 20
              }}
            >
              Confirm your track details before submitting.
            </p>

            {/* BETA NOTICE */}
            {isArtistBeta && (
              <div
                style={{
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.25)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  gap: 10
                }}
              >
                <Gift
                  size={18}
                  color="#4ADE80"
                  style={{
                    flexShrink: 0,
                    marginTop: 2
                  }}
                />

                <div>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#4ADE80',
                      fontWeight: 700,
                      margin: '0 0 4px'
                    }}
                  >
                    Artist Beta Access
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: '#8A9BB0',
                      margin: 0,
                      lineHeight: 1.5
                    }}
                  >
                    This track will be automatically activated.
                    No Paystack payment is required.
                  </p>
                </div>
              </div>
            )}

            {/* DETAILS */}
            <div
              style={{
                background: '#0D1F3C',
                borderRadius: 16,
                padding: '20px',
                marginBottom: 20
              }}
            >
              {[
                {
                  label: 'Track Title',
                  value: form.title
                },
                {
                  label: 'Genre',
                  value: form.genre || 'Not specified'
                },
                {
                  label: 'Platform',
                  value: 'Audiomack'
                },
                {
                  label: 'Coins per stream',
                  value: `${isArtistBeta ? 20 : form.campaign_coins} coins`
                },
                {
                  label: 'Target streams',
                  value: isArtistBeta
                    ? '200'
                    : form.target_streams.toLocaleString()
                },
                {
                  label: 'Package',
                  value: isArtistBeta
                    ? 'Artist Beta'
                    : CAMPAIGN_PACKAGES.find(
                        p => p.id === selectedPackage
                      )?.name || 'Custom'
                },
                ...(isArtistBeta
                  ? [
                      {
                        label: 'Payment',
                        value: 'FREE — Beta Access'
                      }
                    ]
                  : [])
              ].map((item, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom:
                      i < arr.length - 1
                        ? '1px solid rgba(255,255,255,0.05)'
                        : 'none'
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: '#8A9BB0'
                    }}
                  >
                    {item.label}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      color:
                        item.label === 'Payment' &&
                        isArtistBeta
                          ? '#4ADE80'
                          : '#fff',
                      fontWeight: 600,
                      textAlign: 'right',
                      maxWidth: '55%'
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* EMBED PREVIEW */}
            {form.embed_url && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#8A9BB0',
                    marginBottom: 8
                  }}
                >
                  Track Preview
                </p>

                <div
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden'
                  }}
                >
                  <iframe
                    src={form.embed_url}
                    width="100%"
                    height="160"
                    frameBorder="0"
                    allow="autoplay"
                    style={{
                      display: 'block'
                    }}
                  />
                </div>
              </div>
            )}

            {/* INFO */}
            <div
              style={{
                background: isArtistBeta
                  ? 'rgba(74,222,128,0.06)'
                  : 'rgba(74,158,255,0.06)',
                border: isArtistBeta
                  ? '1px solid rgba(74,222,128,0.15)'
                  : '1px solid rgba(74,158,255,0.15)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 24,
                display: 'flex',
                gap: 10
              }}
            >
              {isArtistBeta ? (
                <Gift
                  size={16}
                  color="#4ADE80"
                  style={{
                    flexShrink: 0,
                    marginTop: 2
                  }}
                />
              ) : (
                <Info
                  size={16}
                  color="#4a9eff"
                  style={{
                    flexShrink: 0,
                    marginTop: 2
                  }}
                />
              )}

              <p
                style={{
                  fontSize: 13,
                  color: '#8A9BB0',
                  margin: 0,
                  lineHeight: 1.6
                }}
              >
                {isArtistBeta ? (
                  <>
                    <strong style={{ color: '#4ADE80' }}>
                      ARTIST2026
                    </strong>{' '}
                    has been applied. Your track will be activated
                    automatically with no payment required.
                  </>
                ) : (
                  <>
                    After approval your track goes live in the
                    Stream Feed. Payment is arranged after approval.
                    Our team will contact you at{' '}
                    <strong style={{ color: '#4a9eff' }}>
                      {user?.email}
                    </strong>
                  </>
                )}
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div
                style={{
                  background: 'rgba(192,57,43,0.1)',
                  border: '1px solid rgba(192,57,43,0.3)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 16,
                  color: '#F87171',
                  fontSize: 13
                }}
              >
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                background: loading
                  ? 'rgba(255,255,255,0.08)'
                  : isArtistBeta
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
                color: loading ? '#8A9BB0' : '#fff',
                fontSize: 16,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {loading ? (
                <>
                  <Spinner size={20} />
                  Submitting...
                </>
              ) : isArtistBeta ? (
                <>
                  <Gift size={18} />
                  Activate Track — Free Beta
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Submit Track for Review
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}