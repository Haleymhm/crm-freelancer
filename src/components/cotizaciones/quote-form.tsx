"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { createQuoteSchema, CreateQuoteData } from "@/lib/validations/quote"
import { Trash2, PlusCircle } from "lucide-react"

interface Deal {
    id: string
    title: string
}

interface QuoteFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Deal pre-seleccionado (cuando se abre desde el contexto de un deal) */
    preselectedDealId?: string
    onSuccess: () => void
}

export function QuoteForm({ open, onOpenChange, preselectedDealId, onSuccess }: QuoteFormProps) {
    const [loading, setLoading] = useState(false)
    const [deals, setDeals] = useState<Deal[]>([])

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<CreateQuoteData>({
        resolver: zodResolver(createQuoteSchema),
        defaultValues: {
            dealId: preselectedDealId ?? "",
            items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: 16,
            validUntil: "",
            notes: "",
        },
    })

    const { fields, append, remove } = useFieldArray({ control, name: "items" })
    const watchedItems = watch("items")
    const watchedTaxRate = watch("taxRate")

    // Calcular totales en tiempo real
    const subtotal = watchedItems?.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
    ) ?? 0
    const taxAmount = subtotal * ((Number(watchedTaxRate) || 0) / 100)
    const total = subtotal + taxAmount

    // Sincronizar campo total de cada línea
    useEffect(() => {
        watchedItems?.forEach((item, index) => {
            const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
            setValue(`items.${index}.total`, lineTotal)
        })
    }, [watchedItems?.map(i => `${i.quantity}_${i.unitPrice}`).join(","), setValue])

    const fetchDeals = useCallback(async () => {
        try {
            const response = await fetch("/api/deals")
            if (response.ok) {
                const data = await response.json()
                setDeals(data)
            }
        } catch (error) {
            console.error("Error fetching deals:", error)
        }
    }, [])

    useEffect(() => {
        if (open) {
            fetchDeals()
            reset({
                dealId: preselectedDealId ?? "",
                items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
                taxRate: 16,
                validUntil: "",
                notes: "",
            })
        }
    }, [open, preselectedDealId, fetchDeals, reset])

    const onSubmit = async (data: CreateQuoteData) => {
        setLoading(true)
        try {
            const response = await fetch("/api/cotizaciones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                onSuccess()
                onOpenChange(false)
            } else {
                const err = await response.json()
                console.error("Error al guardar cotización:", err)
            }
        } catch (error) {
            console.error("Error creating quote:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nueva Cotización</DialogTitle>
                    <DialogDescription>
                        Agrega los servicios o productos a cotizar
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-5 py-4">

                        {/* Deal selector */}
                        <div className="space-y-2">
                            <Label htmlFor="dealId">Deal *</Label>
                            <Controller
                                name="dealId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
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

                        {/* Fecha de vencimiento + Tasa impuesto */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="validUntil">Válida hasta</Label>
                                <Input
                                    id="validUntil"
                                    type="date"
                                    {...register("validUntil")}
                                />
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
                                {errors.taxRate && (
                                    <span className="text-sm text-red-500">{errors.taxRate.message}</span>
                                )}
                            </div>
                        </div>

                        {/* Líneas de servicio */}
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

                            {/* Cabecera de tabla */}
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

                            {errors.items && (
                                <span className="text-sm text-red-500">
                                    {typeof errors.items === "string" ? errors.items : "Revisa los ítems"}
                                </span>
                            )}
                        </div>

                        {/* Resumen financiero */}
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

                        {/* Notas */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas internas</Label>
                            <textarea
                                id="notes"
                                rows={3}
                                placeholder="Términos, condiciones, observaciones..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                {...register("notes")}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Cotización"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
