'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle } from 'lucide-react';
import API from '@/lib/api';

const TASK_TYPES = [
  {
    id: 'follow',
    label: 'Follow',
    desc: 'Follow on social media',
    icon: '👥',
  },
  {
    id: 'watch',
    label: 'Watch',
    desc: 'Watch a video',
    icon: '📺',
  },
  {
    id: 'share',
    label: 'Share',
    desc: 'Share content',
    icon: '📤',
  },
  {
    id: 'review',
    label: 'Review',
    desc: 'Write a review',
    icon: '✍️',
  },
  {
    id: 'stream',
    label: 'Stream',
    desc: 'Stream music',
    icon: '🎵',
  },
  {
    id: 'campaign',
    label: 'Campaign',
    desc: 'Brand campaign',
    icon: '📢',
  },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  reward_coins: 30,
  task_type: 'follow',
  target_url: '',
};

export default function CreateTaskPage() {
  const router = useRouter();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!form.task_type) {
      setError('Select a task type');
      return;
    }

    if (!form.reward_coins || form.reward_coins < 10) {
      setError('Reward must be at least 10 coins');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/api/admin/tasks/create', form);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create task'
      );
    } finally {
      setLoading(false);
    }
  };

  const createAnother = () => {
    setSuccess(false);
    setError('');
    setForm({
      title: '',
      description: '',
      reward_coins: 30,
      task_type: 'follow',
      target_url: '',
    });
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
          padding: 24,
        }}
      >
        <CheckCircle
          size={56}
          color="#4ADE80"
          style={{ marginBottom: 16 }}
        />

        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 8,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          Task Created!
        </h2>

        <p
          style={{
            fontSize: 14,
            color: '#8A9BB0',
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          The task is now live and users can start completing it.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            width: '100%',
            maxWidth: 320,
          }}
        >
          <button
            onClick={createAnother}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Another
          </button>

          <button
            onClick={() => router.push('/admin')}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 12,
              background: '#4a9eff',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        paddingBottom: 40,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#0D1F3C',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </button>

        <span
          style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Create New Task
        </span>
      </div>

      <div
        style={{
          padding: '24px 20px',
        }}
      >
        {/* ERROR */}
        {error && (
          <div
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#F87171',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* TASK TYPE */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              display: 'block',
              marginBottom: 10,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Task Type
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}
          >
            {TASK_TYPES.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    task_type: task.id,
                  }))
                }
                style={{
                  padding: '12px 8px',
                  borderRadius: 10,
                  border: `1.5px solid ${
                    form.task_type === task.id
                      ? '#4a9eff'
                      : 'rgba(255,255,255,0.08)'
                  }`,
                  background:
                    form.task_type === task.id
                      ? 'rgba(74,158,255,0.12)'
                      : 'rgba(255,255,255,0.03)',
                  color:
                    form.task_type === task.id
                      ? '#4a9eff'
                      : '#8A9BB0',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {task.icon}
                </span>

                {task.label}
              </button>
            ))}
          </div>
        </div>

        {/* TITLE */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Task Title *
          </label>

          <input
            type="text"
            placeholder="e.g. Follow Rewaiq on Instagram"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                title: e.target.value,
              }))
            }
            style={{
              width: '100%',
              padding: '13px 14px',
              borderRadius: 10,
              border: `1.5px solid ${
                form.title
                  ? '#4a9eff'
                  : 'rgba(255,255,255,0.1)'
              }`,
              fontSize: 14,
              color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              outline: 'none',
            }}
          />
        </div>

        {/* DESCRIPTION */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Description
          </label>

          <textarea
            placeholder="Describe what users need to do to complete this task..."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                description: e.target.value,
              }))
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
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
            }}
          />
        </div>

        {/* TARGET URL */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Target URL (optional)
          </label>

          <input
            type="url"
            placeholder="https://instagram.com/rewaiq"
            value={form.target_url}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                target_url: e.target.value,
              }))
            }
            style={{
              width: '100%',
              padding: '13px 14px',
              borderRadius: 10,
              border: '1.5px solid rgba(255,255,255,0.1)',
              fontSize: 14,
              color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              outline: 'none',
            }}
          />
        </div>

        {/* REWARD COINS */}
        <div
          style={{
            background: '#0D1F3C',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
              }}
            >
              Reward per completion
            </label>

            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#4a9eff',
              }}
            >
              {form.reward_coins} coins
            </span>
          </div>

          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={form.reward_coins}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                reward_coins: parseInt(
                  e.target.value,
                  10
                ),
              }))
            }
            style={{
              width: '100%',
              accentColor: '#4a9eff',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: '#8A9BB0',
              }}
            >
              10 min
            </span>

            <span
              style={{
                fontSize: 11,
                color: '#8A9BB0',
              }}
            >
              = N{(form.reward_coins / 2).toFixed(0)} per user
            </span>

            <span
              style={{
                fontSize: 10,
                color: '#8A9BB0',
              }}
            >
              500 max
            </span>
          </div>

          {/* QUICK PRESETS */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
            }}
          >
            {[30, 50, 80, 100, 200].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    reward_coins: value,
                  }))
                }
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 8,
                  background:
                    form.reward_coins === value
                      ? '#4a9eff'
                      : 'rgba(255,255,255,0.06)',
                  color:
                    form.reward_coins === value
                      ? '#fff'
                      : '#8A9BB0',
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* CREATE BUTTON */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: loading
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, #4a9eff, #2d6be4)',
            color: loading ? '#8A9BB0' : '#fff',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          <Plus size={18} />

          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </div>
  );
}