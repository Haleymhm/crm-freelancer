# CRM Freelancer

Un CRM minimalista para freelancers, agencias pequeñas y negocios de servicios. Gestión completa de clientes, pipeline de ventas visual, cotizaciones, facturación y seguimiento de actividades.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 16 + TypeScript + TailwindCSS v4 + Shadcn UI
- **Backend**: NestJS 11 + TypeScript
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Monorepo**: npm workspaces

## 📁 Estructura del Proyecto

```
crm-freelancer/
├── apps/
│   ├── frontend/         # Next.js application
│   └── backend/          # NestJS API server
├── packages/
│   ├── database/         # Prisma schema & migrations
│   └── shared/           # Shared types & utilities (futuro)
├── docs/                 # Documentación adicional
└── AGENT.md             # Especificaciones del proyecto
```

## 🛠️ Instalación

### Prerequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14

### Setup Inicial

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd crm-freelancer
```

1. **Instalar dependencias**

```bash
npm install
```

1. **Configurar variables de entorno**

**Backend** (`apps/backend/.env`):

```bash
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env con tu configuración
```

**Frontend** (`apps/frontend/.env.local`):

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

**Database** (`packages/database/.env`):

```bash
cp packages/database/.env.example packages/database/.env
# Configurar DATABASE_URL con PostgreSQL
```

1. **Configurar base de datos**

```bash
# Generar Prisma Client
npm run db:generate

# Ejecutar migraciones
npm run db:migrate
```

## 🏃 Desarrollo

### Ejecutar todo el proyecto

```bash
npm run dev
```

### Ejecutar servicios individualmente

**Frontend** (<http://localhost:3000>):

```bash
npm run dev:frontend
```

**Backend** (<http://localhost:3001>):

```bash
npm run dev:backend
```

**Prisma Studio** (<http://localhost:5555>):

```bash
npm run db:studio
```

## 📊 Base de Datos

El schema de Prisma incluye los siguientes módulos:

- **Usuarios y Autenticación**: `User` con roles (ADMIN, USER, VIEWER)
- **Contactos y Empresas**: `Contact`, `Company`
- **Pipeline de Ventas**: `Deal` con stages (Prospecto, Contactado, Propuesta, Negociación, Cerrado)
- **Actividades**: `Activity` (llamadas, emails, reuniones, notas, tareas, WhatsApp)
- **Cotizaciones**: `Quotation`, `QuotationItem`
- **Facturación**: `Invoice`, `InvoiceItem`

### Comandos Prisma útiles

```bash
# Generar Prisma Client
npm run db:generate

# Push schema to DB (desarrollo)
npm run db:push

# Crear migración
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:cov
```

## 🏗️ Build

```bash
# Build de todo
npm run build

# Build individual
npm run build:frontend
npm run build:backend
```

## 📝 Convenciones de Código

Consultar [AGENT.md](./AGENT.md) para:

- Reglas de codificación
- Convenciones de nombres
- Mejores prácticas
- Especificaciones de features

## 🎯 Features Principales

✅ **Implementadas en Schema**:

- Gestión de contactos y empresas
- Pipeline de ventas (Deal stages)
- Sistema de actividades
- Cotizaciones con line items
- Facturación básica

🚧 **Por Implementar**:

- Dashboard con métricas
- Interfaz Kanban para deals
- Autenticación JWT
- Recordatorios automáticos
- Reportes y analytics
- Integración Email/WhatsApp

## 📄 Licencia

Ver [LICENSE](./LICENSE)

## 🤝 Contribuir

Este es un proyecto privado. Consultar con el equipo antes de contribuir.
