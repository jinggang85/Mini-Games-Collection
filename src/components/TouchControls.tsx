/**
 * TouchControls.tsx
 * On-screen virtual controls for touch devices:
 * - D-Pad (up/right/down/left)
 * - Optional Fire button (for Tanks)
 * - Optional Pause/Resume button
 * The component supports both tap mode (Snake) and hold mode (Tanks).
 */

import React from 'react'
import { Button } from './ui/button'

/** Direction type used by both games */
export type Dir = 'up' | 'right' | 'down' | 'left'

/**
 * TouchControlsProps
 * - show: whether to render
 * - variant: 'snake' uses tap on directions; 'tanks' uses hold (press & release)
 * - onTapDir: called once per tap (snake)
 * - onHoldDirChange: (dir, pressed) for tanks to set key states
 * - onFire: fire callback (tanks)
 * - onPause: pause/resume
 */
export interface TouchControlsProps {
  show: boolean
  variant: 'snake' | 'tanks'
  onTapDir?: (dir: Dir) => void
  onHoldDirChange?: (dir: Dir, pressed: boolean) => void
  onFire?: () => void
  onPause?: () => void
}

/**
 * TouchControls
 * Bottom-fixed controls; left: D-Pad, right: action buttons.
 */
const TouchControls: React.FC<TouchControlsProps> = ({
  show,
  variant,
  onTapDir,
  onHoldDirChange,
  onFire,
  onPause,
}) => {
  if (!show) return null

  const dirBtnCls =
    'h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/90 dark:bg-neutral-800/90 border shadow flex items-center justify-center active:scale-95 select-none'

  const actBtnCls =
    'h-12 w-20 sm:h-14 sm:w-24 rounded-full bg-indigo-600 text-white shadow active:scale-95'

  const handleDown = (d: Dir) => {
    if (variant === 'tanks') onHoldDirChange?.(d, true)
  }
  const handleUp = (d: Dir) => {
    if (variant === 'tanks') onHoldDirChange?.(d, false)
  }
  const handleTap = (d: Dir) => {
    if (variant === 'snake') onTapDir?.(d)
  }

  return (
    <div className="fixed inset-x-0 bottom-3 sm:bottom-4 z-30 pointer-events-none">
      {/* left: dpad */}
      <div className="absolute left-3 sm:left-4 bottom-0 pointer-events-auto">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button
            className={dirBtnCls}
            onClick={() => handleTap('up')}
            onPointerDown={(e) => { e.preventDefault(); handleDown('up') }}
            onPointerUp={(e) => { e.preventDefault(); handleUp('up') }}
            onPointerCancel={(e) => { e.preventDefault(); handleUp('up') }}
            aria-label="向上"
          >
            ▲
          </button>
          <div />
          <button
            className={dirBtnCls}
            onClick={() => handleTap('left')}
            onPointerDown={(e) => { e.preventDefault(); handleDown('left') }}
            onPointerUp={(e) => { e.preventDefault(); handleUp('left') }}
            onPointerCancel={(e) => { e.preventDefault(); handleUp('left') }}
            aria-label="向左"
          >
            ◀
          </button>
          <div />
          <button
            className={dirBtnCls}
            onClick={() => handleTap('right')}
            onPointerDown={(e) => { e.preventDefault(); handleDown('right') }}
            onPointerUp={(e) => { e.preventDefault(); handleUp('right') }}
            onPointerCancel={(e) => { e.preventDefault(); handleUp('right') }}
            aria-label="向右"
          >
            ▶
          </button>
          <div />
          <button
            className={dirBtnCls}
            onClick={() => handleTap('down')}
            onPointerDown={(e) => { e.preventDefault(); handleDown('down') }}
            onPointerUp={(e) => { e.preventDefault(); handleUp('down') }}
            onPointerCancel={(e) => { e.preventDefault(); handleUp('down') }}
            aria-label="向下"
          >
            ▼
          </button>
          <div />
        </div>
      </div>

      {/* right: actions */}
      <div className="absolute right-3 sm:right-4 bottom-0 pointer-events-auto flex items-center gap-2">
        {onFire && (
          <button className={actBtnCls} onClick={onFire} aria-label="射击">
            FIRE
          </button>
        )}
        {onPause && (
          <Button className="h-12 sm:h-14 rounded-full" variant="outline" onClick={onPause}>
            暂停
          </Button>
        )}
      </div>
    </div>
  )
}

export default TouchControls
