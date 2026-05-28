import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatCurrency, formatDateTime } from "@/lib/utils";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const COPPER = rgb(0.72, 0.53, 0.27);
const INK = rgb(0.06, 0.13, 0.21);
const SLATE = rgb(0.37, 0.44, 0.49);
const BORDER = rgb(0.88, 0.89, 0.91);
const PAPER = rgb(0.99, 0.98, 0.97);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [""];
  }

  const lines: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  lines.push(current);
  return lines;
}

function drawWrappedText(page: PDFPage, options: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  lineHeight?: number;
}) {
  const lines = wrapText(options.text, options.font, options.size, options.maxWidth);
  const lineHeight = options.lineHeight ?? options.size * 1.45;

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * lineHeight,
      font: options.font,
      size: options.size,
      color: options.color
    });
  });

  return options.y - lines.length * lineHeight;
}

function drawInfoCard(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    value: string;
    detail: string;
  }
) {
  page.drawRectangle({
    x: options.x,
    y: options.y - options.height,
    width: options.width,
    height: options.height,
    borderColor: BORDER,
    borderWidth: 1,
    color: PAPER
  });

  page.drawText(options.label.toUpperCase(), {
    x: options.x + 16,
    y: options.y - 22,
    font: fonts.bold,
    size: 10,
    color: SLATE
  });

  const valueBottom = drawWrappedText(page, {
    text: options.value,
    x: options.x + 16,
    y: options.y - 44,
    maxWidth: options.width - 32,
    font: fonts.bold,
    size: 15,
    color: INK,
    lineHeight: 18
  });

  drawWrappedText(page, {
    text: options.detail,
    x: options.x + 16,
    y: valueBottom - 6,
    maxWidth: options.width - 32,
    font: fonts.regular,
    size: 10,
    color: SLATE,
    lineHeight: 14
  });
}

function drawMoneyRow(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  options: {
    y: number;
    description: string;
    amount: string;
    emphasized?: boolean;
  }
) {
  const font = options.emphasized ? fonts.bold : fonts.regular;
  const color = options.emphasized ? INK : SLATE;

  page.drawLine({
    start: { x: MARGIN, y: options.y + 8 },
    end: { x: PAGE_WIDTH - MARGIN, y: options.y + 8 },
    thickness: 1,
    color: BORDER
  });

  page.drawText(options.description, {
    x: MARGIN,
    y: options.y - 4,
    font,
    size: 12,
    color
  });

  const amountWidth = font.widthOfTextAtSize(options.amount, 12);

  page.drawText(options.amount, {
    x: PAGE_WIDTH - MARGIN - amountWidth,
    y: options.y - 4,
    font,
    size: 12,
    color
  });
}

async function createBasePdf(options: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText(options.eyebrow.toUpperCase(), {
    x: MARGIN,
    y: PAGE_HEIGHT - 54,
    font: bold,
    size: 10,
    color: COPPER
  });

  page.drawText(options.title, {
    x: MARGIN,
    y: PAGE_HEIGHT - 92,
    font: bold,
    size: 32,
    color: INK
  });

  drawWrappedText(page, {
    text: options.subtitle,
    x: MARGIN,
    y: PAGE_HEIGHT - 118,
    maxWidth: PAGE_WIDTH - MARGIN * 2,
    font: regular,
    size: 11,
    color: SLATE,
    lineHeight: 16
  });

  return {
    pdf,
    page,
    fonts: { regular, bold }
  };
}

