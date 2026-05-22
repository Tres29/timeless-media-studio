import { NextResponse } from "next/server";
import { PAYMONGO_API_URL } from "@/lib/payment-config";

function getAuthHeader(key: string) {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYMONGO_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    const isPaymentIntent = id.startsWith("pi_");
    const endpoint = isPaymentIntent ? `/payment_intents/${id}` : `/sources/${id}`;

    const response = await fetch(`${PAYMONGO_API_URL}${endpoint}`, {
      headers: { Authorization: getAuthHeader(secretKey) },
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: result?.errors?.[0]?.detail || "Failed to fetch payment status" },
        { status: response.status }
      );
    }

    const data = result.data;
    const paymongoStatus = data.attributes.status;

    const statusMap: Record<string, string> = {
      pending: "pending",
      redirected: "pending",
      awaiting_payment_method: "pending",
      awaiting_next_action: "pending",
      processing: "pending",
      chargeable: "completed",
      active: "completed",
      succeeded: "completed",
      paid: "completed",
      expired: "failed",
      failed: "failed",
      cancelled: "cancelled",
    };

    return NextResponse.json({
      id: data.id,
      amount: data.attributes.amount ? data.attributes.amount / 100 : undefined,
      currency: data.attributes.currency,
      status: statusMap[paymongoStatus] || "pending",
      paymongoStatus,
      type: data.attributes.type || data.type,
      qrImageUrl: data.attributes?.next_action?.code?.image_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check payment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
