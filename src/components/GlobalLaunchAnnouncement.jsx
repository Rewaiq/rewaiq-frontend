
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LaunchAnnouncement from '@/components/LaunchAnnouncement';

export default function GlobalLaunchAnnouncement() {
  const pathname = usePathname();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    try {
      if (
        sessionStorage.getItem('rewaiq-launch-ad-dismissed') === 'yes'
      ) {
        return;
      }

      setShowAnnouncement(true);
    } catch {
      setShowAnnouncement(true);
    }
  }, []);

  // The homepage has its own announcement after the splash screen.
  if (pathname === '/') return null;

  if (!showAnnouncement) return null;

  return (
    <LaunchAnnouncement
      onClose={() => setShowAnnouncement(false)}
    />
  );
}
