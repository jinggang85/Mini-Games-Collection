/**
 * HomeTanksBadge.tsx
 * 首页用的“坦克大战迷你战场”图标：
 * - 渲染一个 7x7 的小棋盘背景
 * - 放置砖墙、钢墙与基地（简单几何图形）
 * - 放置玩家坦克（使用现有 TankIcon，朝上）
 * - 细微动效：炮口前端有轻微闪烁（ping）
 */

import React from 'react'
import TankIcon from './TankIcon'

/**
 * HomeTanksBadgeProps
 * - className: 外层尺寸控制
 */
export interface HomeTanksBadgeProps {
  className?: string
}

/**
 * cellRect
 * 将网格坐标映射为绝对定位样式。用于定位元素在迷你棋盘中的位置。
 */
function cellRect(x: number, y: number, GRID: number, insetPx = 2) {
  return {
    left: `calc(${(x / GRID) * 100}% + ${insetPx}px)`,
    top: `calc(${(y / GRID) * 100}% + ${insetPx}px)`,
    width: `calc(${(1 / GRID) * 100}% - ${insetPx * 2}px)`,
    height: `calc(${(1 / GRID) * 100}% - ${insetPx * 2}px)`,
  } as React.CSSProperties
}

/**
 * HomeTanksBadge
 * 在首页卡片中作为图标展示的“迷你坦克战场”。
 */
const HomeTanksBadge: React.FC<HomeTanksBadgeProps> = ({ className }) => {
  const GRID = 7

  // 简单地形：砖墙与钢墙坐标
  const bricks = [
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
    { x: 1, y: 2 }, { x: 5, y: 2 },
    { x: 3, y: 3 },
  ]
  const steels = [
    { x: 0, y: 0 }, { x: 6, y: 0 },
    { x: 0, y: 6 }, { x: 6, y: 6 },
  ]

  // 基地位于下方中央（宽两格）
  const baseCells = [
    { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 3, y: 6 },
    { x: 4, y: 5 }, { x: 4, y: 6 },
  ]

  // 玩家坦克位置（底部中间，朝上）
  const player = { x: 3, y: 5 }

  return (
    <div className={['w-full aspect-square', className].filter(Boolean).join(' ')}>
      <div
        className="relative grid gap-1.5 p-2"
        style={{
          gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom right, rgba(125,125,125,0.06), rgba(125,125,125,0.03))',
          borderRadius: 10,
        }}
        aria-label="Tanks miniature preview"
      >
        {/* 背景格子 */}
        {Array.from({ length: GRID }).map((_, y) =>
          Array.from({ length: GRID }).map((__, x) => (
            <div
              key={`bg-${x}-${y}`}
              className="relative w-full aspect-square rounded-sm bg-white/60 dark:bg-neutral-800/60 border border-black/5 overflow-hidden"
            />
          )),
        )}

        {/* 砖墙 */}
        {bricks.map((b, i) => (
          <div
            key={`brick-${i}`}
            className="absolute rounded-[2px] border"
            style={{
              ...cellRect(b.x, b.y, GRID),
              background:
                'linear-gradient(180deg, rgba(244,114,182,0.08), rgba(251,113,133,0.08))',
              borderColor: 'rgba(244,63,94,0.4)',
            }}
            aria-label="brick"
          />
        ))}

        {/* 钢墙 */}
        {steels.map((s, i) => (
          <div
            key={`steel-${i}`}
            className="absolute rounded-[2px] border"
            style={{
              ...cellRect(s.x, s.y, GRID),
              background:
                'linear-gradient(180deg, rgba(148,163,184,0.35), rgba(100,116,139,0.35))',
              borderColor: 'rgba(51,65,85,0.6)',
            }}
            aria-label="steel"
          />
        ))}

        {/* 基地（简单鹰形/城堡块组合） */}
        {baseCells.map((c, i) => (
          <div
            key={`base-${i}`}
            className="absolute rounded-[3px] bg-amber-400/90 dark:bg-amber-300/90 border border-amber-600/60"
            style={cellRect(c.x, c.y, GRID)}
            aria-label="base"
          />
        ))}
        {/* 基地顶部的旗帜（装饰） */}
        <div
          className="absolute"
          style={{
            left: `calc(${(3 / GRID) * 100}% + 6px)`,
            top: `calc(${(4.6 / GRID) * 100}% + 2px)`,
            width: 8,
            height: 12,
          }}
          aria-hidden
        >
          <div className="w-[2px] h-full bg-amber-700/80 mx-auto" />
          <div className="w-2 h-2 bg-red-500 rounded-[2px] -mt-2 mx-auto" />
        </div>

        {/* 玩家坦克 */}
        <div className="absolute" style={cellRect(player.x, player.y, GRID)}>
          <TankIcon variant="player" dir="up" />
          {/* 炮口微光 */}
          <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="h-2 w-2 rounded-full bg-white/80 dark:bg-white/70 animate-ping" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeTanksBadge
