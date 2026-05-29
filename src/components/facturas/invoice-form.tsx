"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { createInvoiceSchema, CreateInvoiceData } from "@/lib/validations/invoice"
import { Trash2, PlusCircle } from "lucide-react"

interface Deal {
    id: string
    title: string
}

interface Quote {
    id: string
    quoteNumber: string
    total: number | string
}

interface InvoiceFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    preselectedDealId?: string
    onSuccess: () => void
}

export function InvoiceForm({ open, onOpenChange, preselectedDealId, onSuccess }: InvoiceFormProps) {
    const [loading, setLoading] = useState(false)
    const [deals, setDeals] = useState<Deal[]>([])
    const [quotes, setQuotes] = useState<Quote[]>([])

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CreateInvoiceData>({
        resolver: zodResolver(createInvoiceSchema),
        defaultValues: {
            dealId: preselectedDealId ?? "",
            quoteId: "",
            items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: 16,
            dueDate: "",
            notes: "",
            status: "PENDIENTE",
        },
    })

    const { fields, append, remove } = useFieldArray({ control, name: "items" })
    const watchedItems = watch("items")
    const watchedTaxRate = watch("taxRate")
    const watchedDealId = watch("dealId")

    const subtotal = watchedItems?.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
    ) ?? 0
    const taxAmount = subtotal * ((Number(watchedTaxRate) || 0) / 100)
    const total = subtotal + taxAmount

    useEffect(() => {
        watchedItems?.forEach((item, index) => {
            const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
            setValue(`items.${index}.total`, lineTotal)
        })
    }, [watchedItems?.map(i => `${i.quantity}_${i.unitPrice}`).join(","), setValue])

    const fetchDeals = async () => {
        try {
            const response = await fetch("/api/deals")
            if (response.ok) {
                const data = await response.json()
                setDeals(data)
            }
        } catch (error) {
            console.error("Error fetching deals:", error)
        }
    }

    const fetchQuotes = async (dealId: string) => {
        if (!dealId) {
            setQuotes([])
            return
        }
        try {
            const response = await fetch(`/api/cotizaciones?dealId=${dealId}`)
            if (response.ok) {
                const data = await response.json()
                setQuotes(data)
            }
        } catch (error) {
            console.error("Error fetching quotes:", error)
        }
    }

    useEffect(() => {
        if (open) {
            fetchDeals()
            reset({
                dealId: preselectedDealId ?? "",
                quoteId: "",
                items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
                taxRate: 16,
                dueDate: "",
                notes: "",
                status: "PENDIENTE",
            })
        }
    }, [open, preselectedDealId, reset])

    useEffect(() => {
        if (watchedDealId) {
            fetchQuotes(watchedDealId)
        }
    }, [watchedDealId])

    const handleQuoteSelect = (quoteId: string) => {
        setValue("quoteId", quoteId || "")
        const selectedQuote = quotes.find(q => q.id === quoteId)
        if (selectedQuote) {
            setValue("items", [{
                description: `Cotización ${selectedQuote.quoteNumber}`,
                quantity: 1,
                unitPrice: Number(selectedQuote.total),
                total: Number(selectedQuote.total),
            }])
        }
    }

    const onSubmit = async (data: CreateInvoiceData) => {
        setLoading(true)
        try {
            const response = await fetch("/api/facturas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    quoteId: data.quoteId === "" ? null : data.quoteId,
                }),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            } else {
                const err = await response.json()
                console.error("Error al guardar factura:", err)
            }
        } catch (error) {
            console.error("Error creating invoice:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nueva Factura</DialogTitle>
                    <DialogDescription>
                        Genera una factura desde un deal o cotización
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-5 py-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dealId">Deal *</Label>
                                <Controller
                                    name="dealId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value ?? undefined}
                                            onValueChange={field.onChange}
                                            disabled={!!preselectedDealId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar deal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {deals.map((deal) => (
                                                    <SelectItem key={deal.id} value={deal.id}>
                                                        {deal.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.dealId && (
                                    <span className="text-sm text-red-500">{errors.dealId.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quoteId">Cotización (opcional)</Label>
                                <Controller
                                    name="quoteId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value ?? undefined}
                                            onValueChange={handleQuoteSelect}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin cotización" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Sin cotización</SelectItem>
                                                {quotes.map((quote) => (
                                                    <SelectItem key={quote.id} value={quote.id}>
                                                        {quote.quoteNumber}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Fecha de vencimiento *</Label>
                                <Input id="dueDate" type="date" {...register("dueDate")} />
                                {errors.dueDate && (
                                    <span className="text-sm text-red-500">{errors.dueDate.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxRate">Impuesto (%)</Label>
                                <Input
                                    id="taxRate"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    {...register("taxRate", { valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Ítems *</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0 })}
                                >
                                    <PlusCircle className="h-4 w-4 mr-1" />
                                    Agregar ítem
                                </Button>
                            </div>

                            <div className="grid grid-cols-[1fr_80px_100px_80px_36px] gap-2 text-xs text-muted-foreground font-medium px-1">
                                <span>Descripción</span>
                                <span className="text-right">Cant.</span>
                                <span className="text-right">Precio unit.</span>
                                <span className="text-right">Total</span>
                                <span />
                            </div>

                            {fields.map((field, index) => {
                                const lineTotal =
                                    (Number(watchedItems?.[index]?.quantity) || 0) *
                                    (Number(watchedItems?.[index]?.unitPrice) || 0)
                                return (
                                    <div key={field.id} className="grid grid-cols-[1fr_80px_100px_80px_36px] gap-2 items-center">
                                        <Input
                                            placeholder="Descripción del servicio"
                                            {...register(`items.${index}.description`)}
                                        />
                                        <Input
                                            type="number"
                                            min={1}
                                            step={1}
                                            className="text-right"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            className="text-right"
                                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                        />
                                        <span className="text-right text-sm font-medium tabular-nums">
                                            ${lineTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="tabular-nums">
                                    ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Impuesto ({watchedTaxRate ?? 0}%)</span>
                                <span className="tabular-nums">
                                    ${taxAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between font-semibold text-base border-t pt-1.5">
                                <span>Total</span>
                                <span className="tabular-nums">
                                    ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                placeholder="Observaciones, condiciones de pago..."
                                {...register("notes")}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Factura"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
