"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STAGES = [
    { value: "PROSPECTO", label: "Prospecto", color: "bg-gray-500" },
    { value: "CONTACTADO", label: "Contactado", color: "bg-blue-500" },
    { value: "PROPUESTA_ENVIADA", label: "Propuesta Enviada", color: "bg-purple-500" },
    { value: "NEGOCIACION", label: "Negociación", color: "bg-yellow-500" },
    { value: "CERRADO_GANADO", label: "Cerrado Ganado", color: "bg-green-500" },
    { value: "CERRADO_PERDIDO", label: "Cerrado Perdido", color: "bg-red-500" },
]

interface Deal {
    id: string
    title: string
    description?: string
    value: number
    stage: string
    contact?: { firstName: string; lastName: string }
    company?: { name: string }
}

export default function PipelinePage() {
    const [deals, setDeals] = useState<Deal[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [contacts, setContacts] = useState<any[]>([])
    const [companies, setCompanies] = useState<any[]>([])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        value: "",
        stage: "PROSPECTO",
        contactId: "",
        companyId: "",
    })

    const fetchDeals = async () => {
        const response = await fetch("/api/deals")
        if (response.ok) {
            const data = await response.json()
            setDeals(data)
        }
    }

    const fetchContacts = async () => {
        const response = await fetch("/api/contactos")
        if (response.ok) setContacts(await response.json())
    }

    const fetchCompanies = async () => {
        const response = await fetch("/api/empresas")
        if (response.ok) setCompanies(await response.json())
    }

    useEffect(() => {
        fetchDeals()
        fetchContacts()
        fetchCompanies()
    }, [])

    const handleDragStart = (e: React.DragEvent, dealId: string) => {
        e.dataTransfer.setData("dealId", dealId)
    }

    const handleDrop = async (e: React.DragEvent, newStage: string) => {
        e.preventDefault()
        const dealId = e.dataTransfer.getData("dealId")

        const response = await fetch(`/api/deals/${dealId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage: newStage }),
        })

        if (response.ok) fetchDeals()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const response = await fetch("/api/deals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                value: parseFloat(formData.value),
                contactId: formData.contactId || null,
                companyId: formData.companyId || null,
            }),
        })

        if (response.ok) {
            fetchDeals()
            setIsFormOpen(false)
            setFormData({ title: "", description: "", value: "", stage: "PROSPECTO", contactId: "", companyId: "" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este deal?")) return
        const response = await fetch(`/api/deals/${id}`, { method: "DELETE" })
        if (response.ok) fetchDeals()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Pipeline de Ventas</h1>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Deal
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {STAGES.map((stage) => {
                    const stageDeals = deals.filter((d) => d.stage === stage.value)
                    const total = stageDeals.reduce((sum, d) => sum + Number(d.value), 0)

                    return (
                        <div
                            key={stage.value}
                            className="space-y-3"
                            onDrop={(e) => handleDrop(e, stage.value)}
                            onDragOver={handleDragOver}
                        >
                            <Card className={`${stage.color} text-white`}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm">{stage.label}</CardTitle>
                                    <p className="text-xs opacity-90">
                                        {stageDeals.length} · {formatCurrency(total)}
                                    </p>
                                </CardHeader>
                            </Card>

                            {stageDeals.map((deal) => (
                                <Card
                                    key={deal.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, deal.id)}
                                    className="cursor-move hover:shadow-lg transition-shadow"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{deal.title}</h3>
                                                <p className="text-lg font-bold text-primary mt-1">
                                                    {formatCurrency(Number(deal.value))}
                                                </p>
                                                {deal.contact && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {deal.contact.firstName} {deal.contact.lastName}
                                                    </p>
                                                )}
                                                {deal.company && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {deal.company.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleDelete(deal.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                })}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Deal</DialogTitle>
                        <DialogDescription>Crea una nueva oportunidad de negocio</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título *</Label>
                                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Valor *</Label>
                                <Input id="value" type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stage">Etapa *</Label>
                                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STAGES.map((stage) => (
                                            <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactId">Contacto</Label>
                                <Select
                                    value={formData.contactId || "none"}
                                    onValueChange={(value) => setFormData({ ...formData, contactId: value === "none" ? "" : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar contacto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin contacto</SelectItem>
                                        {contacts.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyId">Empresa</Label>
                                <Select
                                    value={formData.companyId || "none"}
                                    onValueChange={(value) => setFormData({ ...formData, companyId: value === "none" ? "" : value })}
                                >
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
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button type="submit">Crear Deal</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
