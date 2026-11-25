"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, FileText, Search, UserRound } from "lucide-react"
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
        <div className="flex h-[calc(100vh-3rem)] min-h-[620px] flex-col gap-4">
            <header className="flex shrink-0 items-center justify-between gap-4">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    Pipeline de Ventas
                </h1>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium tabular-nums text-slate-500 shadow-sm">
                    {deals.length} {deals.length === 1 ? "oportunidad" : "oportunidades"}
                </span>
            </header>

            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-[260px]">
                    <label htmlFor="pipeline-search" className="sr-only">
                        Buscar oportunidades
                    </label>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        id="pipeline-search"
                        placeholder="Buscar oportunidades..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                </div>

                <Button
                    onClick={() => {
                        setEditingDealId(null)
                        setFormData({ title: "", description: "", value: "", stage: "PROSPECTO", clientId: "" })
                        setIsFormOpen(true)
                    }}
                    className="h-9 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Oportunidad
                </Button>
            </div>

            <div
                className="min-h-0 flex-1 overflow-x-auto pb-1"
                role="region"
                aria-label="Tablero de oportunidades"
            >
                <div className="grid h-full min-w-[1080px] grid-cols-5 gap-3">
                    {STAGES.map((stage) => {
                        const stageDeals = filteredDeals.filter((d) => d.stage === stage.value)
                        const total = stageDeals.reduce((sum, d) => sum + Number(d.value), 0)
                        const stageTitleId = `pipeline-stage-${stage.value.toLowerCase()}`

                        return (
                            <section
                                key={stage.value}
                                aria-labelledby={stageTitleId}
                                className="flex h-full min-h-[420px] snap-start flex-col overflow-hidden rounded-xl bg-slate-100/90 p-2.5"
                                onDrop={(e) => handleDrop(e, stage.value)}
                                onDragOver={handleDragOver}
                            >
                                <header className="flex items-center gap-2 px-1 py-1.5">
                                    <span
                                        aria-hidden="true"
                                        className={`h-2 w-2 shrink-0 rounded-full ${stage.color}`}
                                    />
                                    <h2
                                        id={stageTitleId}
                                        className="truncate text-xs font-semibold text-slate-700"
                                    >
                                        {stage.label}
                                    </h2>
                                    <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
                                        {stageDeals.length}
                                    </span>
                                    <span
                                        title={formatCurrency(total)}
                                        className="ml-auto max-w-[92px] truncate text-[10px] font-medium tabular-nums text-slate-400"
                                    >
                                        {formatCurrency(total)}
                                    </span>
                                </header>

                                <div className="mt-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-0.5 pb-1">
                                    {stageDeals.map((deal) => (
                                        <Card
                                            key={deal.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, deal.id)}
                                            className="group cursor-grab rounded-lg border-slate-200/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] active:cursor-grabbing"
                                        >
                                            <div className="flex min-w-0 items-start justify-between gap-2">
                                                <h3 className="line-clamp-2 min-w-0 text-[13px] font-semibold leading-[1.35] text-slate-800">
                                                    {deal.title}
                                                </h3>
                                                <span
                                                    aria-hidden="true"
                                                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 transition-colors group-hover:bg-blue-400"
                                                />
                                            </div>

                                            <p className="mt-3 text-[13px] font-semibold tabular-nums text-slate-700">
                                                {formatCurrency(Number(deal.value))}
                                            </p>
                                            {deal.client && (
                                                <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
                                                    <UserRound
                                                        aria-hidden="true"
                                                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                                    />
                                                    <span className="truncate">{deal.client.name}</span>
                                                </p>
                                            )}

                                            <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
                                                {deal.stage === "PROPUESTA_ENVIADA" && deal.quotes && deal.quotes.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Ver cotización de ${deal.title}`}
                                                        title="Ver cotización"
                                                        className="h-7 w-7 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                                        onClick={() => openQuoteDetail(deal)}
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {(deal.stage === "PROSPECTO" || deal.stage === "CONTACTADO") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Editar ${deal.title}`}
                                                        title="Editar oportunidad"
                                                        className="h-7 w-7 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                                        onClick={() => handleEditDeal(deal)}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Eliminar ${deal.title}`}
                                                    title="Eliminar oportunidad"
                                                    className="h-7 w-7 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                    onClick={() => handleDelete(deal.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}

                                    {stageDeals.length === 0 && (
                                        <div className="flex min-h-[88px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/40 px-4 text-center">
                                            <p className="text-[11px] leading-4 text-slate-400">
                                                Suelta una oportunidad aquí
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )
                    })}
                </div>
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
