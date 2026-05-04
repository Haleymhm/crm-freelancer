"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { InvoiceStatusBadge } from "@/components/facturas/invoice-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Trash2, Send } from "lucide-react"

interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

interface Invoice {
    id: string
    invoiceNumber: string
    status: "PENDIENTE" | "PAGADA" | "VENCIDA" | "CANCELADA"
    items: InvoiceItem[]
    subtotal: number | string
    tax: number | string
    total: number | string
    dueDate: string
    paidAt: string | null
    notes: string | null
    createdAt: string
    deal: {
        id: string
        title: string
        contact: { firstName: string; lastName: string } | null
        company: { name: string } | null
    }
}

interface InvoiceDetailDialogProps {
    invoice: Invoice | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusChange: () => void
    onDelete: () => void
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange, onStatusChange, onDelete }: InvoiceDetailDialogProps) {
    const [loading, setLoading] = useState(false)

    if (!invoice) return null

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true)
        try {
            const body: Record<string, unknown> = { status: newStatus }
            if (newStatus === "PAGADA") {
                body.paidAt = new Date().toISOString()
            }
            const response = await fetch(`/api/facturas/${invoice.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (response.ok) {
                onStatusChange()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error updating invoice:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("¿Eliminar esta factura?")) return
        setLoading(true)
        try {
            const response = await fetch(`/api/facturas/${invoice.id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                onDelete()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error deleting invoice:", error)
        } finally {
            setLoading(false)
        }
    }

    const clientName = invoice.deal.contact
        ? `${invoice.deal.contact.firstName} ${invoice.deal.contact.lastName}`
        : invoice.deal.company?.name ?? "—"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Factura {invoice.invoiceNumber}</DialogTitle>
                            <DialogDescription>{invoice.deal.title}</DialogDescription>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Cliente:</span>
                            <p className="font-medium">{clientName}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Vencimiento:</span>
                            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Creada:</span>
                            <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                        </div>
                        {invoice.paidAt && (
                            <div>
                                <span className="text-muted-foreground">Pagada:</span>
                                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border">
                        <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                            <span>Descripción</span>
                            <span className="text-right">Cant.</span>
                            <span className="text-right">Precio</span>
                            <span className="text-right">Total</span>
                        </div>
                        {invoice.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-4 py-2 text-sm border-t">
                                <span className="font-medium">{item.description}</span>
                                <span className="text-right">{item.quantity}</span>
                                <span className="text-right">{formatCurrency(Number(item.unitPrice))}</span>
                                <span className="text-right font-medium">{formatCurrency(Number(item.total))}</span>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatCurrency(Number(invoice.subtotal))}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Impuesto</span>
                            <span className="tabular-nums">{formatCurrency(Number(invoice.tax))}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t pt-1.5">
                            <span>Total</span>
                            <span className="tabular-nums">{formatCurrency(Number(invoice.total))}</span>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div>
                            <span className="text-sm text-muted-foreground">Notas:</span>
                            <p className="text-sm mt-1">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {invoice.status === "PENDIENTE" && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange("PAGADA")}
                                disabled={loading}
                            >
                                <Send className="h-4 w-4 mr-1" />
                                Marcar Pagada
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange("VENCIDA")}
                                disabled={loading}
                            >
                                Marcar Vencida
                            </Button>
                        </>
                    )}
                    {invoice.status === "VENCIDA" && (
                        <Button
                            variant="outline"
                            onClick={() => handleStatusChange("PAGADA")}
                            disabled={loading}
                        >
                            Marcar Pagada
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
