import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, TrendingUp, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { PendingReminders } from "@/components/dashboard/pending-reminders"
import { getRecentInteractions, getPendingReminders } from "@/lib/dashboard-data"

async function getDashboardStats(userId: string) {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const [activeDeals, monthlyRevenue, pendingQuotes, newContacts] = await Promise.all([
        prisma.deal.count({
            where: {
                userId,
                stage: {
                    notIn: ["CERRADO_GANADO", "CERRADO_PERDIDO"],
                },
            },
        }),
        prisma.deal.aggregate({
            where: {
                userId,
                stage: "CERRADO_GANADO",
                closedAt: {
                    gte: firstDayOfMonth,
                },
            },
            _sum: {
                value: true,
            },
        }),
        prisma.quote.count({
            where: {
                deal: {
                    userId,
                },
                status: "ENVIADA",
            },
        }),
        prisma.contact.count({
            where: {
                userId,
                createdAt: {
                    gte: firstDayOfMonth,
                },
            },
        }),
    ])

    return {
        activeDeals,
        monthlyRevenue: monthlyRevenue._sum.value || 0,
        pendingQuotes,
        newContacts,
    }
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.id) {
        return null
    }

    const userId = session.user.id
    const stats = await getDashboardStats(userId)
    const recentInteractions = await getRecentInteractions(userId)
    const pendingReminders = await getPendingReminders(userId)

    const cards = [
        {
            title: "Deals Activos",
            value: stats.activeDeals,
            icon: TrendingUp,
            description: "Oportunidades abiertas",
        },
        {
            title: "Ingresos del Mes",
            value: formatCurrency(Number(stats.monthlyRevenue)),
            icon: DollarSign,
            description: "Deals cerrados ganados",
        },
        {
            title: "Cotizaciones Pendientes",
            value: stats.pendingQuotes,
            icon: FileText,
            description: "Enviadas y sin respuesta",
        },
        {
            title: "Clientes Nuevos",
            value: stats.newContacts,
            icon: Users,
            description: "Contactos del mes",
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {card.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentActivities interactions={recentInteractions} />
                </div>
                <div className="lg:col-span-1">
                    <PendingReminders reminders={pendingReminders} />
                </div>
            </div>
        </div>
    )
}
