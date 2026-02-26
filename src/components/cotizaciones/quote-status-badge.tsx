import { Badge } from "@/components/ui/badge"

type QuoteStatus = "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA"

interface QuoteStatusBadgeProps {
    status: QuoteStatus
}

const statusConfig: Record<QuoteStatus, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    BORRADOR: { label: "Borrador", variant: "secondary" },
    ENVIADA: { label: "Enviada", variant: "outline" },
    ACEPTADA: { label: "Aceptada", variant: "default" },
    RECHAZADA: { label: "Rechazada", variant: "destructive" },
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
    const config = statusConfig[status]

    // Color extra según estado
    const colorClass =
        status === "ENVIADA"
            ? "border-blue-500 text-blue-600"
            : status === "ACEPTADA"
                ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                : ""

    return (
        <Badge variant={config.variant} className={colorClass}>
            {config.label}
        </Badge>
    )
}
