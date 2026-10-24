
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Trophy, Copy, Share2, ExternalLink,
  UploadCloud, CheckCircle2, Clock3, Coins, RefreshCw
} from 'lucide-react';
import API from '@/lib/api';

const VOTING_URL =
  'https://votefounderslive.com/?video=57932c57-f700-4ed5-9ecb-f2ff8e52c1bd';

const CLOUDINARY_CLOUD_NAME = 'dz9br2ju7';
const CLOUDINARY_UPLOAD_PRESET = 'rewaiq_proofs';

export default function FoundersLivePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const [voterReference, setVoterReference] = useState('');
  const [supporterCode, setSupporterCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProgress = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await API.get('/api/founders-live/me');
      setData(res.data);
      setSupporterCode(res.data?.supporter_code || '');
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load your Founders Live progress. Please sign in and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const uploadProof = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP screenshot.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Screenshot must be 8 MB or smaller.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');
    setProofPreview(URL.createObjectURL(file));

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body }
      );

      const json = await response.json();

      if (!response.ok || !json.secure_url) {
        throw new Error(json.error?.message || 'Screenshot upload failed.');
      }

      setProofUrl(json.secure_url);
    } catch (err) {
      setProofUrl('');
      setProofPreview('');
      setError(err.message || 'Screenshot upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submitProof = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!supporterCode.trim()) {
      setError('Your supporter code is not available yet. Refresh and try again.');
      return;
    }

    if (!proofUrl) {
      setError('Upload a screenshot of your completed vote before submitting.');
      return;
    }

    if (!voterReference.trim()) {
      setError('Enter a non-sensitive voter reference for admin review.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await API.post('/api/founders-live/votes', {
        supporter_code: supporterCode.trim(),
        voter_code: voterReference.trim(),
        proof_url: proofUrl
      });

      setMessage(
        res.data?.message ||
        'Evidence submitted for review. It counts only after approval.'
      );

      setProofUrl('');
      setProofPreview('');
      setVoterReference('');
      await loadProgress(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not submit vote evidence. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!supporterCode) return;

    try {
      await navigator.clipboard.writeText(supporterCode);
      setMessage('Supporter code copied. Share it with your community.');
    } catch {
      setMessage(`Your supporter code is ${supporterCode}. Copy it manually.`);
    }
  };

  const shareCampaign = async () => {
    const shareUrl = VOTING_URL;
    const shareData = {
      title: 'Support Rewaiq on Founders Live',
      text:
        'Please support Rewaiq on Founders Live. Open the official voting page and follow its voting instructions. My Rewaiq supporter code is ' +
        supporterCode,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareUrl}`
        );
        setMessage('Campaign message copied. Share it with your community.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Unable to share automatically. Copy your supporter code and voting link manually.');
      }
    }
  };

  const progress = data?.progress || {};
  const votes = Number(progress.verified_votes || 0);
  const nextMilestone = votes < 50 ? 50 : votes < 100 ? 100 : null;
  const percent = nextMilestone
    ? Math.min(100, Math.round((votes / nextMilestone) * 100))
    : 100;

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>Loading Founders Live Challenge…</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => router.back()} style={styles.back} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <strong>Founders Live Challenge</strong>
        <button
          onClick={() => loadProgress(true)}
          style={styles.back}
          aria-label="Refresh progress"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      <div style={styles.content}>
        <section style={styles.hero}>
          <div style={styles.heroIcon}>
            <Trophy size={28} color="#F0C860" />
          </div>
          <div style={styles.eyebrow}>SUPPORT REWAIQ</div>
          <h1 style={styles.title}>Help Rewaiq gain votes</h1>
          <p style={styles.muted}>
            Share the campaign with your community and help more people discover Rewaiq.
          </p>
          <a
            href={data?.campaign?.voting_url || VOTING_URL}
            target="_blank"
            rel="noreferrer"
            style={styles.primaryLink}
          >
            Open official voting page <ExternalLink size={17} />
          </a>
          <p style={styles.small}>
            Follow the competition's official voting rules. A shared link or click alone does not count as a verified vote.
          </p>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <span>Your verified votes</span>
            <button
              onClick={() => loadProgress(true)}
              disabled={refreshing}
              style={styles.textButton}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div style={styles.voteCount}>
            {votes}<span> / 50 votes</span>
          </div>

          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${percent}%` }} />
          </div>

          <p style={styles.muted}>
            {Number(progress.pending_votes || 0)} pending review · {Number(progress.rejected_votes || 0)} rejected
          </p>

          <div style={styles.milestones}>
            {[50, 100].map((target) => {
              const achieved = votes >= target;
              const reward = (progress.milestones || []).find(
                (item) => Number(item.milestone) === target
              );

              return (
                <div key={target} style={styles.milestone}>
                  <div style={styles.milestoneIcon}>
                    {achieved
                      ? <CheckCircle2 size={21} color="#4ADE80" />
                      : <Trophy size={21} color="#D9A93A" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{target} verified votes</strong>
                    <div style={styles.small}>
                      {reward ? 'Reward credited' : `${target === 50 ? 'First' : 'Second'} milestone`}
                    </div>
                  </div>
                  <div style={styles.reward}>
                    <Coins size={15} />
                    {reward ? `${reward.coins_awarded} earned` : '+4 coins'}
                  </div>
                </div>
              );
            })}
          </div>

          <p style={styles.small}>
            Rewards are credited only after verification and only once per milestone.
          </p>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <span>Your supporter code</span>
            <Share2 size={19} color="#60A5FA" />
          </div>

          <p style={styles.muted}>
            Share your code when inviting people to support Rewaiq. The code helps identify the supporter they intend to support; it does not itself verify a vote.
          </p>

          <div style={styles.codeBox}>
            {supporterCode || 'Code unavailable'}
          </div>

          <div style={styles.buttonRow}>
            <button
              style={styles.secondaryButton}
              onClick={copyCode}
              disabled={!supporterCode}
            >
              <Copy size={17} /> Copy code
            </button>
            <button
              style={styles.blueButton}
              onClick={shareCampaign}
              disabled={!supporterCode}
            >
              <Share2 size={17} /> Share campaign
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <span>Submit vote evidence</span>
            <UploadCloud size={20} color="#60A5FA" />
          </div>

          <p style={styles.muted}>
            After voting, upload a screenshot showing the confirmation. An admin will review it before the vote is counted.
          </p>

          <form onSubmit={submitProof} style={styles.form}>
            <label style={styles.label}>
              Voter reference <span style={styles.small}>(no passwords or sensitive details)</span>
            </label>
            <input
              value={voterReference}
              onChange={(event) => setVoterReference(event.target.value)}
              maxLength={200}
              placeholder="A non-sensitive vote/reference code"
              style={styles.input}
            />

            <label style={styles.label}>Vote confirmation screenshot</label>
            <label style={styles.uploadBox}>
              {proofPreview
                ? <img src={proofPreview} alt="Screenshot preview" style={styles.preview} />
                : <UploadCloud size={32} color="#60A5FA" />}
              <strong>
                {uploading
                  ? 'Uploading screenshot…'
                  : proofPreview
                    ? 'Screenshot selected'
                    : 'Tap to upload screenshot'}
              </strong>
              <span style={styles.small}>JPG, PNG, or WebP · maximum 8 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadProof}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>

            {error && <p role="alert" style={styles.error}>{error}</p>}
            {message && <p role="status" style={styles.success}>{message}</p>}

            <button
              type="submit"
              disabled={submitting || uploading || !proofUrl || !voterReference.trim()}
              style={{
                ...styles.blueButton,
                ...styles.submitButton,
                opacity: submitting || uploading || !proofUrl || !voterReference.trim() ? 0.55 : 1
              }}
            >
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </button>
          </form>
        </section>

        <p style={styles.footerNote}>
          <Clock3 size={15} />
          Submitted evidence stays pending until reviewed. Duplicate, misleading, or unverifiable submissions may be rejected. Confirm that incentivized promotion is permitted by the competition.
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0A1628', color: '#F8FAFC', paddingBottom: 36, fontFamily: 'Arial, sans-serif' },
  header: { height: 60, background: '#102142', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', position: 'sticky', top: 0, zIndex: 5 },
  back: { border: 0, background: 'transparent', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: 8, cursor: 'pointer' },
  content: { maxWidth: 680, margin: '0 auto', padding: '20px 16px', display: 'grid', gap: 16 },
  hero: { background: '#102142', border: '1px solid #1D355B', borderRadius: 22, padding: 20, display: 'grid', gap: 12 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, background: '#26354A', display: 'grid', placeItems: 'center' },
  eyebrow: { color: '#60A5FA', fontWeight: 800, letterSpacing: 1.3, fontSize: 12 },
  title: { margin: '6px 0 8px', fontSize: 25, lineHeight: 1.2 },
  muted: { color: '#9CAEC5', lineHeight: 1.55, margin: '6px 0', fontSize: 14 },
  small: { color: '#91A0B5', fontSize: 12, lineHeight: 1.5 },
  primaryLink: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9, borderRadius: 12, background: '#3478F6', color: '#fff', padding: 14, textDecoration: 'none', fontWeight: 700 },
  card: { background: '#0F2039', border: '1px solid #1B3355', borderRadius: 20, padding: 18, display: 'grid', gap: 12 },
  sectionHeading: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontSize: 16 },
  textButton: { color: '#60A5FA', background: 'transparent', border: 0, fontWeight: 700 },
  voteCount: { fontSize: 32, fontWeight: 900 },
  progressTrack: { height: 9, borderRadius: 20, background: '#2B3C55', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#D9A93A', borderRadius: 20, transition: 'width .25s' },
  milestones: { display: 'grid', gap: 10, marginTop: 4 },
  milestone: { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #263A57', borderRadius: 13, padding: 12 },
  milestoneIcon: { width: 34, height: 34, borderRadius: 10, background: '#1B2B43', display: 'grid', placeItems: 'center' },
  reward: { color: '#F0C860', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' },
  codeBox: { background: '#091426', border: '1px dashed #3D5A80', borderRadius: 12, padding: 15, textAlign: 'center', letterSpacing: 2, fontWeight: 900, fontSize: 20, overflowWrap: 'anywhere' },
  buttonRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  secondaryButton: { border: '1px solid #385477', background: '#142846', color: '#DCE8F8', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontWeight: 700 },
  blueButton: { border: 0, background: '#3478F6', color: '#fff', borderRadius: 12, padding: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontWeight: 800 },
  form: { display: 'grid', gap: 10 },
  label: { fontWeight: 700, fontSize: 13, marginTop: 4 },
  input: { width: '100%', boxSizing: 'border-box', background: '#091426', color: '#fff', border: '1px solid #2A3E5A', borderRadius: 12, padding: 14, fontSize: 14 },
  uploadBox: { minHeight: 140, border: '2px dashed #365579', borderRadius: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, textAlign: 'center', cursor: 'pointer', overflow: 'hidden' },
  preview: { maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 },
  submitButton: { width: '100%', marginTop: 4 },
  error: { color: '#FCA5A5', fontSize: 13, margin: 0 },
  success: { color: '#86EFAC', fontSize: 13, margin: 0 },
  footerNote: { display: 'flex', gap: 8, alignItems: 'flex-start', color: '#91A0B5', fontSize: 12, lineHeight: 1.5, margin: 0 },
  loading: { padding: 40, textAlign: 'center', color: '#9CAEC5' }
};
