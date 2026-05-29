import { prisma } from "@/lib/prisma"

export async function getRecentInteractions(userId: string, limit = 5) {
    const interactions = await prisma.interaction.findMany({
        where: { userId },
        orderBy: { interactionDate: "desc" },
        take: limit,
        include: {
            contact: { select: { firstName: true, lastName: true } },
            company: { select: { name: true } },
            deal: { select: { title: true } },
        },
    })
    return interactions
}

export async function getPendingReminders(userId: string, limit = 5) {
    const reminders = await prisma.reminder.findMany({
        where: {
            userId,
            completed: false,
        },
        orderBy: { dueDate: "asc" },
        take: limit,
        include: {
            deal: { select: { title: true } },
        },
    })
    return reminders
}

export async function getDealsByStage(userId: string) {
    const deals = await prisma.deal.groupBy({
        by: ["stage"],
        where: { userId },
        _count: { id: true },
        _sum: { value: true },
    })
    return deals
}

export async function getMonthlyRevenue(userId: string) {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        return {
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
            label: d.toLocaleDateString("es-MX", { month: "short" }),
        }
    }).reverse()

    const revenue = await Promise.all(
        months.map(async (m) => {
            const result = await prisma.deal.aggregate({
                where: {
                    userId,
                    stage: "CERRADO_GANADO",
                    closedAt: {
                        gte: m.start,
                        lte: m.end,
                    },
                },
                _sum: { value: true },
            })
            return {
                month: m.label,
                revenue: Number(result._sum.value || 0),
            }
        })
    )

    return revenue
}

export async function getDealsConversion(userId: string) {
    const deals = await prisma.deal.groupBy({
        by: ["stage"],
        where: { userId },
        _count: { id: true },
    })

    const won = deals.find(d => d.stage === "CERRADO_GANADO")?._count.id || 0
    const lost = deals.find(d => d.stage === "CERRADO_PERDIDO")?._count.id || 0
    const active = deals
        .filter(d => !["CERRADO_GANADO", "CERRADO_PERDIDO"].includes(d.stage))
        .reduce((sum, d) => sum + d._count.id, 0)

    const total = won + lost
    const conversionRate = total > 0 ? (won / total) * 100 : 0

    return {
        won,
        lost,
        active,
        conversionRate,
    }
}
