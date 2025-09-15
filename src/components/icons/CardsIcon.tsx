/**
 * CardsIcon.tsx
 * 纸牌（翻牌记忆）卡通图标：两张叠放的卡片与爱心符号。
 */

import React from 'react'

/**
 * CardsIcon
 * 简洁 SVG，突出“卡片”意象。
 */
const CardsIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 100 100" className={className ?? 'w-full h-full'} role="img" aria-label="纸牌图标">
      <defs>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="cardGrad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>

      {/* 背卡 */}
      <rect x="14" y="18" width="52" height="70" rx="10" fill="url(#cardGrad)" opacity="0.9" />
      <rect x="14" y="18" width="52" height="70" rx="10" fill="white" opacity="0.12" />
      {/* 前卡 */}
      <rect x="34" y="12" width="52" height="76" rx="12" fill="url(#cardGrad2)" />
      <rect x="34" y="12" width="52" height="76" rx="12" fill="white" opacity="0.1" />

      {/* 爱心符号 */}
      <path
        d="M66 48c0-4.4-3.2-8-7.4-8-2.5 0-4.8 1.2-6.1 3.1A7.4 7.4 0 0 0 46.4 40C42.2 40 39 43.6 39 48c0 9.7 13.5 16.4 13.5 16.4S66 57.7 66 48z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  )
}

export default CardsIcon
