# Auditoría de Seguridad — CRM Freelancer (Next.js 16 / App Router)

## 1. Resumen Ejecutivo

**Puntuación global de riesgo: 6.5 / 10 (Medio-Alto)**

| Severidad | Cantidad |
|---|---:|
| CRÍTICA | 0 |
| ALTA | 1 |
| MEDIA | 5 |
| BAJA | 7 |
| **Total** | **13** |

**Conclusiones principales:**

- No se encontraron vulnerabilidades críticas explotables sin autenticación (RCE, SSRF, XSS directo).
- El riesgo se concentra en **autorización a nivel de objeto (BOLA/IDOR)** y **validación de entradas** en los endpoints de `deals`.
- Existe una **cuenta seed con contraseña conocida** (`password123`) que, si se ejecuta en producción, permite takeover inmediato.
- No hay **rate limiting** en login/registro, lo que habilita credential stuffing y creación masiva de cuentas.
- No hay **cabeceras de seguridad** ni CSP en `next.config.js`.
- Las versiones de dependencias están razonablemente actualizadas: `next@16.4.6`, `next-auth@5.0.0-beta.32`, `@auth/core@0.41.3`, `sharp@0.35.5`. No se detectó una dependencia vulnerable según los avisos de octubre/noviembre 2026.
- No existen Server Actions (`"use server"`), por lo que la superficie de mutación son los Route Handlers.

**Cobertura revisada:** `package.json`, `pnpm-lock.yaml`, `next.config.js`, todos los `route.ts`, `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/dashboard-data.ts`, validaciones Zod, layout del dashboard, componentes cliente, `prisma/seed.ts`, `.env copy` y `.gitignore`.

**Ausencias verificadas (controles correctos o superficie no explotable):**

- No hay `dangerouslySetInnerHTML`, renderizado de Markdown sin sanitizar ni `href` dinámicos con datos de usuario.
- No hay llamadas `fetch()` del servidor con URLs controladas por el usuario.
- No hay `rewrites` ni `images.remotePatterns` en `next.config.js` (sin SSRF por configuración).
- No se usa `localStorage` ni `sessionStorage` para sesión; NextAuth usa cookies `HttpOnly` por defecto.
- Todos los endpoints de datos revisados validan `session?.user?.id`; los recursos de clientes y cotizaciones filtran por `userId`.
- `next@16.4.6` es la última versión publicada y supera los umbrales parcheados indicados (`>= 15.5.28`, `>= 16.4.1`, `>= 16.4.5`).

---

## 2. Tabla de Hallazgos

