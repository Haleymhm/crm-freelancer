"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { registerSchema, RegisterFormData } from "@/lib/validations/auth"

export default function RegistroPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit = async (data: RegisterFormData) => {
        setError("")
        setLoading(true)

        try {
            const response = await fetch("/api/registro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            })

            if (!response.ok) {
                const responseData = await response.json()
                setError(responseData.error || "Error al crear la cuenta")
                return
            }

            router.push("/login?registered=true")
        } catch (error) {
            setError("Error al crear la cuenta")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full lg:grid lg:grid-cols-2 h-screen">
            {/* Imagen Izquierda */}
            <div className="hidden bg-muted lg:block relative h-full">
                <Image
                    src="/login-bg.jpg"
                    alt="Register Background"
                    fill
                    className="object-cover dark:brightness-[0.2] dark:grayscale"
                    priority
                />
            </div>

            {/* Formulario Derecha */}
            <div className="flex items-center justify-center p-8 bg-background h-full overflow-y-auto">
                <div className="mx-auto w-full max-w-[350px] space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Crear Cuenta</h1>
                        <p className="text-muted-foreground">
                            Completa el formulario para crear tu cuenta
                        </p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Tu nombre"
                                {...register("name")}
                            />
                            {errors.name && (
                                <span className="text-sm text-red-500">{errors.name.message}</span>
                            )}
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                {...register("email")}
                            />
                            {errors.email && (
                                <span className="text-sm text-red-500">{errors.email.message}</span>
                            )}
                        </div>
                        <div className="space-y-2 text-left">
                            <div className="flex items-center">
                                <Label htmlFor="password">Contraseña</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                            />
                            {errors.password && (
                                <span className="text-sm text-red-500">{errors.password.message}</span>
                            )}
                        </div>
                        <div className="space-y-2 text-left">
                            <div className="flex items-center">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            </div>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <span className="text-sm text-red-500">{errors.confirmPassword.message}</span>
                            )}
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 text-left">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creando cuenta..." : "Crear Cuenta"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Inicia sesión aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
