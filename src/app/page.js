'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  const handleSplashComplete = () => {
    setShowSplash(false);
    const token = localStorage.getItem('rewaiq_token');
    if (token) {
      router.push('/home');
    } else {
      router.push('/welcome');
    }
  };

  return (
    <main>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </main>
  );
}