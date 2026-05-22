import { NextResponse } from "next/server";
import {
  PAYMONGO_API_URL,
  PAYMENT_METHODS,
  type PaymentData,
  type PaymentResponse,
} from "@/lib/payment-config";

function getAuthHeader(key: string) {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function paymongoFetch(path: string, key: string, payload?: unknown) {
  const response = await fetch(`${PAYMONGO_API_URL}${path}`, {
    method: payload ? "POST" : "GET",
    headers: {
      Authorization: getAuthHeader(key),
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.detail ||
        result?.errors?.[0]?.code ||
        "PayMongo request failed"
    );
  }

  return result;
}

async function createQrPhPayment(paymentData: PaymentData, secretKey: string) {
  const amount = Math.round(paymentData.amount * 100);

  const intent = await paymongoFetch("/payment_intents", secretKey, {
    data: {
      attributes: {
        amount,
        currency: paymentData.currency || "PHP",
        payment_method_allowed: ["qrph"],
        description: paymentData.description,
        metadata: {
          referenceId: paymentData.referenceId,
          email: paymentData.email,
        },
      },
    },
  });

  const intentId = intent.data.id;
  const clientKey = intent.data.attributes.client_key;

  const method = await paymongoFetch("/payment_methods", secretKey, {
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
  });

  const methodId = method.data.id;

  const attached = await paymongoFetch(
    `/payment_intents/${intentId}/attach`,
    secretKey,
    {
      data: {
        attributes: {
          payment_method: methodId,
          client_key: clientKey,
        },
      },
    }
  );

  const qrImageUrl = attached.data.attributes?.next_action?.code?.image_url;

  if (!qrImageUrl) {
    throw new Error("QR Ph image was not returned by PayMongo");
  }

  const paymentResponse: PaymentResponse = {
    id: intentId,
    paymentIntentId: intentId,
    paymentMethodId: methodId,
    amount: paymentData.amount,
    currency: paymentData.currency || "PHP",
    description: paymentData.description,
    status: "pending",
    referenceId: paymentData.referenceId,
    qrImageUrl,
  };

  return paymentResponse;
}

async function createWalletSource(paymentData: PaymentData, secretKey: string) {
  const baseUrl = getBaseUrl();

  const sourcePayload = {
    data: {
      attributes: {
        type: paymentData.method,
        amount: Math.round(paymentData.amount * 100),
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

  const result = await paymongoFetch("/sources", secretKey, sourcePayload);
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
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYMONGO_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    if (paymentData.method === PAYMENT_METHODS.QRPH) {
      const response = await createQrPhPayment(paymentData, secretKey);
      return NextResponse.json(response);
    }

    if (
      paymentData.method === PAYMENT_METHODS.GCASH ||
      paymentData.method === PAYMENT_METHODS.MAYA
    ) {
      const response = await createWalletSource(paymentData, secretKey);
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: "This payment method is not enabled yet" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
