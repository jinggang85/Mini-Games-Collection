/**
 * OrientationHint.tsx
 * A simple overlay that suggests rotating device to landscape
 * when screen is very narrow portrait on touch devices.
 */

import React, { useEffect, useState } from 'react'
import useIsTouch from '../hooks/useIsTouch'
import { Button } from './ui/button'

/**
 * OrientationHintProps
 * - thresholdW: show hint if width < threshold (portrait only)
 */
export interface OrientationHintProps {
  thresholdW?: number
}

/**
 * OrientationHint
 * Shows an overlay hint for landscape orientation on narrow portrait screens.
 */
const OrientationHint: React.FC<OrientationHintProps> = ({ thresholdW = 720 }) => {
  const isTouch = useIsTouch()
  const [show, setShow] = useState(false)

  useEffect(() => {
    function update() {
      if (!isTouch) {
        setShow(false)
        return
      }
      const w = window.innerWidth
      const h = window.innerHeight
      setShow(h > w && w < thresholdW)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [isTouch, thresholdW])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <div className="max-w-sm w-full bg-white dark:bg-neutral-900 border rounded-xl shadow-xl p-5 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
          {/* rotate icon using simple CSS */}
          <div className="h-6 w-8 bg-neutral-800 dark:bg-white rounded-sm rotate-90" />
        </div>
        <div className="font-semibold">横屏体验更佳</div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          当前屏幕较窄，建议横屏游玩以获得更大的棋盘与更顺手的操作。
        </p>
        <div className="mt-4">
          <Button className="w-full h-10" onClick={() => setShow(false)}>
            我知道了
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OrientationHint
