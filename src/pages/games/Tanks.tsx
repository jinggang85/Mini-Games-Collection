/** 
 * Tanks.tsx
 * 坦克大战（舒适视觉 + 节奏阶梯 + 基地底部环砖）
 * 新增内容：
 * 1) 关卡节奏阶梯：L1/L2 更少障碍 & 更慢；L3 起恢复到“舒适模式”参数。
 * 2) 基地重构：移动至最底行中间，并用一圈砖墙围住（出界格自动忽略）。
 * 3) 其余沿用此前“舒适模式、遇险提示、朝向箭头、音效开关”等增强。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import TopBar from '../../components/TopBar'
import { Button } from '../../components/ui/button'
import { Pause, Play, RotateCcw, Shield, Zap } from 'lucide-react'
import { Switch } from '../../components/ui/switch'
import TankIcon from '../../components/icons/TankIcon'

/**
 * CellType
 * 棋盘格类型：empty 空格、brick 砖墙（可被炮弹摧毁）、steel 钢墙（不可摧毁）、base 基地。
 */
type CellType = 'empty' | 'brick' | 'steel' | 'base'

/**
 * Direction
 * 朝向：上右下左
 */
type Direction = 'up' | 'right' | 'down' | 'left'

/**
 * Tank
 * 坦克实体：位置、朝向、阵营与存活状态
 */
interface Tank {
  id: string
  x: number
  y: number
  dir: Direction
  side: 'player' | 'enemy'
  alive: boolean
}

/**
 * Bullet
 * 子弹实体：位置、朝向与归属
 */
interface Bullet {
  id: string
  x: number
  y: number
  dir: Direction
  owner: 'player' | 'enemy'
  active: boolean
}

/**
 * PowerUp
 * 道具：玩家拾取后获得增益（shield 护盾 / rapid 连发）
 */
interface PowerUp {
  id: string
  x: number
  y: number
  kind: 'shield' | 'rapid'
}

/**
 * GameState
 * 汇总用于右侧面板展示与流程控制的轻量状态
 */
interface GameState {
  score: number
  lives: number
  level: number
  kills: number
  running: boolean
  paused: boolean
}

/**
 * PlayerPower
 * 玩家增益状态：护盾层数与连发过期时间戳
 */
interface PlayerPower {
  shield: number
  rapidUntil: number // ms 时间戳
}

/**
 * Config
 * 动态节奏配置：根据舒适模式与关卡阶梯切换。
 */
interface Config {
  tickMs: number
  playerStepEvery: number
  enemyStepEvery: number
  bulletStepEvery: number
  enemyFireProb: number
  enemyMaxActiveBullets: number
  maxConcurrentEnemies: number
}

const GRID = 15
const KILLS_PER_LEVEL = 6
const ENEMIES_PER_LEVEL = 6

/**
 * getConfig
 * 根据是否启用舒适模式与当前关卡返回节奏参数（L1/L2 更慢、L3 起恢复舒适参数）。
 * - 舒适模式关闭时，始终采用标准参数。
 */
function getConfig(comfort: boolean, level: number): Config {
  // 标准平衡（舒适 OFF）
  const standard: Config = {
    tickMs: 65,
    playerStepEvery: 2,
    enemyStepEvery: 4,
    bulletStepEvery: 1,
    enemyFireProb: 0.08,
    enemyMaxActiveBullets: 2,
    maxConcurrentEnemies: 3,
  }

  // 舒适基线（舒适 ON，L3 起）
  const comfyBase: Config = {
    tickMs: 65, // 子弹顺滑
    playerStepEvery: 3,
    enemyStepEvery: 5,
    bulletStepEvery: 1, // 子弹每 tick 前进
    enemyFireProb: 0.05,
    enemyMaxActiveBullets: 2,
    maxConcurrentEnemies: 2,
  }

  if (!comfort) return standard

  // 阶梯：L1/L2 更慢更松
  if (level <= 1) {
    return {
      ...comfyBase,
      playerStepEvery: 4,
      enemyStepEvery: 6,
      enemyFireProb: 0.035,
      maxConcurrentEnemies: 1, // 场上更少
    }
  }
  if (level === 2) {
    return {
      ...comfyBase,
      playerStepEvery: 4,
      enemyStepEvery: 6,
      enemyFireProb: 0.045,
      maxConcurrentEnemies: 2,
    }
  }
  // L3 起恢复舒适参数
  return comfyBase
}

