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

interface Contact {
    id: string
    firstName: string
    lastName: string
}

interface Company {
    id: string
    name: string
}

interface Deal {
    id: string
    title: string
}

interface InteractionFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    preselectedContactId?: string
    preselectedCompanyId?: string
    preselectedDealId?: string
    onSuccess: () => void
}

export function InteractionForm({ open, onOpenChange, preselectedContactId, preselectedCompanyId, preselectedDealId, onSuccess }: InteractionFormProps) {
    const [loading, setLoading] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
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
            contactId: preselectedContactId || "none",
            companyId: preselectedCompanyId || "none",
            dealId: preselectedDealId || "none",
            interactionDate: "",
        },
    })

    const fetchData = async () => {
        try {
            const [contactsRes, companiesRes, dealsRes] = await Promise.all([
                fetch("/api/contactos"),
                fetch("/api/empresas"),
                fetch("/api/deals"),
            ])
            if (contactsRes.ok) setContacts(await contactsRes.json())
            if (companiesRes.ok) setCompanies(await companiesRes.json())
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
                contactId: preselectedContactId || "none",
                companyId: preselectedCompanyId || "none",
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
                    contactId: data.contactId === "none" || data.contactId === "" ? null : data.contactId,
                    companyId: data.companyId === "none" || data.companyId === "" ? null : data.companyId,
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactId">Contacto</Label>
                                <Controller
                                    name="contactId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar contacto" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin contacto</SelectItem>
                                                {contacts.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.firstName} {c.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyId">Empresa</Label>
                                <Controller
                                    name="companyId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar empresa" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin empresa</SelectItem>
                                                {companies.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
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
