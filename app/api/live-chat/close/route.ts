import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type EndedBy = "client" | "agent" | "system";

function getSystemMessage(endedBy: EndedBy, agentName?: string | null) {
  if (endedBy === "agent") {
    return `${agentName || "Agent"} ended the chat. Thank you for contacting support.`;
  }

  if (endedBy === "system") {
    return "No response received. This chat has been ended automatically.";
  }

  return "Client ended the chat. Thank you for contacting support.";
}

export async function POST(req: Request) {
  try {
    const { conversationId, endedBy = "agent", agentName = null } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required." }, { status: 400 });
    }

    if (!["client", "agent", "system"].includes(endedBy)) {
      return NextResponse.json({ error: "Invalid end-chat source." }, { status: 400 });
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

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: existingError?.message || "Conversation not found." },
        { status: 404 }
      );
    }

    if (existing.status !== "closed") {
      await supabaseAdmin.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_type: "system",
        sender_name: "System",
        message: getSystemMessage(endedBy as EndedBy, agentName || existing.assigned_agent_name),
      });

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("chat_conversations")
        .update({
          status: "closed",
          ended_by: endedBy,
          ended_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .select("*")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      await supabaseAdmin.from("chat_typing").delete().eq("conversation_id", conversationId);

      return NextResponse.json({ success: true, conversation: updated });
    }

    await supabaseAdmin.from("chat_typing").delete().eq("conversation_id", conversationId);

    return NextResponse.json({ success: true, conversation: existing });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error while closing chat.",
      },
      { status: 500 }
    );
  }
}
