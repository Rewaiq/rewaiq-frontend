'use client';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <XCircle size={60} color="#F87171" style={{ marginBottom: 20 }} />
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
        Authentication Failed
      </h2>
      <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 32, textAlign: 'center' }}>
        Something went wrong with Google sign in. Please try again.
      </p>
      <button onClick={() => router.push('/login')}
        style={{ padding: '14px 32px', borderRadius: 12, background: '#4a9eff', color: '#fff', fontSize: 15, fontWeight: 700 }}>
        Back to Login
      </button>
    </div>
  );
}