import { Badge } from "@/components/ui/badge"

type InvoiceStatus = "PENDIENTE" | "PAGADA" | "VENCIDA" | "CANCELADA"

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    PENDIENTE: { label: "Pendiente", variant: "secondary" },
    PAGADA: { label: "Pagada", variant: "default" },
    VENCIDA: { label: "Vencida", variant: "destructive" },
    CANCELADA: { label: "Cancelada", variant: "outline" },
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
    const config = statusConfig[status]

    const colorClass =
        status === "PAGADA"
            ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
            : status === "VENCIDA"
                ? "bg-red-600 hover:bg-red-700 text-white border-transparent"
            : status === "PENDIENTE"
                ? "border-yellow-500 text-yellow-700"
                : ""

    return (
        <Badge variant={config.variant} className={colorClass}>
            {config.label}
        </Badge>
    )
}