| ID | Severidad | Categoría | Archivo/Línea | Resumen |
|---|---|---|---|---|
| **A-01** | **ALTA** | BOLA / IDOR | `src/app/api/deals/route.ts:42`; `src/app/api/deals/[id]/route.ts:27-29` | `clientId` no se valida contra el `userId`; permite asociar clientes de otro tenant y leer su nombre/tipo vía `GET /api/deals`. |
| **M-01** | MEDIA | Validación de entradas | `src/app/api/deals/route.ts:34-45`; `src/app/api/deals/[id]/route.ts:17-29` | `dealSchema` existe pero no se usa; `stage`, `value`, `title`, fechas y `clientId` se persisten sin validar. `stage: null` produce TypeError y 500. |
| **M-02** | MEDIA | Exposición de información | `src/app/api/deals/[id]/route.ts:43,69` | Se concatena el objeto `error` interno en la respuesta HTTP; puede filtrar detalles de Prisma/BD. |
| **M-03** | MEDIA | Configuración / Cabeceras | `next.config.js:2-6` | Ausencia de CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS y `Permissions-Policy`. |
| **M-04** | MEDIA | Credenciales por defecto | `prisma/seed.ts:9-18` | Usuario seed `haleymhm@localhost.dev` con contraseña conocida `password123`. Si el seed corre en producción, hay takeover. |
| **M-05** | MEDIA | Autenticación | `src/app/api/registro/route.ts:6-10,23-27`; `src/lib/auth.ts:12-47` | Sin rate limiting, contraseña mínima de 6 caracteres, enumeración de emails y sin normalización de email. |
| **B-01** | BAJA | Aislamiento servidor-cliente | `src/lib/prisma.ts:1`; `src/lib/auth.ts:1`; `src/lib/dashboard-data.ts:1` | Falta `import "server-only"` en la capa de acceso a datos. |
| **B-02** | BAJA | XSS latente | `src/lib/validations/client.ts:10` | `z.string().url()` acepta esquemas como `javascript:` y `data:`. Hoy no se renderiza `website` como enlace, pero es una bomba de tiempo. |
| **B-03** | BAJA | Exposición de datos | `src/app/api/clientes/route.ts:23-31`; `src/app/api/deals/route.ts:12-21`; `src/app/api/cotizaciones/route.ts:75-93` | Se devuelven objetos Prisma completos (incluye `userId`, notas, campos internos) y sin `Cache-Control: no-store`. |
| **B-04** | BAJA | Middleware / Sesión | `src/app/(dashboard)/layout.tsx:10-14`; ausencia de `middleware.ts`/`proxy.ts` | Chequeo por existencia `if (!session)` (patrón CVE-2026-73421, aunque beta.32 está parcheado); no hay barrera centralizada. |
| **B-05** | BAJA | CSRF | `src/app/api/deals/route.ts:27`; `src/app/api/deals/[id]/route.ts:6,47`; `src/app/api/clientes/route.ts:38`; `src/app/api/clientes/[id]/route.ts:37,84`; `src/app/api/cotizaciones/route.ts:101`; `src/app/api/cotizaciones/[id]/route.ts:69,141,211` | Mutaciones sin verificación de `Origin`/`Sec-Fetch-Site`; dependen únicamente de `SameSite=Lax`. |
| **B-06** | BAJA | Secretos / Configuración | `.env copy:1-2`; `.gitignore:3-4` | Plantilla `.env copy` versionada con `AUTH_SECRET` placeholder predecible; `.gitignore` no cubre `.env.*`. |
| **B-07** | BAJA | Lógica de negocio | `src/app/api/cotizaciones/[id]/route.ts:152-200` | Permite transiciones arbitrarias (`BORRADOR → ACEPTADA`) y fuerza el deal a `CERRADO_GANADO` sin pasar por `ENVIADA`. |

---

## 3. Detalle Técnico y Remediación

### [A-01] BOLA/IDOR en `clientId` de Deals (ALTA)

**Ubicación:** `src/app/api/deals/route.ts:42`, `src/app/api/deals/[id]/route.ts:27-29`

**Descripción y vector de ataque:**

Los endpoints de creación y edición de deals aceptan `clientId` directamente desde el body y lo persisten como clave foránea, sin comprobar que el cliente pertenezca al usuario autenticado. La base de datos solo valida la existencia del cliente, no la propiedad.

Un atacante autenticado que conozca el UUID de un cliente de otro tenant puede:

1. Crear o editar su propio deal con `clientId = <uuid_víctima>`.
2. Ejecutar `GET /api/deals`, que incluye `client: { select: { id, name, type } }`.
3. Leer el nombre y tipo del cliente de la víctima.

Además, puede contaminar reportes y asociar clientes ajenos a sus propios deals. La explotación requiere conocer el UUID, pero los UUID **no son un control de autorización** y pueden filtrarse por logs, capturas, soporte o futuras APIs.

**Código vulnerable:**

```ts
// src/app/api/deals/route.ts
const data = await request.json()
const deal = await prisma.deal.create({
    data: {
        title: data.title,
        description: data.description || null,
        value: data.value,
        stage: data.stage,
        userId: session.user.id,
        clientId: data.clientId && data.clientId !== "none" ? data.clientId : null,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
    },
})
```

```ts
// src/app/api/deals/[id]/route.ts
if (data.clientId !== undefined) {
    updateData.clientId = data.clientId && data.clientId !== "none" ? data.clientId : null
}
```

**Remediación:**

Validar la propiedad del cliente antes de asociarlo. Aplicar lo mismo en `POST` y `PATCH`.

