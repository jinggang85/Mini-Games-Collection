/**
 * TankIcon.tsx
 * 卡通坦克图标（SVG）：包含履带、车身、炮塔与炮管，通过旋转表现朝向。
 */

import React from 'react'

/**
 * Direction
 * 朝向类型：上/右/下/左
 */
export type Direction = 'up' | 'right' | 'down' | 'left'

/**
 * TankIconProps
 * - variant: 敌我配色
 * - dir: 朝向
 * - className: 外层尺寸控制（通常由父容器 inset% 决定）
 */
export interface TankIconProps {
  variant: 'player' | 'enemy'
  dir: Direction
  className?: string
}

/**
 * dirToDeg
 * 将方向映射为顺时针角度（SVG 旋转使用）
 */
function dirToDeg(d: Direction): number {
  if (d === 'up') return 0
  if (d === 'right') return 90
  if (d === 'down') return 180
  return 270
}

/**
 * getColors
 * 根据阵营返回配色（近似 Tailwind）
 */
function getColors(variant: 'player' | 'enemy') {
  if (variant === 'player') {
    return {
      body: '#ec4899', // pink-500
      bodyDark: '#be185d', // pink-700
      turret: '#f472b6', // pink-400
      track: '#334155' // slate-700
    }
  }
  return {
    body: '#4f46e5', // indigo-600
    bodyDark: '#3730a3', // indigo-800
    turret: '#818cf8', // indigo-400
    track: '#334155' // slate-700
  }
}

/**
 * TankIcon
 * 使用 100x100 的 viewBox，元素以 (50,50) 为中心；通过 <g rotate> 表达朝向。
 */
const TankIcon: React.FC<TankIconProps> = ({ variant, dir, className }) => {
  const deg = dirToDeg(dir)
  const c = getColors(variant)

  return (
    <svg
      role="img"
      aria-label={variant === 'player' ? '玩家坦克' : '敌方坦克'}
      viewBox="0 0 100 100"
      className={className ? className : 'w-full h-full'}
    >
      {/* 柔和阴影 */}
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="rgba(0,0,0,0.25)" />
        </filter>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="black" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* 底层轻微高光背景 */}
      <rect x="8" y="8" width="84" height="84" rx="14" fill="transparent" />

      {/* 旋转组：包含履带、车体、炮塔与炮管 */}
      <g transform={`rotate(${deg} 50 50)`} filter="url(#softShadow)">
        {/* 履带（左右各一） */}
        <rect x="8" y="22" width="16" height="56" rx="6" fill={c.track} />
        <rect x="76" y="22" width="16" height="56" rx="6" fill={c.track} />
        {/* 履带纹理（凹槽） */}
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={`lt-${i}`} x="11" y={26 + i * 10} width="10" height="4" rx="2" fill="#0f172a" opacity="0.35" />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={`rt-${i}`} x="79" y={26 + i * 10} width="10" height="4" rx="2" fill="#0f172a" opacity="0.35" />
        ))}

        {/* 车身 */}
        <rect x="22" y="28" width="56" height="44" rx="10" fill={c.body} stroke={c.bodyDark} strokeWidth="2" />
        {/* 车身高光 */}
        <rect x="22" y="28" width="56" height="44" rx="10" fill="url(#bodyGrad)" />

        {/* 炮塔（圆形） */}
        <circle cx="50" cy="50" r="12" fill={c.turret} stroke={c.bodyDark} strokeWidth="2" />

        {/* 炮管（向上，整体随组旋转） */}
        <rect x="47" y="4" width="6" height="26" rx="3" fill={c.turret} stroke={c.bodyDark} strokeWidth="1.5" />

        {/* 舱盖小螺钉点缀 */}
        <circle cx="45" cy="45" r="2" fill="white" opacity="0.6" />
        <circle cx="55" cy="55" r="2" fill="white" opacity="0.6" />
        <circle cx="45" cy="55" r="2" fill="white" opacity="0.35" />
        <circle cx="55" cy="45" r="2" fill="white" opacity="0.35" />
      </g>
    </svg>
  )
}

export default TankIcon
