"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Message = {
  id: string;
  conversation_id?: string;
  sender_type: "client" | "agent" | "system";
  sender_name: string | null;
  message: string;
  created_at: string;
};

type ConversationStatus = {
  status: "waiting" | "open" | "closed" | string;
  ended_by?: "client" | "agent" | "system" | string | null;
  assigned_agent_name?: string | null;
};

type ClientNeed = "Cancellation" | "Inquiry" | "General Inquiry" | "Live Agent";


function uniqueMessages(messages: Message[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    const key = message.id || `${message.conversation_id}-${message.sender_type}-${message.created_at}-${message.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const clientNeeds: ClientNeed[] = [
  "Cancellation",
  "Inquiry",
  "General Inquiry",
  "Live Agent",
];

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function TypingDots() {
  return (
    <div className="mt-2 flex items-center gap-1 px-2" aria-label="Agent is typing">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
    </div>
  );
}

export default function LiveChatWidget() {
  const pathname = usePathname();

  const hideWidgetRoutes = [
    "/admin",
    "/dashboard",
    "/customer-service",
    "/customer-service-dashboard",
    "/agent-dashboard",
  ];

  const shouldHideWidget = hideWidgetRoutes.some((route) => pathname.startsWith(route));

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedNeed, setSelectedNeed] = useState<ClientNeed | "">("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatClosed, setChatClosed] = useState(false);
  const [endedBy, setEndedBy] = useState<string | null>(null);
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);

  const detectedAgentName = messages
    .filter((message) => message.sender_type === "agent" && message.sender_name)
    .map((message) => message.sender_name?.trim())
    .find((senderName): senderName is string => Boolean(senderName));

  const displayAgentName = assignedAgentName || detectedAgentName || null;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping, chatClosed]);

  function markChatClosed(status?: ConversationStatus | null) {
    setChatClosed(true);
    setText("");
    setAgentTyping(false);
    setEndedBy(status?.ended_by || "agent");
    if (status?.assigned_agent_name) setAssignedAgentName(status.assigned_agent_name);
  }

  async function startChat() {
    if (!name.trim()) return alert("Please enter your name.");
    if (!selectedNeed) return alert("Please choose what you need help with.");

    setLoading(true);
    setChatClosed(false);
    setEndedBy(null);
    setAssignedAgentName(null);
    setMessages([]);
    setText("");
    setAgentTyping(false);

    const res = await fetch("/api/live-chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim() || null,
        need: selectedNeed,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Failed to start chat.");
      return;
    }

    setConversationId(data.conversationId);
  }

  async function updateTyping(value: string) {
    setText(value);

    if (!conversationId || chatClosed) return;

    await supabaseBrowser.from("chat_typing").upsert({
      conversation_id: conversationId,
      sender_type: "client",
      sender_name: name.trim(),
      is_typing: value.trim().length > 0,
      updated_at: new Date().toISOString(),
    });
  }

  async function sendMessage() {
    if (!text.trim() || !conversationId || chatClosed) return;

    const { data: current } = await supabaseBrowser
      .from("chat_conversations")
      .select("status, ended_by, assigned_agent_name")
      .eq("id", conversationId)
      .single();

    if ((current as ConversationStatus | null)?.status === "closed") {
      markChatClosed(current as ConversationStatus);
      return;
    }

    const messageText = text.trim();
    setText("");

    await supabaseBrowser.from("chat_typing").upsert({
      conversation_id: conversationId,
      sender_type: "client",
      sender_name: name.trim(),
      is_typing: false,
      updated_at: new Date().toISOString(),
    });

    await supabaseBrowser.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "client",
      sender_name: name.trim(),
      message: messageText,
    });
  }

  async function endChat() {
    if (!conversationId || chatClosed) return;

    const res = await fetch("/api/live-chat/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        endedBy: "client",
        agentName: null,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error || "Failed to end chat.");
      return;
    }

    markChatClosed(data.conversation as ConversationStatus);
  }

  function newSession() {
    setConversationId("");
    setMessages([]);
    setText("");
    setChatClosed(false);
    setEndedBy(null);
    setAssignedAgentName(null);
    setAgentTyping(false);
    setSelectedNeed("");
  }

  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;

    async function loadConversation() {
      const [{ data: messageData }, { data: conversationData }] = await Promise.all([
        supabaseBrowser
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
        supabaseBrowser
          .from("chat_conversations")
          .select("status, ended_by, assigned_agent_name")
          .eq("id", conversationId)
          .single(),
      ]);

      if (!mounted) return;

      setMessages(uniqueMessages((messageData as Message[]) || []));
      const status = conversationData as ConversationStatus | null;
      if (status?.assigned_agent_name) setAssignedAgentName(status.assigned_agent_name);
      if (status?.status === "closed") markChatClosed(status);
    }

    void loadConversation();

    const messageChannel = supabaseBrowser
      .channel(`client-chat-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((message) => message.id === (payload.new as Message).id)) return prev;
            return uniqueMessages([...prev, payload.new as Message]);
          });
        }
      )
      .subscribe();

    const conversationChannel = supabaseBrowser
      .channel(`client-chat-status-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as ConversationStatus;
          if (updated.assigned_agent_name) setAssignedAgentName(updated.assigned_agent_name);
          if (updated.status === "closed") markChatClosed(updated);
        }
      )
      .subscribe();

    const typingChannel = supabaseBrowser
      .channel(`client-chat-typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const typing = payload.new as { sender_type?: string; is_typing?: boolean };
          if (typing.sender_type === "agent") setAgentTyping(Boolean(typing.is_typing));
        }
      )
      .subscribe();

    const fallbackStatusCheck = window.setInterval(async () => {
      const { data } = await supabaseBrowser
        .from("chat_conversations")
        .select("status, ended_by, assigned_agent_name")
        .eq("id", conversationId)
        .single();

      const status = data as ConversationStatus | null;
      if (status?.assigned_agent_name) setAssignedAgentName(status.assigned_agent_name);
      if (status?.status === "closed") markChatClosed(status);
    }, 4000);

    return () => {
      mounted = false;
      window.clearInterval(fallbackStatusCheck);
      supabaseBrowser.removeChannel(messageChannel);
      supabaseBrowser.removeChannel(conversationChannel);
      supabaseBrowser.removeChannel(typingChannel);
    };
  }, [conversationId]);

  if (shouldHideWidget) return null;

  const endedText =
    endedBy === "agent"
      ? "The agent ended this chat. Please start a new session if you still need help."
      : endedBy === "system"
        ? "This chat ended automatically because there was no client reply. Please start a new session if you still need help."
        : "This chat session has ended. Please start a new session if you still need help.";

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans sm:bottom-5 sm:right-5">
      {open && (
        <div className="mb-3 max-h-[82vh] w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl sm:w-[380px] md:w-[420px]">
          <div className="bg-black p-4 text-white">
            <h3 className="text-base font-bold sm:text-lg">Timeless Studio Live Chat Support</h3>
            <p className="text-xs text-zinc-300 sm:text-sm">
              Message our customer service team for assistance.
            </p>
          </div>

          {!conversationId ? (
            <div className="space-y-3 p-4">
              <input
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-black outline-none focus:border-black sm:text-base"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-black outline-none focus:border-black sm:text-base"
                placeholder="Email optional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-800">Choose client need / help</p>
                <div className="grid grid-cols-2 gap-2">
                  {clientNeeds.map((need) => (
                    <button
                      key={need}
                      type="button"
                      onClick={() => setSelectedNeed(need)}
                      className={`rounded-xl border p-3 text-sm font-semibold transition ${
                        selectedNeed === need
                          ? "border-black bg-black text-white"
                          : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
                      }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startChat}
                disabled={loading}
                className="w-full rounded-xl bg-black p-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60 sm:text-base"
              >
                {loading ? "Starting..." : "Start Chat"}
              </button>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="mb-3 rounded-2xl bg-zinc-100 p-3 text-xs text-zinc-700">
                <p><strong>Client name:</strong> {name || "Client"}</p>
                <p><strong>Need:</strong> {selectedNeed || "Live Agent"}</p>
                <p><strong>Agent:</strong> {displayAgentName || "Waiting for an agent"}</p>
              </div>

              <div className="h-[48vh] max-h-[360px] min-h-[280px] space-y-2 overflow-y-auto rounded-2xl bg-zinc-50 p-3 text-sm sm:h-80">
                {uniqueMessages(messages).map((msg, index) => (
                  <div key={`${msg.id}-${msg.created_at}-${index}`} className={msg.sender_type === "client" ? "text-right" : "text-left"}>
                    <div
                      className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-left ${
                        msg.sender_type === "client"
                          ? "bg-black text-white"
                          : msg.sender_type === "system"
                            ? "bg-yellow-100 text-black"
                            : "bg-zinc-200 text-black"
                      }`}
                    >
                      <p className="break-words text-sm">
                        <span className="font-semibold">
                          {msg.sender_type === "agent"
                            ? `Agent${msg.sender_name ? `: ${msg.sender_name}` : displayAgentName ? `: ${displayAgentName}` : ""}`
                            : msg.sender_type === "system"
                              ? "System"
                              : `Client: ${msg.sender_name || name || "Client"}`}
                        </span>{" "}
                        {msg.message}
                      </p>

                      <p className="mt-1 text-[10px] opacity-70">{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))}

                {agentTyping && !chatClosed && <TypingDots />}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  disabled={chatClosed}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-300 p-3 text-sm text-black outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                  value={text}
                  onChange={(e) => updateTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void sendMessage();
                  }}
                  placeholder={chatClosed ? "Chat has ended" : "Type message..."}
                />

                <button
                  onClick={sendMessage}
                  disabled={chatClosed || !text.trim()}
                  className="rounded-xl bg-black px-4 text-sm text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                >
                  Send
                </button>
              </div>

              {!chatClosed ? (
                <button onClick={endChat} className="mt-3 w-full rounded-xl bg-red-600 p-3 text-sm font-semibold text-white">
                  End Chat
                </button>
              ) : (
                <>
                  <p className="mt-3 rounded-2xl bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                    {endedText}
                  </p>

                  <button onClick={newSession} className="mt-3 w-full rounded-xl bg-black p-3 text-sm font-semibold text-white">
                    New Session
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close live chat" : "Open live chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl transition hover:scale-105 sm:h-16 sm:w-16"
      >
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
