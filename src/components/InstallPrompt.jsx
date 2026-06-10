'use client';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, background: '#0D1F3C', border: '1px solid rgba(74,158,255,0.3)', borderRadius: 16, padding: '16px', zIndex: 999, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Download size={22} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Install Rewaiq App</p>
        <p style={{ fontSize: 12, color: '#8A9BB0', margin: '2px 0 0' }}>Add to home screen for best experience</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={18} color="#8A9BB0" />
        </button>
        <button onClick={handleInstall}
          style={{ background: '#4a9eff', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Install
        </button>
      </div>
    </div>
  );
}