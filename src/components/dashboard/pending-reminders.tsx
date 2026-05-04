import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"
import { Bell, Clock, CheckCircle } from "lucide-react"

interface Reminder {
    id: string
    message: string
    dueDate: string
    completed: boolean
    deal: {
        title: string
    }
}

interface PendingRemindersProps {
    reminders: Reminder[]
}

export function PendingReminders({ reminders }: PendingRemindersProps) {
    if (reminders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recordatorios Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hay recordatorios pendientes
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recordatorios Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {reminders.map((reminder) => {
                        const isOverdue = new Date(reminder.dueDate) < new Date()
                        return (
                            <div
                                key={reminder.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                            >
                                {isOverdue ? (
                                    <Bell className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                ) : (
                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                        {reminder.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {reminder.deal.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateTime(reminder.dueDate)}
                                    </p>
                                </div>
                                {isOverdue && (
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                        Vencido
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
