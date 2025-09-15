/**
 * SnakeIcon.tsx
 * 贪吃蛇图标：由一串方块构成的“蛇身”，带清晰的蛇头方向。
 * 本次更新：
 * - 支持 dir（up/right/down/left）控制朝向
 * - 支持 animate，在首页作轻微摆动以吸引注意（SVG animateTransform）
 */

import React from 'react'

/** 方向类型 */
type Direction = 'up' | 'right' | 'down' | 'left'

/** 将方向映射为角度（顺时针） */
function dirToDeg(d: Direction): number {
  if (d === 'up') return 0
  if (d === 'right') return 90
  if (d === 'down') return 180
  return 270
}

/** SnakeIconProps */
export interface SnakeIconProps {
  className?: string
  /** 朝向（默认 right） */
  dir?: Direction
  /** 是否开启摆动动画（默认 false） */
  animate?: boolean
}

/**
 * SnakeIcon
 * 绿黄配色，突出“前进方向”；可选摆动动画用于首页吸引注意。
 */
const SnakeIcon: React.FC<SnakeIconProps> = ({ className, dir = 'right', animate = false }) => {
  const deg = dirToDeg(dir)
  return (
    <svg viewBox="0 0 100 100" className={className ?? 'w-full h-full'} role="img" aria-label="贪吃蛇图标">
      {/* 背板 */}
      <rect x="8" y="8" width="84" height="84" rx="12" fill="black" opacity="0.04" />
      {/* 外层方向组：控制整体朝向 */}
      <g transform={`rotate(${deg} 50 50)`}>
        {/* 内层摆动组（可选） */}
        <g>
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-3 50 50;3 50 50;-3 50 50"
              dur="2.6s"
              repeatCount="indefinite"
              additive="sum"
            />
          )}
          {/* 蛇身段（折线前进） */}
          {[
            { x: 20, y: 60 }, { x: 32, y: 60 }, { x: 44, y: 60 },
            { x: 56, y: 60 }, { x: 56, y: 48 }, { x: 56, y: 36 },
          ].map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width="10" height="10" rx="2" fill="#22c55e" />
          ))}
          {/* 头部（更亮，带眼睛） */}
          <rect x="60" y="32" width="14" height="14" rx="3" fill="#84cc16" stroke="#3f6212" strokeWidth="1.2" />
          <circle cx="69" cy="36" r="1.5" fill="white" />
          <circle cx="65" cy="36" r="1.5" fill="white" />
          {/* 食物（点缀） */}
          <circle cx="78" cy="22" r="4" fill="#fbbf24" />
        </g>
      </g>
    </svg>
  )
}

export default SnakeIcon
