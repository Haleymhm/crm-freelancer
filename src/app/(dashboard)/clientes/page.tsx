"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Building2, User } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ClientForm, ClientRecord } from "@/components/clientes/client-form"

interface Notification {
    id: number
    message: string
    type: "success" | "error"
}

type TypeFilter = "ALL" | "PERSONA" | "EMPRESA"

export default function ClientesPage() {
    const [clients, setClients] = useState<ClientRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<ClientRecord | undefined>()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notificationCounter, setNotificationCounter] = useState(0)

    const notify = (message: string, type: "success" | "error" = "success") => {
        const id = notificationCounter
        setNotificationCounter((prev) => prev + 1)
        setNotifications((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
        }, 3000)
    }

    const fetchClients = useCallback(async () => {
        try {
            const response = await fetch("/api/clientes")
            if (response.ok) {
                const data = await response.json()
                setClients(data)
            }
        } catch (error) {
            console.error("Error fetching clients:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este cliente?")) return

        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                fetchClients()
                notify("Cliente eliminado")
            }
        } catch (error) {
            console.error("Error deleting client:", error)
        }
    }

    const filteredClients = clients.filter((client) => {
        if (typeFilter !== "ALL" && client.type !== typeFilter) return false
        const search = searchTerm.toLowerCase()
        if (!search) return true
        return (
            client.name.toLowerCase().includes(search) ||
            client.taxId?.toLowerCase().includes(search) ||
            client.email?.toLowerCase().includes(search) ||
            client.phone?.toLowerCase().includes(search) ||
            client.contactName?.toLowerCase().includes(search)
        )
    })

    return (
        <div className="space-y-6">
            {notifications.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right"
                        >
                            <p className="font-medium">{notification.message}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Clientes</h1>
                <Button
                    onClick={() => {
                        setSelectedClient(undefined)
                        setIsFormOpen(true)
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                    placeholder="Buscar por nombre, RUT/DNI, email, teléfono o contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex gap-1">
                    {(
                        [
                            { value: "ALL", label: "Todos" },
                            { value: "PERSONA", label: "Personas" },
                            { value: "EMPRESA", label: "Empresas" },
                        ] as const
                    ).map((option) => (
                        <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={typeFilter === option.value ? "default" : "outline"}
                            onClick={() => setTypeFilter(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>RUT / RUN / DNI</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <div>{client.name}</div>
                                        {client.type === "EMPRESA" && client.contactName && (
                                            <div className="text-xs text-muted-foreground">
                                                Contacto: {client.contactName}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={client.type === "EMPRESA" ? "secondary" : "outline"}
                                            className="gap-1"
                                        >
                                            {client.type === "EMPRESA" ? (
                                                <Building2 className="h-3 w-3" />
                                            ) : (
                                                <User className="h-3 w-3" />
                                            )}
                                            {client.type === "EMPRESA" ? "Empresa" : "Persona"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{client.taxId || "-"}</TableCell>
                                    <TableCell>{client.email || "-"}</TableCell>
                                    <TableCell>{client.phone || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setIsFormOpen(true)
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(client.id)}
                                            >
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

            <ClientForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                client={selectedClient}
                onSuccess={fetchClients}
            />
        </div>
    )
}
