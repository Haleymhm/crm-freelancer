"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, FileText } from "lucide-react"
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
import { QuoteDetailDialog } from "@/components/cotizaciones/quote-detail-dialog"

type QuoteStatus = "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA"

interface QuoteItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

interface Quote {
    id: string
    quoteNumber: string
    status: QuoteStatus
    items: QuoteItem[]
    subtotal: number | string
    tax: number | string
    total: number | string
    validUntil: string | null
    notes: string | null
    sentAt: string | null
    createdAt: string
    deal: {
        id: string
        title: string
        client: { name: string; type?: string } | null
    }
}

const STAGES = [
    { value: "PROSPECTO", label: "Prospección", color: "bg-yellow-500" },
    { value: "CONTACTADO", label: "Contactado", color: "bg-blue-500" },
    { value: "PROPUESTA_ENVIADA", label: "Propuesta Enviada", color: "bg-purple-500" },
    { value: "CERRADO_GANADO", label: "Cerrado Ganado", color: "bg-green-500" },
    { value: "CERRADO_PERDIDO", label: "Cerrado Perdido", color: "bg-red-500" },
]

interface Deal {
    id: string
    title: string
    description?: string
    value: number
    stage: string
    clientId?: string | null
    client?: { id: string; name: string; type?: string } | null
    quotes?: Quote[]
}

interface ClientOption {
    id: string
    name: string
    type: "PERSONA" | "EMPRESA"
}

export default function PipelinePage() {
    const [deals, setDeals] = useState<Deal[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingDealId, setEditingDealId] = useState<string | null>(null)
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [clients, setClients] = useState<ClientOption[]>([])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        value: "",
        stage: "PROSPECTO",
        clientId: "",
    })

    const fetchDeals = async () => {
        const response = await fetch("/api/deals")
        if (response.ok) {
            const data = await response.json()
            setDeals(data)
        }
    }

    const fetchClients = async () => {
        const response = await fetch("/api/clientes")
        if (response.ok) setClients(await response.json())
    }

    useEffect(() => {
        fetchDeals()
        fetchClients()
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

    const filteredDeals = deals.filter((deal) => {
        const search = searchTerm.toLowerCase()
        return (
            deal.title.toLowerCase().includes(search) ||
            deal.client?.name.toLowerCase().includes(search)
        )
    })

    const handleEditDeal = (deal: Deal) => {
        setEditingDealId(deal.id)
        setFormData({
            title: deal.title,
            description: deal.description || "",
            value: deal.value.toString(),
            stage: deal.stage,
            clientId: deal.clientId || "",
        })
        setIsFormOpen(true)
    }

    const openQuoteDetail = (deal: Deal) => {
        if (deal.quotes && deal.quotes.length > 0) {
            const q = deal.quotes[0]
            setSelectedQuote({
                ...q,
                deal: {
                    id: deal.id,
                    title: deal.title,
                    client: deal.client || null,
                }
            })
            setDetailOpen(true)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const url = editingDealId ? `/api/deals/${editingDealId}` : "/api/deals"
        const method = editingDealId ? "PATCH" : "POST"

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                value: formData.value ? parseFloat(formData.value as string) : 0,
                clientId: formData.clientId || null,
            }),
        })

        if (response.ok) {
            fetchDeals()
            setIsFormOpen(false)
            setEditingDealId(null)
            setFormData({ title: "", description: "", value: "", stage: "PROSPECTO", clientId: "" })
        } else {
            console.error("Error response:", await response.text());
            alert("Error al guardar el deal")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta oportunidad?")) return
        const response = await fetch(`/api/deals/${id}`, { method: "DELETE" })
        if (response.ok) fetchDeals()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Pipeline de Ventas</h1>
                <Button onClick={() => {
                    setEditingDealId(null)
                    setFormData({ title: "", description: "", value: "", stage: "PROSPECTO", clientId: "" })
                    setIsFormOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Oportunidad
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Buscar deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="flex w-full gap-1 overflow-x-auto pb-4">
                {STAGES.map((stage) => {
                    const stageDeals = filteredDeals.filter((d) => d.stage === stage.value)
                    const total = stageDeals.reduce((sum, d) => sum + Number(d.value), 0)

                    return (
                        <div
                            key={stage.value}
                            className="flex-1 min-w-[250px] space-y-3 min-h-[700px] overflow-y-auto border-gray-800 bg-gray-100"
                            onDrop={(e) => handleDrop(e, stage.value)}
                            onDragOver={handleDragOver}
                        >
                            <Card className={`${stage.color} text-white border-0`}>
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
                                    className="cursor-move hover:shadow-lg transition-shadow relative group m-1"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 mb-6">
                                                <h3 className="font-semibold text-sm pr-6 leading-tight mb-1">{deal.title}</h3>
                                                <p className="text-lg font-bold text-primary">
                                                    {formatCurrency(Number(deal.value))}
                                                </p>
                                                {deal.client && (
                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                                        {deal.client.name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 absolute bottom-2 right-2">
                                                {deal.stage === "PROPUESTA_ENVIADA" && deal.quotes && deal.quotes.length > 0 && (
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-green-600 transition-all"
                                                        onClick={() => openQuoteDetail(deal)}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {(deal.stage === "PROSPECTO" || deal.stage === "CONTACTADO") && (
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-blue-500 transition-all"
                                                        onClick={() => handleEditDeal(deal)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive transition-all"
                                                    onClick={() => handleDelete(deal.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                        <DialogTitle>{editingDealId ? "Editar Oportunidad" : "Nueva Oportunidad"}</DialogTitle>
                        <DialogDescription>{editingDealId ? "Modifica los detalles de la oportunidad" : "Crea una nueva oportunidad de negocio"}</DialogDescription>
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
                                <Label htmlFor="clientId">Cliente</Label>
                                <Select
                                    value={formData.clientId || "none"}
                                    onValueChange={(value) => setFormData({ ...formData, clientId: value === "none" ? "" : value })}
                                >
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
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button type="submit">{editingDealId ? "Guardar Cambios" : "Crear Oportunidad"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <QuoteDetailDialog
                quote={selectedQuote}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onStatusChange={fetchDeals}
                onDelete={fetchDeals}
            />
        </div>
    )
}
