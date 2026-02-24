"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { contactSchema, ContactFormData } from "@/lib/validations/contact"

interface Contact {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    position?: string
    companyId?: string
}

interface Company {
    id: string
    name: string
}

interface ContactFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    contact?: Contact
    onSuccess: () => void
}

export function ContactForm({ open, onOpenChange, contact, onSuccess }: ContactFormProps) {
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            position: "",
            companyId: "none",
        },
    })

    useEffect(() => {
        if (contact) {
            reset({
                firstName: contact.firstName || "",
                lastName: contact.lastName || "",
                email: contact.email || "",
                phone: contact.phone || "",
                position: contact.position || "",
                companyId: contact.companyId || "none",
            })
        } else {
            reset({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                position: "",
                companyId: "none",
            })
        }
    }, [contact, open, reset])

    useEffect(() => {
        if (open) {
            fetchCompanies()
        }
    }, [open])

    const fetchCompanies = async () => {
        try {
            const response = await fetch("/api/empresas")
            if (response.ok) {
                const data = await response.json()
                setCompanies(data)
            }
        } catch (error) {
            console.error("Error fetching companies:", error)
        }
    }

    const onSubmit = async (data: ContactFormData) => {
        setLoading(true)

        try {
            const url = contact ? `/api/contactos/${contact.id}` : "/api/contactos"
            const method = contact ? "PUT" : "POST"

            const finalCompanyId = data.companyId === "none" || data.companyId === "" ? null : data.companyId

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    companyId: finalCompanyId,
                }),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error saving contact:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {contact ? "Editar Contacto" : "Nuevo Contacto"}
                    </DialogTitle>
                    <DialogDescription>
                        Completa la información del contacto
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    {...register("firstName")}
                                />
                                {errors.firstName && (
                                    <span className="text-sm text-red-500">{errors.firstName.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    {...register("lastName")}
                                />
                                {errors.lastName && (
                                    <span className="text-sm text-red-500">{errors.lastName.message}</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                            />
                            {errors.email && (
                                <span className="text-sm text-red-500">{errors.email.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                {...register("phone")}
                            />
                            {errors.phone && (
                                <span className="text-sm text-red-500">{errors.phone.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo</Label>
                            <Input
                                id="position"
                                {...register("position")}
                            />
                            {errors.position && (
                                <span className="text-sm text-red-500">{errors.position.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa</Label>
                            <Controller
                                name="companyId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar empresa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin empresa</SelectItem>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.companyId && (
                                <span className="text-sm text-red-500">{errors.companyId.message}</span>
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
