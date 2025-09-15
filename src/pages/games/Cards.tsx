/**
 * Cards.tsx
 * 纸牌（记忆翻牌）游戏页面：翻牌配对、计步计时、胜利提示与重置；支持难度选择与最佳成绩存储。
 * 更新：
 * - 自动高度自适应：测量网格可用高度，按需 scale 缩放，保证尽量“一屏可见”。
 * - 新增“紧凑模式”开关：切换卡片纵横比 3:4 -> 1:1，并缩小网格间距。
 * - 继续使用自适应列数算法（16 张 => 4×4 等），保持整体均衡布局。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopBar from '../../components/TopBar'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { RotateCcw } from 'lucide-react'

/**
 * CardItem
 * 牌面数据：id 唯一标识，value 配对值，state 状态。
 */
interface CardItem {
  id: number
  value: number
  matched: boolean
  flipped: boolean
}

/**
 * shuffle
 * 简单洗牌算法（Fisher–Yates）。
 */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * bestKey
 * 生成本地存储 key（按难度区分）。
 */
const bestKey = (pairs: number, kind: 'moves' | 'seconds') => `cards_best_${pairs}_${kind}`

/**
 * getColumns
 * 根据总牌数与屏幕宽度给出更合理的列数。
 * 设计策略：
 * - 手机：固定 3 列，保障可点性；
 * - 平板：在 4–5 列范围内选择，使网格更接近正方形，并优先选择能整除的列数；
 * - 桌面：在 4–6 列范围内选择，同样优先“整除 + 近似正方形”。
 */
