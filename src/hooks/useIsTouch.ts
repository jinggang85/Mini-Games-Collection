/**
 * useIsTouch.ts
 * Detect whether current device likely supports touch input.
 */

import { useEffect, useState } from 'react'

/**
 * useIsTouch
 * Returns true if device has touch capability.
 */
export default function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const check =
      typeof window !== 'undefined' &&
      (('ontouchstart' in window) ||
        (navigator as any).maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0)
    setIsTouch(!!check)
  }, [])

  return isTouch
}
