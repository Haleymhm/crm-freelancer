"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { companySchema, CompanyFormData } from "@/lib/validations/company"

interface Company {
    id: string
    name: string
    email?: string
    phone?: string
    website?: string
    address?: string
}

interface CompanyFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    company?: Company
    onSuccess: () => void
}

export function CompanyForm({ open, onOpenChange, company, onSuccess }: CompanyFormProps) {
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            website: "",
            address: "",
        },
    })

    useEffect(() => {
        if (company) {
            reset({
                name: company.name || "",
                email: company.email || "",
                phone: company.phone || "",
                website: company.website || "",
                address: company.address || "",
            })
        } else {
            reset({
                name: "",
                email: "",
                phone: "",
                website: "",
                address: "",
            })
        }
    }, [company, open, reset])

    const onSubmit = async (data: CompanyFormData) => {
        setLoading(true)

        try {
            const url = company ? `/api/empresas/${company.id}` : "/api/empresas"
            const method = company ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email || null,
                    phone: data.phone || null,
                    website: data.website || null,
                    address: data.address || null,
                }),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error saving company:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {company ? "Editar Empresa" : "Nueva Empresa"}
                    </DialogTitle>
                    <DialogDescription>
                        Completa la información de la empresa
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && (
                                <span className="text-sm text-red-500">{errors.name.message}</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" {...register("email")} />
                                {errors.email && (
                                    <span className="text-sm text-red-500">{errors.email.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" {...register("phone")} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Sitio Web</Label>
                            <Input id="website" {...register("website")} />
                            {errors.website && (
                                <span className="text-sm text-red-500">{errors.website.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input id="address" {...register("address")} />
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
