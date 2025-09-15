/**
 * TopBar.tsx
 * 顶部栏：返回首页 + 标题。为了性能与统一风格，去除缩略图渲染。
 * - 兼容旧用法：保留 thumbnailSrc?: string 的 prop，但不再使用（被忽略）。
 * - 不加载任何外部图片资源，避免不必要的网络请求。
 */

import React from 'react'
import { Link } from 'react-router'

/**
 * TopBarProps
 * - title: 标题文本
 * - thumbnailSrc: 兼容旧参数（已废弃，不渲染）
 */
export interface TopBarProps {
  title: string
  thumbnailSrc?: string // deprecated, ignored
}

/**
 * TopBar
 * 简洁头部，不包含缩略图。左侧返回首页，右侧预留可扩展区（目前为空）。
 */
const TopBar: React.FC<TopBarProps> = ({ title }) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="返回首页"
            className="text-sm sm:text-base text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            ← 返回首页
          </Link>
          <div className="h-3 w-px bg-neutral-300/80 dark:bg-neutral-700/60" />
          <h1 className="text-sm sm:text-base font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 预留：右侧操作位（例如帮助/设置） */}
        </div>
      </div>
    </header>
  )
}

export default TopBar
