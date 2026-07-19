// Deterministic PRNG so mock data is identical on every load (reproducible demo).
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRng(seed) {
  const r = mulberry32(seed)
  return {
    next: r,
    int: (min, max) => Math.floor(r() * (max - min + 1)) + min,
    float: (min, max) => r() * (max - min) + min,
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    picks: (arr, n) => {
      const pool = [...arr]
      const out = []
      for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
      return out
    },
    chance: (p) => r() < p,
  }
}
