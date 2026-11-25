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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { interactionSchema, InteractionFormData } from "@/lib/validations/interaction"

const INTERACTION_TYPES = [
    { value: "EMAIL", label: "Email" },
    { value: "LLAMADA", label: "Llamada" },
    { value: "REUNION", label: "Reunión" },
    { value: "NOTA", label: "Nota" },
    { value: "WHATSAPP", label: "WhatsApp" },
]

interface Client {
    id: string
    name: string
    type: "PERSONA" | "EMPRESA"
}

interface Deal {
    id: string
    title: string
}

interface InteractionFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    preselectedClientId?: string
    preselectedDealId?: string
    onSuccess: () => void
}

export function InteractionForm({ open, onOpenChange, preselectedClientId, preselectedDealId, onSuccess }: InteractionFormProps) {
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [deals, setDeals] = useState<Deal[]>([])

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<InteractionFormData>({
        resolver: zodResolver(interactionSchema),
        defaultValues: {
            type: "NOTA",
            subject: "",
            notes: "",
            clientId: preselectedClientId || "none",
            dealId: preselectedDealId || "none",
            interactionDate: "",
        },
    })

    const fetchData = async () => {
        try {
            const [clientsRes, dealsRes] = await Promise.all([
                fetch("/api/clientes"),
                fetch("/api/deals"),
            ])
            if (clientsRes.ok) setClients(await clientsRes.json())
            if (dealsRes.ok) setDeals(await dealsRes.json())
        } catch (error) {
            console.error("Error fetching data:", error)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (open) {
            fetchData()
            reset({
                type: "NOTA",
                subject: "",
                notes: "",
                clientId: preselectedClientId || "none",
                dealId: preselectedDealId || "none",
                interactionDate: "",
            })
        }
        onOpenChange(open)
    }

    const onSubmit = async (data: InteractionFormData) => {
        setLoading(true)
        try {
            const response = await fetch("/api/interacciones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: data.type,
                    subject: data.subject || null,
                    notes: data.notes || null,
                    clientId: data.clientId === "none" || data.clientId === "" ? null : data.clientId,
                    dealId: data.dealId === "none" || data.dealId === "" ? null : data.dealId,
                    interactionDate: data.interactionDate || undefined,
                }),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error saving interaction:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Interacción</DialogTitle>
                    <DialogDescription>
                        Registra una nueva interacción con el cliente
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo *</Label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INTERACTION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto</Label>
                            <Input id="subject" {...register("subject")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea id="notes" rows={3} {...register("notes")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interactionDate">Fecha</Label>
                            <Input id="interactionDate" type="datetime-local" {...register("interactionDate")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clientId">Cliente</Label>
                            <Controller
                                name="clientId"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin cliente</SelectItem>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} ({c.type === "EMPRESA" ? "Empresa" : "Persona"})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dealId">Deal</Label>
                            <Controller
                                name="dealId"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar deal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin deal</SelectItem>
                                            {deals.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
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
