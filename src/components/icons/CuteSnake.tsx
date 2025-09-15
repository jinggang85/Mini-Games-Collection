/**
 * CuteSnake.tsx
 * 提供贪吃蛇的卡通造型组件：
 * - CuteSnakeHead：带眼睛、微笑与舌头，可通过 dir 旋转明确朝向
 * - CuteSnakeBody：圆角方块，带柔和渐变
 * - 默认导出 CuteSnake：一个小型“路由组件”，通过 part 渲染 Head 或 Body
 */

import React from 'react'

/**
 * Direction
 * 方向类型：上/右/下/左
 */
export type Direction = 'up' | 'right' | 'down' | 'left'

/**
 * dirToDeg
 * 将方向映射为顺时针角度（用于 SVG 旋转）
 */
function dirToDeg(d: Direction): number {
  if (d === 'up') return 0
  if (d === 'right') return 90
  if (d === 'down') return 180
  return 270
}

/**
 * CuteSnakeHeadProps
 * - dir: 头部朝向
 * - className: 外层尺寸样式
 * - color: 主体颜色
 */
export interface CuteSnakeHeadProps {
  dir: Direction
  className?: string
  color?: string
}

/**
 * CuteSnakeHead
 * 卡通蛇头：绿色主体，眼睛+笑口+吐舌；通过旋转表达朝向。
 */
export const CuteSnakeHead: React.FC<CuteSnakeHeadProps> = ({
  dir,
  className,
  color = '#22c55e',
}) => {
  const deg = dirToDeg(dir)
  return (
    <svg
      viewBox="0 0 100 100"
      className={className ?? 'w-full h-full'}
      role="img"
      aria-label="Snake head"
    >
      <defs>
        <radialGradient id="snakeHeadHL" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </radialGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="2" floodColor="rgba(0,0,0,0.25)" />
        </filter>
      </defs>

      <g transform={`rotate(${deg} 50 50)`} filter="url(#softShadow)">
        {/* 头部主体 */}
        <rect x="12" y="12" width="76" height="76" rx="22" fill={color} stroke="#15803d" strokeWidth="2.5" />
        {/* 高光 */}
        <rect x="12" y="12" width="76" height="76" rx="22" fill="url(#snakeHeadHL)" />

        {/* 眼睛（黑色） */}
        <circle cx="35" cy="38" r="5" fill="#0f172a" />
        <circle cx="65" cy="38" r="5" fill="#0f172a" />
        {/* 腮红 */}
        <circle cx="25" cy="52" r="4.5" fill="#fda4af" opacity="0.65" />
        <circle cx="75" cy="52" r="4.5" fill="#fda4af" opacity="0.65" />

        {/* 微笑 */}
        <path d="M32,60 C45,72 55,72 68,60" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

        {/* 小舌头（朝向上时位于下沿，整体随组旋转） */}
        <path d="M48,76 L52,76 L52,92 L50,90 L48,92 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
      </g>
    </svg>
  )
}

/**
 * CuteSnakeBodyProps
 * - className: 外层尺寸样式
 * - color: 主体颜色
 */
export interface CuteSnakeBodyProps {
  className?: string
  color?: string
}

/**
 * CuteSnakeBody
 * 卡通蛇身：圆角方块，内置柔和渐变与描边。
 */
export const CuteSnakeBody: React.FC<CuteSnakeBodyProps> = ({ className, color = '#22c55e' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className ?? 'w-full h-full'}
      role="img"
      aria-label="Snake body"
    >
      <defs>
        <radialGradient id="snakeBodyHL" cx="28%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
        </radialGradient>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="18" fill={color} stroke="#166534" strokeWidth="2.2" />
      <rect x="10" y="10" width="80" height="80" rx="18" fill="url(#snakeBodyHL)" />
    </svg>
  )
}

/**
 * CuteSnakeProps
 * 作为默认导出的“路由组件”：
 * - part 为 'head' 时，必须提供 dir
 * - part 为 'body' 时，不需要 dir
 */
export type CuteSnakeProps =
  | { part: 'head'; dir: Direction; className?: string; color?: string }
  | { part: 'body'; className?: string; color?: string }

/**
 * CuteSnake
 * 根据 part 渲染 Head 或 Body，使调用方（棋盘格）能用统一组件。
 */
const CuteSnake: React.FC<CuteSnakeProps> = (props) => {
  if (props.part === 'head') {
    const { dir, className, color } = props
    return <CuteSnakeHead dir={dir} className={className} color={color} />
  }
  const { className, color } = props
  return <CuteSnakeBody className={className} color={color} />
}

export default CuteSnake
