import "server-only";

import { after } from "next/server";

import {
  createInsForgeServerClient,
  isInsForgeConfigured,
  unwrapInsForgeResult
} from "@/lib/insforge";

type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

type QueuedNotification = {
  id: string;
  channel: NotificationChannel;
  recipient: string | null;
  subject: string;
  body: string;
  attemptCount: number;
};

type DeliveryResult = {
  delivered: boolean;
  providerRef?: string;
  error?: string;
};

export async function queueNotification(params: {
  channel: NotificationChannel;
  templateKey?: string;
  to?: string;
  subject: string;
  body: string;
  bookingId?: string;
  userId?: string;
  sentAt?: string;
}) {
  if (!isInsForgeConfigured()) {
    const result = await deliverNotification({
      channel: params.channel,
      recipient: params.to ?? null,
      subject: params.subject,
      body: params.body
    });

    return { queued: false, delivered: result.delivered, ...params };
  }

  try {
    const insforge = createInsForgeServerClient();
    const recipient = params.to ?? (await resolveUserRecipient(params.userId, params.channel));
    const id = `notification_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await unwrapInsForgeResult(
      insforge.database.from("Notification").insert([{
        id,
        bookingId: params.bookingId ?? null,
        userId: params.userId ?? null,
        channel: params.channel,
        templateKey: params.templateKey ?? "app_event",
        subject: params.subject,
        body: params.body,
        recipient,
        status: "QUEUED",
        attemptCount: 0,
        nextAttemptAt: now,
        sentAt: null
      }]),
      "Queue notification"
    );

    after(async () => {
      await deliverQueuedNotification({
        id,
        channel: params.channel,
        recipient,
        subject: params.subject,
        body: params.body,
        attemptCount: 0
      });
    });

    return { queued: true, delivered: false, ...params };
  } catch (error) {
    console.error("Failed to queue notification", error);
    return { queued: false, delivered: false, ...params };
  }
}

async function resolveUserRecipient(userId: string | undefined, channel: NotificationChannel) {
  if (!userId) return null;

  const insforge = createInsForgeServerClient();
  const user = (await unwrapInsForgeResult(
    insforge.database.from("User").select("email,phone").eq("id", userId).maybeSingle(),
    "Resolve notification recipient"
  )) as { email: string | null; phone: string | null } | null;

  return channel === "EMAIL" ? user?.email ?? null : user?.phone ?? null;
}

async function deliverQueuedNotification(notification: QueuedNotification) {
  const result = await deliverNotification(notification);
  const insforge = createInsForgeServerClient();
  const now = new Date();
  const nextAttemptCount = notification.attemptCount + 1;
  const shouldRetry = !result.delivered && nextAttemptCount < 5;
  const retryDelayMinutes = Math.min(60, 2 ** nextAttemptCount);

  await unwrapInsForgeResult(
    insforge.database
      .from("Notification")
      .update({
        status: result.delivered ? "SENT" : shouldRetry ? "RETRY_PENDING" : "FAILED",
        providerRef: result.providerRef ?? null,
        error: result.error ?? null,
        attemptCount: nextAttemptCount,
        lastAttemptAt: now.toISOString(),
        nextAttemptAt: shouldRetry
          ? new Date(now.getTime() + retryDelayMinutes * 60_000).toISOString()
          : null,
        sentAt: result.delivered ? now.toISOString() : null
      })
      .eq("id", notification.id),
    "Update notification delivery"
  );

  return result;
}

export async function retryPendingNotifications(limit = 25) {
  if (!isInsForgeConfigured()) return { processed: 0, delivered: 0 };

  const insforge = createInsForgeServerClient();
  const pending = ((await unwrapInsForgeResult(
    insforge.database
      .from("Notification")
      .select("id,channel,recipient,subject,body,attemptCount")
      .in("status", ["QUEUED", "RETRY_PENDING"])
      .lte("nextAttemptAt", new Date().toISOString())
      .order("nextAttemptAt", { ascending: true })
      .limit(limit),
    "Load queued notifications"
  )) ?? []) as QueuedNotification[];

  let delivered = 0;

  for (const notification of pending) {
    const result = await deliverQueuedNotification(notification);
    if (result.delivered) delivered += 1;
  }

  return { processed: pending.length, delivered };
}

async function providerFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function deliverNotification(params: {
  channel: NotificationChannel;
  recipient: string | null;
  subject: string;
  body: string;
}): Promise<DeliveryResult> {
  if (!params.recipient) {
    return { delivered: false, error: "Notification recipient is missing." };
  }

  try {
    if (params.channel === "EMAIL") {
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        return { delivered: false, error: "Email provider is not configured." };
      }

      const response = await providerFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: params.recipient,
          subject: params.subject,
          text: params.body
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
      return response.ok
        ? { delivered: true, providerRef: payload.id }
        : { delivered: false, error: payload.message ?? `Email provider returned ${response.status}.` };
    }

    if (params.channel === "SMS") {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
        return { delivered: false, error: "SMS provider is not configured." };
      }

      const credentials = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");
      const response = await providerFetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_FROM_NUMBER,
            To: params.recipient,
            Body: params.body
          })
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
      return response.ok
        ? { delivered: true, providerRef: payload.sid }
        : { delivered: false, error: payload.message ?? `SMS provider returned ${response.status}.` };
    }

    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      return { delivered: false, error: "WhatsApp provider is not configured." };
    }

    const response = await providerFetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.recipient.replace(/[^\d]/g, ""),
          type: "text",
          text: { body: params.body }
        })
      }
    );
    const payload = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };
    return response.ok
      ? { delivered: true, providerRef: payload.messages?.[0]?.id }
      : { delivered: false, error: payload.error?.message ?? `WhatsApp provider returned ${response.status}.` };
  } catch (error) {
    console.error("Notification delivery failed", error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : "Notification delivery failed."
    };
  }
}
