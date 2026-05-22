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

async function createQrPhPayment(paymentData: PaymentData) {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;

  if (!secretKey || !publicKey) {
    throw new Error("PayMongo public or secret key is missing");
  }

  const amountInCentavos = Math.round(paymentData.amount * 100);

  const intentResponse = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${createAuthHeader(secretKey)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: amountInCentavos,
          currency: paymentData.currency || "PHP",
          payment_method_allowed: ["qrph"],
          description: paymentData.description,
          metadata: {
            referenceId: paymentData.referenceId,
            email: paymentData.email,
            qrPhSourceId: process.env.PAYMONGO_QRPH_SOURCE_ID || "",
          },
        },
      },
    }),
  });

  if (!intentResponse.ok) {
    throw new Error(await readPayMongoError(intentResponse));
  }

  const intentResult = await intentResponse.json();
  const paymentIntent = intentResult.data;

  const methodResponse = await fetch(`${PAYMONGO_API_URL}/payment_methods`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${createAuthHeader(publicKey)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: "qrph",
          billing: {
            name: paymentData.name,
            email: paymentData.email,
            phone: paymentData.phone,
          },
        },
      },
    }),
  });

  if (!methodResponse.ok) {
    throw new Error(await readPayMongoError(methodResponse));
  }

  const methodResult = await methodResponse.json();
  const paymentMethod = methodResult.data;

  const attachResponse = await fetch(
    `${PAYMONGO_API_URL}/payment_intents/${paymentIntent.id}/attach`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${createAuthHeader(publicKey)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethod.id,
            client_key: paymentIntent.attributes.client_key,
          },
        },
      }),
    }
  );

  if (!attachResponse.ok) {
    throw new Error(await readPayMongoError(attachResponse));
  }

  const attachResult = await attachResponse.json();
  const attachedIntent = attachResult.data;
  const qrImageUrl = attachedIntent.attributes?.next_action?.code?.image_url;

  if (!qrImageUrl) {
    throw new Error("QR Ph code was created, but no QR image was returned");
  }

  const paymentResponse: PaymentResponse = {
    id: attachedIntent.id,
    paymentIntentId: attachedIntent.id,
    clientKey: attachedIntent.attributes.client_key,
    amount: paymentData.amount,
    currency: paymentData.currency || "PHP",
    description: paymentData.description,
    status: "pending",
    referenceId: paymentData.referenceId,
    qrImageUrl,
  };

  return paymentResponse;
}

async function createSourcePayment(paymentData: PaymentData) {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is missing");
  }

  const baseUrl = getBaseUrl();
  const amountInCentavos = Math.round(paymentData.amount * 100);

  const sourcePayload = {
    data: {
      attributes: {
        type: paymentData.method,
        amount: amountInCentavos,
        currency: paymentData.currency || "PHP",
        redirect: {
          success: `${baseUrl}/payment/success`,
          failed: `${baseUrl}/payment/failed`,
        },
        billing: {
          name: paymentData.name,
          email: paymentData.email,
          phone: paymentData.phone,
        },
        description: paymentData.description,
        metadata: {
          referenceId: paymentData.referenceId,
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

/**
 * POST /api/payment/create-source
 * Creates GCash/Maya source payments or QR Ph dynamic QR payments.
 */
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

    if (paymentData.method === PAYMENT_METHODS.QRPH) {
      const qrPayment = await createQrPhPayment(paymentData);
      return NextResponse.json(qrPayment);
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
