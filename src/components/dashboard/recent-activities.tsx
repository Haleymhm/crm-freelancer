import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { InteractionBadge } from "@/components/interacciones/interaction-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Interaction {
    id: string
    type: "EMAIL" | "LLAMADA" | "REUNION" | "NOTA" | "WHATSAPP"
    subject?: string | null
    notes?: string | null
    contact?: { firstName: string; lastName: string } | null
    company?: { name: string } | null
    deal?: { title: string } | null
    interactionDate: string
}

interface RecentActivitiesProps {
    interactions: Interaction[]
}

export function RecentActivities({ interactions }: RecentActivitiesProps) {
    if (interactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hay actividad reciente
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {interactions.map((interaction) => {
                        const clientName = interaction.contact
                            ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
                            : interaction.company?.name ?? "—"

                        return (
                            <div key={interaction.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {interaction.type.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <InteractionBadge type={interaction.type} />
                                        {interaction.subject && (
                                            <span className="text-sm font-medium truncate">
                                                {interaction.subject}
                                            </span>
                                        )}
                                    </div>
                                    {interaction.notes && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                            {interaction.notes}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {clientName}
                                        {interaction.deal && ` · ${interaction.deal.title}`}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {formatDateTime(interaction.interactionDate)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
