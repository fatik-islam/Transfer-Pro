import "server-only";

import { createInsForgeServerClient, isInsForgeConfigured, unwrapInsForgeResult } from "@/lib/insforge";

export async function queueNotification(params: {
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  templateKey?: string;
  to?: string;
  subject: string;
  body: string;
  bookingId?: string;
  userId?: string;
  sentAt?: string;
}) {
  const deliveredAt = await deliverNotification(params);

  if (!isInsForgeConfigured()) {
    return {
      queued: true,
      delivered: Boolean(deliveredAt),
      ...params
    };
  }

  try {
    const insforge = createInsForgeServerClient();

    await unwrapInsForgeResult(
      insforge.database.from("Notification").insert({
        id: `notification_${crypto.randomUUID()}`,
        bookingId: params.bookingId ?? null,
        userId: params.userId ?? null,
        channel: params.channel,
        templateKey: params.templateKey ?? "app_event",
        subject: params.subject,
        body: params.body,
        sentAt: params.sentAt ?? deliveredAt ?? null
      }),
      "Queue notification"
    );

    return {
      queued: true,
      delivered: Boolean(deliveredAt),
      ...params
    };
  } catch (error) {
    console.error("Failed to queue notification", error);

    return {
      queued: false,
      delivered: Boolean(deliveredAt),
      ...params
    };
  }
}

async function deliverNotification(params: {
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  to?: string;
  subject: string;
  body: string;
}) {
  try {
    if (params.channel === "EMAIL" && params.to && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: params.to,
          subject: params.subject,
          text: params.body
        })
      });

      return response.ok ? new Date().toISOString() : null;
    }

    if (params.channel === "SMS" && params.to && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      const credentials = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");
      const body = new URLSearchParams({
        From: process.env.TWILIO_FROM_NUMBER,
        To: params.to,
        Body: params.body
      });
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body
        }
      );

      return response.ok ? new Date().toISOString() : null;
    }

    if (params.channel === "WHATSAPP" && params.to && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: params.to.replace(/[^\d]/g, ""),
            type: "text",
            text: { body: params.body }
          })
        }
      );

      return response.ok ? new Date().toISOString() : null;
    }
  } catch (error) {
    console.error("Notification delivery failed", error);
  }

  return null;
}
