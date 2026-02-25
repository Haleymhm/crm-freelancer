"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { loginSchema, LoginFormData } from "@/lib/validations/auth"

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        setError("")
        setLoading(true)

        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                setError("Credenciales incorrectas")
            } else {
                router.push("/")
                router.refresh()
            }
        } catch (error) {
            setError("Error al iniciar sesión")
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
                    alt="Login Background"
                    fill
                    className="object-cover dark:brightness-[0.2] dark:grayscale"
                    priority
                />
            </div>

            {/* Formulario Derecha */}
            <div className="flex items-center justify-center p-8 bg-background h-full overflow-y-auto">
                <div className="mx-auto w-full max-w-[350px] space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">CRM Freelancer</h1>
                        <p className="text-muted-foreground">
                            Ingresa tus credenciales
                        </p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        {error && (
                            <div className="text-sm text-red-500 text-left">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        ¿No tienes una cuenta?{" "}
                        <Link href="/registro" className="text-primary hover:underline">
                            Regístrate aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
