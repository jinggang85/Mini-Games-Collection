/**
 * HomeCardsBadge.tsx
 * 首页用“记忆翻牌迷你场景”图标：
 * - 两张卡片错位叠放：一张正面(A♥)，一张背面（棋盘纹理）
 * - 使用轻微的 pulse 与 rotate 营造灵动感（不过度干扰）
 */

import React from 'react'

/** 单张卡片外观（SVG绘制边框+投影，高对比） */
function CardShell({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={['relative rounded-xl shadow-sm', className].filter(Boolean).join(' ')}>
      <svg viewBox="0 0 100 140" className="w-full h-full">
        <defs>
          <linearGradient id="cardHL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="90" height="130" rx="12" fill="#ffffff" stroke="#1f2937" strokeWidth="3" />
        <rect x="5" y="5" width="90" height="130" rx="12" fill="url(#cardHL)" />
      </svg>
      <div className="absolute inset-0 p-3">{children}</div>
    </div>
  )
}

/** 卡片背面（棋盘纹理） */
function CardBack() {
  return (
    <CardShell>
      <div className="w-full h-full rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-1 w-full h-full">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className={i % 2 === 0 ? 'bg-indigo-300/70' : 'bg-indigo-400/70'}
            />
          ))}
        </div>
      </div>
    </CardShell>
  )
}

/** 卡片正面（A ♥） */
function CardFront() {
  return (
    <CardShell>
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* 大爱心 */}
        <svg viewBox="0 0 100 90" className="w-[60%] h-auto">
          <path
            d="M50 78 C 40 65, 18 56, 18 36 C 18 24, 28 16, 38 16 C 44 16, 48 18, 50 22 C 52 18, 56 16, 62 16 C 72 16, 82 24, 82 36 C 82 56, 60 65, 50 78 Z"
            fill="#ef4444"
            stroke="#991b1b"
            strokeWidth="3"
          />
        </svg>
        {/* 角标 A 与 ♥ */}
        <div className="absolute left-3 top-2 text-[14px] leading-none font-bold text-rose-600">
          <div>A</div>
          <div className="-mt-0.5">♥</div>
        </div>
        <div className="absolute right-3 bottom-2 text-[14px] leading-none font-bold text-rose-600 rotate-180">
          <div>A</div>
          <div className="-mt-0.5">♥</div>
        </div>
      </div>
    </CardShell>
  )
}

/**
 * HomeCardsBadge
 * 两张卡片：上层为 A♥ 正面，下层为背面；轻微旋转与呼吸动效。
 */
const HomeCardsBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={['w-full aspect-square', className].filter(Boolean).join(' ')}>
      <div
        className="relative w-full h-full p-3 rounded-xl"
        style={{
          background: 'linear-gradient(to bottom right, rgba(125,125,125,0.06), rgba(125,125,125,0.03))',
        }}
        aria-label="Cards miniature preview"
      >
        {/* 背面卡（左后方） */}
        <div
          className="absolute w-[58%] h-[70%] left-[14%] top-[18%] rotate-[-8deg] drop-shadow-sm"
        >
          <CardBack />
        </div>

        {/* 正面卡（前景） */}
        <div className="absolute w-[58%] h-[70%] left-[28%] top-[10%] rotate-[8deg] animate-pulse [animation-duration:2.6s]">
          <CardFront />
        </div>

        {/* 外描边 */}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5" />
      </div>
    </div>
  )
}

export default HomeCardsBadge
