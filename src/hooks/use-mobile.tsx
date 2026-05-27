
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024
// Altura mínima necessária para o layout desktop do PDV ser usável.
// Abaixo disso, caímos no layout tablet (single-column com bottom nav).
const SHORT_VIEWPORT_HEIGHT = 720

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const compute = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobileWidth = width < MOBILE_BREAKPOINT
      const isInTabletWidth = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
      const isShortHeight = height < SHORT_VIEWPORT_HEIGHT
      // Considera tablet também quando a altura é baixa demais para o layout desktop,
      // desde que não seja mobile (que já tem seu próprio layout).
      setIsTablet(isInTabletWidth || (isShortHeight && !isMobileWidth))
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const compute = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setIsDesktop(width >= TABLET_BREAKPOINT && height >= SHORT_VIEWPORT_HEIGHT)
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [])

  return !!isDesktop
}
