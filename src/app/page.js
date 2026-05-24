'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleComplete = () => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('rewaiq_token');
      router.push(token ? '/home' : '/welcome');
    }
  };

  if (!mounted) return null;

  return (
    <main>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
    </main>
  );
}