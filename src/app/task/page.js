'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Upload,
  CheckCircle,
  Coins,
  Camera,
  Loader2,
  Sparkles,
} from 'lucide-react';
import API from '@/lib/api';
import Spinner from '@/components/Spinner';

const CLOUDINARY_CLOUD_NAME = 'dz9br2ju7';
const CLOUDINARY_UPLOAD_PRESET = 'rewaiq_proofs';

function TaskContent() {
  const router = useRouter();
  const params = useSearchParams();
  const taskId = params.get('id');

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [proof, setProof] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coinsAwarded, setCoinsAwarded] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskId) {
      fetchTask();
    } else {
      setLoading(false);
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await API.get(`/api/tasks/${taskId}`);
      setTask(res.data?.task || null);
    } catch (err) {
      setError('Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  const isSocialTask = () => {
    if (!task) return false;
    const type = (task.task_type || '').toLowerCase();
    return ['tiktok', 'instagram', 'telegram', 'twitter', 'follow', 'social'].includes(type);
  };

  const handleOpenLink = () => {
    if (task?.target_url) {
      window.open(task.target_url, '_blank', 'noopener,noreferrer');
      setHasOpenedLink(true);
      setError('');
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        setProof(data.secure_url);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      setError('Image upload failed. You can paste a direct screenshot link instead.');
      setProofPreview('');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async () => {
    const isSocial = isSocialTask();

    if (!isSocial && !proof) {
      setError('Please upload a screenshot or paste a link as proof.');
      return;
    }

    if (isSocial && task.target_url && !hasOpenedLink) {
      setError('Please tap "Open Task Link" and follow the account first.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Corrected endpoint matching backend: POST /api/tasks/complete
      const res = await API.post('/api/tasks/complete', {
        task_id: taskId,
        proof_url: proof || task.target_url || 'social_verified',
      });

      const awarded = res.data?.coins_awarded || task.reward_coins || 0;
      setCoinsAwarded(awarded);

      // Update local storage wallet balance if returned
      if (res.data?.coin_balance !== undefined && typeof window !== 'undefined') {
        const stored = localStorage.getItem('rewaiq_user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.coin_balance = res.data.coin_balance;
            localStorage.setItem('rewaiq_user', JSON.stringify(user));
          } catch (_) {}
        }
      }

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInstructions = (t) => {
    const type = (t.task_type || '').toLowerCase();
    switch (type) {
      case 'tiktok':
      case 'instagram':
      case 'follow':
        return [
          'Tap "Open Task Link" below to visit the official page',
          'Follow the account',
          'Return here and tap "Verify & Claim Coins"',
        ];
      case 'telegram':
        return [
          'Tap "Open Task Link" below to join the channel',
          'Join the community channel',
          'Return here and tap "Verify & Claim Coins"',
        ];
      case 'watch':
        return [
          'Click the link below to watch the video',
          'Watch for at least 60 seconds',
          'Screenshot the video showing progress',
          'Upload screenshot and submit',
        ];
      case 'share':
        return [
          'Click the link below to share Rewaiq',
          'Share to your WhatsApp Status or Social feed',
          'Take a screenshot of your share confirmation',
          'Upload screenshot and submit',
        ];
      default:
        return [
          'Complete the task using the link below',
          'Take a screenshot as proof',
          'Upload screenshot and submit',
        ];
    }
  };

  if (loading) return <Spinner fullscreen />;

  if (success) {
    const isSocial = isSocialTask();

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A1628',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'rgba(74,222,128,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            border: '2px solid rgba(74,222,128,0.3)',
          }}
        >
          <CheckCircle size={44} color="#4ADE80" />
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 8,
            fontFamily: 'Montserrat, sans-serif',
            textAlign: 'center',
          }}
        >
          {isSocial ? 'Task Completed!' : 'Submitted for Review'}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: '#8A9BB0',
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 1.6,
            maxWidth: 300,
          }}
        >
          {isSocial
            ? 'Your coins have been credited to your wallet balance.'
            : 'Your submission is being reviewed. Coins will be credited once approved.'}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 28,
            background: 'rgba(212,160,23,0.1)',
            padding: '10px 18px',
            borderRadius: 20,
            border: '1px solid rgba(212,160,23,0.25)',
          }}
        >
          <Coins size={22} color="#FBBF24" />
          <span style={{ fontSize: 17, fontWeight: 800, color: '#FBBF24' }}>
            +{coinsAwarded || task?.reward_coins} coins {isSocial ? 'added' : 'pending'}
          </span>
        </div>

        <button
          onClick={() => router.push('/home')}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: '15px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4a9eff, #2d6be4)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Back to Feed
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A1628',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A9BB0',
          padding: 24,
        }}
      >
        <p>Task not found.</p>
        <button
          onClick={() => router.back()}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            background: '#4a9eff',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const isSocial = isSocialTask();

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#0D1F3C',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
        >
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Complete Task</span>
      </div>

      <div style={{ padding: '20px', maxWidth: 520, margin: '0 auto' }}>
        {/* Task Details Card */}
        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '20px', marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  color: '#4a9eff',
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  margin: '0 0 4px',
                }}
              >
                {task.task_type} Task
              </p>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {task.title}
              </h2>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(251,191,36,0.12)',
                padding: '6px 12px',
                borderRadius: 20,
                flexShrink: 0,
                marginLeft: 10,
              }}
            >
              <Coins size={15} color="#FBBF24" />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FBBF24' }}>
                +{task.reward_coins}
              </span>
            </div>
          </div>
          {task.description && (
            <p style={{ fontSize: 13, color: '#8A9BB0', lineHeight: 1.6, margin: 0 }}>
              {task.description}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div
          style={{
            background: 'rgba(74,158,255,0.06)',
            border: '1px solid rgba(74,158,255,0.15)',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 18,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#4a9eff',
              margin: '0 0 12px',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            How to complete
          </p>
          {getInstructions(task).map((instruction, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 10,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#4a9eff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 13, color: '#8A9BB0', lineHeight: 1.5 }}>
                {instruction}
              </span>
            </div>
          ))}
        </div>

        {/* Open Link Button */}
        {task.target_url && (
          <button
            type="button"
            onClick={handleOpenLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: '#0D1F3C',
              border: hasOpenedLink
                ? '1px solid rgba(74,222,128,0.4)'
                : '1px solid rgba(74,158,255,0.35)',
              color: hasOpenedLink ? '#4ADE80' : '#4a9eff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            <ExternalLink size={16} />
            {hasOpenedLink ? 'Link Opened (Tap to view again)' : 'Open Task Link'}
          </button>
        )}

        {/* Proof Upload (Only shown for non-social or proof-based tasks) */}
        {!isSocial && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Upload Screenshot as Proof
            </label>

            <label style={{ display: 'block', cursor: 'pointer', marginBottom: 12 }}>
              <div
                style={{
                  border: `2px dashed ${
                    proofPreview ? '#4ADE80' : 'rgba(74,158,255,0.3)'
                  }`,
                  borderRadius: 12,
                  padding: '20px',
                  textAlign: 'center',
                  background: proofPreview
                    ? 'rgba(74,222,128,0.04)'
                    : 'rgba(74,158,255,0.04)',
                }}
              >
                {proofPreview ? (
                  <>
                    <img
                      src={proofPreview}
                      alt="proof preview"
                      style={{
                        width: '100%',
                        maxHeight: 220,
                        objectFit: 'contain',
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    />
                    <p style={{ fontSize: 12, color: '#4ADE80', margin: 0, fontWeight: 700 }}>
                      {uploadingProof
                        ? 'Uploading to cloud...'
                        : 'Screenshot uploaded — tap to replace'}
                    </p>
                  </>
                ) : (
                  <>
                    <Camera size={34} color="#4a9eff" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: '#4a9eff', fontWeight: 700, margin: '0 0 4px' }}>
                      {uploadingProof ? 'Uploading image...' : 'Tap to upload screenshot'}
                    </p>
                    <p style={{ fontSize: 11, color: '#8A9BB0', margin: 0 }}>
                      JPG or PNG from your gallery
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                style={{ display: 'none' }}
                disabled={uploadingProof}
              />
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: '#8A9BB0' }}>OR paste link</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <input
              type="url"
              placeholder="https://... (screenshot link)"
              value={proofPreview ? '' : proof}
              onChange={(e) => {
                setProof(e.target.value);
                setProofPreview('');
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 13,
                color: '#fff',
                background: 'rgba(255,255,255,0.05)',
                outline: 'none',
              }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#F87171',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit / Claim Button */}
        <button
          onClick={handleSubmit}
          disabled={
            submitting ||
            uploadingProof ||
            (!isSocial && !proof && !proofPreview) ||
            (isSocial && task.target_url && !hasOpenedLink)
          }
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 14,
            background:
              submitting || uploadingProof || (!isSocial && !proof && !proofPreview)
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
            color:
              submitting || uploadingProof || (!isSocial && !proof && !proofPreview)
                ? '#8A9BB0'
                : '#fff',
            fontSize: 15,
            fontWeight: 800,
            border: 'none',
            cursor:
              submitting || uploadingProof || (!isSocial && !proof && !proofPreview)
                ? 'not-allowed'
                : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {uploadingProof ? (
            <>
              <Loader2 size={16} className="spin" /> Uploading image...
            </>
          ) : submitting ? (
            <>
              <Loader2 size={16} className="spin" /> Verifying...
            </>
          ) : isSocial ? (
            <>
              <Sparkles size={16} /> Verify & Claim Coins
            </>
          ) : (
            <>
              <Upload size={16} /> Submit for Review
            </>
          )}
        </button>

        <p
          style={{
            fontSize: 11,
            color: '#8A9BB0',
            textAlign: 'center',
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          {isSocial
            ? 'Coins will be credited automatically once verified.'
            : 'Fake or invalid submissions will be rejected.'}
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function TaskPage() {
  return (
    <Suspense fallback={<Spinner fullscreen />}>
      <TaskContent />
    </Suspense>
  );
}
