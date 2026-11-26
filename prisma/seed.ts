import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
        throw new Error("El seed está bloqueado en producción")
    }

    const seedPassword = process.env.SEED_PASSWORD
    const seedEmail = (process.env.SEED_EMAIL ?? "seed@example.invalid").trim().toLowerCase()

    if (!seedPassword || seedPassword.length < 16) {
        throw new Error("SEED_PASSWORD debe tener al menos 16 caracteres")
    }

    console.log("Starting seed...")

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

    console.log("Created/Found user:", user.email)

    const client1 = await prisma.client.upsert({
        where: { id: "seed-client-1" },
        update: {},
        create: {
            id: "seed-client-1",
            type: "EMPRESA",
            name: "ACME Corp",
            taxId: "76.123.456-7",
            email: "contact@acme.com",
            phone: "+56 9 1234 5678",
            contactName: "John Doe",
            website: "https://acme.com",
            address: "Av. Principal 123, Santiago",
            notes: "Cliente corporativo interesado en rediseño web.",
            userId: user.id,
        },
    })

    const client2 = await prisma.client.upsert({
        where: { id: "seed-client-2" },
        update: {},
        create: {
            id: "seed-client-2",
            type: "EMPRESA",
            name: "Tech Solutions",
            taxId: "77.987.654-3",
            email: "info@techsolutions.com",
            phone: "+56 9 8765 4321",
            contactName: "Jane Smith",
            website: "https://techsolutions.com",
            address: "Calle Innovación 456, Providencia",
            notes: "Agencia partner para desarrollo móvil.",
            userId: user.id,
        },
    })

    const client3 = await prisma.client.upsert({
        where: { id: "seed-client-3" },
        update: {},
        create: {
            id: "seed-client-3",
            type: "PERSONA",
            name: "María González",
            taxId: "18.456.789-0",
            email: "maria.gonzalez@gmail.com",
            phone: "+56 9 5555 4444",
            address: "Pasaje Los Aromos 89, Valparaíso",
            notes: "Consultoría freelance para tienda online.",
            userId: user.id,
        },
    })

    console.log("Created clients")

    await prisma.deal.deleteMany({
        where: { title: { contains: "Seed Deal" } },
    })

    await prisma.deal.create({
        data: {
            title: "Seed Deal - Web Development",
            description: "Website redesign project",
            value: 15000,
            stage: "PROSPECTO",
            clientId: client1.id,
            userId: user.id,
        },
    })

    await prisma.deal.create({
        data: {
            title: "Seed Deal - Mobile App",
            description: "Mobile app development",
            value: 25000,
            stage: "CONTACTADO",
            clientId: client2.id,
            userId: user.id,
        },
    })

    await prisma.deal.create({
        data: {
            title: "Seed Deal - Consulting",
            description: "Technical consulting",
            value: 8000,
            stage: "PROPUESTA_ENVIADA",
            clientId: client3.id,
            userId: user.id,
        },
    })

    console.log("Created deals")
    console.log("Seed completed successfully!")
    console.log(`Created ${await prisma.deal.count()} deals`)
    console.log(`Created ${await prisma.client.count()} clients`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
