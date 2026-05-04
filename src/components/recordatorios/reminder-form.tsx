"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createReminderSchema, CreateReminderData } from "@/lib/validations/reminder"

interface Deal {
    id: string
    title: string
}

interface ReminderFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    preselectedDealId?: string
    onSuccess: () => void
}

export function ReminderForm({ open, onOpenChange, preselectedDealId, onSuccess }: ReminderFormProps) {
    const [loading, setLoading] = useState(false)
    const [deals, setDeals] = useState<Deal[]>([])

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<CreateReminderData>({
        resolver: zodResolver(createReminderSchema),
        defaultValues: {
            dealId: preselectedDealId ?? "",
            message: "",
            dueDate: "",
            completed: false,
        },
    })

    const fetchDeals = async () => {
        try {
            const response = await fetch("/api/deals")
            if (response.ok) {
                const data = await response.json()
                setDeals(data)
            }
        } catch (error) {
            console.error("Error fetching deals:", error)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (open) {
            fetchDeals()
            reset({
                dealId: preselectedDealId ?? "",
                message: "",
                dueDate: "",
                completed: false,
            })
        }
        onOpenChange(open)
    }

    const onSubmit = async (data: CreateReminderData) => {
        setLoading(true)
        try {
            const response = await fetch("/api/recordatorios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error saving reminder:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nuevo Recordatorio</DialogTitle>
                    <DialogDescription>
                        Crea un recordatorio para hacer seguimiento a un deal
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        {!preselectedDealId && (
                            <div className="space-y-2">
                                <Label htmlFor="dealId">Deal *</Label>
                                <Controller
                                    name="dealId"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Seleccionar deal</option>
                                            {deals.map((deal) => (
                                                <option key={deal.id} value={deal.id}>
                                                    {deal.title}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                                {errors.dealId && (
                                    <span className="text-sm text-red-500">{errors.dealId.message}</span>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="message">Mensaje *</Label>
                            <Textarea
                                id="message"
                                rows={2}
                                placeholder="¿Qué necesitas recordar?"
                                {...register("message")}
                            />
                            {errors.message && (
                                <span className="text-sm text-red-500">{errors.message.message}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Fecha y hora *</Label>
                            <Input id="dueDate" type="datetime-local" {...register("dueDate")} />
                            {errors.dueDate && (
                                <span className="text-sm text-red-500">{errors.dueDate.message}</span>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
