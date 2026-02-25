# CRM Freelancer

Un CRM minimalista diseñado específicamente para freelancers, agencias pequeñas o negocios de servicios. Permite la gestión eficiente de clientes, seguimiento de propuestas y cotizaciones, visualización del pipeline de ventas, recordatorios de seguimiento y facturación básica, todo sin la complejidad de sistemas corporativos pesados.

## 🚀 Características Principales

- **Dashboard Integrado:** Visualización de deals activos, ingresos del mes, cotizaciones pendientes y nuevos clientes.
- **Gestión de Contactos y Empresas:** Registro detallado con historial de interacciones y notas de seguimiento.
- **Pipeline de Ventas (Kanban):** Interfaz visual interactiva con estados personalizables (Prospecto, Contactado, Propuesta Enviada, Negociación, Cerrado).
- **Cotizaciones y Propuestas:** Creación y envío de cotizaciones detallando servicios y precios.
- **Seguimiento Automatizado:** Sistema de recordatorios automáticos para asegurar el cierre de tratos (deals).
- **Facturación Básica:** Generación y envío de facturas directamente desde oportunidades de negocio cerradas.
- **Historial Completo:** Registro de interacciones (emails, llamadas, notas, reuniones, WhatsApp) por cada cliente.
- **Reportes:** Visualización de ventas, tasas de conversión con gráficos y opción de exportación a CSV.

## 🛠️ Stack Tecnológico

Este proyecto está construido con un stack moderno y enfocado en la eficiencia, seguridad y escalabilidad:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [Shadcn UI](https://ui.shadcn.com/)
- **Gestión de Formularios:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) para validaciones
- **Base de Datos:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Autenticación:** [Auth.js](https://authjs.dev/) (NextAuth v5)
- **Gestor de Paquetes:** [pnpm](https://pnpm.io/)
- **Drag and Drop / Tableros:** [dnd-kit](https://dndkit.com/) (para el Pipeline Kanban)

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (v18.17 o superior recomendado)
- pnpm instalado globalmente (`npm install -g pnpm`)
- Una instancia de PostgreSQL ejecutándose

## ⚙️ Configuración e Instalación Local

1. **Clonar el repositorio:**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd crm-freelancer
   ```

2. **Instalar dependencias:**

   ```bash
   pnpm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto basándote en tus credenciales de base de datos:

   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/crm_freelancer"
   AUTH_SECRET="tu_secreto_para_authjs"
   ```

4. **Inicializar la base de datos (Prisma):**

   ```bash
   pnpm dlx prisma db push
   # O si usas migraciones: pnpm dlx prisma migrate dev
   ```

5. **Generar el cliente de Prisma:**
   *(Esto debería ejecutarse automáticamente post-instalación de paquetes)*

   ```bash
   pnpm dlx prisma generate
   ```

6. **Iniciar el servidor de desarrollo (con Turbopack):**

   ```bash
   pnpm run dev
   ```

   El proyecto estará disponible en [http://localhost:3000](http://localhost:3000).

## 📜 Scripts Disponibles

- `pnpm run dev`: Inicia el servidor de desarrollo utilizando Turbopack para mayor velocidad.
- `pnpm run build`: Construye la aplicación optimizada para producción.
- `pnpm run start`: Inicia el servidor de producción.
- `pnpm run lint`: Ejecuta el linter (ESLint) para verificar problemas en el código.
- `pnpm run postinstall`: Genera el cliente de Prisma automáticamente después de instalar las dependencias.

## 🤝 Reglas de Contribución y Codificación

- **TypeScript Estricto:** Se deben definir interfaces/tipos explícitos para todas las estructuras, especialmente las provenientes de la base de datos.
- **Componentes:** Se prioriza el uso estricto de **Shadcn UI** para elementos de la interfaz. No se escriben estilos CSS personalizados; se utiliza TailwindCSS exclusivamente.
- **Base de Datos:** Los cambios estructurales se realizan mediante `schema.prisma`. Se utiliza Zod para validar datos antes de persistirlos con el cliente de Prisma.
- **Nomenclatura:** `camelCase` para variables y campos de BD; `PascalCase` para modelos; `kebab-case` para nombres de archivos y rutas.
