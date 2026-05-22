import { NextResponse } from "next/server";
import {
  PAYMONGO_API_URL,
  PAYMENT_METHODS,
  type PaymentData,
  type PaymentResponse,
} from "@/lib/payment-config";

function createAuthHeader(apiKey: string) {
  return Buffer.from(`${apiKey}:`).toString("base64");
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL?.replace(/^/, "https://") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function readPayMongoError(response: Response) {
  const errorData = await response.json().catch(() => null);

  return (
    errorData?.errors?.[0]?.detail ||
    errorData?.errors?.[0]?.message ||
    "PayMongo request failed"
  );
}

async function createSourcePayment(paymentData: PaymentData) {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is missing");
  }

  const baseUrl = getBaseUrl();
  const reference = encodeURIComponent(paymentData.referenceId);
  const amountInCentavos = Math.round(paymentData.amount * 100);

  const sourcePayload = {
    data: {
      attributes: {
        type: paymentData.method,
        amount: amountInCentavos,
        currency: paymentData.currency || "PHP",
        redirect: {
          success: `${baseUrl}/payment/success?confirmationNumber=${reference}`,
          failed: `${baseUrl}/payment/failed?confirmationNumber=${reference}`,
        },
        billing: {
          name: paymentData.name,
          email: paymentData.email,
          phone: paymentData.phone,
        },
        description: paymentData.description,
        metadata: {
          referenceId: paymentData.referenceId,
          confirmationNumber: paymentData.referenceId,
          email: paymentData.email,
        },
      },
    },
  };

  const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${createAuthHeader(secretKey)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sourcePayload),
  });

  if (!response.ok) {
    throw new Error(await readPayMongoError(response));
  }

  const result = await response.json();
  const source = result.data;

  const checkoutUrl =
    source.attributes?.checkout_url ||
    source.attributes?.redirect?.checkout_url ||
    `https://checkout.paymongo.com/sources/${source.id}`;

  const paymentResponse: PaymentResponse = {
    id: source.id,
    amount: paymentData.amount,
    currency: paymentData.currency || "PHP",
    description: paymentData.description,
    status: "pending",
    sourceId: source.id,
    referenceId: paymentData.referenceId,
    checkoutUrl,
  };

  return paymentResponse;
}

export async function POST(req: Request) {
  try {
    const paymentData: PaymentData = await req.json();

    if (!paymentData.amount || !paymentData.email || !paymentData.method) {
      return NextResponse.json(
        { error: "Missing required payment fields" },
        { status: 400 }
      );
    }

    if (!Object.values(PAYMENT_METHODS).includes(paymentData.method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const sourcePayment = await createSourcePayment(paymentData);
    return NextResponse.json(sourcePayment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process payment";

    console.error("Payment creation error:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
