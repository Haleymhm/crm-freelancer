"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CotizacionesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Cotizaciones</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Módulo en Desarrollo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        El módulo de cotizaciones estará disponible próximamente. Podrás crear, enviar y gestionar cotizaciones para tus deals.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
