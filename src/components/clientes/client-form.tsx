"use client"

import { useState, useEffect } from "react"
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
import { clientSchema, ClientFormData } from "@/lib/validations/client"

export interface ClientRecord {
    id: string
    type: "PERSONA" | "EMPRESA"
    name: string
    taxId?: string | null
    email?: string | null
    phone?: string | null
    contactName?: string | null
    website?: string | null
    address?: string | null
    notes?: string | null
}

interface ClientFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client?: ClientRecord
    onSuccess: () => void
}

export function ClientForm({ open, onOpenChange, client, onSuccess }: ClientFormProps) {
    const [loading, setLoading] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            type: "PERSONA",
            name: "",
            taxId: "",
            email: "",
            phone: "",
            contactName: "",
            website: "",
            address: "",
            notes: "",
        },
    })

    const clientType = watch("type")

    useEffect(() => {
        setSubmitError(null)
        if (client) {
            reset({
                type: client.type,
                name: client.name || "",
                taxId: client.taxId || "",
                email: client.email || "",
                phone: client.phone || "",
                contactName: client.contactName || "",
                website: client.website || "",
                address: client.address || "",
                notes: client.notes || "",
            })
        } else {
            reset({
                type: "PERSONA",
                name: "",
                taxId: "",
                email: "",
                phone: "",
                contactName: "",
                website: "",
                address: "",
                notes: "",
            })
        }
    }, [client, open, reset])

    const onSubmit = async (data: ClientFormData) => {
        setLoading(true)
        setSubmitError(null)

        try {
            const url = client ? `/api/clientes/${client.id}` : "/api/clientes"
            const method = client ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    contactName: data.type === "EMPRESA" ? data.contactName || "" : "",
                }),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            } else {
                const err = await response.json().catch(() => null)
                setSubmitError(err?.error || "Error al guardar el cliente")
            }
        } catch (error) {
            console.error("Error saving client:", error)
            setSubmitError("Error de conexión al guardar el cliente")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {client ? "Editar Cliente" : "Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                        Completa la información del cliente
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo *</Label>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger id="type">
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PERSONA">Persona</SelectItem>
                                                <SelectItem value="EMPRESA">Empresa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.type && (
                                    <span className="text-sm text-red-500">{errors.type.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">RUT / RUN / DNI</Label>
                                <Input
                                    id="taxId"
                                    placeholder="Ej: 12.345.678-9"
                                    {...register("taxId")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {clientType === "EMPRESA" ? "Nombre o Razón Social *" : "Nombre *"}
                            </Label>
                            <Input
                                id="name"
                                placeholder={clientType === "EMPRESA" ? "Ej: ACME SpA" : "Ej: María González"}
                                {...register("name")}
                            />
                            {errors.name && (
                                <span className="text-sm text-red-500">{errors.name.message}</span>
                            )}
                        </div>

                        {clientType === "EMPRESA" && (
                            <div className="space-y-2">
                                <Label htmlFor="contactName">Nombre de contacto</Label>
                                <Input
                                    id="contactName"
                                    placeholder="Persona referente en la empresa"
                                    {...register("contactName")}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <span className="text-sm text-red-500">{errors.email.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono de contacto</Label>
                                <Input
                                    id="phone"
                                    placeholder="+56 9 1234 5678"
                                    {...register("phone")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="website">Sitio Web</Label>
                                <Input
                                    id="website"
                                    placeholder="https://ejemplo.com"
                                    {...register("website")}
                                />
                                {errors.website && (
                                    <span className="text-sm text-red-500">{errors.website.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    placeholder="Calle, número, ciudad"
                                    {...register("address")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                placeholder="Información adicional del cliente..."
                                {...register("notes")}
                            />
                        </div>

                        {submitError && (
                            <p className="text-sm text-red-500">{submitError}</p>
                        )}
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
