"use client"

import { useState, useEffect } from "react"
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
import { ContactForm } from "@/components/contactos/contact-form"

interface Notification {
    id: number
    message: string
    type: "success" | "error"
}

interface Contact {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    position?: string
    company?: {
        name: string
    }
}

export default function ContactosPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notificationCounter, setNotificationCounter] = useState(0)

    const fetchContacts = async () => {
        try {
            const response = await fetch("/api/contactos")
            if (response.ok) {
                const data = await response.json()
                setContacts(data)
            }
        } catch (error) {
            console.error("Error fetching contacts:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContacts()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este contacto?")) return

        try {
            const response = await fetch(`/api/contactos/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                fetchContacts()
                const newNotification: Notification = {
                    id: notificationCounter,
                    message: "Contacto eliminado",
                    type: "success"
                }
                setNotifications(prev => [...prev, newNotification])
                setNotificationCounter(prev => prev + 1)
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
                }, 3000)
            }
        } catch (error) {
            console.error("Error deleting contact:", error)
        }
    }

    const filteredContacts = contacts.filter((contact) => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase()
        const search = searchTerm.toLowerCase()
        return (
            fullName.includes(search) ||
            contact.email?.toLowerCase().includes(search) ||
            contact.company?.name.toLowerCase().includes(search)
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
                <h1 className="text-3xl font-bold">Contactos</h1>
                <Button onClick={() => {
                    setSelectedContact(undefined)
                    setIsFormOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Contacto
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Buscar contactos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Empresa</TableHead>
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
                        ) : filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No se encontraron contactos
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                        {contact.firstName} {contact.lastName}
                                    </TableCell>
                                    <TableCell>{contact.email || "-"}</TableCell>
                                    <TableCell>{contact.phone || "-"}</TableCell>
                                    <TableCell>{contact.position || "-"}</TableCell>
                                    <TableCell>{contact.company?.name || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedContact(contact)
                                                    setIsFormOpen(true)
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(contact.id)}
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

            <ContactForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                contact={selectedContact}
                onSuccess={fetchContacts}
            />
        </div>
    )
}