/**
 * clamp
 * 限定范围
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/**
 * turnLeft/turnRight
 * 旋转朝向
 */
function turnLeft(d: Direction): Direction {
  return d === 'up' ? 'left' : d === 'left' ? 'down' : d === 'down' ? 'right' : 'up'
}
function turnRight(d: Direction): Direction {
  return d === 'up' ? 'right' : d === 'right' ? 'down' : d === 'down' ? 'left' : 'up'
}

/**
 * dirDelta
 * 将方向转换为坐标增量
 */
function dirDelta(d: Direction) {
  if (d === 'up') return { dx: 0, dy: -1 }
  if (d === 'right') return { dx: 1, dy: 0 }
  if (d === 'down') return { dx: 0, dy: 1 }
  return { dx: -1, dy: 0 }
}

/**
 * getBasePos
 * 基地固定在最底行中间（x 为中点，y 为 GRID - 1）
 */
function getBasePos() {
  return { x: Math.floor(GRID / 2), y: GRID - 1 }
}

/**
 * buildTerrain
 * 生成地形：随机撒落砖墙与钢墙，基地置于底部并以砖墙环绕一圈。
 * - L1/L2：障碍密度降低（砖/钢按比例缩减），让画面更清爽。
 */
function buildTerrain(level: number): CellType[][] {
  const terrain: CellType[][] = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => 'empty' as CellType)
  )

  const base = getBasePos()
  // 随等级略增的密度（L1/L2 再额外下调，舒适阶梯的“更少障碍”）
  const normalBrick = 0.12 + Math.min(0.06, level * 0.02)
  const normalSteel = 0.06 + Math.min(0.04, level * 0.015)

  let brickDensity = normalBrick
  let steelDensity = normalSteel
  if (level === 1) {
    brickDensity *= 0.5
    steelDensity *= 0.5
  } else if (level === 2) {
    brickDensity *= 0.75
    steelDensity *= 0.7
  }

  // 随机撒落（保留边界空白；基地周围 1 格在随机阶段避免放置，稍后手动铺环）
  for (let y = 1; y < GRID - 1; y++) {
    for (let x = 1; x < GRID - 1; x++) {
      const nearBase = Math.abs(x - base.x) <= 1 && Math.abs(y - base.y) <= 1
      const nearSpawn = y > GRID - 4 // 底部区域留出玩家机动空间
      if (nearBase || nearSpawn) continue

      const r = Math.random()
      if (r < steelDensity) {
        terrain[y][x] = 'steel'
      } else if (r < steelDensity + brickDensity) {
        terrain[y][x] = 'brick'
      }
    }
  }

  // 放置基地（底行中心）
  terrain[base.y][base.x] = 'base'

  // 一圈砖墙（出界则跳过）：围住基地
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const xx = base.x + dx
      const yy = base.y + dy
      if (xx >= 0 && xx < GRID && yy >= 0 && yy < GRID) {
        terrain[yy][xx] = 'brick'
      }
    }
  }

  return terrain
}

/**
 * spawnEnemyPositions
 * 敌人出生点（上方三处），若被占用则向内侧寻找
 */
function spawnEnemyPositions(tanks: Tank[]) {
  const candidates = [
    { x: 1, y: 1 },
    { x: Math.floor(GRID / 2), y: 1 },
    { x: GRID - 2, y: 1 },
  ]
  const occupied = new Set(tanks.filter(t => t.alive).map(t => `${t.x},${t.y}`))
  for (const c of candidates) {
    let { x, y } = c
    for (let k = 0; k < 3; k++) {
      const key = `${x},${y}`
      if (!occupied.has(key)) {
        return { x, y }
      }
      x = clamp(x + (k - 1), 1, GRID - 2)
      y = clamp(y + 1, 1, GRID - 2)
    }
  }
  // 全被占则返回中心
  return { x: Math.floor(GRID / 2), y: 1 }
}

/**
 * manhattan
 * 计算曼哈顿距离
 */