function getColumns(totalCards: number, vw: number): number {
  if (vw < 640) return 3
  const isTablet = vw < 1024
  const min = 4
  const max = isTablet ? 5 : 6

  // 在 [min, max] 区间内寻找最佳列数：先是否整除，再形状接近度
  let best = min
  let bestScore = Number.POSITIVE_INFINITY
  for (let c = min; c <= max; c++) {
    const rows = Math.ceil(totalCards / c)
    const remainder = totalCards % c
    const ratioDiff = Math.abs(c - rows)
    const notDivisible = remainder === 0 ? 0 : 1
    const score = notDivisible * 1000 + ratioDiff * 10 + remainder
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  return best
}

/**
 * CardsPage
 * 记忆翻牌主组件：支持难度选择、最佳成绩存储、紧凑模式与自动高度适配。
 */
const CardsPage: React.FC = () => {
  // 游戏状态
  const [pairs, setPairs] = useState<number>(8)
  const [deck, setDeck] = useState<CardItem[]>([])
  const [busy, setBusy] = useState(false)
  const busyRef = useRef<boolean>(false) // 同步忙碌锁：用于在同一事件循环内立刻阻断连点
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  // 布局与显示
  const [compact, setCompact] = useState<boolean>(false) // 紧凑模式开关
  const [scale, setScale] = useState<number>(1) // 自动高度缩放比例
  const gridWrapRef = useRef<HTMLDivElement | null>(null) // 网格外层容器（用于测量可用高度）
  const gridRef = useRef<HTMLDivElement | null>(null) // 网格元素（用于读取实际 gap 与宽度）

  // 记录已处理过的当前两张牌的组合，避免重复判定
  const lastPairRef = useRef<string | null>(null)
  // 保存当前的判定计时器
  const timerRef = useRef<number | null>(null)

  const bestMoves = Number(localStorage.getItem(bestKey(pairs, 'moves')) || 0)
  const bestSeconds = Number(localStorage.getItem(bestKey(pairs, 'seconds')) || 0)

  /**
   * setBusyState
   * 同步更新 busy state 与 ref，确保在同一事件中也能即时生效。
   */
  const setBusyState = useCallback((v: boolean) => {
    busyRef.current = v
    setBusy(v)
  }, [])

  /**
   * makeDeckFor
   * 根据配对数生成一副新牌。
   */
  const makeDeckFor = useCallback((count: number): CardItem[] => {
    const base = Array.from({ length: count }, (_, i) => i + 1)
    const d = shuffle([...base, ...base]).map((v, idx) => ({
      id: idx + 1,
      value: v,
      matched: false,
      flipped: false
    }))
    return d
  }, [])

  /**
   * reset
   * 重置/开始；可选地指定下一局的配对数，便于“立即生效”的难度切换。
   */
  const reset = useCallback(
    (nextPairs?: number) => {
      const p = typeof nextPairs === 'number' ? nextPairs : pairs
      setDeck(makeDeckFor(p))
      setMoves(0)
      setSeconds(0)
      setRunning(true)
      setBusyState(false)
      lastPairRef.current = null
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    },
    [pairs, makeDeckFor, setBusyState]
  )

  // 初始化 & 难度变化时重开（确保在只调用 setPairs 而未显式 reset 的场景也能生效）
  useEffect(() => {
    reset()
  }, [reset])

  // 计时器控制
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  // 当前翻开的（未匹配）两张
  const flipped = deck.filter((c) => c.flipped && !c.matched)

  /**
   * pairKey
   * 为“当前正待判定的两张牌”生成稳定的键，避免因数组引用变化导致副作用重复执行。
   */
  const pairKey = useMemo(() => {
    if (flipped.length !== 2) return ''
    const a = flipped[0]
    const b = flipped[1]
    return a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`
  }, [flipped])

  /**
   * handleFlip
   * 翻牌：点击未翻开的牌将其翻面。
   * 关键点：
   * - 使用 busyRef 作为“即时闸门”，在第二张牌翻开同一渲染周期内立即上锁，杜绝第三次点击竞态。
   */
  const handleFlip = useCallback(
    (id: number) => {
      if (busyRef.current || busy || !running) return
      setDeck((prev) => {
        const card = prev.find((c) => c.id === id)
        if (!card || card.flipped || card.matched) return prev

        // 生成翻开当前牌后的临时牌堆
        const next = prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))

        // 计算此刻翻开的未匹配牌数量，若为 2 立刻加锁，避免第三次点击
        const flippedNow = next.filter((c) => c.flipped && !c.matched)
        if (flippedNow.length === 2) {
          setBusyState(true)
        }

        return next
      })
    },
    [busy, running, setBusyState]
  )

  /**
   * 配对逻辑（基于稳定的 pairKey）
   * - 仅当 pairKey 从空 -> 非空（形成一对）时触发一次
   * - 使用 timerRef 保存计时器，避免在其它状态变更时被清理
   * - 计时结束后：匹配则标记 matched，不匹配则翻回；随后解锁 busy
   */
  useEffect(() => {
    // 若未处于“两张待判定”的状态，清理计时器并兜底解锁
    if (!pairKey) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      lastPairRef.current = null
      if (busy) setBusyState(false) // 兜底：异常情况下释放锁
      return
    }

    // 避免重复处理同一对
    if (lastPairRef.current === pairKey) return
    lastPairRef.current = pairKey

    // 双保险：达到两张时确保处于 busy 状态与步数+1
    setBusyState(true)
    setMoves((m) => m + 1)

    // 解析当前这一对的 id，并读取当下的牌面值做比较
    const [s1, s2] = pairKey.split('-')
    const id1 = Number(s1)
    const id2 = Number(s2)
    const a = deck.find((c) => c.id === id1)!
    const b = deck.find((c) => c.id === id2)!
    const isMatch = a.value === b.value

    timerRef.current = window.setTimeout(() => {
      setDeck((prev) =>
        prev.map((c) => {
          if (isMatch && (c.id === id1 || c.id === id2)) return { ...c, matched: true }
          if (!isMatch && (c.id === id1 || c.id === id2)) return { ...c, flipped: false }
          return c
        })
      )
      setBusyState(false)
      timerRef.current = null
    }, isMatch ? 250 : 700)

    // 当 pairKey 改变（进入下一对）或卸载时清理
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pairKey, deck, setBusyState, setDeck, busy])

  // 全配对判定
  const allMatched = useMemo(() => deck.length > 0 && deck.every((c) => c.matched), [deck])

  // 全配对后停止计时并写入最佳成绩
  useEffect(() => {
    if (allMatched) {
      setRunning(false)
      if (moves > 0 && (bestMoves === 0 || moves < bestMoves)) {
        localStorage.setItem(bestKey(pairs, 'moves'), String(moves))
      }
      if (seconds > 0 && (bestSeconds === 0 || seconds < bestSeconds)) {
        localStorage.setItem(bestKey(pairs, 'seconds'), String(seconds))
      }
    }
  }, [allMatched, bestMoves, bestSeconds, moves, pairs, seconds])

  /**
   * 屏幕宽度监听：用于计算列数
   */
  const [vw, setVw] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /**
   * columns
   * 根据难度与屏幕宽度的自适应列数
   */
  const columns = useMemo(() => getColumns(pairs * 2, vw), [pairs, vw])

  /**
   * ratio
   * 卡片纵横比：常规 3:4（1.33），紧凑模式 1:1（1）。
   */
  const ratio = compact ? 1 : 4 / 3

  /**
   * recomputeScale
   * 计算网格在视口中的最大可用高度，并按需缩放以“一屏可见”。
   * 逻辑：
   * - 读取网格所在容器距视口顶部的距离，得到可用高度 available。
   * - 依据列数、间距与卡片比例估算网格理论高度 gridHeight。
   * - scale = min(1, available / gridHeight)。
   */
  const recomputeScale = useCallback(() => {
    const wrap = gridWrapRef.current
    const grid = gridRef.current
    if (!wrap || !grid) {
      setScale(1)
      return
    }

    // 可用高度：视口底部到网格容器顶部的剩余空间，预留 24px 底部呼吸
    const rect = wrap.getBoundingClientRect()
    const available = Math.max(120, window.innerHeight - rect.top - 24)

    // 网格当前样式（真实 gap）
    const cs = getComputedStyle(grid)
    const colGap = parseFloat(cs.columnGap || '0')
    const rowGap = parseFloat(cs.rowGap || cs.columnGap || '0')

    const gridWidth = grid.clientWidth
    const cols = Math.max(1, columns)
    const rows = Math.max(1, Math.ceil(deck.length / cols))

    const cardWidth = (gridWidth - colGap * (cols - 1)) / cols
    const cardHeight = cardWidth * ratio
    const gridHeight = rows * cardHeight + rowGap * (rows - 1)

    const s = Math.min(1, available / gridHeight)
    setScale(Number.isFinite(s) && s > 0 ? s : 1)
  }, [columns, deck.length, ratio])

  // 首次与依赖变化时重新计算；窗口尺寸变化也更新
  useEffect(() => {
    const r = () => recomputeScale()
    r()
    window.addEventListener('resize', r)
    window.addEventListener('orientationchange', r as any)
    return () => {
      window.removeEventListener('resize', r)
      window.removeEventListener('orientationchange', r as any)
    }
  }, [recomputeScale])

  /**
   * renderCard
   * 渲染单张牌（正面数字/背面花纹），用 padding 百分比维持比例，并受紧凑模式影响。
   */
  const renderCard = (card: CardItem) => {
    const clickable = !(busy || !running || card.matched)
    return (
      <button
        key={card.id}
        onClick={() => handleFlip(card.id)}
        disabled={!clickable}
        aria-label={card.flipped || card.matched ? `牌 ${card.value}` : '未翻的牌'}
        className={[
          'relative w-full rounded-lg shadow-sm border transition',
          clickable ? 'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400' : 'opacity-80 cursor-default'
        ].join(' ')}
        style={{ paddingBottom: `${Math.round(ratio * 100)}%` }}
      >
        {/* 绝对定位内容层 */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          {/* 正面（数字） */}
          <div
            className={[
              'absolute inset-0 flex items-center justify-center text-2xl font-bold transition-all duration-300',
              card.flipped || card.matched ? 'opacity-100 scale-100 bg-indigo-500 text-white' : 'opacity-0 scale-90'
            ].join(' ')}
          >
            {card.value}
          </div>

          {/* 背面（花纹） */}
          <div
            className={['absolute inset-0 transition-opacity duration-300', card.flipped || card.matched ? 'opacity-0' : 'opacity-100'].join(' ')}
          >
            <div className="w-full h-full bg-neutral-50 dark:bg-neutral-800">
              {/* 花纹与边框增强可视性 */}
              <div className="w-full h-full border rounded-lg overflow-hidden">
                <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.15),transparent_40%)]" />
              </div>
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <TopBar
        title="纸牌（记忆翻牌）"
        thumbnailSrc="https://pub-cdn.sider.ai/u/U0E5HGEZ0W/web-coder/689d54efa616cfbf067663e8/resource/d102eb61-ed47-4479-bd96-069afa057518.jpg"
      />
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-6">
        {/* 左侧牌面区域：占满左侧 */}
        <div className="flex items-start">
          <div className="rounded-lg p-3 sm:p-4 bg-white dark:bg-neutral-900 border shadow-sm w-full">
            {/* 等比缩放容器：自动高度适配，一屏可见 */}
            <div ref={gridWrapRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {/* 自适应网格列数 */}
              <div
                ref={gridRef}
                className={['grid', compact ? 'gap-1.5 sm:gap-2 md:gap-3' : 'gap-2 sm:gap-3 md:gap-4'].join(' ')}
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {deck.map((card) => renderCard(card))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧信息与控制面板 */}
        <aside className="space-y-4">
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm space-y-2">
            <div className="text-sm text-muted-foreground">难度（配对数）</div>
            <select
              className="w-full rounded-md border bg-transparent px-3 py-2"
              value={pairs}
              onChange={(e) => {
                const n = Number(e.target.value)
                setPairs(n)
                reset(n) // 即时重开一局，用户直观感受“已切换成功”
              }}
              title="更改难度会重新开始"
            >
              {[6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n} 对（{n * 2} 张）
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">更改难度将重新开始游戏。</p>
          </div>

          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">步数</div>
              <div className="text-right font-bold text-lg">{moves}</div>
              <div className="text-muted-foreground">用时</div>
              <div className="text-right font-semibold">{seconds}s</div>
              <div className="text-muted-foreground">最佳步数</div>
              <div className="text-right">{bestMoves > 0 ? bestMoves : '-'}</div>
              <div className="text-muted-foreground">最佳用时</div>
              <div className="text-right">{bestSeconds > 0 ? `${bestSeconds}s` : '-'}</div>
            </div>
          </div>

          {/* 紧凑模式开关 */}
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">紧凑模式</div>
              <div className="text-xs text-muted-foreground">方形卡片与更小间距，便于在小屏“一屏显示全局”。</div>
            </div>
            <Switch checked={compact} onCheckedChange={(v) => setCompact(v)} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent" onClick={() => reset()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重新开始
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            提示：每回合翻两张牌，配对成功将保留正面。若显示不全，系统将自动压缩网格以适配当前视口。
          </div>
        </aside>
      </div>

      {allMatched && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 border rounded-lg p-6 text-center shadow-xl">
            <div className="text-xl font-bold mb-2">胜利！</div>
            <div className="text-sm text-muted-foreground mb-4">
              步数 {moves} · 用时 {seconds}s
            </div>
            <Button onClick={() => reset()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              再来一局
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardsPage
