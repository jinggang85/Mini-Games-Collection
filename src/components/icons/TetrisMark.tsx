/**
 * TetrisMark.tsx
 * 俄罗斯方块图标：由彩色小方块构成的“Tetrimino”组合。
 */

import React from 'react'

/**
 * Block
 * 渲染单个彩色小块。
 */
function Block({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <rect x={x} y={y} width={18} height={18} rx={3} fill={color} />
  )
}

/**
 * TetrisMark
 * 多色积木组合，突出“堆叠”的感觉。
 */
const TetrisMark: React.FC<{ className?: string }> = ({ className }) => {
  // 画布 100x100，积木区域大致 72x72 居中
  const offX = 14
  const offY = 14
  return (
    <svg viewBox="0 0 100 100" className={className ?? 'w-full h-full'} role="img" aria-label="俄罗斯方块图标">
      {/* 阴影底 */}
      <rect x="10" y="10" width="80" height="80" rx="12" fill="black" opacity="0.04" />
      <g transform={`translate(${offX}, ${offY})`}>
        {/* “T” 形与“L” 形组合 */}
        <Block x={0} y={0} color="#f87171" />
        <Block x={20} y={0} color="#f87171" />
        <Block x={40} y={0} color="#f87171" />
        <Block x={20} y={20} color="#f97316" />

        <Block x={0} y={40} color="#34d399" />
        <Block x={0} y={60} color="#34d399" />
        <Block x={20} y={60} color="#34d399" />
        <Block x={40} y={60} color="#60a5fa" />
        <Block x={60} y={60} color="#60a5fa" />
        <Block x={60} y={40} color="#60a5fa" />
      </g>
    </svg>
  )
}

export default TetrisMark