```ts
// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createDealSchema } from "@/lib/validations/deal"

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const parsed = createDealSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Datos inválidos", details: parsed.error.flatten() },
            { status: 400 }
        )
    }

    let clientId: string | null = null
    if (parsed.data.clientId && parsed.data.clientId !== "none") {
        const ownedClient = await prisma.client.findFirst({
            where: { id: parsed.data.clientId, userId: session.user.id },
            select: { id: true },
        })
        if (!ownedClient) {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
        }
        clientId = ownedClient.id
    }

    const deal = await prisma.deal.create({
        data: {
            title: parsed.data.title,
            description: parsed.data.description || null,
            value: parsed.data.value,
            stage: parsed.data.stage,
            userId: session.user.id,
            clientId,
            expectedCloseDate: parsed.data.expectedCloseDate
                ? new Date(`${parsed.data.expectedCloseDate}T12:00:00Z`)
                : null,
        },
        select: {
            id: true,
            title: true,
            description: true,
            value: true,
            stage: true,
            clientId: true,
            expectedCloseDate: true,
            createdAt: true,
        },
    })

    return NextResponse.json(deal, { status: 201 })
}
```

Para `PATCH`, replicar la misma comprobación antes de asignar `updateData.clientId`.

---

### [M-01] Falta de validación de entradas en `/api/deals` (MEDIA)

**Ubicación:** `src/app/api/deals/route.ts:34-45`, `src/app/api/deals/[id]/route.ts:17-29`

**Descripción y vector de ataque:**

Existe `dealSchema` en `src/lib/validations/deal.ts`, pero no se importa ni se usa en los endpoints de deals. El servidor confía en el body:

- `stage` puede ser cualquier string, número, `null` u objeto. En `PATCH`, `data.stage.startsWith(...)` lanza `TypeError` si es `null`, devolviendo un 500.
- `value` puede ser negativo, `NaN`, string, o exceder `Decimal(10,2)`, provocando errores de Prisma.
- `title` y `description` no tienen límite de longitud.
- `expectedCloseDate` se convierte con `new Date(...)` sin validar; una fecha inválida genera un error de BD.
- `clientId` no se valida como UUID (ver A-01).

Impacto: errores 500, corrupción de datos y manipulación de métricas del pipeline (por ejemplo, crear deals directamente en `CERRADO_GANADO`).

**Código vulnerable:**

```ts
// src/app/api/deals/route.ts
const data = await request.json()
const deal = await prisma.deal.create({
    data: {
        title: data.title,
        value: data.value,
        stage: data.stage,
        ...
    },
})
```

```ts
// src/app/api/deals/[id]/route.ts
const updateData: Partial<Deal> = {}
if (data.stage !== undefined) {
    updateData.stage = data.stage
    if (data.stage.startsWith("CERRADO")) updateData.closedAt = new Date()
}
```

**Remediación:**

```ts
// src/lib/validations/deal.ts
import * as z from "zod"

export const dealStageSchema = z.enum([
    "PROSPECTO",
    "CONTACTADO",
    "PROPUESTA_ENVIADA",
    "NEGOCIACION",
    "CERRADO_GANADO",
    "CERRADO_PERDIDO",
])

const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")

export const createDealSchema = z
    .object({
        title: z.string().trim().min(1, "El título es requerido").max(200),
        description: z.string().trim().max(5000).optional().or(z.literal("")),
        value: z.coerce
            .number()
            .finite()
            .nonnegative("El valor no puede ser negativo")
            .max(99_999_999.99),
        stage: dealStageSchema,
        clientId: z
            .union([z.string().uuid("Cliente inválido"), z.literal("none"), z.literal(""), z.null()])
            .optional(),
        expectedCloseDate: isoDateSchema.optional().or(z.literal("")),
    })
    .strict()

export const updateDealSchema = createDealSchema.partial().strict()

export type DealFormData = z.infer<typeof createDealSchema>
```

```ts
// src/app/api/deals/[id]/route.ts
import { Prisma } from "@prisma/client"
import { updateDealSchema } from "@/lib/validations/deal"

const parsed = updateDealSchema.safeParse(await request.json().catch(() => null))
if (!parsed.success) {
    return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
    )
}

const updateData: Prisma.DealUpdateInput = {}
if (parsed.data.stage !== undefined) {
    updateData.stage = parsed.data.stage
    updateData.closedAt = parsed.data.stage.startsWith("CERRADO") ? new Date() : null
}
if (parsed.data.title !== undefined) updateData.title = parsed.data.title
if (parsed.data.description !== undefined) updateData.description = parsed.data.description
if (parsed.data.value !== undefined) updateData.value = parsed.data.value
```

