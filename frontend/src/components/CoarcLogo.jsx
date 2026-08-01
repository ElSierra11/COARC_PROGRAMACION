import React from 'react';

export const CoarcLogo = ({ className = "h-12 w-auto", onClick }) => {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-98 transition-all ${className}`} title="Ir al Menú Principal de Programación">
      <div className="relative w-11 h-13 flex-shrink-0">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
          {/* Shield Border */}
          <path
            d="M 10,10 L 90,10 L 90,70 Q 90,110 50,118 Q 10,110 10,70 Z"
            fill="#0B2580"
            stroke="#D97706"
            strokeWidth="5"
          />
          {/* Top Section Background */}
          <path
            d="M 12,12 L 88,12 L 88,48 L 12,48 Z"
            fill="#FFFDF5"
          />
          {/* Middle Banner */}
          <rect x="12" y="48" width="76" height="22" fill="#78350F" />
          
          {/* COARC Text */}
          <text x="50" y="30" textAnchor="middle" fill="#0B2580" fontSize="19" fontWeight="900" fontFamily="sans-serif">COARC</text>
          <text x="50" y="42" textAnchor="middle" fill="#78350F" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">CORPORACIÓN ARBITRAL DE CÓRDOBA</text>

          {/* ARBITRO Text */}
          <text x="50" y="64" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">ÀRBITRO</text>

          {/* Inner Circle / Whistle & Ball Icon */}
          <circle cx="50" cy="90" r="18" fill="#1D4ED8" stroke="#D97706" strokeWidth="2" />
          {/* Soccer Ball Pattern SVG */}
          <circle cx="50" cy="90" r="9" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
          <polygon points="50,85 53,88 52,92 48,92 47,88" fill="#000" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-lg tracking-tight text-blue-900 dark:text-blue-400 leading-none">
          COARC
        </span>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase leading-snug">
          Corporación Arbitral de Córdoba
        </span>
      </div>
    </div>
  );
};
