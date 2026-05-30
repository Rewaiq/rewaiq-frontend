{/* Artist guide */}
<div style={{ background: '#0D1F3C', borderRadius: 14, padding: '16px', marginBottom: 24, border: '1px solid rgba(212,160,23,0.2)' }}>
  <p style={{ fontSize: 12, fontWeight: 700, color: '#D4A017', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
    How It Works for Artists
  </p>
  {[
    { num: '01', text: 'Upload your track link from Audiomack, YouTube, TikTok or Facebook' },
    { num: '02', text: 'Set how many coins users earn per stream (min 5, max 50)' },
    { num: '03', text: 'Our team reviews and approves your track within 24 hours' },
    { num: '04', text: 'Your track appears in the Stream Feed — thousands of users stream it' },
    { num: '05', text: 'You get real streams and engagement on your music' },
  ].map(item => (
    <div key={item.num} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', background: 'rgba(212,160,23,0.1)', padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>
        {item.num}
      </span>
      <span style={{ fontSize: 13, color: '#8A9BB0', lineHeight: 1.5 }}>{item.text}</span>
    </div>
  ))}
</div>