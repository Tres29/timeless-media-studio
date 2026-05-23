import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin
      .from("chat_conversations")
      .insert({
        customer_name: name.trim(),
        customer_email: email?.trim() || null,
        status: "waiting",
        assigned_agent_id: null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    await supabaseAdmin.from("chat_messages").insert({
      conversation_id: data.id,
      sender_type: "system",
      message: "Client started a live chat.",
    });

    return NextResponse.json({
      success: true,
      conversationId: data.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error while starting chat." },
      { status: 500 }
    );
  }
}