export async function renderInvoicePdf(data: {
  number: string;
  issuedAt: string;
  dueAt: string | null;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  bookingReference: string;
  pickupAt: string;
  origin: string;
  destination: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  driverName: string | null;
  paymentMethodLabel: string;
}) {
  const { pdf, page, fonts } = await createBasePdf({
    eyebrow: "Transfer Pro Invoice",
    title: data.number,
    subtitle: "Private chauffeurs. Premium journeys."
  });

  const cardWidth = (PAGE_WIDTH - MARGIN * 2 - 16) / 2;
  const cardHeight = 90;
  const topY = PAGE_HEIGHT - 160;

  drawInfoCard(page, fonts, {
    x: MARGIN,
    y: topY,
    width: cardWidth,
    height: cardHeight,
    label: "Customer",
    value: data.customerName,
    detail: `${data.customerEmail} · ${data.customerPhone}`
  });
  drawInfoCard(page, fonts, {
    x: MARGIN + cardWidth + 16,
    y: topY,
    width: cardWidth,
    height: cardHeight,
    label: "Journey",
    value: `${data.origin} to ${data.destination}`,
    detail: `${formatDateTime(data.pickupAt)} · ${data.bookingReference}`
  });
  drawInfoCard(page, fonts, {
    x: MARGIN,
    y: topY - cardHeight - 16,
    width: cardWidth,
    height: cardHeight,
    label: "Issue date",
    value: formatDateTime(data.issuedAt),
    detail: data.dueAt ? `Due ${formatDateTime(data.dueAt)}` : "Due on receipt"
  });
  drawInfoCard(page, fonts, {
    x: MARGIN + cardWidth + 16,
    y: topY - cardHeight - 16,
    width: cardWidth,
    height: cardHeight,
    label: "Fulfillment",
    value: data.driverName ?? "Transfer Pro dispatch",
    detail: data.paymentMethodLabel
  });

  let y = topY - cardHeight * 2 - 54;

  page.drawText("DESCRIPTION", {
    x: MARGIN,
    y,
    font: fonts.bold,
    size: 10,
    color: SLATE
  });

  const amountHeadingWidth = fonts.bold.widthOfTextAtSize("AMOUNT", 10);
  page.drawText("AMOUNT", {
    x: PAGE_WIDTH - MARGIN - amountHeadingWidth,
    y,
    font: fonts.bold,
    size: 10,
    color: SLATE
  });

  y -= 24;
  drawMoneyRow(page, fonts, {
    y,
    description: "Private transfer fare",
    amount: formatCurrency(data.subtotal, data.currency)
  });
  y -= 34;
  drawMoneyRow(page, fonts, {
    y,
    description: "Tax",
    amount: data.tax > 0 ? formatCurrency(data.tax, data.currency) : "Included"
  });
  y -= 34;
  drawMoneyRow(page, fonts, {
    y,
    description: "Total",
    amount: formatCurrency(data.total, data.currency),
    emphasized: true
  });

  drawWrappedText(page, {
    text: "This invoice covers the booked transfer fare only. Tips and offline settlement notes appear on the receipt after payment is completed.",
    x: MARGIN,
    y: y - 56,
    maxWidth: PAGE_WIDTH - MARGIN * 2,
    font: fonts.regular,
    size: 10,
    color: SLATE,
    lineHeight: 15
  });

  return pdf.save();
}

export async function renderReceiptPdf(data: {
  number: string;
  paidAt: string | null;
  capturedAt: string | null;
  fareTotal: number;
  tipAmount: number;
  currency: string;
  bookingReference: string;
  origin: string;
  destination: string;
  customerName: string;
  driverName: string | null;
  paymentMethodLabel: string;
  farePaid: boolean;
  tipPaid: boolean;
}) {
  const receiptTotal = (data.farePaid ? data.fareTotal : 0) + (data.tipPaid ? data.tipAmount : 0);
  const { pdf, page, fonts } = await createBasePdf({
    eyebrow: "Transfer Pro Receipt",
    title: data.number,
    subtitle: `${data.origin} to ${data.destination} · ${data.bookingReference}`
  });

  const cardWidth = (PAGE_WIDTH - MARGIN * 2 - 16) / 2;
  const cardHeight = 90;
  const topY = PAGE_HEIGHT - 160;

  drawInfoCard(page, fonts, {
    x: MARGIN,
    y: topY,
    width: cardWidth,
    height: cardHeight,
    label: "Customer",
    value: data.customerName,
    detail: "Receipt issued for completed journey."
  });
  drawInfoCard(page, fonts, {
    x: MARGIN + cardWidth + 16,
    y: topY,
    width: cardWidth,
    height: cardHeight,
    label: "Driver",
    value: data.driverName ?? "Transfer Pro dispatch",
    detail: data.paymentMethodLabel
  });
  drawInfoCard(page, fonts, {
    x: MARGIN,
    y: topY - cardHeight - 16,
    width: cardWidth,
    height: cardHeight,
    label: "Paid at",
    value:
      data.paidAt
        ? formatDateTime(data.paidAt)
        : data.capturedAt
          ? formatDateTime(data.capturedAt)
          : "Pending",
    detail: "Captured and receipted after settlement."
  });
  drawInfoCard(page, fonts, {
    x: MARGIN + cardWidth + 16,
    y: topY - cardHeight - 16,
    width: cardWidth,
    height: cardHeight,
    label: "Receipt total",
    value: formatCurrency(receiptTotal, data.currency),
    detail: data.tipPaid ? "Fare and tip received." : "Fare received."
  });

  let y = topY - cardHeight * 2 - 54;

  page.drawText("DESCRIPTION", {
    x: MARGIN,
    y,
    font: fonts.bold,
    size: 10,
    color: SLATE
  });

  const amountHeadingWidth = fonts.bold.widthOfTextAtSize("AMOUNT", 10);
  page.drawText("AMOUNT", {
    x: PAGE_WIDTH - MARGIN - amountHeadingWidth,
    y,
    font: fonts.bold,
    size: 10,
    color: SLATE
  });

  y -= 24;
  drawMoneyRow(page, fonts, {
    y,
    description: "Transfer fare",
    amount: data.farePaid ? formatCurrency(data.fareTotal, data.currency) : "Pending"
  });
  y -= 34;
  drawMoneyRow(page, fonts, {
    y,
    description: "Driver tip",
    amount: data.tipPaid ? formatCurrency(data.tipAmount, data.currency) : "Not paid"
  });
  y -= 34;
  drawMoneyRow(page, fonts, {
    y,
    description: "Total received",
    amount: formatCurrency(receiptTotal, data.currency),
    emphasized: true
  });

  return pdf.save();
}
