"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DealsByStageProps {
    data: { stage: string; count: number; value: number }[]
}

const STAGE_LABELS: Record<string, string> = {
    PROSPECTO: "Prospecto",
    CONTACTADO: "Contactado",
    PROPUESTA_ENVIADA: "Propuesta",
    NEGOCIACION: "Negociación",
    CERRADO_GANADO: "Ganado",
    CERRADO_PERDIDO: "Perdido",
}

export function DealsByStageChart({ data }: DealsByStageProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tickFormatter={(v) => STAGE_LABELS[v] || v} />
                <YAxis />
                <Tooltip
                    formatter={(value: number, name: string) => {
                        if (name === "count") return [`${value}`, "Cantidad"]
                        if (name === "value") return [`$${value.toLocaleString("es-MX")}`, "Valor"]
                        return [value, name]
                    }}
                />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Cantidad" radius={[4, 4, 0, 0]} />
                <Bar dataKey="value" fill="hsl(var(--muted-foreground))" name="Valor" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
