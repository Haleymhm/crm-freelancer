import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    quoteNumber: {
        fontSize: 14,
        color: "#666",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 8,
        borderBottom: "1px solid #ddd",
        paddingBottom: 4,
    },
    row: {
        flexDirection: "row",
        marginBottom: 4,
    },
    label: {
        color: "#666",
        width: 80,
    },
    value: {
        flex: 1,
    },
    table: {
        marginTop: 8,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        padding: 8,
        borderBottom: "1px solid #ddd",
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottom: "1px solid #eee",
    },
    col1: { flex: 3 },
    col2: { width: 60, textAlign: "right" },
    col3: { width: 90, textAlign: "right" },
    col4: { width: 90, textAlign: "right" },
    totalsSection: {
        marginTop: 20,
        alignItems: "flex-end",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 4,
        width: 200,
    },
    totalLabel: {
        flex: 1,
    },
    totalValue: {
        width: 100,
        textAlign: "right",
    },
    grandTotal: {
        borderTop: "1px solid #333",
        paddingTop: 8,
        fontWeight: "bold",
        fontSize: 12,
    },
    notes: {
        marginTop: 20,
        padding: 12,
        backgroundColor: "#f9f9f9",
        borderRadius: 4,
    },
    notesTitle: {
        fontWeight: "bold",
        marginBottom: 4,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        color: "#999",
        fontSize: 8,
    },
})

interface QuoteItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

interface Quote {
    quoteNumber: string
    items: QuoteItem[]
    subtotal: number | string
    tax: number | string
    total: number | string
    validUntil: string | null
    notes: string | null
    createdAt: string
    deal: {
        title: string
        contact: { firstName: string; lastName: string } | null
        company: { name: string } | null
    }
}

interface QuotePdfProps {
    quote: Quote
}

const formatCurrency = (val: number | string) =>
    `$${Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

export function QuotePdf({ quote }: QuotePdfProps) {
    const clientName = quote.deal.contact
        ? `${quote.deal.contact.firstName} ${quote.deal.contact.lastName}`
        : quote.deal.company?.name ?? "Sin cliente"

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Cotización</Text>
                        <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Deal:</Text>
                        <Text style={styles.value}>{quote.deal.title}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cliente:</Text>
                        <Text style={styles.value}>{clientName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha:</Text>
                        <Text style={styles.value}>{formatDate(quote.createdAt)}</Text>
                    </View>
                    {quote.validUntil && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Válida hasta:</Text>
                            <Text style={styles.value}>{formatDate(quote.validUntil)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ítems</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>Descripción</Text>
                            <Text style={styles.col2}>Cant.</Text>
                            <Text style={styles.col3}>Precio unit.</Text>
                            <Text style={styles.col4}>Total</Text>
                        </View>
                        {quote.items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.col1}>{item.description}</Text>
                                <Text style={styles.col2}>{item.quantity}</Text>
                                <Text style={styles.col3}>{formatCurrency(item.unitPrice)}</Text>
                                <Text style={styles.col4}>{formatCurrency(item.total)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Impuesto</Text>
                        <Text style={styles.totalValue}>{formatCurrency(quote.tax)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(quote.total)}</Text>
                    </View>
                </View>

                {quote.notes && (
                    <View style={styles.notes}>
                        <Text style={styles.notesTitle}>Notas</Text>
                        <Text>{quote.notes}</Text>
                    </View>
                )}

                <Text style={styles.footer}>
                    Documento generado el {new Date().toLocaleDateString("es-MX")}
                </Text>
            </Page>
        </Document>
    )
}