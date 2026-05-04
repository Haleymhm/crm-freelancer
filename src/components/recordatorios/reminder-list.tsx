"use client"

import { useState } from "react"
import { formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Bell, CheckCircle, Trash2, Clock } from "lucide-react"

interface Reminder {
    id: string
    message: string
    dueDate: string
    completed: boolean
    completedAt: string | null
    createdAt: string
    deal: {
        id: string
        title: string
    }
}

interface ReminderListProps {
    reminders: Reminder[]
    onComplete: (id: string) => void
    onDelete: (id: string) => void
}

export function ReminderList({ reminders, onComplete, onDelete }: ReminderListProps) {
    const [loading, setLoading] = useState<string | null>(null)

    const sortedReminders = [...reminders].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return a.completed ? 1 : -1
    })

    if (sortedReminders.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No hay recordatorios pendientes
            </div>
        )
    }

    const handleToggleComplete = async (reminder: Reminder) => {
        setLoading(reminder.id)
        try {
            const response = await fetch(`/api/recordatorios/${reminder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    completed: !reminder.completed,
                    completedAt: !reminder.completed ? new Date().toISOString() : undefined,
                }),
            })
            if (response.ok) {
                onComplete(reminder.id)
            }
        } catch (error) {
            console.error("Error updating reminder:", error)
        } finally {
            setLoading(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este recordatorio?")) return
        setLoading(id)
        try {
            const response = await fetch(`/api/recordatorios/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                onDelete(id)
            }
        } catch (error) {
            console.error("Error deleting reminder:", error)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-3">
            {sortedReminders.map((reminder, index) => {
                const isOverdue = !reminder.completed && new Date(reminder.dueDate) < new Date()
                return (
                    <div key={reminder.id}>
                        {index > 0 && <Separator />}
                        <div className="flex items-start gap-3 py-2">
                            <Checkbox
                                checked={reminder.completed}
                                onCheckedChange={() => handleToggleComplete(reminder)}
                                disabled={loading === reminder.id}
                                className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm ${reminder.completed ? "line-through text-muted-foreground" : ""}`}>
                                    {reminder.message}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDateTime(reminder.dueDate)}
                                    </span>
                                    <span>Deal: {reminder.deal.title}</span>
                                    {isOverdue && (
                                        <span className="text-red-500 font-medium flex items-center gap-1">
                                            <Bell className="h-3 w-3" />
                                            Vencido
                                        </span>
                                    )}
                                    {reminder.completed && reminder.completedAt && (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Completado
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(reminder.id)}
                                disabled={loading === reminder.id}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
