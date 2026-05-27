"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type BookingStatus =
  | "pending"
  | "approved"
  | "in_process"
  | "for_pick_up"
  | "completed"
  | "cancelled";

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  booking_date: string;
  package_type: string;
  message?: string | null;
  confirmation_number: string;
  status: BookingStatus;
  created_at?: string;
  updated_at?: string;
};

type ChatConversation = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  status: "waiting" | "open" | "closed" | string;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string | null;
  created_at: string;
  updated_at?: string | null;
  ended_at?: string | null;
  ended_by?: "client" | "agent" | "system" | string | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_type: "client" | "agent" | "system";
  sender_name: string | null;
  message: string;
  created_at: string;
};

type AiSummary = {
  clientRequest: string;
  conversationSummary: string;
  agentActions: string;
  resolution: string;
};

const statusOptions: BookingStatus[] = [
  "pending",
  "approved",
  "in_process",
  "for_pick_up",
  "completed",
  "cancelled",
];

const FIRST_IDLE_MESSAGE = "Hi. Just a quick check if we are still connected?";
const FINAL_IDLE_MESSAGE = "No response received. This chat will now be ended automatically.";

function cleanClientName(name?: string | null) {
  return (name || "Client")
    .replace(/^waiting\s*[-:|]\s*/i, "")
    .replace(/^\[?waiting\]?\s*/i, "")
    .trim() || "Client";
}


function uniqueMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    const key = message.id || `${message.conversation_id}-${message.sender_type}-${message.created_at}-${message.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getNeedFromMessages(messages: ChatMessage[]) {
  const needMessage = messages.find((message) =>
    message.message.startsWith("Client need/help:")
  );

  return needMessage?.message.replace("Client need/help:", "").trim() || "Live Agent";
}

function summarizeText(items: string[], fallback: string) {
  const cleanItems = items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !item.startsWith("Client need/help:"));

  if (cleanItems.length === 0) return fallback;

  const joined = cleanItems.join(" ");
  return joined.length > 420 ? `${joined.slice(0, 420).trim()}...` : joined;
}

function buildAiSummary(conversation: ChatConversation | null, messages: ChatMessage[]): AiSummary | null {
  if (!conversation || messages.length === 0) return null;

  const clientMessages = messages
    .filter((message) => message.sender_type === "client")
    .map((message) => message.message);

  const agentMessages = messages
    .filter((message) => message.sender_type === "agent")
    .map((message) => message.message);

  const systemMessages = messages
    .filter((message) => message.sender_type === "system")
    .map((message) => message.message);

  const need = getNeedFromMessages(messages);
  const clientName = cleanClientName(conversation.customer_name);
  const agentName = conversation.assigned_agent_name || "the assigned agent";

  const clientRequest = summarizeText(
    clientMessages,
    `${clientName} requested assistance for ${need}.`
  );

  const conversationSummary = [
    `${clientName} selected "${need}" as the reason for contacting support.`,
    clientMessages.length
      ? `Client explained: ${summarizeText(clientMessages, "")}`
      : "Client did not provide additional details after joining the queue.",
    agentMessages.length
      ? `${agentName} responded with: ${summarizeText(agentMessages, "")}`
      : "No agent response was sent before the conversation ended.",
  ].join(" ");

  const agentActions = agentMessages.length
    ? summarizeText(agentMessages, "Agent reviewed the chat and responded to the client.")
    : "No agent action was recorded before the chat ended.";

  let resolution = "No final resolution was confirmed in the conversation.";

  const lowerAgentMessages = agentMessages.join(" ").toLowerCase();
  const lowerSystemMessages = systemMessages.join(" ").toLowerCase();

  if (conversation.ended_by === "client") {
    resolution = "Client ended the chat, so the conversation was disabled and no further replies can be sent.";
  } else if (conversation.ended_by === "system") {
    resolution = "Client did not reply within the automatic no-response window. The system sent follow-up messages and ended the chat.";
  } else if (conversation.ended_by === "agent") {
    resolution = agentMessages.length
      ? "Agent ended the chat after providing assistance based on the conversation."
      : "Agent ended the chat without a recorded reply.";
  }

  if (
    lowerAgentMessages.includes("cancel") ||
    lowerAgentMessages.includes("cancelled") ||
    lowerSystemMessages.includes("cancel")
  ) {
    resolution = "Cancellation support was discussed or offered during the chat.";
  } else if (
    lowerAgentMessages.includes("booking") ||
    lowerAgentMessages.includes("reservation") ||
    lowerAgentMessages.includes("confirmation")
  ) {
    resolution = "Booking or reservation support was provided or offered during the chat.";
  } else if (
    lowerAgentMessages.includes("email") ||
    lowerAgentMessages.includes("call") ||
    lowerAgentMessages.includes("contact")
  ) {
    resolution = "Agent offered follow-up contact or additional support steps.";
  }

  return { clientRequest, conversationSummary, agentActions, resolution };
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function CustomerServiceDashboard() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [agentName, setAgentName] = useState("Agent");
  const [activeTab, setActiveTab] = useState<"chat" | "tracker">("chat");

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [clientTyping, setClientTyping] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentNameInput, setAgentNameInput] = useState("Agent");
  const [savingSettings, setSavingSettings] = useState(false);

  const [searchType, setSearchType] = useState<"email" | "phone" | "confirmation">("confirmation");
  const [searchValue, setSearchValue] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<BookingStatus>("pending");
  const [editPackage, setEditPackage] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const chatIsClosed = selectedConversation?.status === "closed";

  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabaseBrowser
        .from("chat_conversations")
        .select("*")
        .in("status", ["waiting", "open"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load conversations:", error);
      } else {
        // Filter out any closed conversations as a safeguard
        const activeConversations = (data as ChatConversation[]) || [];
        const filtered = activeConversations.filter((conv) => conv.status !== "closed");
        console.log("Active conversations:", filtered.length);
        setConversations(filtered);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedAgentName =
      typeof window !== "undefined" ? localStorage.getItem("timelessAgentName") : null;

    supabaseBrowser.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email;
      const fallbackName = email?.split("@")[0] || "Agent";
      const preferredName = savedAgentName || fallbackName;

      setAgentName(preferredName);
      setAgentNameInput(preferredName);

      if (email) {
        const { data: settings } = await supabaseBrowser
          .from("chat_agent_settings")
          .select("agent_name")
          .eq("agent_email", email)
          .maybeSingle();

        if (settings?.agent_name) {
          setAgentName(settings.agent_name);
          setAgentNameInput(settings.agent_name);
          localStorage.setItem("timelessAgentName", settings.agent_name);
        }
      }
    });

    void loadConversations();

    const channel = supabaseBrowser
      .channel("customer-service-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        (payload) => {
          const newConversation = payload.new as ChatConversation | null;
          const oldConversation = payload.old as ChatConversation | null;
          console.log("Chat conversation changed:", payload);
          // If a conversation was closed, remove it from the list immediately
          if (newConversation?.status === "closed" || oldConversation?.status === "closed") {
            console.log("Conversation closed, removing from list");
            setConversations((prev) => prev.filter((conv) => conv.id !== newConversation?.id));
            // If the closed conversation was selected, show the summary view
            if (selectedConversation?.id === newConversation?.id && newConversation) {
              setSelectedConversation(newConversation);
            }
          } else {
            void loadConversations();
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, clientTyping]);

  async function refreshSelectedConversation(conversationId: string) {
    const { data } = await supabaseBrowser
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (data) {
      const updated = data as ChatConversation;
      setSelectedConversation(updated);
      if (updated.status === "closed") {
        setAiSummary(buildAiSummary(updated, messages));
      }
    }
  }

  async function selectConversation(conversation: ChatConversation) {
    setSelectedConversation(conversation);
    setClientTyping(false);
    setReplyText("");
    setAiSummary(null);

    let currentConversation = conversation;

    if (conversation.status === "waiting" || !conversation.assigned_agent_name) {
      const { data } = await supabaseBrowser
        .from("chat_conversations")
        .update({
          status: "open",
          assigned_agent_name: agentName,
          assigned_agent_id: agentName,
        })
        .eq("id", conversation.id)
        .select("*")
        .single();

      if (data) currentConversation = data as ChatConversation;
      setSelectedConversation(currentConversation);

      const { data: existingJoinMessage } = await supabaseBrowser
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", conversation.id)
        .eq("sender_type", "system")
        .ilike("message", `%${agentName} joined the chat%`)
        .limit(1);

      if (!existingJoinMessage?.length) {
        await supabaseBrowser.from("chat_messages").insert({
          conversation_id: conversation.id,
          sender_type: "system",
          sender_name: "System",
          message: `${agentName} joined the chat and is now assigned to this conversation.`,
        });
      }
    }

    const { data } = await supabaseBrowser
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    const loadedMessages = uniqueMessages((data as ChatMessage[]) || []);
    setMessages(loadedMessages);

    if (currentConversation.status === "closed") {
      setAiSummary(buildAiSummary(currentConversation, loadedMessages));
    }
  }

  useEffect(() => {
    if (!selectedConversation?.id) return;

    const messageChannel = supabaseBrowser
      .channel(`agent-messages-${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => uniqueMessages([...prev, payload.new as ChatMessage]));
        }
      )
      .subscribe();

    const conversationChannel = supabaseBrowser
      .channel(`agent-conversation-${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const updated = payload.new as ChatConversation;
          setSelectedConversation(updated);
          if (updated.status === "closed") {
            setReplyText("");
            setClientTyping(false);
          }
        }
      )
      .subscribe();

    const typingChannel = supabaseBrowser
      .channel(`agent-typing-${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const typing = payload.new as { sender_type?: string; is_typing?: boolean };
          if (typing.sender_type === "client") setClientTyping(Boolean(typing.is_typing));
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(messageChannel);
      supabaseBrowser.removeChannel(conversationChannel);
      supabaseBrowser.removeChannel(typingChannel);
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation?.status === "closed") {
      setAiSummary(buildAiSummary(selectedConversation, messages));
    }
  }, [messages, selectedConversation]);

  useEffect(() => {
    if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current);
    if (!selectedConversation || selectedConversation.status === "closed") return;

    const nonSystemMessages = messages.filter((message) => message.sender_type !== "system");
    const lastNonSystemMessage = nonSystemMessages[nonSystemMessages.length - 1];

    if (!lastNonSystemMessage || lastNonSystemMessage.sender_type !== "agent") return;

    const hasFirstWarning = messages.some((message) => message.message === FIRST_IDLE_MESSAGE);
    const hasFinalWarning = messages.some((message) => message.message === FINAL_IDLE_MESSAGE);
    const lastAgentTime = new Date(lastNonSystemMessage.created_at).getTime();
    const now = Date.now();

    async function insertSystemMessage(message: string) {
      if (!selectedConversation) return;
      await supabaseBrowser.from("chat_messages").insert({
        conversation_id: selectedConversation.id,
        sender_type: "system",
        sender_name: "System",
        message,
      });
    }

    async function autoCloseChat() {
      if (!selectedConversation) return;

      const res = await fetch("/api/live-chat/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          endedBy: "system",
          agentName,
        }),
      });

      if (!res.ok) {
        await insertSystemMessage(FINAL_IDLE_MESSAGE);
      }

      await refreshSelectedConversation(selectedConversation.id);
      await loadConversations();
    }

    if (!hasFirstWarning) {
      const remaining = Math.max(0, lastAgentTime + 120000 - now);
      autoEndTimerRef.current = setTimeout(() => {
        void insertSystemMessage(FIRST_IDLE_MESSAGE);
      }, remaining);
      return;
    }

    if (!hasFinalWarning) {
      const remaining = Math.max(0, lastAgentTime + 180000 - now);
      autoEndTimerRef.current = setTimeout(() => {
        void autoCloseChat();
      }, remaining);
    }

    return () => {
      if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current);
    };
  }, [messages, selectedConversation]);

  async function updateAgentTyping(value: string) {
    setReplyText(value);
    if (!selectedConversation || selectedConversation.status === "closed") return;

    await supabaseBrowser.from("chat_typing").upsert({
      conversation_id: selectedConversation.id,
      sender_type: "agent",
      sender_name: agentName,
      is_typing: value.trim().length > 0,
      updated_at: new Date().toISOString(),
    });
  }

  async function sendReply() {
    if (!selectedConversation || !replyText.trim() || sendingReply || chatIsClosed) return;

    setSendingReply(true);
    const message = replyText.trim();
    setReplyText("");

    if (selectedConversation.status === "waiting" || !selectedConversation.assigned_agent_name) {
      const { data: reassigned } = await supabaseBrowser
        .from("chat_conversations")
        .update({
          status: "open",
          assigned_agent_name: agentName,
          assigned_agent_id: agentName,
        })
        .eq("id", selectedConversation.id)
        .select("*")
        .single();

      if (reassigned) {
        setSelectedConversation(reassigned as ChatConversation);
      }
    }

    await supabaseBrowser.from("chat_typing").upsert({
      conversation_id: selectedConversation.id,
      sender_type: "agent",
      sender_name: agentName,
      is_typing: false,
      updated_at: new Date().toISOString(),
    });

    const { error } = await supabaseBrowser.from("chat_messages").insert({
      conversation_id: selectedConversation.id,
      sender_type: "agent",
      sender_name: agentName,
      message,
    });

    if (error) alert(error.message);
    await loadConversations();
    setSendingReply(false);
  }

  async function closeChat() {
    if (!selectedConversation) return;

    if (selectedConversation.status === "closed") {
      setSelectedConversation(null);
      setMessages([]);
      setReplyText("");
      setAiSummary(null);
      await loadConversations();
      return;
    }

    const confirmed = window.confirm("End this live chat conversation?");
    if (!confirmed) return;

    const res = await fetch("/api/live-chat/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selectedConversation.id,
        endedBy: "agent",
        agentName,
      }),
    });

    const result = await res.json().catch(() => null);

    if (!res.ok) {
      alert(result?.error || "Failed to close chat. Please try again.");
      return;
    }

    const updated = (result?.conversation as ChatConversation) || {
      ...selectedConversation,
      status: "closed",
      ended_by: "agent",
      ended_at: new Date().toISOString(),
    };

    const closedConversationMessages = [
      ...messages,
      {
        id: "agent-ended-local",
        conversation_id: selectedConversation.id,
        sender_type: "system" as const,
        sender_name: "System",
        message: `${agentName || "Agent"} ended the chat. Thank you for contacting support.`,
        created_at: new Date().toISOString(),
      },
    ];

    setSelectedConversation(updated);
    setAiSummary(buildAiSummary(updated, closedConversationMessages));
    setConversations((prev) => prev.filter((conv) => conv.id !== updated.id));
    setReplyText("");
    setClientTyping(false);
    await loadConversations();
  }

  async function searchBooking(event?: FormEvent) {
    event?.preventDefault();
    if (!searchValue.trim()) return alert("Please enter email, phone, or confirmation number.");

    setLoading(true);
    setSelectedBooking(null);
    setBookings([]);

    try {
      const params = new URLSearchParams();
      if (searchType === "confirmation") params.set("confirmationNumber", searchValue.trim());
      if (searchType === "email") params.set("email", searchValue.trim());
      if (searchType === "phone") params.set("phone", searchValue.trim());

      const res = await fetch(`/api/bookings?${params.toString()}`, { method: "GET", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "No booking found.");

      const list = Array.isArray(data) ? data : [data];
      setBookings(list);
      if (list.length === 1) selectBooking(list[0]);
    } catch {
      alert("Failed to search booking.");
    } finally {
      setLoading(false);
    }
  }

  function selectBooking(booking: Booking) {
    setSelectedBooking(booking);
    setEditStatus(booking.status || "pending");
    setEditPackage(booking.package_type || "");
    setEditMessage(booking.message || "");
    setIsEditing(false);
  }

  async function updateBooking(statusOverride?: BookingStatus) {
    if (!selectedBooking) return;
    setSaving(true);

    try {
      const finalStatus = statusOverride || editStatus;
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: finalStatus,
          packageType: editPackage,
          message: editMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Failed to update booking.");

      setSelectedBooking(data);
      setEditStatus(data.status);
      setEditPackage(data.package_type || "");
      setEditMessage(data.message || "");
      setIsEditing(false);
      setBookings((prev) => prev.map((booking) => (booking.id === data.id ? data : booking)));

      if (finalStatus === "cancelled") alert("Booking cancelled. Cancellation email sent.");
      else if (finalStatus === "approved") alert("Booking approved. Approval email sent.");
      else alert("Booking updated.");
    } catch {
      alert("Something went wrong while updating booking.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking() {
    if (!selectedBooking) return;
    if (selectedBooking.status === "completed" || selectedBooking.status === "in_process") {
      alert("This booking can no longer be cancelled.");
      return;
    }
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    await updateBooking("cancelled");
  }

  async function approveBooking() {
    if (!selectedBooking) return;
    await updateBooking("approved");
  }

  async function saveAgentSettings() {
    const nextName = agentNameInput.trim() || "Agent";
    setSavingSettings(true);

    try {
      setAgentName(nextName);
      localStorage.setItem("timelessAgentName", nextName);

      const { data } = await supabaseBrowser.auth.getUser();
      const email = data.user?.email || `${nextName.toLowerCase().replaceAll(" ", ".")}@local.agent`;

      await supabaseBrowser.from("chat_agent_settings").upsert({
        agent_email: email,
        agent_name: nextName,
        updated_at: new Date().toISOString(),
      });

      if (selectedConversation && selectedConversation.status !== "closed") {
        const { data: updatedConversation } = await supabaseBrowser
          .from("chat_conversations")
          .update({
            assigned_agent_name: nextName,
            assigned_agent_id: nextName,
          })
          .eq("id", selectedConversation.id)
          .select("*")
          .single();

        if (updatedConversation) {
          setSelectedConversation(updatedConversation as ChatConversation);
        }
      }

      setSettingsOpen(false);
      alert("Agent settings saved.");
    } catch {
      alert("Agent name saved locally. Run the SQL migration to save it in Supabase.");
    } finally {
      setSavingSettings(false);
    }
  }

  function logout() {
    void supabaseBrowser.auth.signOut();
    router.push("/customer-service/login");
  }

  const needLabel = useMemo(() => getNeedFromMessages(messages), [messages]);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-400">Timeless Media Studio</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Customer Service Dashboard</h1>
            <p className="mt-2 text-neutral-400">Live chat support and booking tracker in one dashboard.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setSettingsOpen((value) => !value)} className="rounded-2xl border border-white/10 px-5 py-3 font-semibold transition hover:border-yellow-400">
              Settings
            </button>
            <button onClick={logout} className="rounded-2xl border border-white/10 px-5 py-3 font-semibold transition hover:border-yellow-400">
              Logout
            </button>
          </div>
        </header>

        {settingsOpen ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-bold">Dashboard Settings</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Change the agent display name used for new replies and assigned chats.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={agentNameInput}
                onChange={(e) => setAgentNameInput(e.target.value)}
                placeholder="Agent name"
                className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
              />
              <button
                onClick={() => void saveAgentSettings()}
                disabled={savingSettings}
                className="rounded-2xl bg-yellow-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save Agent Name"}
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`rounded-2xl px-5 py-3 font-semibold transition ${activeTab === "chat" ? "bg-yellow-400 text-black" : "border border-white/10 bg-white/[0.04]"}`}
          >
            Live Chat Support
          </button>
          <button
            onClick={() => setActiveTab("tracker")}
            className={`rounded-2xl px-5 py-3 font-semibold transition ${activeTab === "tracker" ? "bg-yellow-400 text-black" : "border border-white/10 bg-white/[0.04]"}`}
          >
            Booking / Reservation Tracker
          </button>
        </div>

        {activeTab === "chat" ? (
          <section className="grid h-[720px] max-h-[720px] min-h-0 gap-6 xl:grid-cols-[320px_340px_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-bold">AI Summary</h2>
              <p className="mt-1 text-sm text-neutral-400">Shows after a chat ends. Resets when agent closes the chat card.</p>

              {aiSummary ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Client Request</p>
                    <p className="mt-2 text-sm text-neutral-100">{aiSummary.clientRequest}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Whole Conversation</p>
                    <p className="mt-2 text-sm text-neutral-100">{aiSummary.conversationSummary}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Agent Did</p>
                    <p className="mt-2 text-sm text-neutral-100">{aiSummary.agentActions}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Resolution Offered</p>
                    <p className="mt-2 text-sm text-neutral-100">{aiSummary.resolution}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-neutral-400">
                  No ended chat summary yet.
                </div>
              )}
            </aside>

            <aside className="min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Active Chats</h2>
                <button onClick={() => void loadConversations()} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-yellow-400">
                  Refresh
                </button>
              </div>

              {chatLoading ? <p className="text-neutral-400">Loading chats...</p> : null}
              {!chatLoading && conversations.length === 0 ? <p className="text-neutral-400">No active live chats.</p> : null}

              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => void selectConversation(conversation)}
                    className={`w-full rounded-2xl border p-4 text-left transition hover:border-yellow-400 ${selectedConversation?.id === conversation.id ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-black/30"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{cleanClientName(conversation.customer_name)}</p>
                      <span className={`rounded-full px-2 py-1 text-xs ${conversation.status === "waiting" ? "bg-yellow-400/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}>
                        {conversation.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-neutral-400">{conversation.customer_email || "No email"}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {conversation.assigned_agent_name ? `Assigned to ${conversation.assigned_agent_name}` : conversation.status === "open" ? "Assigned" : "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">{new Date(conversation.created_at).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </aside>

            <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              {selectedConversation ? (
                <>
                  <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-xl font-bold">Chat</h2>
                      <p className="text-sm text-neutral-300">Agent Name: <span className="font-semibold text-white">{agentName}</span></p>
                      <p className="text-sm text-neutral-300">Client Name: <span className="font-semibold text-white">{cleanClientName(selectedConversation.customer_name)}</span></p>
                      <p className="text-sm text-neutral-400">Need: {needLabel}</p>
                      <p className="text-sm text-neutral-400">Assigned Agent: {selectedConversation.assigned_agent_name || agentName}</p>
                      {chatIsClosed ? <p className="mt-1 text-sm font-semibold text-red-300">Conversation has ended.</p> : null}
                    </div>
                    <button onClick={() => void closeChat()} className="rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white disabled:opacity-50">
                      {chatIsClosed ? "Close Chat & Reset Summary" : "End Chat"}
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
                    {uniqueMessages(messages).map((message, index) => (
                      <div key={`${message.id}-${message.created_at}-${index}`} className={`flex ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender_type === "agent" ? "bg-yellow-400 text-black" : message.sender_type === "system" ? "bg-blue-500/20 text-blue-100" : "bg-black/50 text-white"}`}>
                          {message.sender_type !== "system" ? (
                            <p className="text-xs opacity-70">
                              {message.sender_type === "agent" ? `Agent Name: ${message.sender_name || agentName}` : `Client Name: ${message.sender_name || cleanClientName(selectedConversation.customer_name)}`}
                            </p>
                          ) : <p className="text-xs opacity-70">System</p>}
                          <p className="break-words">{message.message}</p>
                          <p className="mt-1 text-right text-[10px] opacity-60">{formatTime(message.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {clientTyping && !chatIsClosed ? <TypingDots /> : null}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-white/10 p-4">
                    <div className="flex gap-3">
                      <input
                        value={replyText}
                        onChange={(e) => void updateAgentTyping(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void sendReply();
                        }}
                        disabled={chatIsClosed}
                        placeholder={chatIsClosed ? "Chat disabled" : "Type your reply..."}
                        className="flex-1 rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <button
                        onClick={() => void sendReply()}
                        disabled={sendingReply || !replyText.trim() || chatIsClosed}
                        className="rounded-2xl bg-yellow-400 px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-neutral-400">
                  Select a live chat conversation to start supporting the client.
                </div>
              )}
            </section>
          </section>
        ) : (
          <BookingTracker
            searchType={searchType}
            setSearchType={setSearchType}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            searchBooking={searchBooking}
            bookings={bookings}
            selectedBooking={selectedBooking}
            selectBooking={selectBooking}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            loading={loading}
            saving={saving}
            editStatus={editStatus}
            setEditStatus={setEditStatus}
            editPackage={editPackage}
            setEditPackage={setEditPackage}
            editMessage={editMessage}
            setEditMessage={setEditMessage}
            updateBooking={updateBooking}
            approveBooking={approveBooking}
            cancelBooking={cancelBooking}
          />
        )}
      </section>
    </main>
  );
}

function BookingTracker(props: {
  searchType: "email" | "phone" | "confirmation";
  setSearchType: (value: "email" | "phone" | "confirmation") => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchBooking: (event?: FormEvent) => Promise<void>;
  bookings: Booking[];
  selectedBooking: Booking | null;
  selectBooking: (booking: Booking) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  loading: boolean;
  saving: boolean;
  editStatus: BookingStatus;
  setEditStatus: (value: BookingStatus) => void;
  editPackage: string;
  setEditPackage: (value: string) => void;
  editMessage: string;
  setEditMessage: (value: string) => void;
  updateBooking: (statusOverride?: BookingStatus) => Promise<void>;
  approveBooking: () => Promise<void>;
  cancelBooking: () => Promise<void>;
}) {
  return (
    <section className="space-y-6">
      <form onSubmit={props.searchBooking} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
        <div className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
          <select
            value={props.searchType}
            onChange={(e) => props.setSearchType(e.target.value as "email" | "phone" | "confirmation")}
            className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
          >
            <option value="confirmation">Confirmation Number</option>
            <option value="email">Email</option>
            <option value="phone">Phone Number</option>
          </select>
          <input
            value={props.searchValue}
            onChange={(e) => props.setSearchValue(e.target.value)}
            placeholder="Enter search value"
            className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-neutral-500"
          />
          <button type="submit" disabled={props.loading} className="rounded-2xl bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:scale-[1.02] disabled:opacity-60">
            {props.loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {props.bookings.length > 1 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-xl font-semibold">Matching Bookings</h2>
          <div className="grid gap-3">
            {props.bookings.map((booking) => (
              <button key={booking.id} onClick={() => props.selectBooking(booking)} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-yellow-400">
                <p className="font-semibold">{booking.name}</p>
                <p className="text-sm text-neutral-400">{booking.email}</p>
                <p className="text-sm text-neutral-400">{booking.confirmation_number}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {props.selectedBooking && (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <h2 className="text-2xl font-bold">Reservation Details</h2>
                <p className="text-neutral-400">{props.selectedBooking.confirmation_number}</p>
              </div>
              <StatusPill status={props.selectedBooking.status} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Name" value={props.selectedBooking.name} />
              <Info label="Email" value={props.selectedBooking.email} />
              <Info label="Phone" value={props.selectedBooking.phone} />
              <Info label="Reservation Date" value={props.selectedBooking.booking_date ? new Date(props.selectedBooking.booking_date).toLocaleDateString() : "N/A"} />
              <Info label="Package Selected" value={props.selectedBooking.package_type} />
              <Info label="Created" value={props.selectedBooking.created_at ? new Date(props.selectedBooking.created_at).toLocaleString() : "N/A"} />
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-neutral-400">Message</p>
              <p className="mt-2 text-white">{props.selectedBooking.message || "No message provided."}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold">Actions</h2>
            {!props.isEditing ? (
              <div className="mt-6 grid gap-3">
                <button onClick={() => props.setIsEditing(true)} className="rounded-2xl border border-white/10 px-5 py-3 font-semibold transition hover:border-yellow-400">Update Booking</button>
                <button onClick={() => void props.approveBooking()} disabled={props.saving || props.selectedBooking.status === "approved"} className="rounded-2xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50">Approve Booking</button>
                <button onClick={() => void props.cancelBooking()} disabled={props.saving || props.selectedBooking.status === "cancelled" || props.selectedBooking.status === "completed" || props.selectedBooking.status === "in_process"} className="rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400">Cancel Booking</button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <label className="block text-sm text-neutral-400">Status</label>
                <select value={props.editStatus} onChange={(e) => props.setEditStatus(e.target.value as BookingStatus)} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none">
                  {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ").toUpperCase()}</option>)}
                </select>
                <label className="block text-sm text-neutral-400">Package</label>
                <input value={props.editPackage} onChange={(e) => props.setEditPackage(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none" />
                <label className="block text-sm text-neutral-400">Message</label>
                <textarea value={props.editMessage} onChange={(e) => props.setEditMessage(e.target.value)} rows={5} className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={() => void props.updateBooking()} disabled={props.saving} className="rounded-2xl bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:scale-[1.02] disabled:opacity-60">{props.saving ? "Saving..." : "Save Changes"}</button>
                  <button onClick={() => props.setIsEditing(false)} disabled={props.saving} className="rounded-2xl border border-white/10 px-5 py-3 font-semibold transition hover:border-yellow-400">Cancel Edit</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
    </div>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${status === "approved" ? "bg-green-500/20 text-green-300" : status === "cancelled" ? "bg-red-500/20 text-red-300" : status === "completed" ? "bg-blue-500/20 text-blue-300" : "bg-yellow-500/20 text-yellow-300"}`}>
      {status.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-1 break-words font-semibold text-white">{value || "N/A"}</p>
    </div>
  );
}
