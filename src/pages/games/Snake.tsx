/**
 * Snake.tsx
 * 贪吃蛇（移动端适配 + 倒计时提示音 + 速度选择 + 粒子反馈）
 * 状态机：idle → countdown → running → paused → ended
 * - 触屏：显示虚拟方向键与暂停按钮（仅触屏设备）
 * - 响应式：棋盘宽度 min(92vw, 560px)；gap/padding 响应式
 * - 倒计时：3→2→1 提示音+缩放动画；开始时不自动开局
 * - 难度：速度选择（Easy/Normal/Hard/Extreme）
 * - 反馈：吃到食物时，蛇头轻微缩放+食物格波纹粒子
 * - 本次更新：食物类型随机（苹果/草莓/甜甜圈），开始后自动聚焦支持键盘
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopBar from '../../components/TopBar'
import { Button } from '../../components/ui/button'
import { Pause, Play, RotateCcw } from 'lucide-react'
import CuteSnake from '../../components/icons/CuteSnake'
import CuteFood, { type FoodKind } from '../../components/icons/CuteFood'
import OrientationHint from '../../components/OrientationHint'
import TouchControls, { Dir } from '../../components/TouchControls'
import useIsTouch from '../../hooks/useIsTouch'

/** 方向类型 */
type GameDir = 'up' | 'down' | 'left' | 'right'
/** 游戏阶段 */
type GameStatus = 'idle' | 'countdown' | 'running' | 'paused' | 'ended'

/** 点坐标 */
interface Point { x: number; y: number }

/** 棋盘规模 */
const GRID = 18

/** 难度选项 */
const SPEED_OPTIONS: Array<{ key: string; label: string; tick: number }> = [
  { key: 'easy', label: 'Easy', tick: 170 },
  { key: 'normal', label: 'Normal', tick: 140 },
  { key: 'hard', label: 'Hard', tick: 110 },
  { key: 'extreme', label: 'Extreme', tick: 80 },
]

/** 将方向映射为坐标增量 */
function delta(d: GameDir) {
  return d === 'up'
    ? { x: 0, y: -1 }
    : d === 'down'
    ? { x: 0, y: 1 }
    : d === 'left'
    ? { x: -1, y: 0 }
    : { x: 1, y: 0 }
}

/** 生成一个不与蛇重叠的随机食物点 */
function randomFood(used: Set<string>): Point {
  while (true) {
    const x = Math.floor(Math.random() * GRID)
    const y = Math.floor(Math.random() * GRID)
    const k = `${x},${y}`
    if (!used.has(k)) return { x, y }
  }
}

/** 随机一种食物类型 */
function randomFoodKind(): FoodKind {
  const kinds: FoodKind[] = ['apple', 'strawberry', 'donut']
  return kinds[Math.floor(Math.random() * kinds.length)]
}

/** 简易 beep 音效（Web Audio Oscillator） */
const getAudioCtx = (() => {
  let ctx: AudioContext | null = null
  return () => {
    if (typeof window === 'undefined') return null
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    return ctx
  }
})()

/** 播放短促的哔声 */
function playBeep(freq = 600, ms = 110) {
  const ac = getAudioCtx()
  if (!ac) return
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  o.connect(g)
  g.connect(ac.destination)
  const now = ac.currentTime
  g.gain.setValueAtTime(0.001, now)
  g.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, now + ms / 1000)
  o.start(now)
  o.stop(now + ms / 1000 + 0.02)
}

/** 粒子（波纹）用于吃到食物时的视觉反馈 */
interface Pulse {
  id: string
  x: number
  y: number
  until: number
}

/**
 * SnakePage
 * 主组件：状态机、键盘/触屏输入、主循环与渲染
 */