---

### [M-02] Fuga de detalles internos en errores de Deals (MEDIA)

**Ubicación:** `src/app/api/deals/[id]/route.ts:43,69`

**Descripción y vector de ataque:**

Los `catch` concatenan el objeto `error` directamente en la respuesta JSON. Los errores de Prisma pueden incluir nombres de modelos, campos, restricciones y detalles de la consulta. Un atacante puede provocar errores deliberadamente (por ejemplo, `stage: null`) y leer información interna.

**Código vulnerable:**

```ts
return NextResponse.json({ error: "Error al actualizar deal" + error }, { status: 500 })
```

```ts
return NextResponse.json({ error: "Error al eliminar deal" + error }, { status: 500 })
```

**Remediación:**

```ts
import { Prisma } from "@prisma/client"

try {
    // ...
} catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
        }
        if (error.code === "P2003") {
            return NextResponse.json({ error: "Referencia inválida" }, { status: 400 })
        }
    }

    console.error("deal_update_failed", {
        dealId: id,
        userId: session.user.id,
        error,
    })

    return NextResponse.json(
        { error: "No se pudo actualizar la oportunidad" },
        { status: 500 }
    )
}
```

Nunca devolver `error.message`, `error.stack` ni el objeto `error` al cliente.

---

### [M-03] Ausencia de cabeceras de seguridad y CSP (MEDIA)

**Ubicación:** `next.config.js:2-6`

**Descripción y vector de ataque:**

La configuración actual no define cabeceras de seguridad. Esto permite:

- **Clickjacking** sobre `/login` y `/registro` al no existir `X-Frame-Options` ni `frame-ancestors`.
- **MIME sniffing** al no existir `X-Content-Type-Options: nosniff`.
- Fuga de URLs internas vía `Referer`.
- Ausencia de una CSP que limite la ejecución de scripts ante un futuro XSS.
- Exposición de la tecnología mediante `X-Powered-By`.

**Código vulnerable:**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
}

module.exports = nextConfig
```

**Remediación:**

```js
/** @type {import('next').NextConfig} */
const securityHeaders = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self' 'unsafe-inline'",
            "connect-src 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
        ].join("; "),
    },
]

const nextConfig = {
    poweredByHeader: false,
    typescript: {
        ignoreBuildErrors: false,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ]
    },
}

module.exports = nextConfig
```

> Nota: `script-src 'unsafe-inline'` es una base temporal. Para una CSP estricta, generar un nonce por request en `proxy.ts`/`middleware.ts` y usar `script-src 'self' 'nonce-<nonce>' 'strict-dynamic'`.

---

### [M-04] Credenciales por defecto en el seed (MEDIA)

**Ubicación:** `prisma/seed.ts:9-18`

**Descripción y vector de ataque:**

El seed crea un usuario con email conocido y contraseña `password123`. Si el script se ejecuta contra una base de producción o staging accesible, cualquier atacante puede iniciar sesión como ese usuario y acceder a todos sus datos. El email también está hardcodeado, lo que facilita la enumeración.

**Código vulnerable:**

```ts
const hashedPassword = await bcrypt.hash("password123", 10)

const user = await prisma.user.upsert({
    where: { email: "haleymhm@localhost.dev" },
    update: {},
    create: {
        email: "haleymhm@localhost.dev",
        password: hashedPassword,
        name: "Test User",
    },
})
```

**Remediación:**

```ts
const seedPassword = process.env.SEED_PASSWORD
const seedEmail = process.env.SEED_EMAIL ?? "seed@example.invalid"

if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    throw new Error("El seed está bloqueado en producción")
}

if (!seedPassword || seedPassword.length < 16) {
    throw new Error("SEED_PASSWORD debe tener al menos 16 caracteres")
}

const hashedPassword = await bcrypt.hash(seedPassword, 12)

