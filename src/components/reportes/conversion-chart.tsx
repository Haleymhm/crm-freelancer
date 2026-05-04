"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface ConversionChartProps {
    won: number
    lost: number
    active: number
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"]

export function ConversionChart({ won, lost, active }: ConversionChartProps) {
    const data = [
        { name: "Ganados", value: won },
        { name: "Perdidos", value: lost },
        { name: "Activos", value: active },
    ]

    const total = won + lost
    const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0"

    return (
        <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary mb-2">{rate}%</div>
            <p className="text-sm text-muted-foreground mb-4">Tasa de conversión</p>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} deals`, ""]} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
