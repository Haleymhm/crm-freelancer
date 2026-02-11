# AGENT.md - Contexto del Proyecto: CRM Simple para Negocios de Servicios

## 1. Descripción del Proyecto

Un CRM minimalista para freelancers, agencias pequeñas o negocios de servicios. Gestión de clientes, seguimiento de propuestas/cotizaciones, pipeline de ventas, recordatorios de seguimiento y facturación básica. Sin la complejidad de Salesforce o HubSpot.

## 2. Stack Tecnológico

- **Lenguaje:** TypeScript (Strict mode).
- **Frontend:** (Framework: Next.js).
- **Estilos:** TailwindCSS.
- **Componentes UI:** Shadcn UI (basado en Radix).
- **Base de Datos / ORM:** Prisma.
- **Backend:** (Framework: NestJS).

## 3. Reglas de Codificación

### General

- Usa **TypeScript** estricto para todo. Define interfaces o tipos para todas las estructuras de datos, especialmente las que vienen de la base de datos.
- Prefiere la programación funcional y componentes limpios.
- Documenta las funciones complejas en español.

### Backend & Base de Datos (Prisma)

- **Schema:** Cada vez que se sugiera un cambio en la base de datos, proporciona el código actualizado para `schema.prisma`.
- **Consultas:** Utiliza siempre el cliente de Prisma (`prisma.client`). Evita SQL crudo a menos que sea estrictamente necesario para rendimiento.
- **Validación:** Valida los datos de entrada antes de enviarlos a Prisma (por ejemplo, usando Zod si está disponible).
- **Relaciones:** Asegura la integridad referencial (ej: un ticket no puede existir sin un puesto asignado).

### Frontend & UI (Tailwind + Shadcn)

- **Estilos:** No escribas CSS personalizado. Usa siempre las clases utilitarias de **TailwindCSS**.
- **Componentes:** Para botones, inputs, modales y tablas, utiliza siempre los componentes de **Shadcn**. No crees componentes HTML nativos si existe una alternativa en Shadcn.
- **Diseño:** La interfaz debe ser limpia y responder a dispositivos móviles (Mobile-first).

## 4. Convenciones de Nombres

- **Base de Datos:** `camelCase` para campos (ej: `fechaEntrada`), `PascalCase` para modelos (ej: `Ticket`, `Vehiculo`).
- **Variables:** `camelCase` (ej: `espaciosDisponibles`).
- **Archivos:** `kebab-case` o seguir la convención del framework (ej: `parking-controller.ts`).

## 5. Tareas Críticas (Backend Focus)

- Algoritmo de asignación de puestos (encontrar el más cercano o disponible).
- Cálculo preciso de tarifas basado en el tiempo (horas/minutos).
- Prevención de doble reserva de un mismo puesto.

## 6. Características principales

- Dashboard con deals activos, ingresos del mes, cotizaciones pendientes y clientes nuevos
- Gestión de contactos y empresas con historial de interacciones y notas
- Pipeline de ventas visual estilo Kanban (prospecto, contactado, propuesta enviada, negociación, cerrado)
- Creación y envío de cotizaciones/propuestas con detalle de servicios y precios
- Seguimiento de deals con recordatorios automáticos
- Facturación básica integrada, generar y enviar facturas desde un deal cerrado
- Historial de interacciones por cliente
- Reportes de ventas y tasa de conversión con gráficos y exportación a CSV
- Integración con email y WhatsApp
