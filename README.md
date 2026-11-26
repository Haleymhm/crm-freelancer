# CRM Freelancer

Un CRM minimalista en español diseñado para freelancers, agencias pequeñas y negocios de servicios. Cubre el ciclo completo desde el primer contacto con el cliente hasta la cotización y facturación, sin la complejidad de sistemas corporativos pesados.

## 🚀 Características Principales

- **Dashboard Integrado:** Visualización de deals activos, ingresos del mes, cotizaciones pendientes, clientes nuevos, actividades recientes y recordatorios.
- **Gestión Unificada de Clientes (`/clientes`):** Registro único para **Personas** y **Empresas** (RUT/RUN/DNI, email, teléfono, persona de contacto en empresas, sitio web, dirección y notas), con filtro por tipo y búsqueda.
- **Pipeline de Ventas Kanban (`/pipeline`):** Tablero visual interactivo con etapas (`PROSPECTO`, `CONTACTADO`, `PROPUESTA_ENVIADA`, `NEGOCIACION`, `CERRADO_GANADO`, `CERRADO_PERDIDO`).
- **Cotizaciones y Propuestas (`/cotizaciones`):** Creación con líneas de servicio, cálculo de impuestos en servidor, máquina de estados (`BORRADOR` → `ENVIADA` / `RECHAZADA` → `ACEPTADA`), sincronización automática con el Deal y exportación a PDF.
- **Facturación (`/facturas`):** Generación de facturas desde deals o cotizaciones, control de estados (`PENDIENTE`, `PAGADA`, `VENCIDA`, `CANCELADA`).
- **Interacciones y Recordatorios:** Registro de interacciones (`EMAIL`, `LLAMADA`, `REUNION`, `NOTA`, `WHATSAPP`) y recordatorios de seguimiento asociados a deals.
- **Reportes (`/reportes`):** Gráficos de ingresos mensuales, tasa de conversión y distribución de deals por etapa.

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 16.4.6](https://nextjs.org/) (App Router, Turbopack, `src/proxy.ts`)
- **UI & Librerías:** React 19, [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Recharts](https://recharts.org/), [@react-pdf/renderer](https://react-pdf.org/), [dnd-kit](https://dndkit.com/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Formularios y Validación:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Base de Datos y ORM:** PostgreSQL + [Prisma 6](https://www.prisma.io/)
- **Autenticación:** [Auth.js](https://authjs.dev/) (`next-auth@5.0.0-beta.32`, estrategia JWT)
- **Gestor de Paquetes:** [pnpm](https://pnpm.io/)

## 🔌 API Routes

Todas las rutas privadas validan sesión (`session.user.id`), pertenencia de recursos por `userId`, esquemas Zod con `safeParse`, protección CSRF (`Origin` / `Sec-Fetch-Site`), límites de tamaño de payload (1 MB) y cabeceras `Cache-Control: no-store`:

- `POST /api/registro` — Registro de usuarios (contraseña >= 12 caracteres, rate limiting, respuesta anti-enumeración).
- `GET/POST /api/auth/[...nextauth]` — Autenticación con rate limiting y bloqueo progresivo tras intentos fallidos.
- `GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/[id]` — Gestión unificada de clientes.
- `GET/POST /api/deals`, `PATCH/DELETE /api/deals/[id]` — Gestión de oportunidades y etapas.
- `GET/POST /api/cotizaciones`, `GET/PUT/PATCH/DELETE /api/cotizaciones/[id]` — Cotizaciones y transiciones de estado.
- `GET/POST /api/facturas`, `GET/PATCH/DELETE /api/facturas/[id]` — Facturas y transiciones de estado.
- `GET/POST /api/interacciones`, `DELETE /api/interacciones/[id]` — Historial de interacciones.
- `GET/POST /api/recordatorios`, `PATCH/DELETE /api/recordatorios/[id]` — Recordatorios de seguimiento.
- `GET /api/reportes/revenue`, `/api/reportes/conversion`, `/api/reportes/stages` — Métricas de reportes.

## 🔒 Seguridad y Hardening

- **Cabeceras y CSP:** Configuradas en `next.config.js` (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP`, HSTS, `poweredByHeader: false`) y CSP estricta con `nonce` por petición en `src/proxy.ts`.
- **Sesión y Cookies:** Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en producción (prefijo `__Host-`), `maxAge` de 8 horas y validación obligatoria de `AUTH_SECRET` (>= 32 caracteres) en producción.
- **Aislamiento servidor-cliente:** Uso de `server-only` en la capa de acceso a datos (`prisma`, `auth`, `dashboard-data`, `rate-limit`, helpers HTTP).
- **CI y Dependencias:** Flujo en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (`tsc`, `lint`, `pnpm audit --prod`, verificación de cabeceras con `curl -I`) y [`.github/dependabot.yml`](.github/dependabot.yml).

## 📋 Requisitos Previos

- Node.js (v22 recomendado)
- pnpm (`npm install -g pnpm`)
- Instancia de PostgreSQL (local o Neon)

## ⚙️ Configuración e Instalación Local

1. **Clonar el repositorio e instalar dependencias:**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd crm-freelancer
   pnpm install
   ```

2. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

   Edita `.env` con tu `DATABASE_URL` y genera un `AUTH_SECRET` seguro:

   ```bash
   openssl rand -base64 48
   ```

3. **Aplicar migraciones y generar el cliente Prisma:**

   ```bash
   pnpm exec prisma migrate deploy
   pnpm exec prisma generate
   ```

4. **Ejecutar el seed (opcional, solo desarrollo):**

   El seed está bloqueado en producción (`NODE_ENV=production`) salvo que se defina `ALLOW_SEED=true`, y exige `SEED_PASSWORD` de al menos 16 caracteres:

   ```bash
   SEED_EMAIL="dev@example.invalid" SEED_PASSWORD="tu-password-seguro-de-16-chars" node --env-file=.env prisma/seed.ts
   ```

5. **Iniciar el servidor de desarrollo:**

   ```bash
   pnpm run dev
   ```

   Disponible en [http://localhost:3000](http://localhost:3000).

## 📜 Scripts Disponibles

- `pnpm run dev`: Inicia el servidor de desarrollo (Next.js + Turbopack).
- `pnpm run build`: Genera el build de producción.
- `pnpm run start`: Inicia el servidor de producción.
- `pnpm run lint`: Ejecuta ESLint.
- `pnpm exec tsc --noEmit`: Verifica tipos con TypeScript.
- `pnpm run postinstall`: Ejecuta `prisma generate`.

## 🤝 Reglas de Contribución y Codificación

- **TypeScript Estricto:** Tipos e interfaces explícitos en toda la aplicación.
- **UI:** Uso estricto de **Shadcn UI** y clases utilitarias de **Tailwind CSS** (sin CSS personalizado).
- **Base de Datos:** Cambios mediante `prisma/schema.prisma` y migraciones; consultas con Prisma Client (sin SQL crudo) y validación Zod previa.
- **Nomenclatura:** `camelCase` para variables y campos, `PascalCase` para modelos, `kebab-case` para archivos y rutas.
