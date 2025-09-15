/**
 * HomeTetrisBadge.tsx
 * 首页用“俄罗斯方块迷你场景”图标：
 * - 渲染 10x12 的小棋盘背景
 * - 放置 I / T / L 三种方块，颜色鲜明对比，风格接近游戏内
 * - 细微动效：一组小方块使用 animate-bounce 做轻微上下律动
 */

import React from 'react'

/** 单元格样式工具：按网格定位一个绝对定位的格 */
function cellStyle(x: number, y: number, cols: number, rows: number) {
  return {
    left: `calc(${(x / cols) * 100}% + 2px)`,
    top: `calc(${(y / rows) * 100}% + 2px)`,
    width: `calc(${(1 / cols) * 100}% - 4px)`,
    height: `calc(${(1 / rows) * 100}% - 4px)`,
  } as React.CSSProperties
}

/** 迷你棋盘格背景（仅渲染淡色格） */
function MiniCellBg({ x, y, cols, rows }: { x: number; y: number; cols: number; rows: number }) {
  return (
    <div
      key={`bg-${x}-${y}`}
      className="absolute rounded-[3px] bg-white/60 dark:bg-neutral-800/60 border border-black/5"
      style={cellStyle(x, y, cols, rows)}
    />
  )
}

/** 渲染一个 1x1 彩色小方块 */
function Block({ x, y, cols, rows, color, stroke = '#0f172a' }: {
  x: number; y: number; cols: number; rows: number; color: string; stroke?: string
}) {
  return (
    <div
      className="absolute"
      style={cellStyle(x, y, cols, rows)}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="5" y="5" width="90" height="90" rx="10" fill={color} stroke={stroke} strokeWidth="8" />
        <rect x="5" y="5" width="90" height="90" rx="10" fill="url(#hl)" />
        <defs>
          <radialGradient id="hl" cx="28%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

/**
 * HomeTetrisBadge
 * 10x12 迷你棋盘，摆放 I / T / L 三种方块；右侧一列使用 bounce 做轻微动效。
 */
const HomeTetrisBadge: React.FC<{ className?: string }> = ({ className }) => {
  const COLS = 10
  const ROWS = 12

  // 三种方块布局（坐标基于 COLS/ROWS）
  // T 形（紫色）
  const T = [
    { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
    { x: 4, y: 4 },
  ]
  // L 形（橙色）
  const L = [
    { x: 1, y: 6 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
  ]
  // I 形（青色），竖直；给予轻微 bounce 动效（看起来像在准备下落）
  const I = [
    { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 },
  ]

  return (
    <div className={['w-full aspect-square', className].filter(Boolean).join(' ')}>
      <div
        className="relative w-full h-full p-2 rounded-xl"
        style={{
          background: 'linear-gradient(to bottom right, rgba(125,125,125,0.06), rgba(125,125,125,0.03))',
        }}
        aria-label="Tetris miniature preview"
      >
        {/* 背景格子 */}
        <div className="absolute inset-0">
          {Array.from({ length: ROWS }).map((_, y) =>
            Array.from({ length: COLS }).map((__, x) => (
              <MiniCellBg key={`c-${x}-${y}`} x={x} y={y} cols={COLS} rows={ROWS} />
            )),
          )}
        </div>

        {/* 方块：T（紫） */}
        {T.map((p, i) => (
          <Block key={`t-${i}`} x={p.x} y={p.y} cols={COLS} rows={ROWS} color="#a78bfa" stroke="#6d28d9" />
        ))}
        {/* 方块：L（橙） */}
        {L.map((p, i) => (
          <Block key={`l-${i}`} x={p.x} y={p.y} cols={COLS} rows={ROWS} color="#fb923c" stroke="#c2410c" />
        ))}
        {/* 方块：I（青）带轻微动效 */}
        <div className="animate-bounce [animation-duration:2.5s]">
          {I.map((p, i) => (
            <Block key={`i-${i}`} x={p.x} y={p.y} cols={COLS} rows={ROWS} color="#22d3ee" stroke="#0e7490" />
          ))}
        </div>

        {/* 左右侧淡色描边，营造一丝“容器”感觉 */}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5" />
      </div>
    </div>
  )
}

export default HomeTetrisBadge
