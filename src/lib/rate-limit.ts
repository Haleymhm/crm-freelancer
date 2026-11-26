import "server-only"

interface RateLimitEntry {
    timestamps: number[]
}

interface LockoutEntry {
    failures: number
    lockedUntil: number
}

/**
 * Limitador de tasa en memoria con ventana deslizante.
 * Nota: Para despliegues multi-instancia en producción, reemplazar por Redis/Upstash.
 */
class SlidingWindowLimiter {
    private store = new Map<string, RateLimitEntry>()
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests: number, windowSeconds: number) {
        this.maxRequests = maxRequests
        this.windowMs = windowSeconds * 1000
    }

    async limit(key: string): Promise<{ success: boolean; remaining: number }> {
        const now = Date.now()
        const windowStart = now - this.windowMs
        const entry = this.store.get(key) ?? { timestamps: [] }

        entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

        if (entry.timestamps.length >= this.maxRequests) {
            this.store.set(key, entry)
            return { success: false, remaining: 0 }
        }

        entry.timestamps.push(now)
        this.store.set(key, entry)

        if (this.store.size > 10_000) {
            for (const [k, v] of this.store.entries()) {
                if (v.timestamps.every((ts) => ts <= windowStart)) {
                    this.store.delete(k)
                }
            }
        }

        return {
            success: true,
            remaining: this.maxRequests - entry.timestamps.length,
        }
    }
}

/**
 * Bloqueo progresivo exponencial tras intentos fallidos de autenticación.
 */
class ProgressiveLockout {
    private store = new Map<string, LockoutEntry>()
    private readonly threshold: number
    private readonly baseLockMs: number
    private readonly maxLockMs: number

    constructor(threshold = 5, baseLockSeconds = 60, maxLockSeconds = 3600) {
        this.threshold = threshold
        this.baseLockMs = baseLockSeconds * 1000
        this.maxLockMs = maxLockSeconds * 1000
    }

    isLocked(key: string): boolean {
        const entry = this.store.get(key)
        if (!entry) return false
        if (entry.lockedUntil > Date.now()) return true
        return false
    }

    recordFailure(key: string): void {
        const now = Date.now()
        const entry = this.store.get(key) ?? { failures: 0, lockedUntil: 0 }
        entry.failures += 1

        if (entry.failures >= this.threshold) {
            const exponent = entry.failures - this.threshold
            const lockMs = Math.min(this.baseLockMs * Math.pow(2, exponent), this.maxLockMs)
            entry.lockedUntil = now + lockMs
        }

        this.store.set(key, entry)
    }

    reset(key: string): void {
        this.store.delete(key)
    }
}

export const loginLimiter = new SlidingWindowLimiter(5, 60)
export const registerLimiter = new SlidingWindowLimiter(3, 60)
export const authRouteLimiter = new SlidingWindowLimiter(20, 60)
export const mutationLimiter = new SlidingWindowLimiter(60, 60)
export const loginLockout = new ProgressiveLockout(5, 60, 3600)
