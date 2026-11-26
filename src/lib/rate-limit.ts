import "server-only"

interface RateLimitEntry {
    timestamps: number[]
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

        // Limpiar timestamps fuera de la ventana
        entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

        if (entry.timestamps.length >= this.maxRequests) {
            this.store.set(key, entry)
            return { success: false, remaining: 0 }
        }

        entry.timestamps.push(now)
        this.store.set(key, entry)

        // Evitar crecimiento ilimitado en memoria
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

export const loginLimiter = new SlidingWindowLimiter(5, 60)
export const registerLimiter = new SlidingWindowLimiter(3, 60)
