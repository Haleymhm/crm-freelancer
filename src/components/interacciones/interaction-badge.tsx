import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Users, FileText, MessageCircle } from "lucide-react"

type InteractionType = "EMAIL" | "LLAMADA" | "REUNION" | "NOTA" | "WHATSAPP"

interface InteractionBadgeProps {
    type: InteractionType
}

const configMap: Record<InteractionType, { label: string; icon: React.ReactNode; variant: "secondary" | "default" | "outline" }> = {
    EMAIL: { label: "Email", icon: <Mail className="h-3 w-3" />, variant: "outline" },
    LLAMADA: { label: "Llamada", icon: <Phone className="h-3 w-3" />, variant: "secondary" },
    REUNION: { label: "Reunión", icon: <Users className="h-3 w-3" />, variant: "default" },
    NOTA: { label: "Nota", icon: <FileText className="h-3 w-3" />, variant: "outline" },
    WHATSAPP: { label: "WhatsApp", icon: <MessageCircle className="h-3 w-3" />, variant: "secondary" },
}

export function InteractionBadge({ type }: InteractionBadgeProps) {
    const config = configMap[type]
    return (
        <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
        </Badge>
    )
}
