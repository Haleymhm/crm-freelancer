"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { QuoteStatusBadge } from "@/components/cotizaciones/quote-status-badge"
import { QuoteForm } from "@/components/cotizaciones/quote-form"
import { QuoteDetailDialog } from "@/components/cotizaciones/quote-detail-dialog"
import { PlusCircle, FileText } from "lucide-react"

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
        contact: { firstName: string; lastName: string } | null
        company: { name: string } | null
    }
}

const TABS: { label: string; value: QuoteStatus | "TODAS" }[] = [
    { label: "Todas", value: "TODAS" },
    { label: "Borrador", value: "BORRADOR" },
    { label: "Enviada", value: "ENVIADA" },
    { label: "Aceptada", value: "ACEPTADA" },
    { label: "Rechazada", value: "RECHAZADA" },
]

export default function CotizacionesPage() {
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<QuoteStatus | "TODAS">("TODAS")
    const [formOpen, setFormOpen] = useState(false)
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    const fetchQuotes = useCallback(async () => {
        setLoading(true)
        try {
            const url =
                activeTab === "TODAS"
                    ? "/api/cotizaciones"
                    : `/api/cotizaciones?status=${activeTab}`
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setQuotes(data)
            }
        } catch (error) {
            console.error("Error fetching quotes:", error)
        } finally {
            setLoading(false)
        }
    }, [activeTab])

    useEffect(() => {
        fetchQuotes()
    }, [fetchQuotes])

    const openDetail = (quote: Quote) => {
        setSelectedQuote(quote)
        setDetailOpen(true)
    }

    const fmt = (val: number | string) =>
        `$${Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cotizaciones</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus propuestas y cotizaciones de servicios
                    </p>
                </div>
                <Button onClick={() => setFormOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nueva Cotización
                </Button>
            </div>

            {/* Tabs de filtro */}
            <div className="flex gap-1 border-b">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.value
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tabla de cotizaciones */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Cargando...</div>
            ) : quotes.length === 0 ? (
                /* Estado vacío */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h2 className="text-lg font-semibold mb-1">Sin cotizaciones</h2>
                    <p className="text-muted-foreground text-sm mb-6">
                        {activeTab === "TODAS"
                            ? "Aún no has creado ninguna cotización."
                            : `No hay cotizaciones con estado "${activeTab.toLowerCase()}".`}
                    </p>
                    {activeTab === "TODAS" && (
                        <Button onClick={() => setFormOpen(true)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Crear primera cotización
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nro.</TableHead>
                                <TableHead>Deal</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Válida hasta</TableHead>
                                <TableHead className="text-right">Creada</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.map((quote) => {
                                const clientName = quote.deal.contact
                                    ? `${quote.deal.contact.firstName} ${quote.deal.contact.lastName}`
                                    : quote.deal.company?.name ?? "—"

                                return (
                                    <TableRow
                                        key={quote.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => openDetail(quote)}
                                    >
                                        <TableCell className="font-mono text-sm font-medium">
                                            {quote.quoteNumber}
                                        </TableCell>
                                        <TableCell className="font-medium">{quote.deal.title}</TableCell>
                                        <TableCell className="text-muted-foreground">{clientName}</TableCell>
                                        <TableCell className="text-right tabular-nums font-semibold">
                                            {fmt(quote.total)}
                                        </TableCell>
                                        <TableCell>
                                            <QuoteStatusBadge status={quote.status} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {quote.validUntil
                                                ? new Date(quote.validUntil).toLocaleDateString("es-MX")
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {new Date(quote.createdAt).toLocaleDateString("es-MX")}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Dialogs */}
            <QuoteForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={fetchQuotes}
            />
            <QuoteDetailDialog
                quote={selectedQuote}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onStatusChange={fetchQuotes}
                onDelete={fetchQuotes}
            />
        </div>
    )
}