const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
        email: seedEmail,
        password: hashedPassword,
        name: "Seed User",
    },
})
```

Además:

- No incluir `prisma/seed.ts` en la imagen de producción.
- Ejecutar el seed solo en local/test.
- Forzar cambio de contraseña en el primer login si se usa en staging.

---

### [M-05] Sin rate limiting, contraseñas débiles y enumeración de usuarios (MEDIA)

**Ubicación:** `src/app/api/registro/route.ts:6-10,23-27`; `src/lib/auth.ts:12-47`

**Descripción y vector de ataque:**

- `POST /api/registro` no tiene rate limiting: un atacante puede crear cuentas masivamente y agotar la base de datos.
- La contraseña mínima es de 6 caracteres, insuficiente frente a fuerza bruta.
- El endpoint devuelve `400 "El email ya está registrado"`, lo que permite enumerar emails registrados.
- `authorize()` no limita intentos de login, habilitando credential stuffing.
- No se normaliza el email (`User@x.com` y `user@x.com` pueden coexistir en PostgreSQL, que es case-sensitive).
- `bcrypt` usa coste 10; se recomienda 12 o Argon2id.

**Código vulnerable:**

```ts
const apiRegisterSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Debe ser un correo electrónico válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

if (existingUser) {
    return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
    )
}

const hashedPassword = await bcrypt.hash(password, 10)
```

**Remediación:**

```ts
// src/app/api/registro/route.ts
const apiRegisterSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(12, "Mínimo 12 caracteres").max(128),
})

// Rate limit por IP
const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
const { success } = await registerLimiter.limit(ip)
if (!success) {
    return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        { status: 429 }
    )
}

const parsed = apiRegisterSchema.safeParse(await request.json().catch(() => null))
if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
}

const { name, email, password } = parsed.data

const existingUser = await prisma.user.findUnique({ where: { email } })

// Respuesta genérica para evitar enumeración
if (existingUser) {
    return NextResponse.json(
        { message: "Si el correo es válido, recibirás un enlace de verificación" },
        { status: 202 }
    )
}

const hashedPassword = await bcrypt.hash(password, 12)

await prisma.user.create({
    data: { name, email, password: hashedPassword },
})

return NextResponse.json(
    { message: "Si el correo es válido, recibirás un enlace de verificación" },
    { status: 202 }
)
```

```ts
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export const loginLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:login",
})

export const registerLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    prefix: "rl:register",
})
```

```ts
// src/lib/auth.ts
async authorize(credentials, request) {
    const email = String(credentials?.email ?? "").trim().toLowerCase()
    const password = String(credentials?.password ?? "")

    const ip =
        request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    const { success } = await loginLimiter.limit(`${ip}:${email}`)
    if (!success) {
        throw new Error("Demasiados intentos. Intenta más tarde.")
    }

    if (!email || !password) {
        throw new Error("Credenciales incorrectas")
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.password) {
        throw new Error("Credenciales incorrectas")
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
        throw new Error("Credenciales incorrectas")
    }

    return { id: user.id, email: user.email, name: user.name }
}
```

Añadir `@upstash/ratelimit` y `@upstash/redis` al proyecto, o usar Redis/Postgres con `rate-limiter-flexible` si se prefiere no depender de Upstash.

---

### [B-01] Falta `server-only` en la capa de acceso a datos (BAJA)

**Ubicación:** `src/lib/prisma.ts:1`, `src/lib/auth.ts:1`, `src/lib/dashboard-data.ts:1`

**Descripción:** Hoy ningún componente `"use client"` importa estas capas, pero un import accidental podría empaquetar código privilegiado (Prisma, auth) hacia el navegador. `server-only` convierte ese error en un fallo de build.

**Remediación:**

```ts
import "server-only"

import { PrismaClient } from "@prisma/client"
// ...
```

Aplicar en `src/lib/prisma.ts`, `src/lib/auth.ts` y `src/lib/dashboard-data.ts`. En componentes cliente, importar `signIn`/`signOut` desde `next-auth/react`, no desde `@/lib/auth`.

---

### [B-02] `z.string().url()` acepta esquemas peligrosos (BAJA)

**Ubicación:** `src/lib/validations/client.ts:10`

**Descripción:** Zod 3 valida URLs con `new URL()`, que acepta `javascript:alert(1)`, `data:text/html,...` y `file:`. Actualmente `website` solo se muestra en un `<Input>`, no como enlace, por lo que **no hay XSS explotable hoy**. Sin embargo, si en el futuro se renderiza como `<a href={client.website}>`, se convierte en XSS almacenado.

**Código vulnerable:**

```ts
website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
```

**Remediación:**

```ts
const httpUrlSchema = z
    .string()
    .trim()
    .max(2048)
    .url("Debe ser una URL válida")
    .refine((value) => {
        try {
            const { protocol } = new URL(value)
            return protocol === "http:" || protocol === "https:"
        } catch {
            return false
        }
    }, "Solo se permiten URLs http/https")

