import { NextResponse } from "next/server";
import { PAYMONGO_API_URL } from "@/lib/payment-config";

function createAuthHeader(apiKey: string) {
  return Buffer.from(`${apiKey}:`).toString("base64");
}

async function readPayMongoError(response: Response) {
  const errorData = await response.json().catch(() => null);
  return (
    errorData?.errors?.[0]?.detail ||
    errorData?.errors?.[0]?.message ||
    "Failed to fetch payment status"
  );
}

/**
 * GET /api/payment/status?id=
 * Checks payment status from PayMongo Sources or Payment Intents.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    const endpoint = id.startsWith("pi_")
      ? `${PAYMONGO_API_URL}/payment_intents/${id}`
      : `${PAYMONGO_API_URL}/sources/${id}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${createAuthHeader(secretKey)}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: await readPayMongoError(response) },
        { status: response.status }
      );
    }

    const result = await response.json();
    const payment = result.data;
    const attributes = payment.attributes;

    const statusMap: Record<string, string> = {
      pending: "pending",
      active: "pending",
      redirected: "pending",
      awaiting_payment_method: "pending",
      awaiting_next_action: "pending",
      processing: "pending",
      chargeable: "completed",
      succeeded: "completed",
      paid: "completed",
      expired: "failed",
      cancelled: "cancelled",
      failed: "failed",
    };

    return NextResponse.json({
      id: payment.id,
      amount: attributes.amount ? attributes.amount / 100 : 0,
      currency: attributes.currency || "PHP",
      status: statusMap[attributes.status] || "pending",
      sourceStatus: attributes.status,
      type: attributes.type || "qrph",
      billing: attributes.billing,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check payment status";

    console.error("Payment status error:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
