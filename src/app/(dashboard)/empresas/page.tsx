"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Company {
    id: string
    name: string
    email?: string
    phone?: string
    website?: string
    address?: string
}

export default function EmpresasPage() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedCompany, setSelectedCompany] = useState<Company | undefined>()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
    })

    const fetchCompanies = async () => {
        try {
            const response = await fetch("/api/empresas")
            if (response.ok) {
                const data = await response.json()
                setCompanies(data)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    useEffect(() => {
        if (selectedCompany) {
            setFormData({
                name: selectedCompany.name || "",
                email: selectedCompany.email || "",
                phone: selectedCompany.phone || "",
                website: selectedCompany.website || "",
                address: selectedCompany.address || "",
            })
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                website: "",
                address: "",
            })
        }
    }, [selectedCompany, isFormOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const url = selectedCompany ? `/api/empresas/${selectedCompany.id}` : "/api/empresas"
        const method = selectedCompany ? "PUT" : "POST"

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })

        if (response.ok) {
            fetchCompanies()
            setIsFormOpen(false)
            setSelectedCompany(undefined)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta empresa?")) return

        const response = await fetch(`/api/empresas/${id}`, { method: "DELETE" })
        if (response.ok) fetchCompanies()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Empresas</h1>
                <Button onClick={() => {
                    setSelectedCompany(undefined)
                    setIsFormOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Empresa
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Sitio Web</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : companies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No hay empresas</TableCell>
                            </TableRow>
                        ) : (
                            companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.name}</TableCell>
                                    <TableCell>{company.email || "-"}</TableCell>
                                    <TableCell>{company.phone || "-"}</TableCell>
                                    <TableCell>{company.website || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setSelectedCompany(company)
                                                setIsFormOpen(true)
                                            }}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCompany ? "Editar" : "Nueva"} Empresa</DialogTitle>
                        <DialogDescription>Completa la información de la empresa</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Sitio Web</Label>
                                <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
