/**
 * HomeSnakeBadge.tsx
 * 首页用的“贪吃蛇迷你场景”图标：
 * - 渲染一个 5x5 的小棋盘背景
 * - 放置蛇头、两节蛇身和一个食物（与游戏内风格一致的可爱 SVG）
 * - 细微动画：蛇头轻微 pulse，食物有小范围 ping 波纹
 */

import React from 'react'
import CuteSnake from './CuteSnake'
import CuteFood from './CuteFood'

/**
 * HomeSnakeBadgeProps
 * - className: 外层尺寸控制（会继承父级的大小）
 */
export interface HomeSnakeBadgeProps {
  className?: string
}

/**
 * HomeSnakeBadge
 * 在首页卡片中作为图标展示的“迷你贪吃蛇棋盘”。
 */
const HomeSnakeBadge: React.FC<HomeSnakeBadgeProps> = ({ className }) => {
  // 迷你棋盘规模
  const GRID = 5

  // 预设蛇与食物位置，营造“正在转弯”的画面
  const head = { x: 3, y: 1 } // 头在上方偏右
  const bodies = [
    { x: 2, y: 1 },
    { x: 1, y: 1 },
  ]
  const food = { x: 4, y: 3 } // 右下角一点位置

  // 工具：渲染一个单元格背景
  const renderCellBg = (x: number, y: number) => (
    <div
      key={`bg-${x}-${y}`}
      className="relative w-full aspect-square rounded-sm bg-white/60 dark:bg-neutral-800/60 border border-black/5 overflow-hidden"
    />
  )

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
        aria-label="Snake miniature preview"
      >
        {/* 背景格子 */}
        {Array.from({ length: GRID }).map((_, y) =>
          Array.from({ length: GRID }).map((__, x) => renderCellBg(x, y)),
        )}

        {/* 身体：两节，使用游戏同款卡通蛇身 */}
        {bodies.map((b) => (
          <div key={`body-${b.x}-${b.y}`} className="absolute" style={{
            left: `calc(${(b.x / GRID) * 100}% + 2px)`,
            top: `calc(${(b.y / GRID) * 100}% + 2px)`,
            width: `calc(${(1 / GRID) * 100}% - 4px)`,
            height: `calc(${(1 / GRID) * 100}% - 4px)`,
          }}>
            <CuteSnake part="body" className="w-full h-full" />
          </div>
        ))}

        {/* 蛇头：朝向右侧，轻微 pulse 动效 */}
        <div className="absolute animate-[pulse_3s_ease-in-out_infinite]" style={{
          left: `calc(${(head.x / GRID) * 100}% + 2px)`,
          top: `calc(${(head.y / GRID) * 100}% + 2px)`,
          width: `calc(${(1 / GRID) * 100}% - 4px)`,
          height: `calc(${(1 / GRID) * 100}% - 4px)`,
        }}>
          <CuteSnake part="head" dir="right" className="w-full h-full" />
        </div>

        {/* 食物：甜甜圈 + 轻微 ping 波纹 */}
        <div className="absolute" style={{
          left: `calc(${(food.x / GRID) * 100}% + 2px)`,
          top: `calc(${(food.y / GRID) * 100}% + 2px)`,
          width: `calc(${(1 / GRID) * 100}% - 4px)`,
          height: `calc(${(1 / GRID) * 100}% - 4px)`,
        }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-white/80 dark:bg-white/60 animate-ping" />
          </div>
          <div className="absolute inset-[18%]">
            <CuteFood kind="donut" className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeSnakeBadge
