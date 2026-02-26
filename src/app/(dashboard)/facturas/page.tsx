"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FacturasPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Facturas</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Módulo en Desarrollo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        El módulo de facturación estará disponible próximamente. Podrás generar y enviar facturas desde los deals cerrados.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
