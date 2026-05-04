"use client"

import { useState, useEffect, useCallback } from "react"
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
import { InvoiceForm } from "@/components/facturas/invoice-form"
import { InvoiceDetailDialog } from "@/components/facturas/invoice-detail-dialog"
import { InvoiceStatusBadge } from "@/components/facturas/invoice-status-badge"
import { formatCurrency } from "@/lib/utils"

interface Invoice {
    id: string
    invoiceNumber: string
    status: "PENDIENTE" | "PAGADA" | "VENCIDA" | "CANCELADA"
    total: number | string
    dueDate: string
    createdAt: string
    deal: {
        id: string
        title: string
        contact: { firstName: string; lastName: string } | null
        company: { name: string } | null
    }
    items: any[]
    subtotal: number | string
    tax: number | string
    notes: string | null
    paidAt: string | null
}

export default function FacturasPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/facturas")
            if (response.ok) {
                setInvoices(await response.json())
            }
        } catch (error) {
            console.error("Error fetching invoices:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    const filteredInvoices = invoices.filter((inv) => {
        const search = searchTerm.toLowerCase()
        const clientName = inv.deal.contact
            ? `${inv.deal.contact.firstName} ${inv.deal.contact.lastName}`
            : inv.deal.company?.name ?? ""
        return (
            inv.invoiceNumber.toLowerCase().includes(search) ||
            clientName.toLowerCase().includes(search) ||
            inv.deal.title.toLowerCase().includes(search)
        )
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Facturas</h1>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Factura
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Buscar facturas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nro. Factura</TableHead>
                            <TableHead>Deal</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        ) : filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">No hay facturas registradas</TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((inv) => {
                                const clientName = inv.deal.contact
                                    ? `${inv.deal.contact.firstName} ${inv.deal.contact.lastName}`
                                    : inv.deal.company?.name ?? "—"
                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                                        <TableCell>{inv.deal.title}</TableCell>
                                        <TableCell>{clientName}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(Number(inv.total))}
                                        </TableCell>
                                        <TableCell>
                                            <InvoiceStatusBadge status={inv.status} />
                                        </TableCell>
                                        <TableCell>{new Date(inv.dueDate).toLocaleDateString("es-MX")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedInvoice(inv)
                                                    setDetailOpen(true)
                                                }}
                                            >
                                                Ver detalle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <InvoiceForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={fetchInvoices}
            />
            <InvoiceDetailDialog
                invoice={selectedInvoice}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onStatusChange={fetchInvoices}
                onDelete={fetchInvoices}
            />
        </div>
    )
}
