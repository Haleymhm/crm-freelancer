"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Building2,
    Kanban,
    FileText,
    Receipt,
    BarChart3,
    LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/contactos", label: "Contactos", icon: Users },
    { href: "/empresas", label: "Empresas", icon: Building2 },
    { href: "/pipeline", label: "Seguimiento", icon: Kanban },
    { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
    { href: "/facturas", label: "Facturas", icon: Receipt },
    { href: "/reportes", label: "Reportes", icon: BarChart3 },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-48 flex-col border-r bg-card">
            <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-xl font-bold text-primary">CRM Freelancer</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
