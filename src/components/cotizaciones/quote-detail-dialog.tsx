"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { QuoteStatusBadge } from "./quote-status-badge"
import { Pencil, Trash2, SendHorizontal, CheckCircle, XCircle } from "lucide-react"

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

interface QuoteDetailDialogProps {
    quote: Quote | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusChange: () => void
    onDelete: () => void
}

export function QuoteDetailDialog({
    quote,
    open,
    onOpenChange,
    onStatusChange,
    onDelete,
}: QuoteDetailDialogProps) {
    const [actionLoading, setActionLoading] = useState(false)

    if (!quote) return null

    const fmt = (val: number | string) =>
        `$${Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

    const changeStatus = async (status: QuoteStatus) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/cotizaciones/${quote.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            })
            if (res.ok) {
                onStatusChange()
                onOpenChange(false)
            }
        } catch (e) {
            console.error("Error changing status:", e)
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/cotizaciones/${quote.id}`, { method: "DELETE" })
            if (res.ok) {
                onDelete()
                onOpenChange(false)
            }
        } catch (e) {
            console.error("Error deleting quote:", e)
        } finally {
            setActionLoading(false)
        }
    }

    const clientName = quote.deal.contact
        ? `${quote.deal.contact.firstName} ${quote.deal.contact.lastName}`
        : quote.deal.company?.name ?? "Sin cliente"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle>{quote.quoteNumber}</DialogTitle>
                        <QuoteStatusBadge status={quote.status} />
                    </div>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Info general */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Deal</p>
                            <p className="font-medium">{quote.deal.title}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Cliente</p>
                            <p className="font-medium">{clientName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Creada</p>
                            <p>{new Date(quote.createdAt).toLocaleDateString("es-MX")}</p>
                        </div>
                        {quote.validUntil && (
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Válida hasta</p>
                                <p>{new Date(quote.validUntil).toLocaleDateString("es-MX")}</p>
                            </div>
                        )}
                        {quote.sentAt && (
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Enviada</p>
                                <p>{new Date(quote.sentAt).toLocaleDateString("es-MX")}</p>
                            </div>
                        )}
                    </div>

                    {/* Ítems */}
                    <div>
                        <p className="text-sm font-medium mb-2">Ítems</p>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right w-20">Cant.</TableHead>
                                    <TableHead className="text-right w-28">Precio unit.</TableHead>
                                    <TableHead className="text-right w-28">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(quote.items as QuoteItem[]).map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(item.unitPrice)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmt(item.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totales */}
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm ml-auto max-w-xs">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{fmt(quote.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Impuesto</span>
                            <span className="tabular-nums">{fmt(quote.tax)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t pt-1.5">
                            <span>Total</span>
                            <span className="tabular-nums">{fmt(quote.total)}</span>
                        </div>
                    </div>

                    {/* Notas */}
                    {quote.notes && (
                        <div>
                            <p className="text-sm font-medium mb-1">Notas</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 border-t pt-4">
                        {quote.status === "BORRADOR" && (
                            <>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => changeStatus("ENVIADA")}
                                    disabled={actionLoading}
                                >
                                    <SendHorizontal className="h-4 w-4 mr-1.5" />
                                    Marcar como Enviada
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading}
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4 mr-1.5 text-red-500" />
                                    Eliminar
                                </Button>
                            </>
                        )}
                        {quote.status === "ENVIADA" && (
                            <>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => changeStatus("ACEPTADA")}
                                    disabled={actionLoading}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1.5" />
                                    Marcar como Aceptada
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => changeStatus("RECHAZADA")}
                                    disabled={actionLoading}
                                >
                                    <XCircle className="h-4 w-4 mr-1.5 text-red-500" />
                                    Marcar como Rechazada
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
