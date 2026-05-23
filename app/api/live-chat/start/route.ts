import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, need } = await req.json();

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

    const selectedNeed = typeof need === "string" && need.trim()
      ? need.trim()
      : "Live Agent";

    console.log("Creating chat conversation for:", { name: name.trim(), email: email?.trim() || null, need: selectedNeed });

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
      console.error("Failed to create conversation:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log("Conversation created:", data.id);

    await supabaseAdmin.from("chat_messages").insert([
      {
        conversation_id: data.id,
        sender_type: "system",
        sender_name: "System",
        message: `Client need/help: ${selectedNeed}`,
      },
      {
        conversation_id: data.id,
        sender_type: "system",
        sender_name: "System",
        message: "You have been added to the live agent queue.",
      },
      {
        conversation_id: data.id,
        sender_type: "system",
        sender_name: "System",
        message: "An agent is expected to join within minutes.",
      },
    ]);

    console.log("System messages added to conversation:", data.id);

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
