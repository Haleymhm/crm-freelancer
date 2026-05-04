"use client"

import { formatDateTime } from "@/lib/utils"
import { InteractionBadge } from "@/components/interacciones/interaction-badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Interaction {
    id: string
    type: "EMAIL" | "LLAMADA" | "REUNION" | "NOTA" | "WHATSAPP"
    subject?: string
    notes?: string
    contact?: { firstName: string; lastName: string } | null
    company?: { name: string } | null
    deal?: { title: string } | null
    interactionDate: string
}

interface InteractionListProps {
    interactions: Interaction[]
}

export function InteractionList({ interactions }: InteractionListProps) {
    if (interactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No hay interacciones registradas
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {interactions.map((interaction, index) => (
                <div key={interaction.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {interaction.type.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <InteractionBadge type={interaction.type} />
                                <span className="text-xs text-muted-foreground">
                                    {formatDateTime(interaction.interactionDate)}
                                </span>
                            </div>
                            {interaction.subject && (
                                <p className="text-sm font-medium">{interaction.subject}</p>
                            )}
                            {interaction.notes && (
                                <p className="text-sm text-muted-foreground">{interaction.notes}</p>
                            )}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                                {interaction.contact && (
                                    <span>
                                        Contacto: {interaction.contact.firstName} {interaction.contact.lastName}
                                    </span>
                                )}
                                {interaction.deal && (
                                    <span>Deal: {interaction.deal.title}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
