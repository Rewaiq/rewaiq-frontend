'use client';

export default function Spinner({ size = 44, fullscreen = false }) {
  const wrapper = fullscreen ? {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0A1628',
    zIndex: 9999,
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 200,
  };

  return (
    <div style={wrapper}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        animation: 'rwPulse 1.2s ease-in-out infinite',
      }}>
        <svg width={size} height={size * 0.8} viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spGrad" x1="0%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#7ec8ff"/>
              <stop offset="100%" stopColor="#1a3a8f"/>
            </linearGradient>
          </defs>
          <path d="M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z" fill="#1a3a8f"/>
          <path d="M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z" fill="url(#spGrad)"/>
          <path d="M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.0237 71.6257 72.4608 71.6478Z" fill="#2d6be4"/>
        </svg>
        <style>{`
          @keyframes rwPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.82); }
          }
        `}</style>
      </div>
    </div>
  );
}