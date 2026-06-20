'use client';

// 1. Structural Logo Symbol Vectors
const ICON_STEM        = "M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z";
const ICON_BRIGHT_SLSH = "M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9846 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z";
const ICON_DARK_SLASH  = "M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4583 72.4608 71.6478Z";
const ICON_BOWL        = "M43.3994 11.9088L30.1509 0.75581C29.8654 0.515512 30.0354 0.0498047 30.4085 0.0498047H70.5668C75.2261 0.0498047 80.8853 1.84576 84.7261 3.97949C88.5668 6.11322 92.6025 9.32724 95.0668 14.5498C98.2216 21.2356 98.3844 26.7954 95.2261 33.4795C92.4068 39.4461 84.8727 43.5938 82.6426 44.7581C82.2912 44.9415 81.8726 44.8833 81.5716 44.6254L68.961 33.8163C68.5888 33.4972 68.7249 32.8681 69.1877 32.7063C71.8809 31.7649 78.4652 28.7204 78.0668 21.5498C77.5669 15.0498 70.5669 12.0498 67.5668 12.0498H43.7858C43.6444 12.0498 43.5075 11.9999 43.3994 11.9088Z";

export default function Spinner({ size = 52, fullscreen = false }) {
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
    minHeight: 220,
  };

  return (
    <div style={wrapper}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <svg 
          width={size} 
          height={size * (104 / 109)} // Exact proportional layout formula
          viewBox="0 0 109 104" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="custom-loading-spinner"
        >
          <defs>
            <linearGradient id="paint0_linear" x1="61.9536" y1="36.7573" x2="11.0931" y2="8.90582" gradientUnits="userSpaceOnUse">
              <stop stopColor="#74CDFF"/>
              <stop offset="1" stopColor="#0450E4"/>
            </linearGradient>
            <linearGradient id="paint1_linear" x1="97.5469" y1="66.9169" x2="37.3154" y2="41.5855" gradientUnits="userSpaceOnUse">
              <stop stopColor="#75CEFF"/>
              <stop offset="1" stopColor="#014DE3"/>
            </linearGradient>
          </defs>

          {/* LEFT STEM */}
          <path 
            className="spinner-path path-stem"
            d={ICON_STEM}
            fill="#103272"
          />

          {/* TOP R BOWL */}
          <path 
            className="spinner-path path-bowl"
            d={ICON_BOWL}
            fill="#123575"
          />

          {/* DIAGONAL BRIGHT SLASH */}
          <path 
            className="spinner-path path-bright-slash"
            d={ICON_BRIGHT_SLSH}
            fill="url(#paint0_linear)"
          />

          {/* DIAGONAL SHADOW SLASH */}
          <path 
            className="spinner-path path-dark-slash"
            d={ICON_DARK_SLASH}
            fill="url(#paint1_linear)"
          />
        </svg>

        <style>{`
          .spinner-path {
            stroke-dasharray: 420;
            stroke-dashoffset: 420;
            animation: drawAndFill 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            transform-origin: center;
          }

          /* Tracing properties with customized stroke hues */
          .path-stem         { stroke: #103272; stroke-width: 1.2; animation-delay: 0.0s; }
          .path-bowl         { stroke: #123575; stroke-width: 1.2; animation-delay: 0.2s; }
          .path-bright-slash { stroke: #74CDFF; stroke-width: 1.2; animation-delay: 0.4s; }
          .path-dark-slash   { stroke: #75CEFF; stroke-width: 1.2; animation-delay: 0.6s; }

          @keyframes drawAndFill {
            0% {
              stroke-dashoffset: 420;
              fill-opacity: 0;
            }
            32% {
              stroke-dashoffset: 0;
              fill-opacity: 0;
            }
            48%, 78% {
              stroke-dashoffset: 0;
              fill-opacity: 1;
            }
            92%, 100% {
              stroke-dashoffset: 420;
              fill-opacity: 0;
            }
          }

          .custom-loading-spinner {
            animation: globalPulse 2.6s ease-in-out infinite;
          }
          @keyframes globalPulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(116,205,255,0)); }
            50% { transform: scale(1.04); filter: drop-shadow(0 6px 16px rgba(4,80,228,0.2)); }
          }
        `}</style>
      </div>
    </div>
  );
}