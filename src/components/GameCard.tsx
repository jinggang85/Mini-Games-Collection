/**
 * GameCard.tsx
 * 首页游戏入口卡片：支持图标插画或智能占位图；展示标题、描述与进入按钮。
 */

import React from 'react'
import { Button } from './ui/button'

/**
 * GameCardProps
 * - title: 标题
 * - description: 简短描述
 * - href: 路由（形如 /tetris）
 * - imageKeyword: 智能占位图关键词（当未提供 icon 时使用）
 * - icon: 可选自定义插画（SVG/ReactNode）
 * - headerClassName: 顶部背景样式（渐变色等，仅在 icon 模式下使用）
 */
export interface GameCardProps {
  title: string
  description: string
  href: string
  imageKeyword?: string
  icon?: React.ReactNode
  headerClassName?: string
}

/**
 * GameCard
 * 若传入 icon，则渲染彩色头图+图标；否则回退到 smart placeholder。
 */
const GameCard: React.FC<GameCardProps> = ({ title, description, href, imageKeyword, icon, headerClassName }) => {
  const link = `#${href.startsWith('/') ? href : `/${href}`}`

  return (
    <div className="rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border shadow-sm flex flex-col">
      {/* 头图 */}
      {icon ? (
        <div className={['relative h-36 w-full flex items-center justify-center', headerClassName ?? 'bg-gradient-to-br from-indigo-200 to-teal-200 dark:from-indigo-900/40 dark:to-teal-900/40'].join(' ')}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(600px_120px_at_10%_0%,white,transparent)]" />
          <div className="w-24 h-24">{icon}</div>
        </div>
      ) : (
        <div className="h-36 w-full overflow-hidden">
          <img
            src={`https://pub-cdn.sider.ai/u/U0E5HGEZ0W/web-coder/689d54efa616cfbf067663e8/resource/1f9fad46-7882-41f7-8f9a-6a63445501a0.jpg`}
            alt={`${title} 配图`}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* 文本与按钮 */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-semibold">{title}</div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{description}</p>
        <div className="mt-4">
          <a href={link} aria-label={`进入 ${title}`}>
            <Button className="w-full">进入游戏</Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default GameCard
