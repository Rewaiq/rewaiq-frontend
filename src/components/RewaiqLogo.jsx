'use client';

export default function RewaiqLogo({ size = 28, showText = true, textColor = '#fff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Proportional Aspect Ratio Controller:
        Your logo canvas is 110 wide by 80 high. 
        Setting the height dynamically keeps the vector math flawless at any scale.
      */}
      <svg 
        width={size} 
        height={size * (80 / 110)} 
        viewBox="0 0 110 80"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* LEFT STEM - FULL HEIGHT (dark navy) */}
        <path 
          d="M11.0669 2.5 L11.0669 64.9132 Q11.0669 65.4111 12.0329 65.3886 L20.9163 58.5505 Q21.2945 58.2594 21.8251 58.2766 Q22.1875 58.2766 22.1875 58.5871 C30.0565 65.3295 39.3371 70.5626 49.5669 71.0497 L62.4764 71.0497 Q62.8488 71.0497 62.735 70.3446 L12.0548 27.3871 Q11.0669 26.5 11.0669 27.8448 L11.0669 2.5Z" 
          fill="#1a3a8f"
        />

        {/* TOP R BOWL / ARCH (dark navy) */}
        <path 
          d="M11.0669 2.5 L30.1509 0.75581 Q30.4085 0.0498 30.4085 0.0498 L70.5668 0.0498 C75.2261 0.0498 80.8853 1.84576 84.7261 3.97949 C88.5668 6.11322 92.6025 9.32724 95.0668 14.5498 C98.2216 21.2356 98.3844 26.7954 95.2261 33.4795 C92.4068 39.4461 84.8727 43.5938 82.6426 44.7581 Q82.2912 44.9415 81.5716 44.6254 L68.961 33.8163 Q68.5888 33.4972 69.1877 32.7063 C71.8809 31.7649 78.4652 28.7204 78.0668 21.5498 C77.5669 15.0498 70.5669 12.0498 67.5668 12.0498 L43.7858 12.0498 Q43.6444 12.0498 43.3994 11.9088 L11.0669 2.5Z" 
          fill="#1a3a8f"
        />

        {/* DIAGONAL BRIGHT SLASH (sky blue) */}
        <path 
          d="M12.2466 20.8923 C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093 C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418 C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666 C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144 L98.8583 66.325 Q99.196 66.611 98.712 67.3279 C90.4102 70.9338 84.6197 72.1928 72.4271 71.665 Q71.9846 71.6459 71.2195 71.1903 L12.2466 20.8923Z" 
          fill="#4a9eff"
        />

        {/* DIAGONAL SHADOW / LOWER SLASH (medium blue) */}
        <path 
          d="M72.4608 71.6478 C84.77 72.2692 90.6026 71.0456 98.9505 67.478 Q99.3591 67.3034 99.0994 66.4732 L63.7412 36.6038 C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853 L71.2682 71.1746 Q71.6014 71.4583 72.4608 71.6478Z" 
          fill="#2d6be4"
        />
      </svg>
      
      {showText && (
        <span style={{ 
          fontFamily: "'Montserrat', sans-serif", 
          fontWeight: 700, 
          fontSize: size * 0.68, // Precision text scaling based on the new mark profile
          color: textColor, 
          letterSpacing: '-0.01em' 
        }}>
          Rewaiq
        </span>
      )}
    </div>
  );
}