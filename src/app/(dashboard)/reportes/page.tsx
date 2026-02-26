"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Reportes</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Módulo en Desarrollo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        El módulo de reportes estará disponible próximamente. Podrás ver gráficos de ventas, tasas de conversión y exportar a CSV.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