const SnakePage: React.FC = () => {
  // 初始蛇体（水平向右）
  const initialSnake: Point[] = [
    { x: 3, y: 3 },
    { x: 2, y: 3 },
    { x: 1, y: 3 },
  ]

  // 基础状态
  const [status, setStatus] = useState<GameStatus>('idle')
  const [dir, setDir] = useState<GameDir>('right')
  const [snake, setSnake] = useState<Point[]>(initialSnake)
  const [food, setFood] = useState<Point>(() =>
    randomFood(new Set(initialSnake.map((p) => `${p.x},${p.y}`))),
  )
  /** 本次新增：随机食物类型 */
  const [foodKind, setFoodKind] = useState<FoodKind>(() => randomFoodKind())

  const [score, setScore] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [speedKey, setSpeedKey] = useState<string>('normal') // 难度选择
  const tickMs = SPEED_OPTIONS.find((s) => s.key === speedKey)?.tick ?? 140

  // 粒子与蛇头缩放反馈
  const [pulses, setPulses] = useState<Pulse[]>([])
  const [headPulseUntil, setHeadPulseUntil] = useState<number>(0)

  // 引用：用于 interval 内读取最新状态
  const statusRef = useRef(status)
  const dirRef = useRef(dir)
  const snakeRef = useRef(snake)
  const tickRef = useRef<number | null>(null)
  useEffect(() => void (statusRef.current = status), [status])
  useEffect(() => void (dirRef.current = dir), [dir])
  useEffect(() => void (snakeRef.current = snake), [snake])

  /** 棋盘焦点与键盘输入 */
  const boardRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    boardRef.current?.focus()
  }, [])

  /** 开局/再开：进入 3 秒倒计时 */
  const beginCountdown = useCallback(() => {
    setCountdown(3)
    setStatus('countdown')
  }, [])

  /** 倒计时结束：开始运行 */
  const startRun = useCallback(() => {
    setStatus('running')
  }, [])

  /** 完整重置为待开始 */
  const reset = useCallback(() => {
    const init = [...initialSnake]
    setSnake(init)
    setDir('right')
    setScore(0)
    setFood(randomFood(new Set(init.map((p) => `${p.x},${p.y}`))))
    setFoodKind(randomFoodKind())
    setPulses([])
    setHeadPulseUntil(0)
    setStatus('idle')
    // 重置后主棋盘获取焦点，避免下一局还需点击
    setTimeout(() => boardRef.current?.focus(), 0)
  }, [])

  /** 键盘处理：不同阶段行为不同 */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (status === 'idle') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        beginCountdown()
      }
      return
    }
    if (status === 'countdown') return

    // 空格：运行/暂停切换
    if (e.key === ' ') {
      e.preventDefault()
      setStatus((s) => (s === 'paused' ? 'running' : s === 'running' ? 'paused' : s))
      return
    }
    if (status !== 'running') return

    // 方向控制：禁止直接反向
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')
      if (dirRef.current !== 'down') setDir('up')
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S')
      if (dirRef.current !== 'up') setDir('down')
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A')
      if (dirRef.current !== 'right') setDir('left')
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')
      if (dirRef.current !== 'left') setDir('right')
  }

  /** 倒计时开始/开始运行时，确保棋盘获得焦点（修复需点击场景的问题） */
  useEffect(() => {
    if (status === 'countdown' || status === 'running') {
      // 下一帧聚焦，避免被按钮/覆盖层抢占焦点
      const id = requestAnimationFrame(() => boardRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [status])

  /** 倒计时副作用：3→2→1→start（带提示音） */
  useEffect(() => {
    if (status !== 'countdown') return
    setCountdown(3)
    // 立即播报一次 3
    playBeep(520, 110)
    const id = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1
        if (next >= 1) {
          // 不同音高的“滴”
          playBeep(next === 2 ? 580 : 640, 110)
          return next
        }
        // 进入开始：更高音提示
        playBeep(760, 140)
        clearInterval(id)
        startRun()
        return 0
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status, startRun])

  /** 主循环（仅在 running 运行；速度变更会重启计时器） */
  useEffect(() => {
    if (status !== 'running') {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }
    // 重启 interval 以应用 tickMs（难度）
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    tickRef.current = window.setInterval(() => {
      setSnake((prev) => {
        const head = prev[0]
        const d = delta(dirRef.current)
        const nx = head.x + d.x
        const ny = head.y + d.y

        // 碰壁/自撞：结束
        if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || prev.some((p) => p.x === nx && p.y === ny)) {
          setStatus('ended')
          return prev
        }

        const next = [{ x: nx, y: ny }, ...prev]
        // 吃到食物：加分+不去尾并刷新食物+动画+随机食物类型
        if (nx === food.x && ny === food.y) {
          setScore((s) => s + 10)
          const used = new Set(next.map((p) => `${p.x},${p.y}`))
          setFood(randomFood(used))
          setFoodKind(randomFoodKind())
          // 头部轻微缩放
          setHeadPulseUntil(Date.now() + 140)
          // 食物波纹粒子（450ms）
          const id = `P-${Date.now()}-${Math.random()}`
          setPulses((ps) => [...ps, { id, x: nx, y: ny, until: Date.now() + 450 }])
          // 清理粒子
          setTimeout(() => {
            setPulses((ps) => ps.filter((p) => p.id !== id))
          }, 500)
          return next
        }
        // 正常前进：去尾
        next.pop()
        return next
      })
    }, tickMs)

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [status, tickMs, food])

  /** 预计算用于渲染的格子类型 */
  const cells = useMemo(() => {
    const sset = new Map<string, number>()
    snake.forEach((p, i) => sset.set(`${p.x},${p.y}`, i))
    const items: Array<Array<'empty' | 'body' | 'head' | 'food'>> = Array.from(
      { length: GRID },
      () => Array.from({ length: GRID }, () => 'empty' as const),
    )
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (x === food.x && y === food.y) items[y][x] = 'food'
        const idx = sset.get(`${x},${y}`)
        if (idx === 0) items[y][x] = 'head'
        else if (idx !== undefined) items[y][x] = 'body'
      }
    }
    return items
  }, [snake, food])

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isTouch = useIsTouch()

  /** 触屏方向点击（Snake：单次改变方向，禁止反向） */
  const handleTapDir = (d: Dir) => {
    if (!isRunning) return
    if (d === 'up' && dirRef.current !== 'down') setDir('up')
    if (d === 'down' && dirRef.current !== 'up') setDir('down')
    if (d === 'left' && dirRef.current !== 'right') setDir('left')
    if (d === 'right' && dirRef.current !== 'left') setDir('right')
  }

  /** 当前蛇头是否处于缩放动画中 */
  const headPulseActive = headPulseUntil > Date.now()

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <TopBar title="贪吃蛇（可爱版）" />

      {/* 横屏提示（触屏 + 窄纵向） */}
      <OrientationHint />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 sm:gap-6">
        {/* 左侧：棋盘 */}
        <div className="flex items-start">
          <div className="rounded-lg p-2 sm:p-4 bg-white dark:bg-neutral-900 border shadow-sm w-full">
            <div
              ref={boardRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onMouseDown={() => boardRef.current?.focus()}
              onTouchStart={() => boardRef.current?.focus()}
              aria-label="贪吃蛇棋盘（点击以获取键盘控制）"
              className="outline-none"
            >
              <div
                className="relative grid gap-1.5 sm:gap-2 p-2 sm:p-3"
                style={{
                  gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
                  width: 'min(92vw, 560px)',
                  aspectRatio: '1 / 1',
                  margin: '0 auto',
                  background: 'linear-gradient(to bottom right, rgba(125,125,125,0.06), rgba(125,125,125,0.03))',
                  borderRadius: 8,
                }}
              >
                {cells.map((row, y) =>
                  row.map((kind, x) => {
                    const pulseHere = pulses.some((p) => p.x === x && p.y === y)
                    return (
                      <div
                        key={`${x}-${y}`}
                        className="relative w-full aspect-square rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-black/5 overflow-hidden"
                      >
                        {/* 反馈粒子（波纹） */}
                        {pulseHere && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-white/80 dark:bg-white/60 animate-ping" />
                          </div>
                        )}

                        {kind === 'head' && (
                          <div className={`absolute inset-[10%] transition-transform ${headPulseActive ? 'scale-110' : ''}`}>
                            <CuteSnake part="head" dir={dir} className="w-full h-full" />
                          </div>
                        )}
                        {kind === 'body' && (
                          <div className="absolute inset-[12%]">
                            <CuteSnake part="body" className="w-full h-full" />
                          </div>
                        )}
                        {kind === 'food' && (
                          <div className="absolute inset-[18%]">
                            <CuteFood kind={foodKind} className="w-full h-full" />
                          </div>
                        )}
                      </div>
                    )
                  }),
                )}

                {/* 覆盖层：待开始 / 倒计时 / 暂停 / 结束 */}
                {status !== 'running' && (
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-sm rounded-md flex items-center justify-center">
                    {status === 'idle' && (
                      <div className="flex flex-col items-center gap-3">
                        <Button className="h-10" onClick={beginCountdown}>
                          开始游戏
                        </Button>
                        <div className="text-xs text-muted-foreground">按 空格/回车 也可开始</div>
                      </div>
                    )}
                    {status === 'countdown' && (
                      <div key={countdown} className="text-5xl font-bold select-none animate-[pulse_0.9s_ease-in-out_1]">
                        {countdown}
                      </div>
                    )}
                    {status === 'paused' && (
                      <div className="flex items-center gap-3">
                        <Play className="h-5 w-5" />
                        <span>已暂停，按空格继续</span>
                      </div>
                    )}
                    {status === 'ended' && (
                      <div className="bg-white dark:bg-neutral-900 border rounded-lg shadow p-4 text-center">
                        <div className="font-semibold">游戏结束</div>
                        <div className="mt-1 text-muted-foreground">得分 {score}</div>
                        <div className="mt-3 flex justify-center">
                          <Button onClick={() => { reset(); beginCountdown(); }} className="h-10">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            再来一局
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：信息与控制 */}
        <aside className="space-y-4">
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">得分</div>
              <div className="text-right font-bold text-lg">{score}</div>
              <div className="text-muted-foreground">状态</div>
              <div className="text-right">
                {status === 'idle'
                  ? '待开始'
                  : status === 'countdown'
                  ? `倒计时 ${countdown}s`
                  : status === 'running'
                  ? '进行中'
                  : status === 'paused'
                  ? '已暂停'
                  : '已结束'}
              </div>
              <div className="text-muted-foreground">速度</div>
              <div className="text-right">
                <select
                  value={speedKey}
                  onChange={(e) => setSpeedKey(e.target.value)}
                  className="bg-transparent border rounded px-2 py-1 text-sm"
                >
                  {SPEED_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="bg-transparent h-10"
              onClick={() => {
                if (status === 'idle') beginCountdown()
                else if (status === 'running') setStatus('paused')
                else if (status === 'paused') setStatus('running')
              }}
            >
              {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {status === 'idle' ? '开始' : isRunning ? '暂停' : '继续'}
            </Button>
            <Button variant="outline" className="bg-transparent h-10" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>

          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm text-xs leading-relaxed text-muted-foreground">
            操作：WASD/方向键控制，空格开始/暂停/继续。倒计时 3 秒后开局；若按键无效，请点击棋盘以聚焦。移动端/Pad 自动自适应尺寸。
          </div>
        </aside>
      </div>

      {/* 触屏虚拟按键（仅触屏设备显示） */}
      <TouchControls
        show={isTouch}
        variant="snake"
        onTapDir={handleTapDir}
        onPause={() => setStatus((s) => (s === 'running' ? 'paused' : s === 'paused' ? 'running' : s))}
      />
    </div>
  )
}

export default SnakePage
