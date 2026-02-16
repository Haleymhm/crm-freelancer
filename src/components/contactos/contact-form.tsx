"use client"

import { useState, useEffect } from "react"
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
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        companyId: "",
    })

    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName || "",
                lastName: contact.lastName || "",
                email: contact.email || "",
                phone: contact.phone || "",
                position: contact.position || "",
                companyId: contact.companyId || "",
            })
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                position: "",
                companyId: "",
            })
        }
    }, [contact, open])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = contact ? `/api/contactos/${contact.id}` : "/api/contactos"
            const method = contact ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    companyId: formData.companyId || null,
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
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo</Label>
                            <Input
                                id="position"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa</Label>
                            <Select
                                value={formData.companyId || "none"}
                                onValueChange={(value) => setFormData({ ...formData, companyId: value === "none" ? "" : value })}
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
