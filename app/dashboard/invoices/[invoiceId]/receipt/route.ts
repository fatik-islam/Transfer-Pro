import { getSession } from "@/lib/auth";
import { renderReceiptPdf } from "@/lib/documents";
import { getInvoiceDocumentData } from "@/lib/repository";

export async function GET(
  _: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { invoiceId } = await context.params;
  const invoice = await getInvoiceDocumentData(invoiceId, session);

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const pdfBytes = await renderReceiptPdf({
    number: invoice.number,
    paidAt: invoice.paidAt,
    capturedAt: invoice.capturedAt,
    fareTotal: invoice.total,
    tipAmount: invoice.tipAmount,
    currency: invoice.currency,
    bookingReference: invoice.bookingReference,
    origin: invoice.origin,
    destination: invoice.destination,
    customerName: invoice.customerName,
    driverName: invoice.driverName,
    paymentMethodLabel: invoice.paymentMethodLabel,
    farePaid: invoice.paymentStatus === "PAID",
    tipPaid: invoice.tipPaymentStatus === "PAID"
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number.toLowerCase()}-receipt.pdf"`
    }
  });
}
