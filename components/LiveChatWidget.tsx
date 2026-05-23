"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Message = {
  id: string;
  sender_type: "client" | "agent" | "system";
  sender_name: string | null;
  message: string;
  created_at: string;
};

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function TypingDots() {
  return (
    <div className="mt-2 flex items-center gap-1 px-2">
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

  const shouldHideWidget = hideWidgetRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatClosed, setChatClosed] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  if (shouldHideWidget) return null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  async function startChat() {
    if (!name.trim()) return alert("Please enter your name.");

    setLoading(true);
    setChatClosed(false);
    setMessages([]);

    const res = await fetch("/api/live-chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim() || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Failed to start chat.");
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

    await supabaseBrowser.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      sender_name: "System",
      message: "Customer has ended the chat.",
    });

    await supabaseBrowser
      .from("chat_conversations")
      .update({
        status: "closed",
        ended_by: "client",
        ended_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    setChatClosed(true);
    setText("");
  }

  function newSession() {
    setConversationId("");
    setMessages([]);
    setText("");
    setChatClosed(false);
    setAgentTyping(false);
  }

  useEffect(() => {
    if (!conversationId) return;

    supabaseBrowser
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) || []);
      });

    const messageChannel = supabaseBrowser
      .channel(`client-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    const conversationChannel = supabaseBrowser
      .channel(`conversation-status-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new.status === "closed") {
            setChatClosed(true);
          }
        }
      )
      .subscribe();

    const typingChannel = supabaseBrowser
      .channel(`client-typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const typing = payload.new as {
            sender_type: string;
            is_typing: boolean;
          };

          if (typing.sender_type === "agent") {
            setAgentTyping(typing.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(messageChannel);
      supabaseBrowser.removeChannel(conversationChannel);
      supabaseBrowser.removeChannel(typingChannel);
    };
  }, [conversationId]);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans sm:bottom-5 sm:right-5">
      {open && (
        <div className="mb-3 max-h-[82vh] w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl sm:w-[380px] md:w-[420px]">
          <div className="bg-black p-4 text-white">
            <h3 className="text-base font-bold sm:text-lg">
              Timeless Studio Live Chat Support
            </h3>
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
              <div className="h-[48vh] max-h-[360px] min-h-[280px] space-y-2 overflow-y-auto rounded-2xl bg-zinc-50 p-3 text-sm sm:h-80">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.sender_type === "client" ? "text-right" : "text-left"
                    }
                  >
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
                          {msg.sender_name ||
                            (msg.sender_type === "agent"
                              ? "Agent"
                              : msg.sender_type === "system"
                              ? "System"
                              : name)}
                          :
                        </span>{" "}
                        {msg.message}
                      </p>

                      <p className="mt-1 text-[10px] opacity-70">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {agentTyping && !chatClosed && <TypingDots />}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  disabled={chatClosed}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-300 p-3 text-sm text-black outline-none focus:border-black disabled:opacity-50 sm:text-base"
                  value={text}
                  onChange={(e) => updateTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder={chatClosed ? "Chat has ended" : "Type message..."}
                />

                <button
                  onClick={sendMessage}
                  disabled={chatClosed}
                  className="rounded-xl bg-black px-4 text-sm text-white transition hover:scale-105 disabled:opacity-50 sm:text-base"
                >
                  Send
                </button>
              </div>

              {!chatClosed ? (
                <button
                  onClick={endChat}
                  className="mt-3 w-full rounded-xl bg-red-600 p-3 text-sm font-semibold text-white"
                >
                  End Chat
                </button>
              ) : (
                <>
                  <p className="mt-3 text-center text-sm font-medium text-red-500">
                    This chat session has ended.
                  </p>

                  <button
                    onClick={newSession}
                    className="mt-3 w-full rounded-xl bg-black p-3 text-sm font-semibold text-white"
                  >
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