function manhattan(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

/**
 * 轻量音频工具：柔和 beep 音效（默认关闭）
 */
const getAudioCtx = (() => {
  let ctx: AudioContext | null = null
  return () => {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    return ctx
  }
})()

/**
 * playTone
 * 播放短促的柔和哔声
 */
function playTone(freq: number, ms: number, volume = 0.08) {
  const ac = getAudioCtx()
  if (!ac) return
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  o.connect(g)
  g.connect(ac.destination)
  const now = ac.currentTime
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(volume, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000)
  o.start(now)
  o.stop(now + ms / 1000 + 0.03)
}

/**
 * TanksPage
 * 主要组件：渲染棋盘、侧栏与键盘/循环逻辑；包含道具与友伤免疫。
 * 更新：加入“节奏阶梯 + 基地底部砖墙环绕”的体验优化。
 */
const TanksPage: React.FC = () => {
  // 地形
  const [terrain, setTerrain] = useState<CellType[][]>(() => buildTerrain(1))
  // 实体（玩家出生点：基地上方两格，中线靠下；避免与砖墙环冲突）
  const [tanks, setTanks] = useState<Tank[]>(() => [
    { id: 'P1', x: Math.floor(GRID / 2), y: GRID - 3, dir: 'up', side: 'player', alive: true },
  ])
  const [bullets, setBullets] = useState<Bullet[]>([])
  // 道具
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  // 面板
  const [state, setState] = useState<GameState>({
    score: 0,
    lives: 3,
    level: 1,
    kills: 0,
    running: true,
    paused: false,
  })
  // 玩家增益状态
  const [power, setPower] = useState<PlayerPower>({ shield: 0, rapidUntil: 0 })

  // 舒适模式（默认开，记忆本地）
  const [comfort, setComfort] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('tanks_comfort')
    return saved === null ? true : saved === 'true'
  })
  useEffect(() => {
    try {
      localStorage.setItem('tanks_comfort', String(comfort))
    } catch {}
  }, [comfort])

  // 音效开关（默认关，记忆本地）
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('tanks_sound')
    return saved === 'true'
  })
  useEffect(() => {
    try {
      localStorage.setItem('tanks_sound', String(soundOn))
    } catch {}
  }, [soundOn])

  // 动态配置（含阶梯）
  const config = useMemo(() => getConfig(comfort, state.level), [comfort, state.level])

  // 引用以供循环内使用（避免闭包读到旧值）
  const stateRef = useRef(state)
  const tanksRef = useRef(tanks)
  const terrainRef = useRef(terrain)
  const bulletsRef = useRef(bullets)
  const powerUpsRef = useRef(powerUps)
  const powerRef = useRef(power)
  const soundOnRef = useRef(soundOn)
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { tanksRef.current = tanks }, [tanks])
  useEffect(() => { terrainRef.current = terrain }, [terrain])
  useEffect(() => { bulletsRef.current = bullets }, [bullets])
  useEffect(() => { powerUpsRef.current = powerUps }, [powerUps])
  useEffect(() => { powerRef.current = power }, [power])
  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])

  /**
   * reset
   * 重置当前关卡
   */
  const reset = () => {
    setTerrain(buildTerrain(stateRef.current.level))
    setBullets([])
    setPowerUps([])
    setTanks([{ id: 'P1', x: Math.floor(GRID / 2), y: GRID - 3, dir: 'up', side: 'player', alive: true }])
    setPower({ shield: 0, rapidUntil: 0 })
    setState(s => ({ ...s, running: true, paused: false, kills: 0 }))
    // 夺回焦点
    setTimeout(() => boardRef.current?.focus(), 0)
  }

  /**
   * nextLevel
   * 进入下一关
   */
  const nextLevel = () => {
    setState(s => ({ ...s, level: s.level + 1, kills: 0 }))
    setTerrain(buildTerrain(stateRef.current.level + 1))
    setBullets([])
    setPowerUps([])
    setPower(p => ({ ...p, shield: Math.min(2, p.shield) })) // 保留护盾（不额外赠送）
    // 保留玩家/生命与分数，重置敌人与位置
    setTanks(prev =>
      prev
        .filter(t => t.side === 'player')
        .map(t => ({ ...t, x: Math.floor(GRID / 2), y: GRID - 3, dir: 'up', alive: true }))
    )
  }

  /**
   * 输入状态：按键集合（在容器上监听）
   */
  const keysRef = useRef<Record<string, boolean>>({})
  const boardRef = useRef<HTMLDivElement | null>(null)

  /**
   * handleKeyDown / handleKeyUp
   * 键盘输入：WASD/方向键移动，空格射击，P 暂停
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!stateRef.current.running) return
    keysRef.current[e.key] = true

    if (e.key === 'p' || e.key === 'P') {
      setState(s => ({ ...s, paused: !s.paused }))
    }
    if (e.key === ' ') {
      e.preventDefault()
      spawnBullet('player')
    }
  }
  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    keysRef.current[e.key] = false
  }

  /**
   * useEffect: 挂载时自动聚焦棋盘；点击棋盘主动聚焦
   */
  useEffect(() => {
    boardRef.current?.focus()
  }, [])

  /**
   * canMoveTo
   * 判定坦克/子弹是否可进入坐标（边界与地形阻挡）
   */
  function canMoveTo(x: number, y: number): boolean {
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) return false
    const cell = terrainRef.current[y][x]
    if (cell === 'brick' || cell === 'steel' || cell === 'base') return false
    // 不能与其他存活坦克重叠
    const occupied = tanksRef.current.some(t => t.alive && t.x === x && t.y === y)
    if (occupied) return false
    return true
  }

  /**
   * moveTank
   * 移动指定坦克（玩家/敌人）
   */
  function moveTank(t: Tank, dir: Direction) {
    const { dx, dy } = dirDelta(dir)
    const nx = clamp(t.x + dx, 0, GRID - 1)
    const ny = clamp(t.y + dy, 0, GRID - 1)
    // 面向调整与可行性判断
    t.dir = dir
    if (canMoveTo(nx, ny)) {
      t.x = nx
      t.y = ny
    }
  }

  /**
   * spawnBullet
   * 发射子弹：玩家受“连发”影响可多发；敌人有弹量上限
   */
  function spawnBullet(owner: 'player' | 'enemy') {
    if (!stateRef.current.running || stateRef.current.paused) return

    if (owner === 'player') {
      // 根据连发状态调整同屏弹量限制
      const rapidActive = Date.now() < powerRef.current.rapidUntil
      const maxActive = rapidActive ? 3 : 1
      const actives = bulletsRef.current.filter(b => b.owner === 'player' && b.active).length
      if (actives >= maxActive) return

      const p = tanksRef.current.find(t => t.side === 'player' && t.alive)
      if (!p) return
      const b: Bullet = {
        id: `B-P-${Date.now()}-${Math.random()}`,
        x: p.x,
        y: p.y,
        dir: p.dir,
        owner,
        active: true,
      }
      setBullets(prev => [...prev, b])

      // 柔和开火音（玩家）：高一点
      if (soundOnRef.current) playTone(700, 90, 0.08)
    } else {
      // 敌人随机抽一台开火
      const enemies = tanksRef.current.filter(t => t.side === 'enemy' && t.alive)
      if (enemies.length === 0) return
      const who = enemies[Math.floor(Math.random() * enemies.length)]
      // 控制弹量（使用动态配置）
      const actives = bulletsRef.current.filter(b => b.owner === 'enemy' && b.active).length
      if (actives >= config.enemyMaxActiveBullets) return
      const b: Bullet = { id: `B-E-${Date.now()}-${Math.random()}`, x: who.x, y: who.y, dir: who.dir, owner, active: true }
      setBullets(prev => [...prev, b])

      // 敌人开火音：更低
      if (soundOnRef.current) playTone(480, 80, 0.07)
    }
  }

  /**
   * dropPowerUp
   * 敌人被击毁后以一定概率在原地掉落道具（护盾/连发）
   */
  function dropPowerUp(x: number, y: number) {
    // 35% 掉落概率
    if (Math.random() < 0.35) {
      const kind: PowerUp['kind'] = Math.random() < 0.5 ? 'shield' : 'rapid'
      setPowerUps(prev => [...prev, { id: `PU-${Date.now()}-${Math.random()}`, x, y, kind }])
    }
  }

  /**
   * pickupPowerUpIfAny
   * 玩家经过道具格则拾取并生效
   */
  function pickupPowerUpIfAny(px: number, py: number) {
    const idx = powerUpsRef.current.findIndex(pu => pu.x === px && pu.y === py)
    if (idx < 0) return
    const pu = powerUpsRef.current[idx]
    if (pu.kind === 'shield') {
      setPower(p => ({ ...p, shield: Math.min(3, p.shield + 1) }))
    } else if (pu.kind === 'rapid') {
      setPower(p => ({ ...p, rapidUntil: Date.now() + 8000 }))
    }
    setPowerUps(prev => prev.filter(p => p.id !== pu.id))
  }

  /**
   * damageAt
   * 子弹打击地形/单位：处理墙体破坏、钢墙阻挡、基地/坦克命中、友伤免疫与护盾
   */
  function damageAt(x: number, y: number, owner: 'player' | 'enemy'): 'blocked' | 'hit' | 'none' {
    // 越界
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) return 'blocked'
    const cell = terrainRef.current[y][x]

    // 墙体与基地
    if (cell === 'steel') return 'blocked'
    if (cell === 'brick') {
      setTerrain(prev => {
        const next = prev.map(row => row.slice())
        next[y][x] = 'empty'
        return next
      })
      // 砖墙破坏音
      if (soundOnRef.current) playTone(320, 70, 0.06)
      return 'hit'
    }
    if (cell === 'base') {
      // 基地被摧毁 -> 失败
      setState(s => ({ ...s, running: false, paused: false }))
      // 基地受击音（更沉）
      if (soundOnRef.current) playTone(260, 180, 0.08)
      return 'hit'
    }

    // 命中坦克
    const hitIndex = tanksRef.current.findIndex(t => t.alive && t.x === x && t.y === y)
    if (hitIndex >= 0) {
      const target = tanksRef.current[hitIndex]

      // 友伤免疫：同阵营不造成伤害，子弹消散
      if ((owner === 'enemy' && target.side === 'enemy') || (owner === 'player' && target.side === 'player')) {
        return 'blocked'
      }

      // 命中玩家：先结算护盾
      if (target.side === 'player') {
        if (powerRef.current.shield > 0) {
          // 护盾抵消一次伤害，不死亡
          setPower(p => ({ ...p, shield: Math.max(0, p.shield - 1) }))
          // 护盾触发音
          if (soundOnRef.current) playTone(540, 100, 0.07)
          return 'hit'
        }
      }

      // 正常击毁逻辑
      target.alive = false
      setTanks(prev => prev.map(t => (t.id === target.id ? { ...t, alive: false } : t)))

      if (target.side === 'enemy') {
        setState(s => ({ ...s, score: s.score + 100, kills: s.kills + 1 }))
        // 掉落道具
        dropPowerUp(x, y)
        // 击毁敌人音
        if (soundOnRef.current) playTone(420, 120, 0.07)
      } else {
        // 玩家死亡扣命并重生或游戏结束
        setState(s => ({ ...s, lives: Math.max(0, s.lives - 1) }))
        // 玩家受击音（更沉）
        if (soundOnRef.current) playTone(300, 150, 0.08)
        setTimeout(() => {
          if (stateRef.current.lives > 0 && stateRef.current.running) {
            setTanks(prev =>
              prev.map(t =>
                t.side === 'player' ? { ...t, x: Math.floor(GRID / 2), y: GRID - 3, dir: 'up', alive: true } : t
              )
            )
          } else {
            setState(s => ({ ...s, running: false, paused: false }))
          }
        }, 200)
      }
      return 'hit'
    }

    return 'none'
  }

  /**
   * tick
   * 主循环：处理输入、敌人AI、子弹移动与碰撞、拾取道具与过关判定
   * 使用“步进节流”将玩家/敌人移动频率降低，子弹保持每 tick 前进。
   * 注意：依赖动态 config，切换舒适模式或关卡时会重置计时器并即时生效。
   */
  const tickRef = useRef<number | null>(null)
  const tickCount = useRef(0)

  useEffect(() => {
    if (!state.running || state.paused) {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }
    if (!tickRef.current) {
      tickRef.current = window.setInterval(() => {
        tickCount.current++

        const stepNowPlayer = tickCount.current % config.playerStepEvery === 0
        const stepNowEnemy = tickCount.current % config.enemyStepEvery === 0
        const stepNowBullet = tickCount.current % config.bulletStepEvery === 0

        // 玩家输入（降低位移频率）
        const player = tanksRef.current.find(t => t.side === 'player' && t.alive)
        if (player && stepNowPlayer) {
          if (keysRef.current['w'] || keysRef.current['W'] || keysRef.current['ArrowUp']) moveTank(player, 'up')
          else if (keysRef.current['s'] || keysRef.current['S'] || keysRef.current['ArrowDown']) moveTank(player, 'down')
          else if (keysRef.current['a'] || keysRef.current['A'] || keysRef.current['ArrowLeft']) moveTank(player, 'left')
          else if (keysRef.current['d'] || keysRef.current['D'] || keysRef.current['ArrowRight']) moveTank(player, 'right')

          // 玩家拾取道具（在移动后判定）
          pickupPowerUpIfAny(player.x, player.y)
        }

        // 敌人AI：按更低频率步进
        if (stepNowEnemy) {
          setTanks(prev => {
            const next = prev.map(t => ({ ...t }))
            for (const e of next) {
              if (e.side !== 'enemy' || !e.alive) continue
              // 10% 概率换向
              if (Math.random() < 0.1) {
                e.dir = Math.random() < 0.5 ? turnLeft(e.dir) : turnRight(e.dir)
              }
              const { dx, dy } = dirDelta(e.dir)
              const nx = e.x + dx
              const ny = e.y + dy
              // 不能走则尝试换一个方向
              if (!canMoveTo(nx, ny)) {
                e.dir = ['up', 'right', 'down', 'left'][Math.floor(Math.random() * 4)] as Direction
              } else {
                e.x = nx
                e.y = ny
              }
              // 偶尔开火（动态概率，舒适阶梯更少）
              if (Math.random() < config.enemyFireProb) spawnBullet('enemy')
            }
            return next
          })
        }

        // 子弹移动与碰撞（每 tick）
        if (stepNowBullet) {
          setBullets(prev => {
            const next: Bullet[] = []
            for (const b of prev) {
              if (!b.active) continue
              const { dx, dy } = dirDelta(b.dir)
              const nx = b.x + dx
              const ny = b.y + dy
              // 命中/阻挡判定
              const result = damageAt(nx, ny, b.owner)
              if (result === 'blocked' || result === 'hit') {
                // 子弹消失（命中玩家导致游戏结束或护盾抵消均在 damageAt 中处理）
              } else {
                next.push({ ...b, x: nx, y: ny })
              }
            }
            return next
          })
        }

        // 生成敌人：保证场上最多 N 台，同时总数达到关卡目标（舒适阶梯更少同屏）
        const aliveEnemies = tanksRef.current.filter(t => t.side === 'enemy' && t.alive).length
        const totalEnemySpawned = tanksRef.current.filter(t => t.side === 'enemy').length
        if (aliveEnemies < config.maxConcurrentEnemies && totalEnemySpawned < ENEMIES_PER_LEVEL) {
          const pos = spawnEnemyPositions(tanksRef.current)
          setTanks(prev => [
            ...prev,
            { id: `E-${Date.now()}-${Math.random()}`, x: pos.x, y: pos.y, dir: 'down', side: 'enemy', alive: true },
          ])
        }

        // 过关判定
        if (stateRef.current.kills >= KILLS_PER_LEVEL && stateRef.current.running) {
          nextLevel()
        }
      }, config.tickMs)
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [state.running, state.paused, config]) // 依赖运行/暂停与动态配置（含阶梯）

  /**
   * 渲染网格：将地形+坦克+子弹+道具整合为可视单元
   */
  const cells = useMemo(() => {
    const grid: Array<Array<{ terrain: CellType; tank?: Tank; bullets: Bullet[]; powerUps: PowerUp[] }>> = Array.from(
      { length: GRID },
      (_, y) => Array.from({ length: GRID }, (_, x) => ({ terrain: terrain[y][x], bullets: [] as Bullet[], powerUps: [] as PowerUp[] }))
    )
    for (const t of tanks) {
      if (!t.alive) continue
      grid[t.y][t.x].tank = t
    }
    for (const b of bullets) {
      if (!b.active) continue
      if (b.x >= 0 && b.x < GRID && b.y >= 0 && b.y < GRID) {
        grid[b.y][b.x].bullets.push(b)
      }
    }
    for (const pu of powerUps) {
      if (pu.x >= 0 && pu.x < GRID && pu.y >= 0 && pu.y < GRID) {
        grid[pu.y][pu.x].powerUps.push(pu)
      }
    }
    return grid
  }, [terrain, tanks, bullets, powerUps])

  /**
   * 基地遇险判断：敌方子弹与基地的曼哈顿距离 ≤ 3
   * 用于在基地格上绘制红色脉冲边框
   */
  const baseDanger = useMemo(() => {
    const base = getBasePos()
    return bullets.some(b => b.owner === 'enemy' && manhattan(b.x, b.y, base.x, base.y) <= 3)
  }, [bullets])

  /**
   * UI 辅助：暂停/恢复/重置
   */
  const togglePause = () => setState(s => ({ ...s, paused: !s.paused }))
  const handleReset = () => {
    setState(s => ({ ...s, score: 0, lives: 3, level: 1, kills: 0, running: true, paused: false }))
    setTerrain(buildTerrain(1))
    setBullets([])
    setPowerUps([])
    setPower({ shield: 0, rapidUntil: 0 })
    setTanks([{ id: 'P1', x: Math.floor(GRID / 2), y: GRID - 3, dir: 'up', side: 'player', alive: true }])
    setTimeout(() => boardRef.current?.focus(), 0)
  }

  /**
   * 用于右侧“连发剩余时间”显示的当前时间（仅用于展示）
   */
  const [, setNow] = useState<number>(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])
  const rapidRemainSec = Math.max(0, Math.ceil((power.rapidUntil - Date.now()) / 1000))
  const rapidActive = rapidRemainSec > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <TopBar title="坦克大战（舒适版）" />
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* 左：棋盘 */}
        <div className="flex items-start">
          <div className="rounded-lg p-3 sm:p-4 bg-white dark:bg-neutral-900 border shadow-sm w-full">
            <div
              ref={boardRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onMouseDown={() => boardRef.current?.focus()}
              onTouchStart={() => boardRef.current?.focus()}
              aria-label="坦克棋盘（点击此区域以获得键盘控制）"
              className={['outline-none rounded-md', state.paused ? 'ring-2 ring-yellow-400' : 'ring-1 ring-transparent'].join(' ')}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
                  width: 'min(560px, 100%)',
                  aspectRatio: '1 / 1',
                  margin: '0 auto',
                  gap: '6px', // 网格间距更大，视觉更轻松
                  padding: '10px',
                  background: 'linear-gradient(to bottom right, rgba(125,125,125,0.05), rgba(125,125,125,0.03))',
                  borderRadius: '10px'
                }}
              >
                {cells.map((row, y) =>
                  row.map((cell, x) => {
                    // 基础外观：柔和但有对比
                    const baseCls =
                      'relative w-full aspect-square rounded-md flex items-center justify-center select-none'
                    const bg =
                      cell.terrain === 'empty'
                        ? 'bg-neutral-100 dark:bg-neutral-800'
                        : cell.terrain === 'brick'
                        ? 'bg-rose-400/85' // 更暖更亮
                        : cell.terrain === 'steel'
                        ? 'bg-slate-500'
                        : 'bg-emerald-500' // 基地更亮
                    const isBase = cell.terrain === 'base'
                    return (
                      <div key={`${x}-${y}`} className={[baseCls, bg, 'border border-black/5 overflow-hidden'].join(' ')}>
                        {/* 砖墙纹理：砖缝（横/竖细线），增强可读性 */}
                        {cell.terrain === 'brick' && (
                          <div
                            aria-hidden
                            className="absolute inset-0 opacity-45"
                            style={{
                              backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
                              backgroundSize: '100% 8px, 12px 100%'
                            }}
                          />
                        )}

                        {/* 钢墙纹理：斜纹 + 内描边，冷色更“硬” */}
                        {cell.terrain === 'steel' && (
                          <>
                            <div
                              aria-hidden
                              className="absolute inset-0 opacity-35"
                              style={{
                                backgroundImage:
                                  'repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 6px)'
                              }}
                            />
                            <div
                              aria-hidden
                              className="absolute inset-0 rounded-md"
                              style={{ boxShadow: 'inset 0 0 0 2px rgba(15,23,42,0.35)' }}
                            />
                          </>
                        )}

                        {/* 基地标识：中央小徽标（护盾形），更显眼；遇险时外圈红色脉冲 */}
                        {isBase && (
                          <div className="absolute inset-0">
                            <div className="absolute inset-[30%] rounded-md bg-emerald-300/70 mix-blend-overlay" />
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                              <div className="w-3 h-3 rotate-45 rounded-[2px] bg-white/80 shadow-sm" />
                            </div>
                            {baseDanger && (
                              <div
                                className="absolute inset-0 rounded-md ring-2 ring-red-500/70 animate-pulse pointer-events-none"
                                aria-hidden
                              />
                            )}
                          </div>
                        )}

                        {/* 坦克：尺寸略大，孩子更容易看清；玩家额外显示朝向箭头 */}
                        {cell.tank && (
                          <>
                            <div className="absolute inset-[6%]">
                              <TankIcon
                                dir={cell.tank.dir}
                                variant={cell.tank.side === 'player' ? 'player' : 'enemy'}
                                className="w-full h-full"
                              />
                            </div>

                            {/* 玩家朝向提示箭头：小巧、不刺眼 */}
                            {cell.tank.side === 'player' && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <svg
                                  viewBox="0 0 100 100"
                                  className="w-[32%] h-[32%] opacity-80"
                                  style={{
                                    transform:
                                      cell.tank.dir === 'up'
                                        ? 'rotate(0deg)'
                                        : cell.tank.dir === 'right'
                                        ? 'rotate(90deg)'
                                        : cell.tank.dir === 'down'
                                        ? 'rotate(180deg)'
                                        : 'rotate(270deg)'
                                  }}
                                  aria-hidden
                                >
                                  <polygon points="50,8 68,40 32,40" fill="white" opacity="0.9" />
                                  <polygon points="50,12 64,38 36,38" fill="#60a5fa" opacity="0.6" />
                                </svg>
                              </div>
                            )}
                          </>
                        )}

                        {/* 子弹：更大更亮（玩家白色，敌人琥珀色），加轻微发光 */}
                        {cell.bullets.length > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className={[
                                'h-3 w-3 rounded-sm shadow-sm',
                                cell.bullets.some(b => b.owner === 'player') ? 'bg-white' : 'bg-amber-300'
                              ].join(' ')}
                              style={{ boxShadow: '0 0 8px rgba(255,255,255,0.6)' }}
                            />
                          </div>
                        )}

                        {/* 道具：护盾/连发 */}
                        {cell.powerUps.length > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {cell.powerUps.map(pu => (
                              <div key={pu.id} className="flex items-center justify-center">
                                {pu.kind === 'shield' ? (
                                  <Shield className="h-4 w-4 text-teal-400 drop-shadow" />
                                ) : (
                                  <Zap className="h-4 w-4 text-amber-400 drop-shadow" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右：信息与控制 */}
        <aside className="space-y-4">
          {/* 舒适模式开关 */}
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">舒适模式</div>
              <div className="text-xs text-muted-foreground">
                前两关更慢更松，第三关起恢复舒适参数；子弹保持顺滑。
              </div>
            </div>
            <Switch checked={comfort} onCheckedChange={(v) => setComfort(v)} />
          </div>

          {/* 音效开关（柔和） */}
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">音效</div>
              <div className="text-xs text-muted-foreground">柔和哔声提示（默认关闭，可随时开启）。</div>
            </div>
            <Switch checked={soundOn} onCheckedChange={(v) => setSoundOn(v)} />
          </div>

          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">分数</div>
              <div className="text-right font-bold text-lg">{state.score}</div>
              <div className="text-muted-foreground">生命</div>
              <div className="text-right font-semibold">{state.lives}</div>
              <div className="text-muted-foreground">关卡</div>
              <div className="text-right font-semibold">{state.level}</div>
              <div className="text-muted-foreground">击杀</div>
              <div className="text-right">{state.kills}/{KILLS_PER_LEVEL}</div>
            </div>
          </div>

          {/* 道具状态显示 */}
          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-400" />
                <span>护盾</span>
              </div>
              <div className="font-semibold">{power.shield > 0 ? `${power.shield} 层` : '-'}</div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>连发</span>
              </div>
              <div className="font-semibold">{rapidActive ? `${rapidRemainSec}s` : '-'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-transparent" onClick={togglePause} disabled={!state.running}>
              {state.paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {state.paused ? '恢复' : '暂停'}
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
            <Button onClick={reset} disabled={!state.running}>
              快速重开当前关
            </Button>
          </div>

          <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 border shadow-sm text-xs leading-relaxed text-muted-foreground">
            操作：WASD/方向键移动，空格射击。砖墙可被炮弹摧毁，钢墙不可摧毁；保护基地，消灭敌人提升关卡。<br />
            若按键无效，请点击棋盘区域以聚焦。你可随时开启/关闭“舒适模式”和“音效”。
          </div>

          {!state.running && (
            <div className="text-center text-sm text-red-500">游戏结束：基地被摧毁或生命耗尽</div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default TanksPage
