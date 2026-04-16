import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("Starting seed...")

    const hashedPassword = await bcrypt.hash("password123", 10)

    const user = await prisma.user.upsert({
        where: { email: "example@gmail.com" },
        update: {},
        create: {
            email: "example@gmail.com",
            password: hashedPassword,
            name: "Test User",
        },
    })

    console.log("Created/Found user:", user.email)

    const company1 = await prisma.company.upsert({
        where: { id: "seed-company-1" },
        update: {},
        create: {
            id: "seed-company-1",
            name: "ACME Corp",
            email: "contact@acme.com",
            phone: "1234567890",
            website: "https://acme.com",
            userId: user.id,
        },
    })

    const company2 = await prisma.company.upsert({
        where: { id: "seed-company-2" },
        update: {},
        create: {
            id: "seed-company-2",
            name: "Tech Solutions",
            email: "info@techsolutions.com",
            phone: "0987654321",
            website: "https://techsolutions.com",
            userId: user.id,
        },
    })

    console.log("Created companies")

    const contact1 = await prisma.contact.upsert({
        where: { id: "seed-contact-1" },
        update: {},
        create: {
            id: "seed-contact-1",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@acme.com",
            phone: "1112223333",
            position: "CEO",
            companyId: company1.id,
            userId: user.id,
        },
    })

    const contact2 = await prisma.contact.upsert({
        where: { id: "seed-contact-2" },
        update: {},
        create: {
            id: "seed-contact-2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@techsolutions.com",
            phone: "4445556666",
            position: "CTO",
            companyId: company2.id,
            userId: user.id,
        },
    })

    console.log("Created contacts")

    await prisma.deal.deleteMany({
        where: { title: { contains: "Seed Deal" } },
    })

    const deal1 = await prisma.deal.create({
        data: {
            title: "Seed Deal - Web Development",
            description: "Website redesign project",
            value: 15000,
            stage: "PROSPECTO",
            contactId: contact1.id,
            companyId: company1.id,
            userId: user.id,
        },
    })

    const deal2 = await prisma.deal.create({
        data: {
            title: "Seed Deal - Mobile App",
            description: "Mobile app development",
            value: 25000,
            stage: "CONTACTADO",
            contactId: contact2.id,
            companyId: company2.id,
            userId: user.id,
        },
    })

    const deal3 = await prisma.deal.create({
        data: {
            title: "Seed Deal - Consulting",
            description: "Technical consulting",
            value: 8000,
            stage: "PROPUESTA_ENVIADA",
            contactId: contact1.id,
            companyId: company1.id,
            userId: user.id,
        },
    })

    console.log("Created deals")
    console.log("Seed completed successfully!")
    console.log(`Created ${await prisma.deal.count()} deals`)
    console.log(`Created ${await prisma.contact.count()} contacts`)
    console.log(`Created ${await prisma.company.count()} companies`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