export const clientSchema = z.object({
    // ...
    website: httpUrlSchema.optional().or(z.literal("")),
})
```

Si se renderiza como enlace, añadir `rel="noopener noreferrer nofollow"` y `target="_blank"`.

---

### [B-03] Exposición excesiva de datos y ausencia de `no-store` (BAJA)

**Ubicación:** `src/app/api/clientes/route.ts:23-31`, `src/app/api/deals/route.ts:12-21`, `src/app/api/cotizaciones/route.ts:75-93`

**Descripción:** Los endpoints devuelven objetos Prisma completos. En clientes se incluye `userId`, `notes`, `taxId`, etc. En deals se incluyen cotizaciones completas. No es una fuga entre tenants, pero viola el principio de minimización y amplifica el impacto de cualquier XSS/IDOR futuro. Tampoco se establece `Cache-Control: no-store`, por lo que proxies/cachés compartidas podrían almacenar PII.

**Código vulnerable:**

```ts
const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
})
return NextResponse.json(clients)
```

**Remediación:**

```ts
const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    select: {
        id: true,
        type: true,
        name: true,
        taxId: true,
        email: true,
        phone: true,
        contactName: true,
        website: true,
        address: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
})

return NextResponse.json(clients, {
    headers: {
        "Cache-Control": "no-store, max-age=0",
        Vary: "Cookie",
    },
})
```

Aplicar el mismo patrón a `GET /api/deals` y `GET /api/cotizaciones`, seleccionando solo los campos que consume la UI y excluyendo `userId` y campos internos.

---

### [B-04] Ausencia de proxy/middleware y chequeo por existencia de sesión (BAJA)

**Ubicación:** `src/app/(dashboard)/layout.tsx:10-14`; no existe `middleware.ts` ni `proxy.ts`

**Descripción:** El layout usa `if (!session)`, el patrón de comprobación por existencia afectado por CVE-2026-73421. La versión `next-auth@5.0.0-beta.32` ya está parcheada y los endpoints validan `session.user.id`, por lo que **no hay bypass actual**. Aun así, conviene reforzar el chequeo y añadir una barrera centralizada.

**Código vulnerable:**

```tsx
const session = await auth()

if (!session) {
    redirect("/login")
}
```

**Remediación:**

```tsx
const session = await auth()

if (!session?.user?.id) {
    redirect("/login")
}
```

Añadir `src/proxy.ts` (Next.js 16; en Next 15 sería `middleware.ts`):

```ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const userId = (req.auth?.user as { id?: string } | undefined)?.id
    const isLoggedIn = Boolean(userId)
    const { pathname } = req.nextUrl
    const isAuthPage = pathname === "/login" || pathname === "/registro"

    if (!isLoggedIn && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login-bg.jpg).*)"],
}
```

> El proxy es defensa en profundidad. La autorización real debe seguir en cada Route Handler y en la capa de datos.

---

### [B-05] CSRF no verificado en endpoints de mutación (BAJA)

**Ubicación:** `src/app/api/deals/route.ts:27`; `src/app/api/deals/[id]/route.ts:6,47`; `src/app/api/clientes/route.ts:38`; `src/app/api/clientes/[id]/route.ts:37,84`; `src/app/api/cotizaciones/route.ts:101`; `src/app/api/cotizaciones/[id]/route.ts:69,141,211`

**Descripción:** Las mutaciones dependen únicamente de la cookie de NextAuth. Por defecto `SameSite=Lax` mitiga la mayoría de CSRF cross-site, pero no protege frente a subdominios comprometidos ni si en el futuro se configura `SameSite=None`. No se valida `Origin` ni `Sec-Fetch-Site`.

**Remediación:**

```ts
// src/lib/http/same-origin.ts
import "server-only"
import type { NextRequest } from "next/server"

