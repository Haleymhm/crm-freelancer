"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/reportes/revenue-chart"
import { ConversionChart } from "@/components/reportes/conversion-chart"
import { DealsByStageChart } from "@/components/reportes/deals-by-stage-chart"

interface RevenueData {
    month: string
    revenue: number
}

interface ConversionData {
    won: number
    lost: number
    active: number
}

interface StageData {
    stage: string
    count: number
    value: number
}

export default function ReportesPage() {
    const [revenueData, setRevenueData] = useState<RevenueData[]>([])
    const [conversionData, setConversionData] = useState<ConversionData | null>(null)
    const [stageData, setStageData] = useState<StageData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const [revRes, convRes, stageRes] = await Promise.all([
                    fetch("/api/reportes/revenue"),
                    fetch("/api/reportes/conversion"),
                    fetch("/api/reportes/stages"),
                ])
                if (revRes.ok) setRevenueData(await revRes.json())
                if (convRes.ok) setConversionData(await convRes.json())
                if (stageRes.ok) setStageData(await stageRes.json())
            } catch (error) {
                console.error("Error fetching reports:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    if (loading) {
        return <div className="text-center py-16 text-muted-foreground">Cargando reportes...</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Reportes</h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Ingresos Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueChart data={revenueData} />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Tasa de Conversión</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {conversionData && <ConversionChart {...conversionData} />}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Distribución de Deals por Etapa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DealsByStageChart data={stageData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
