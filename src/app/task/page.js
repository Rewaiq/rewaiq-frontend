'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Upload, CheckCircle, Coins, Camera } from 'lucide-react';
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
  const [proof, setProof] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskId) fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await API.get(`/api/tasks/${taskId}`);
      setTask(res.data.task);
    } catch {} finally { setLoading(false); }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProof(true);
    setError('');

    // Show preview immediately
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
        throw new Error('Upload failed');
      }
    } catch {
      setError('Image upload failed. Please paste a link instead.');
      setProofPreview('');
    } finally { setUploadingProof(false); }
  };

  const handleSubmit = async () => {
    if (!proof) { setError('Please upload a screenshot or paste a link'); return; }
    setSubmitting(true); setError('');
    try {
      await API.post(`/api/tasks/${taskId}/complete`, { proof_url: proof });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Try again.');
    } finally { setSubmitting(false); }
  };

  const getInstructions = (task) => {
    switch (task.task_type) {
      case 'follow': return [
        'Open the link below and follow the account',
        'Take a screenshot showing you followed',
        'Upload the screenshot below',
        'Submit for review',
      ];
      case 'watch': return [
        'Click the link below to watch the video',
        'Watch for at least 60 seconds',
        'Screenshot the video showing progress',
        'Upload screenshot and submit',
      ];
      case 'share': return [
        'Click the link below',
        'Share to your WhatsApp status or any social media',
        'Screenshot your share confirmation',
        'Upload screenshot and submit',
      ];
      case 'review': return [
        'Click the link below to leave a review',
        'Write an honest review',
        'Screenshot your submitted review',
        'Upload screenshot and submit',
      ];
      default: return [
        'Complete the task using the link below',
        'Take a screenshot as proof',
        'Upload screenshot and submit',
      ];
    }
  };

  if (loading) return <Spinner fullscreen />;

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '2px solid rgba(74,222,128,0.3)' }}>
          <CheckCircle size={44} color="#4ADE80" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
          Submitted for Review
        </h2>
        <p style={{ fontSize: 14, color: '#8A9BB0', textAlign: 'center', marginBottom: 8, lineHeight: 1.7, maxWidth: 280 }}>
          Your submission is being reviewed. Coins will be credited once approved.
        </p>
        <div style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#4a9eff', margin: 0 }}>Usually reviewed within 2-4 hours</p>
          <p style={{ fontSize: 12, color: '#8A9BB0', margin: '4px 0 0' }}>You will be notified when approved</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <Coins size={20} color="#D4A017" />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#D4A017' }}>+{task?.reward_coins} coins pending</span>
        </div>
        <button onClick={() => router.push('/home')}
          style={{ width: '100%', maxWidth: 320, padding: '15px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Back to Feed
        </button>
      </div>
    );
  }

  if (!task) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB0' }}>
      Task not found
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: '#0D1F3C', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Complete Task</span>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Task card */}
        <div style={{ background: '#0D1F3C', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#4a9eff', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                {task.task_type} task
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.3 }}>
                {task.title}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,158,255,0.1)', padding: '8px 14px', borderRadius: 20, flexShrink: 0, marginLeft: 12 }}>
              <Coins size={16} color="#4a9eff" />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#4a9eff' }}>+{task.reward_coins}</span>
            </div>
          </div>
          {task.description && (
            <p style={{ fontSize: 14, color: '#8A9BB0', lineHeight: 1.6, margin: 0 }}>{task.description}</p>
          )}
        </div>

        {/* Instructions */}
        <div style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#4a9eff', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            How to complete
          </p>
          {getInstructions(task).map((instruction, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 13, color: '#8A9BB0', lineHeight: 1.5, paddingTop: 3 }}>{instruction}</span>
            </div>
          ))}
        </div>

        {/* Task link */}
        {task.target_url && (
  <a 
    href={task.target_url} 
    target="_blank" 
    rel="noreferrer"
    onClick={(e) => e.stopPropagation()}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '15px', borderRadius: 12, background: '#0D1F3C', border: '1px solid rgba(74,158,255,0.3)', color: '#4a9eff', fontSize: 15, fontWeight: 600, textDecoration: 'none', marginBottom: 20 }}>
    <ExternalLink size={18} />
    Open Task Link
  </a>
)}

        {/* Proof upload */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 8 }}>
            Upload Screenshot as Proof
          </label>

          {/* Upload box */}
          <label style={{ display: 'block', cursor: 'pointer', marginBottom: 12 }}>
            <div style={{ border: `2px dashed ${proofPreview ? '#4ADE80' : 'rgba(74,158,255,0.3)'}`, borderRadius: 12, padding: '20px', textAlign: 'center', background: proofPreview ? 'rgba(74,222,128,0.04)' : 'rgba(74,158,255,0.04)', transition: 'all 0.2s' }}>
              {proofPreview ? (
                <>
                  <img src={proofPreview} alt="proof preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, color: '#4ADE80', margin: 0, fontWeight: 600 }}>
                    {uploadingProof ? 'Uploading to cloud...' : 'Screenshot uploaded — tap to change'}
                  </p>
                </>
              ) : (
                <>
                  <Camera size={36} color="#4a9eff" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 14, color: '#4a9eff', fontWeight: 600, margin: '0 0 4px' }}>
                    {uploadingProof ? 'Uploading...' : 'Tap to upload screenshot'}
                  </p>
                  <p style={{ fontSize: 12, color: '#8A9BB0', margin: 0 }}>JPG or PNG — from your gallery or camera</p>
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

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 11, color: '#8A9BB0' }}>OR paste a link</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Paste link */}
          <input
            type="url"
            placeholder="https://... (paste screenshot link from Imgur, Drive, etc)"
            value={proofPreview ? '' : proof}
            onChange={e => {
              setProof(e.target.value);
              setProofPreview('');
            }}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${proof && !proofPreview ? '#4a9eff' : 'rgba(255,255,255,0.1)'}`, fontSize: 14, color: '#fff', background: 'rgba(255,255,255,0.05)' }}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#F87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || uploadingProof || (!proof && !proofPreview)}
          style={{ width: '100%', padding: '16px', borderRadius: 14, background: submitting || uploadingProof || (!proof && !proofPreview) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #4a9eff, #2d6be4)', color: submitting || uploadingProof || (!proof && !proofPreview) ? '#8A9BB0' : '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: (!proof && !proofPreview) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Montserrat, sans-serif' }}>
          <Upload size={18} />
          {uploadingProof ? 'Uploading image...' : submitting ? 'Submitting...' : 'Submit for Review'}
        </button>

        <p style={{ fontSize: 11, color: '#8A9BB0', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          Fake or invalid submissions will be rejected. Repeated violations may result in account suspension.
        </p>
      </div>
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