export function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")
    const fetchSite = request.headers.get("sec-fetch-site")

    if (fetchSite && fetchSite !== "same-origin") return false
    if (!origin || !host) return false

    try {
        return new URL(origin).host === host
    } catch {
        return false
    }
}
```

```ts
import { isSameOrigin } from "@/lib/http/same-origin"

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
    }
    // ...
}
```

Aplicar en `POST`, `PUT`, `PATCH` y `DELETE`. Mantener cookies `HttpOnly`, `Secure`, `SameSite=Lax` (o `Strict`).

---

### [B-06] Plantilla `.env copy` versionada y `.gitignore` insuficiente (BAJA)

**Ubicación:** `.env copy:1-2`; `.gitignore:3-4`

**Descripción:** `.env copy` está versionado y contiene un `AUTH_SECRET` placeholder predecible. No es un secreto real, pero si un operador lo renombra a `.env` y lo despliega tal cual, cualquiera que conozca el repositorio puede **falsificar JWTs** y suplantar usuarios. Además, `.gitignore` solo cubre `.env` y `.env.local`, no `.env.production`, `.env.staging`, etc.

**Código vulnerable:**

```env
DATABASE_URL="tira de conexion"
AUTH_SECRET="Frase de Seguridad de 512 caracteres"
```

```gitignore
.env
.env.local
```

**Remediación:**

```gitignore
.env
.env.*
.env*
!.env.example
```

```bash
git rm --cached ".env copy"
```

Crear `.env.example` sin valores reales:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/crm"
AUTH_SECRET="genera_con_openssl_rand_base64_48"
```

Validar el secreto al arrancar:

```ts
const authSecret = process.env.AUTH_SECRET

if (!authSecret || authSecret.length < 32) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: authSecret,
    // ...
})
```

Generar con:

```bash
openssl rand -base64 48
```

---

### [B-07] Transiciones de estado de cotización no validadas (BAJA)

**Ubicación:** `src/app/api/cotizaciones/[id]/route.ts:152-200`

**Descripción:** `PATCH` acepta cualquier estado válido sin comprobar la transición. Un usuario puede pasar de `BORRADOR` directamente a `ACEPTADA`, saltándose `ENVIADA`, y el endpoint actualiza el deal a `CERRADO_GANADO` con `closedAt`, falseando métricas de ingresos y conversión. Es un problema de integridad de negocio, no de aislamiento entre tenants.

**Código vulnerable:**

```ts
const { status } = (await request.json()) as { status: string }

if (!validStatuses.includes(status as QuoteStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
}

const nextStatus = status as QuoteStatus
```

**Remediación:**

```ts
const allowedTransitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
    BORRADOR: ["ENVIADA", "RECHAZADA"],
    ENVIADA: ["ACEPTADA", "RECHAZADA"],
    ACEPTADA: [],
    RECHAZADA: [],
}

const { status } = (await request.json()) as { status: string }

if (!validStatuses.includes(status as QuoteStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
}

const nextStatus = status as QuoteStatus

if (!allowedTransitions[existing.status].includes(nextStatus)) {
    return NextResponse.json(
        { error: "Transición de estado no permitida" },
        { status: 409 }
    )
}
```

---

## 4. Checklist de Hardening Pendiente

### Autenticación y sesión

- [x] Añadir rate limiting global en `/api/auth/*`, `/api/registro` y mutaciones (implementado en memoria; migrar a Redis/Upstash para multi-instancia).
- [x] Subir contraseña mínima a 12 caracteres y usar `bcrypt` coste 12 o Argon2id.
- [x] Normalizar emails (`trim().toLowerCase()`) antes de registrar/autenticar.
- [ ] Implementar verificación de email y reset de contraseña con tokens de un solo uso.
- [x] Configurar `session.maxAge` a 8 horas y `updateAge` a 15 minutos (pendiente rotar `AUTH_SECRET` en producción).
- [x] Validar `AUTH_SECRET` al arrancar (mínimo 32 bytes) — pendiente almacenarlo en un secret manager en despliegue.
- [x] Configurar cookies `HttpOnly`, `Secure`, `SameSite=Lax` explícitamente con prefijo `__Host-` en producción.
- [x] Añadir bloqueo progresivo tras N intentos fallidos (CAPTCHA opcional pendiente).
- [ ] Migrar de `next-auth@5.0.0-beta` a estable cuando esté disponible.

