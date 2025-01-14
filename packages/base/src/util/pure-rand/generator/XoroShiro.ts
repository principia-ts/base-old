import type { RandomGenerator } from './RandomGenerator'

// XoroShiro128+ with a=24, b=16, c=37,
// - https://en.wikipedia.org/wiki/Xoroshiro128%2B
// - http://prng.di.unimi.it/xoroshiro128plus.c
class XoroShiro128Plus implements RandomGenerator {
  constructor(readonly s01: number, readonly s00: number, readonly s11: number, readonly s10: number) {}
  min(): number {
    return -0x80000000
  }
  max(): number {
    return 0x7fffffff
  }
  next(): [number, XoroShiro128Plus] {
    // a = s0[n] ^ s1[n]
    const a0 = this.s10 ^ this.s00
    const a1 = this.s11 ^ this.s01
    // s0[n+1] = rotl(s0[n], 24) ^ a ^ (a << 16)
    const ns00 = (this.s00 << 24) ^ (this.s01 >>> 8) ^ a0 ^ (a0 << 16)
    const ns01 = (this.s01 << 24) ^ (this.s00 >>> 8) ^ a1 ^ ((a1 << 16) | (a0 >>> 16))
    // s1[n+1] = rotl(a, 37)
    const ns10 = (a1 << 5) ^ (a0 >>> 27)
    const ns11 = (a0 << 5) ^ (a1 >>> 27)
    return [(this.s00 + this.s10) | 0, new XoroShiro128Plus(ns01, ns00, ns11, ns10)]
  }
  jump(): XoroShiro128Plus {
    // equivalent to 2^64 calls to next()
    // can be used to generate 2^64 non-overlapping subsequences
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let rngRunner: XoroShiro128Plus = this
    let ns01                        = 0
    let ns00                        = 0
    let ns11                        = 0
    let ns10                        = 0
    const jump                      = [0xd8f554a5, 0xdf900294, 0x4b3201fc, 0x170865df]
    for (let i = 0; i !== 4; ++i) {
      for (let mask = 1; mask; mask <<= 1) {
        // Because: (1 << 31) << 1 === 0
        if (jump[i] & mask) {
          ns01 ^= rngRunner.s01
          ns00 ^= rngRunner.s00
          ns11 ^= rngRunner.s11
          ns10 ^= rngRunner.s10
        }
        rngRunner = rngRunner.next()[1]
      }
    }
    return new XoroShiro128Plus(ns01, ns00, ns11, ns10)
  }
}

export const xoroshiro128plus = function (seed: number): RandomGenerator {
  return new XoroShiro128Plus(-1, ~seed, seed | 0, 0)
}
