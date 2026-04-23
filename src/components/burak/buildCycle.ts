export function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export type CyclePhase = 'build' | 'holdBuilt' | 'demo' | 'holdEmpty'

export type CycleState = {
  phase: CyclePhase
  completeness: number
  phaseT: number
}

const BUILD = 11.2
const HOLD_BUILT = 3.1
const DEMO = 9.4
const HOLD_EMPTY = 2.2
const TOTAL = BUILD + HOLD_BUILT + DEMO + HOLD_EMPTY

export function getCycleState(elapsed: number): CycleState {
  const t = elapsed % TOTAL
  if (t < BUILD) {
    const p = t / BUILD
    return {
      phase: 'build',
      completeness: easeOutQuint(p),
      phaseT: p,
    }
  }
  if (t < BUILD + HOLD_BUILT) {
    return { phase: 'holdBuilt', completeness: 1, phaseT: 0 }
  }
  if (t < BUILD + HOLD_BUILT + DEMO) {
    const u = (t - BUILD - HOLD_BUILT) / DEMO
    const inv = easeInOutCubic(u)
    return {
      phase: 'demo',
      completeness: 1 - inv,
      phaseT: u,
    }
  }
  return { phase: 'holdEmpty', completeness: 0, phaseT: 0 }
}
