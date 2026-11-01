
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import LaunchAnnouncement from '@/components/LaunchAnnouncement';

export default function Home() {
  const [phase, setPhase] = useState('splash');
  const [mounted, setMounted] = useState(false);
  const [showLaunchAnnouncement, setShowLaunchAnnouncement] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSplashComplete = () => {
    setShowLaunchAnnouncement(true);
  };

  const handleLaunchAnnouncementClose = () => {
    setShowLaunchAnnouncement(false);

    const seen = localStorage.getItem('rewaiq_onboarded');
    const token = localStorage.getItem('rewaiq_token');

    if (token) {
      router.push('/home');
    } else if (seen) {
      router.push('/welcome');
    } else {
      setPhase('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('rewaiq_onboarded', 'true');
    router.push('/welcome');
  };

  if (!mounted) return null;

  return (
    <main>
      {phase === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {phase === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

      {showLaunchAnnouncement && (
        <LaunchAnnouncement onClose={handleLaunchAnnouncementClose} />
      )}
    </main>
  );
}
