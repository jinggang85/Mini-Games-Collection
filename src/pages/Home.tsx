/**
 * Home.tsx
 * 首页：小游戏合集索引门户，展示各游戏入口卡片（使用卡通图标以替换占位图）。
 */

import React from 'react'
import GameCard from '../components/GameCard'
import HomeCardsBadge from '../components/icons/HomeCardsBadge'
import HomeTetrisBadge from '../components/icons/HomeTetrisBadge'

import HomeSnakeBadge from '../components/icons/HomeSnakeBadge'
import HomeTanksBadge from '../components/icons/HomeTanksBadge'

/**
 * HomePage
 * 展示欢迎横幅与游戏网格入口。
 */
const HomePage: React.FC = () => {
  const games = [
    {
      title: '纸牌（记忆翻牌）',
      description: '翻开两张相同的牌完成配对，支持难度与最佳成绩存档。',
      href: '/cards',
      icon: <HomeCardsBadge />,
      headerClassName: 'bg-gradient-to-br from-indigo-200 to-sky-200 dark:from-indigo-900/50 dark:to-sky-900/40'
    },
    {
      title: '俄罗斯方块',
      description: '支持影子投影、保存/交换、音效，旋转堆叠消行冲高分。',
      href: '/tetris',
      icon: <HomeTetrisBadge />,
      headerClassName: 'bg-gradient-to-br from-rose-200 to-amber-200 dark:from-rose-900/50 dark:to-amber-900/40'
    },
    {
      title: '贪吃蛇',
      description: '多地图与可调速度，蛇头方向清晰可见，吃食物变长！',
      href: '/snake',
      icon: <HomeSnakeBadge />,
      headerClassName: 'bg-gradient-to-br from-emerald-200 to-lime-200 dark:from-emerald-900/50 dark:to-lime-900/40'
    },
    {
      title: '坦克大战',
      description: '加入基地与防御，敌人多类型，关卡制体验更刺激。',
      href: '/tanks',
      icon: <HomeTanksBadge />,
      headerClassName: 'bg-gradient-to-br from-fuchsia-200 to-indigo-200 dark:from-fuchsia-900/50 dark:to-indigo-900/40'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <section className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">小游戏合集</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            精选四款经典小游戏，即点即玩。用键盘操作更畅快！
          </p>
        </section>

        <section>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((g) => (
              <GameCard key={g.href} {...g} />
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          提示：如遇键盘控制问题，请先点击游戏区域以获取焦点。
        </footer>
      </div>
    </div>
  )
}

export default HomePage