### Autorización y datos

- [x] Validar propiedad de **todas** las relaciones (`clientId`, `dealId`, `quoteId`) antes de persistir.
- [x] Usar `select`/DTOs en todas las respuestas; nunca devolver `userId`, `password` ni campos internos.
- [x] Añadir `Cache-Control: no-store` y `Vary: Cookie` a respuestas autenticadas.
- [x] Implementar filtros `userId` en todas las consultas Prisma (incluidas las rutas `/api/facturas`, `/api/interacciones` y `/api/recordatorios`).
- [ ] Añadir pruebas de autorización cross-tenant (A intenta acceder a recursos de B).

### Validación y robustez

- [x] Usar `safeParse` en todos los Route Handlers; devolver 400 con errores de campo, no 500.
- [x] Limitar tamaños: `Content-Length` máximo (1 MB), `items.max(50)`, strings con `.max()`.
- [x] Validar fechas con regex + `Date.parse` (UUIDs con `.min(1).max(100)` para compatibilidad con IDs de seed + verificación de propiedad en BD).
- [x] Manejar errores Prisma (`P2025` → 404, `P2002` → 409, `P2003` → 400) sin filtrar detalles.
- [x] Añadir máquina de estados para `QuoteStatus` y `InvoiceStatus` (`DealStage` se mantiene libre para drag-and-drop en Kanban).

### Cabeceras y configuración

- [x] Implementar CSP estricta con nonce en `proxy.ts` (evitar `'unsafe-inline'` en `script-src`).
- [x] Añadir `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, HSTS y `Permissions-Policy`.
- [x] Añadir `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Resource-Policy: same-origin`.
- [x] Deshabilitar `X-Powered-By` (`poweredByHeader: false`).
- [x] Verificar cabeceras con `curl -I` en CI (`.github/workflows/ci.yml`).

### Dependencias y cadena de suministro

- [x] Fijar versiones exactas en `package.json` (`next: "16.4.6"`, `next-auth: "5.0.0-beta.32"`) y revisar el lockfile.
- [x] Ejecutar `pnpm audit --prod` en CI (`.github/workflows/ci.yml`).
- [x] Configurar Dependabot (`.github/dependabot.yml`); activar alertas de seguridad en la configuración de GitHub.
- [x] Revisar `pnpm-workspace.yaml`: habilitado `sharp: true` para compilación nativa en producción.
- [x] Mantener `next` en la rama parcheada (>= 16.4.6) y monitorizar advisories de Vercel.

### Secretos y repositorio

- [x] Eliminar `.env copy` del repositorio y crear `.env.example`.
- [x] Añadir `.env*` a `.gitignore` excepto `.env.example`.
- [x] Revisar el historial de git por secretos reales (`git log -p -- .env*` — solo contenía `.env copy` con placeholders).
- [x] Sanitizar `testsprite_tests/` eliminando credenciales de prueba hardcodeadas.
- [x] No ejecutar `prisma/seed.ts` en producción; bloquearlo por `NODE_ENV`.

### Observaciones funcionales (no seguridad)

- [x] Implementar `/api/facturas`, `/api/recordatorios`, `/api/interacciones` y `/api/reportes/*` con auth, ownership, Zod, `isSameOrigin`, DTOs y `no-store`.
- [x] `POST /api/cotizaciones` reutiliza `request.json()` dentro de un bucle de reintentos; movida la lectura/validación fuera del bucle.
- [x] `PUT /api/cotizaciones/[id]` preserva `taxRate`, `validUntil` y `notes` cuando se omiten en actualización parcial.

---

**Conclusión:** El proyecto tiene una base razonable de autenticación y separación por `userId`, pero la falta de validación y de comprobación de propiedad en las relaciones de `deals` es el hallazgo más relevante. Corregir A-01, M-01, M-04 y M-05 reduce la mayor parte del riesgo residual; M-03 y el hardening de sesión/CSRF completan la postura de seguridad.
