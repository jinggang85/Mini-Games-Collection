/**
 * Tetris.tsx
 * 俄罗斯方块游戏页面：包含游戏逻辑、影子投影、保存/交换（Hold）与简单音效。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopBar from '../../components/TopBar'
import { Button } from '../../components/ui/button'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'

/**
 * TetrisCell
 * 棋盘单元格的类型：0 表示空，其它数字代表不同方块颜色索引。
 */
type TetrisCell = number

/**
 * PieceShape
 * 方块形状定义：矩阵，值为 1 表示占用。
 */
type PieceShape = number[][]

/**
 * ActivePiece
 * 当前活动方块的数据结构。
 */
interface ActivePiece {
  shape: PieceShape
  x: number
  y: number
  color: number
  idx: number // 记录形状索引，便于 hold/next
}

/**
 * TetrisStats
 * 统计数据接口：分数、消行数与等级。
 */
interface TetrisStats {
  score: number
  lines: number
  level: number
}

/**
 * useInterval
 * 简单的可暂停 interval Hook。
 */
function useInterval(callback: () => void, delay: number | null) {
  const savedRef = useRef(callback)
  useEffect(() => {
    savedRef.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedRef.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/**
 * 俄罗斯方块页面主组件。
 */
const TetrisPage: React.FC = () => {
  // 基本参数
  const COLS = 10
  const ROWS = 20
  const SPEEDS = [800, 650, 520, 420, 330, 260, 200, 160, 130, 100] // 等级对应下落间隔

  // 聚焦用：确保能收到键盘事件
  const boardRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    // 进入页面自动尝试聚焦一次
    boardRef.current?.focus()
  }, [])

  // 形状定义（7 种）
  const SHAPES: PieceShape[] = useMemo(
    () => [
      // I
      [[1, 1, 1, 1]],
      // O
      [
        [1, 1],
        [1, 1]
      ],
      // T
      [
        [0, 1, 0],
        [1, 1, 1]
      ],
      // S
      [
        [0, 1, 1],
        [1, 1, 0]
      ],
      // Z
      [
        [1, 1, 0],
        [0, 1, 1]
      ],
      // J
      [
        [1, 0, 0],
        [1, 1, 1]
      ],
      // L
      [
        [0, 0, 1],
        [1, 1, 1]
      ]
    ],
    []
  )

  // 颜色类名（Tailwind）
  const COLORS = useMemo(
    () => [
      '', // 0 空
      'bg-sky-500',
      'bg-amber-500',
      'bg-emerald-500',
      'bg-rose-500',
      'bg-violet-500',
      'bg-teal-500',
      'bg-fuchsia-500'
    ],
    []
  )

  const [board, setBoard] = useState<TetrisCell[][]>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(0)))
  const [piece, setPiece] = useState<ActivePiece | null>(null)
  const [stats, setStats] = useState<TetrisStats>({ score: 0, lines: 0, level: 1 })
  const [running, setRunning] = useState<boolean>(false)
  const [gameOver, setGameOver] = useState<boolean>(false)

  // 预览与持有
  const [nextIdx, setNextIdx] = useState<number>(() => Math.floor(Math.random() * SHAPES.length))
  const [holdIdx, setHoldIdx] = useState<number | null>(null)
  const [canHold, setCanHold] = useState<boolean>(true)

  // 音效
  const [soundOn, setSoundOn] = useState<boolean>(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  /**
   * initAudio
   * 懒加载音频上下文。
   */
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (Ctx) audioCtxRef.current = new Ctx()
    }
  }, [])

  /**
   * playTone
   * 简易蜂鸣音效，避免外部依赖。
   */
  const playTone = useCallback(
    (freq: number, duration = 0.06, type: OscillatorType = 'sine', volume = 0.03) => {
      if (!soundOn) return
      initAudio()
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.value = volume
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    },
    [initAudio, soundOn]
  )

  const sfx = {
    rotate: () => playTone(660, 0.05, 'triangle'),
    drop: () => playTone(330, 0.04, 'square'),
    clear: () => {
      playTone(880, 0.05, 'sine')
      setTimeout(() => playTone(988, 0.05, 'sine'), 60)
    },
    gameover: () => {
      playTone(220, 0.2, 'sawtooth', 0.04)
    }
  }

  /**
   * 生成随机方块索引
   */
  const randomIndex = useCallback(() => Math.floor(Math.random() * SHAPES.length), [SHAPES.length])

  /**
   * 由索引构建活动方块
   */
  const buildPiece = useCallback(
    (idx: number): ActivePiece => {
      const shape = SHAPES[idx]
      return {
        shape,
        x: Math.floor((COLS - shape[0].length) / 2),
        y: 0,
        color: idx + 1,
        idx
      }
    },
    [COLS, SHAPES]
  )

  /**
   * 旋转方块（顺时针）
   */
  const rotate = useCallback((shape: PieceShape): PieceShape => {
    const rows = shape.length
    const cols = shape[0].length
    const res: PieceShape = Array.from({ length: cols }, () => Array(rows).fill(0))
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        res[c][rows - 1 - r] = shape[r][c]
      }
    }
    return res
  }, [])

  /**
   * 碰撞检测：判断方块是否与边界或固定块冲突
   */
  const collide = useCallback(
    (b: TetrisCell[][], p: ActivePiece): boolean => {
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[0].length; c++) {
          if (!p.shape[r][c]) continue
          const y = p.y + r
          const x = p.x + c
          if (x < 0 || x >= COLS || y >= ROWS) return true
          if (y >= 0 && b[y][x] !== 0) return true
        }
      }
      return false
    },
    [COLS, ROWS]
  )

  /**
   * 将当前方块融合到棋盘
   */
  const merge = useCallback(
    (b: TetrisCell[][], p: ActivePiece): TetrisCell[][] => {
      const copy = b.map((row) => row.slice())
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[0].length; c++) {
          if (!p.shape[r][c]) continue
          const y = p.y + r
          const x = p.x + c
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            copy[y][x] = p.color
          }
        }
      }
      return copy
    },
    [COLS, ROWS]
  )

  /**
   * 消除整行并计分
   */
  const clearLines = useCallback((b: TetrisCell[][]): { board: TetrisCell[][]; linesCleared: number } => {
    let linesCleared = 0
    const newBoard = b.filter((row) => {
      const full = row.every((v) => v !== 0)
      if (full) linesCleared++
      return !full
    })
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0))
    }
    return { board: newBoard, linesCleared }
  }, [COLS, ROWS])

  /**
   * 根据消行数更新分数与等级
   */
  const addScoreAndLevel = useCallback((lines: number) => {
    if (lines === 0) return
    const pointsPerLines = [0, 100, 300, 500, 800] // 1~4行
    setStats((s) => {
      const newLines = s.lines + lines
      const newScore = s.score + pointsPerLines[lines]
      const newLevel = Math.min(10, 1 + Math.floor(newLines / 10))
      return { score: newScore, lines: newLines, level: newLevel }
    })
    sfx.clear()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 生成新方块或判负
   */
  const spawn = useCallback(
    (b: TetrisCell[][]): { board: TetrisCell[][]; ok: boolean; piece: ActivePiece | null } => {
      // 使用 nextIdx，随后预先生成新的 nextIdx
      const current = buildPiece(nextIdx)
      const next = randomIndex()
      setNextIdx(next)
      if (collide(b, current)) {
        return { board: b, ok: false, piece: null }
      }
      setCanHold(true)
      return { board: b, ok: true, piece: current }
    },
    [buildPiece, collide, nextIdx, randomIndex]
  )

  /**
   * 启动/重置游戏
   */
  const startGame = useCallback(() => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)))
    setStats({ score: 0, lines: 0, level: 1 })
    setHoldIdx(null)
    setCanHold(true)
    setGameOver(false)
    setRunning(true)
    setNextIdx(randomIndex())
    const first = buildPiece(randomIndex())
    setPiece(first)
    // 初始化音频(需用户交互后才允许)
    initAudio()
    // 开局自动聚焦棋盘，确保键盘生效
    setTimeout(() => boardRef.current?.focus(), 0)
  }, [COLS, ROWS, buildPiece, initAudio, randomIndex])

  /**
   * 下落一步
   */
  const tick = useCallback(() => {
    if (!running || gameOver) return
    setPiece((prev) => {
      if (!prev) return prev
      const moved = { ...prev, y: prev.y + 1 }
      if (!collide(board, moved)) {
        return moved
      }
      // 融合
      const merged = merge(board, prev)
      sfx.drop()
      const { board: cleared, linesCleared } = clearLines(merged)
      if (linesCleared) addScoreAndLevel(linesCleared)
      const { ok, piece: newP, board: nb } = spawn(cleared)
      setBoard(nb)
      if (!ok || !newP) {
        setRunning(false)
        setGameOver(true)
        sfx.gameover()
        return null
      }
      return newP
    })
  }, [addScoreAndLevel, board, clearLines, collide, gameOver, merge, running, spawn]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 计算影子投影位置
   */
  const computeGhost = useCallback((p: ActivePiece | null, b: TetrisCell[][]) => {
    if (!p) return null
    let ghost = { ...p }
    while (!collide(b, { ...ghost, y: ghost.y + 1 })) {
      ghost.y += 1
    }
    return ghost
  }, [collide])

  /**
   * Hold/交换方块
   */
  const doHold = useCallback(() => {
    if (!piece || !canHold) return
    setCanHold(false)
    setPiece((prev) => {
      if (!prev) return prev
      if (holdIdx === null) {
        setHoldIdx(prev.idx)
        const { ok, piece: newP, board: nb } = spawn(board)
        setBoard(nb)
        if (!ok || !newP) {
          setRunning(false)
          setGameOver(true)
          sfx.gameover()
          return null
        }
        return newP
      } else {
        // 与 hold 交换
        const swapped = buildPiece(holdIdx)
        setHoldIdx(prev.idx)
        // 放在顶部中心
        if (collide(board, swapped)) {
          setRunning(false)
          setGameOver(true)
          sfx.gameover()
          return null
        }
        return swapped
      }
    })
  }, [board, buildPiece, canHold, collide, holdIdx, piece, spawn]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 按键控制
   */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!piece || !running || gameOver) return
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
      e.preventDefault()
    }
    if (e.code === 'ArrowLeft') {
      const moved = { ...piece, x: piece.x - 1 }
      if (!collide(board, moved)) setPiece(moved)
    } else if (e.code === 'ArrowRight') {
      const moved = { ...piece, x: piece.x + 1 }
      if (!collide(board, moved)) setPiece(moved)
    } else if (e.code === 'ArrowDown') {
      const moved = { ...piece, y: piece.y + 1 }
      if (!collide(board, moved)) setPiece(moved)
    } else if (e.code === 'ArrowUp') {
      const rotated = { ...piece, shape: rotate(piece.shape) }
      if (!collide(board, rotated)) {
        setPiece(rotated)
        sfx.rotate()
      }
    } else if (e.code === 'Space') {
      // 硬降
      let fall = { ...piece }
      while (!collide(board, { ...fall, y: fall.y + 1 })) {
        fall.y += 1
      }
      setPiece(fall)
      // 立刻融合
      const merged = merge(board, fall)
      sfx.drop()
      const { board: cleared, linesCleared } = clearLines(merged)
      if (linesCleared) addScoreAndLevel(linesCleared)
      const { ok, piece: newP, board: nb } = spawn(cleared)
      setBoard(nb)
      if (!ok || !newP) {
        setRunning(false)
        setGameOver(true)
        setPiece(null)
        sfx.gameover()
      } else {
        setPiece(newP)
      }
    } else if (e.code === 'KeyP') {
      setRunning((r) => !r)
    } else if (e.code === 'KeyC') {
      // Hold/交换
      doHold()
    }
  }, [addScoreAndLevel, board, clearLines, collide, doHold, gameOver, merge, piece, rotate, running, spawn, sfx]) // eslint-disable-line

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKey(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [handleKey])

  // 根据等级更新速度
  const delay = running && !gameOver ? SPEEDS[Math.min(stats.level - 1, SPEEDS.length - 1)] : null
  useInterval(() => tick(), delay)

  /**
   * 渲染棋盘单元格 + 活动方块 + 影子投影
   */
  const renderBoard = useMemo(() => {
    // 先生成一个包含活动方块的临时棋盘
    const temp = board.map((r) => r.slice())
    if (piece) {
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[0].length; c++) {
          if (!piece.shape[r][c]) continue
          const y = piece.y + r
          const x = piece.x + c
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            temp[y][x] = piece.color
          }
        }
      }
    }
    return temp
  }, [board, piece])

  // 计算 ghost 坐标集合
  const ghost = computeGhost(piece, board)
  const ghostSet = useMemo(() => {
    const s = new Set<string>()
    if (ghost) {
      for (let r = 0; r < ghost.shape.length; r++) {
        for (let c = 0; c < ghost.shape[0].length; c++) {
          if (!ghost.shape[r][c]) continue
          const y = ghost.y + r
          const x = ghost.x + c
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            s.add(`${y},${x}`)
          }
        }
      }
    }
    return s
  }, [ghost])

  // 用于渲染 hold/next 小缩略预览
  const renderMini = (idx: number | null) => {
    const size = 4
    const cells: number[][] = Array.from({ length: size }, () => Array(size).fill(0))
    if (idx !== null) {
      const shape = SHAPES[idx]
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
          if (!shape[r][c]) continue
          // 居中显示
          const offsetX = Math.floor((size - shape[0].length) / 2)
          const offsetY = Math.floor((size - shape.length) / 2)
          cells[offsetY + r][offsetX + c] = idx + 1
        }
      }
    }
    return (
      <div
        className="grid gap-[2px] bg-neutral-200 dark:bg-neutral-800 p-[2px] rounded"
        style={{ gridTemplateColumns: `repeat(${size}, 16px)` }}
      >
        {cells.flatMap((row, r) =>
          row.map((v, c) => (
            <div key={`${r}-${c}`} className={`h-4 w-4 rounded-sm ${v ? COLORS[v] : 'bg-neutral-100 dark:bg-neutral-700'}`} />
          ))
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <TopBar title="俄罗斯方块" thumbnailSrc="https://pub-cdn.sider.ai/u/U0E5HGEZ0W/web-coder/689d54efa616cfbf067663e8/resource/54994095-7a51-4e3d-b4d2-ebc460108ef8.jpg" />
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="flex items-start justify-center">
          <div
            ref={boardRef}
            className="rounded-lg p-3 bg-white dark:bg-neutral-900 border shadow-sm outline-none"
            tabIndex={0}
            aria-label="俄罗斯方块棋盘"
            onClick={() => boardRef.current?.focus()}
            title="点击或按任意键以获取焦点"
          >
            <div
              className="relative grid gap-[2px] bg-neutral-200 dark:bg-neutral-800 p-[2px] rounded"
              style={{ gridTemplateColumns: `repeat(${COLS}, 24px)` }}
            >
              {renderBoard.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isGhost = ghostSet.has(`${rIdx},${cIdx}`) && cell === 0
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`h-6 w-6 rounded-sm ${
                        isGhost
                          ? 'bg-transparent border border-neutral-400/40 dark:border-neutral-300/30'
                          : COLORS[cell] || 'bg-neutral-100 dark:bg-neutral-700'
                      }`}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm">
            <div className="text-sm text-muted-foreground">分数</div>
            <div className="text-2xl font-bold">{stats.score}</div>
            <div className="mt-2 text-sm text-muted-foreground">消行</div>
            <div className="text-lg font-semibold">{stats.lines}</div>
            <div className="mt-2 text-sm text-muted-foreground">等级</div>
            <div className="text-lg font-semibold">{stats.level}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 border shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Hold (C)</div>
              {renderMini(holdIdx)}
            </div>
            <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 border shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Next</div>
              {renderMini(nextIdx)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!running && !gameOver && (
              <Button onClick={startGame}>
                <Play className="h-4 w-4 mr-2" />
                开始
              </Button>
            )}
            {running && (
              <Button variant="outline" className="bg-transparent" onClick={() => setRunning(false)}>
                <Pause className="h-4 w-4 mr-2" />
                暂停
              </Button>
            )}
            {!running && !gameOver && (
              <Button onClick={() => { setRunning(true); setTimeout(() => boardRef.current?.focus(), 0) }}>
                <Play className="h-4 w-4 mr-2" />
                继续
              </Button>
            )}
            {gameOver && (
              <Button onClick={startGame}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重新开始
              </Button>
            )}
            {!gameOver && (
              <Button variant="outline" className="bg-transparent" onClick={startGame}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => setSoundOn((s) => !s)}
              title={soundOn ? '关闭音效' : '开启音效'}
            >
              {soundOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
              {soundOn ? '音效开' : '音效关'}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            操作：← → 移动，↓ 软降，↑ 旋转，空格 硬降，C 保存/交换，P 暂停/继续。若按键无效，请先点击棋盘以聚焦。
          </div>
        </aside>
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 border rounded-lg p-6 text-center shadow-xl">
            <div className="text-xl font-bold mb-2">游戏结束</div>
            <div className="text-sm text-muted-foreground mb-4">得分 {stats.score} · 消行 {stats.lines}</div>
            <Button onClick={startGame}>
              <RotateCcw className="h-4 w-4 mr-2" />
              再来一局
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TetrisPage
