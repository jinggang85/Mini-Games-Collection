/**
 * CuteFood.tsx
 * 提供卡通食物图标：苹果 / 草莓 / 甜甜圈（纯 SVG，可缩放）。
 */

import React from 'react'

/**
 * FoodKind
 * 食物类型
 */
export type FoodKind = 'apple' | 'strawberry' | 'donut'

/**
 * CuteFoodProps
 * - kind: 食物种类
 * - className: 外层尺寸样式
 */
export interface CuteFoodProps {
  kind: FoodKind
  className?: string
}

/**
 * AppleIcon
 * 卡通苹果：红色主体+叶片+高光
 */
const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className ?? 'w-full h-full'} role="img" aria-label="Apple">
    <defs>
      <radialGradient id="appleHL" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
      </radialGradient>
    </defs>
    <path d="M28 40 C28 25, 44 22, 50 32 C56 22, 72 25, 72 40 C72 66, 56 78, 50 78 C44 78, 28 66, 28 40 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
    <path d="M50 28 C52 22, 58 16, 66 16" stroke="#14532d" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="70" cy="20" rx="10" ry="6" fill="#22c55e" stroke="#166534" strokeWidth="2" transform="rotate(-20 70 20)" />
    <path d="M32 36 C40 34, 48 34, 56 36" fill="none" stroke="#b91c1c" strokeWidth="1.5" opacity="0.25" />
    <path d="M34 38 C40 36, 46 36, 52 38" fill="none" stroke="#b91c1c" strokeWidth="1.2" opacity="0.2" />
    <path d="M30 42 C36 35, 45 31, 55 33" fill="url(#appleHL)" />
  </svg>
)

/**
 * StrawberryIcon
 * 卡通草莓：心形主体+芝麻籽点缀
 */
const StrawberryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className ?? 'w-full h-full'} role="img" aria-label="Strawberry">
    <defs>
      <radialGradient id="stHL" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
      </radialGradient>
    </defs>
    <path d="M50 22 C56 14, 70 18, 70 30 C80 34, 84 44, 78 56 C72 70, 60 78, 50 84 C40 78, 28 70, 22 56 C16 44, 20 34, 30 30 C30 18, 44 14, 50 22 Z" fill="#f43f5e" stroke="#9f1239" strokeWidth="2.5" />
    {/* 叶片 */}
    <path d="M50 22 C54 18, 60 18, 64 22 C60 22, 56 24, 50 24 C44 24, 40 22, 36 22 C40 18, 46 18, 50 22 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1.8" />
    {/* 籽 */}
    {[...Array(10)].map((_, i) => {
      const x = 35 + (i % 5) * 8
      const y = 44 + Math.floor(i / 5) * 10
      return <ellipse key={i} cx={x} cy={y} rx="2.2" ry="3" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" />
    })}
    <path d="M30 30 L70 30 L50 24 Z" fill="url(#stHL)" />
  </svg>
)

/**
 * DonutIcon
 * 卡通甜甜圈：面团+糖霜+彩针
 */
const DonutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className ?? 'w-full h-full'} role="img" aria-label="Donut">
    <defs>
      <radialGradient id="dnHL" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
      </radialGradient>
    </defs>
    {/* 面团 */}
    <circle cx="50" cy="50" r="32" fill="#f59e0b" stroke="#b45309" strokeWidth="2.2" />
    <circle cx="50" cy="50" r="12" fill="#fde68a" stroke="#b45309" strokeWidth="1.6" />
    {/* 糖霜 */}
    <path d="M20 46 C28 38, 40 42, 50 40 C60 38, 72 36, 80 44 L80 52 C72 60, 60 58, 50 60 C40 62, 28 60, 20 54 Z" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.8" />
    {/* 彩针 */}
    {[...Array(12)].map((_, i) => {
      const colors = ['#f87171', '#34d399', '#60a5fa', '#fbbf24']
      const x = 28 + (i % 6) * 8
      const y = i < 6 ? 44 : 56
      return <rect key={i} x={x} y={y} width="3.5" height="1.5" rx="0.8" fill={colors[i % colors.length]} />
    })}
    <circle cx="50" cy="50" r="32" fill="url(#dnHL)" />
  </svg>
)

/**
 * CuteFood
 * 根据 kind 渲染对应的可爱食物。
 */
export const CuteFood: React.FC<CuteFoodProps> = ({ kind, className }) => {
  if (kind === 'strawberry') return <StrawberryIcon className={className} />
  if (kind === 'donut') return <DonutIcon className={className} />
  return <AppleIcon className={className} />
}

export default CuteFood
