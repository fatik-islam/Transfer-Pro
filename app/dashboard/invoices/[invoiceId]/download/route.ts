import { getSession } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/documents";
import { getInvoiceDocumentData } from "@/lib/repository";

export async function GET(
  _: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.role === "CUSTOMER") {
    return new Response("Forbidden", { status: 403 });
  }

  const { invoiceId } = await context.params;
  const invoice = await getInvoiceDocumentData(invoiceId, session);

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const pdfBytes = await renderInvoicePdf({
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    currency: invoice.currency,
    bookingReference: invoice.bookingReference,
    pickupAt: invoice.pickupAt,
    origin: invoice.origin,
    destination: invoice.destination,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone,
    driverName: invoice.driverName,
    paymentMethodLabel: invoice.paymentMethodLabel
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number.toLowerCase()}.pdf"`
    }
  });
}
