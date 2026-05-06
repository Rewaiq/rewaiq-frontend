'use client';
import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <main>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      {!showSplash && (
        <div>
          {/* Next screen goes here */}
          <p style={{ color: 'white', textAlign: 'center', marginTop: '50vh' }}>
            App Loading...
          </p>
        </div>
      )}
    </main>
  );
}