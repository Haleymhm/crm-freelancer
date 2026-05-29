import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { PendingReminders } from "@/components/dashboard/pending-reminders"
import { getRecentInteractions, getPendingReminders } from "@/lib/dashboard-data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus, Building2, Kanban } from "lucide-react"

async function getDashboardStats(userId: string) {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)

    const [
        activeDeals,
        monthlyRevenue,
        pendingQuotes,
        newContacts,
        lastMonthRevenue,
        totalDealsValue,
    ] = await Promise.all([
        prisma.deal.count({
            where: {
                userId,
                stage: { notIn: ["CERRADO_GANADO", "CERRADO_PERDIDO"] },
            },
        }),
        prisma.deal.aggregate({
            where: {
                userId,
                stage: "CERRADO_GANADO",
                closedAt: { gte: firstDayOfMonth },
            },
            _sum: { value: true },
        }),
        prisma.quote.count({
            where: {
                deal: { userId },
                status: "ENVIADA",
            },
        }),
        prisma.contact.count({
            where: {
                userId,
                createdAt: { gte: firstDayOfMonth },
            },
        }),
        prisma.deal.aggregate({
            where: {
                userId,
                stage: "CERRADO_GANADO",
                closedAt: { gte: lastMonthStart, lte: lastMonthEnd },
            },
            _sum: { value: true },
        }),
        prisma.deal.aggregate({
            where: {
                userId,
                stage: { notIn: ["CERRADO_GANADO", "CERRADO_PERDIDO"] },
            },
            _sum: { value: true },
        }),
    ])

    const monthlyRevNum = Number(monthlyRevenue._sum.value || 0)
    const lastMonthRevNum = Number(lastMonthRevenue._sum.value || 0)
    const revenueChange = lastMonthRevNum > 0 
        ? ((monthlyRevNum - lastMonthRevNum) / lastMonthRevNum) * 100 
        : 0

    return {
        activeDeals,
        monthlyRevenue: monthlyRevNum,
        pendingQuotes,
        newContacts,
        revenueChange,
        totalDealsValue: Number(totalDealsValue._sum.value || 0),
    }
}

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    const userId = session.user.id
    const stats = await getDashboardStats(userId)
    const recentInteractions = await getRecentInteractions(userId)
    const pendingReminders = await getPendingReminders(userId)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Resumen de tu negocio</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Deals Activos"
                    value={stats.activeDeals}
                    icon={Kanban}
                    description={`Valor total: ${formatCurrency(stats.totalDealsValue)}`}
                    trend={null}
                    href="/pipeline"
                />
                <KpiCard
                    title="Ingresos del Mes"
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={DollarSign}
                    description="Deals cerrados ganados"
                    trend={stats.revenueChange}
                    href="/reportes"
                />
                <KpiCard
                    title="Cotizaciones Pendientes"
                    value={stats.pendingQuotes}
                    icon={FileText}
                    description="Enviadas y sin respuesta"
                    trend={null}
                    href="/cotizaciones"
                />
                <KpiCard
                    title="Clientes Nuevos"
                    value={stats.newContacts}
                    icon={Users}
                    description="Contactos del mes"
                    trend={null}
                    href="/contactos"
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                            <Link href="/pipeline">
                                <Kanban className="mr-2 h-4 w-4" />
                                Nuevo Deal
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/contactos">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Nuevo Contacto
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/empresas">
                                <Building2 className="mr-2 h-4 w-4" />
                                Nueva Empresa
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/cotizaciones">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Cotización
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Activity & Reminders */}
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

function KpiCard({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    href 
}: {
    title: string
    value: string | number
    icon: React.ElementType
    description: string
    trend: number | null
    href?: string
}) {
    const content = (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{value}</div>
                    {trend !== null && (
                        <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(trend).toFixed(1)}%
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )

    if (href) {
        return <Link href={href} className="block">{content}</Link>
    }
    return content
}