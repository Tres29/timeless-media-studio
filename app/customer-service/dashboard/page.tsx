"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Conversation = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  status: "waiting" | "assigned" | "closed";
  assigned_agent_id: string | null;
  created_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_type: "client" | "agent" | "system";
  sender_name: string | null;
  message: string;
  created_at: string;
};

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
  date: string;
  package_type: string;
  message: string | null;
  confirmation_number: string;
  status: BookingStatus;
  created_at?: string;
};

const CHECK_MESSAGE = "Hi. Just a quick check if we are still connected?";

const AUTO_END_MESSAGE =
  "Since we haven't got any response from you. This chat will automatically ended. Feel free to reach us back again. Thank you for choosing Timeless Studio!";

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

export default function CustomerServiceDashboard() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [agentName, setAgentName] = useState("Agent");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [clientTyping, setClientTyping] = useState(false);

  const [trackerMode, setTrackerMode] = useState<"contact" | "confirmation">(
    "contact"
  );
  const [trackerQuery, setTrackerQuery] = useState("");
  const [bookingResults, setBookingResults] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("pending");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingPackage, setBookingPackage] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, clientTyping]);

  async function loadConversations() {
    const { data } = await supabaseBrowser
      .from("chat_conversations")
      .select("*")
      .order("created_at", { ascending: false });

    setConversations((data as Conversation[]) || []);
  }

  async function acceptChat(chat: Conversation) {
    if (!userId) {
      router.push("/customer-service/login");
      return;
    }

    const { error } = await supabaseBrowser
      .from("chat_conversations")
      .update({
        status: "assigned",
        assigned_agent_id: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", chat.id);

    if (error) return alert(error.message);

    setActive({ ...chat, status: "assigned", assigned_agent_id: userId });
    loadConversations();
  }

  async function updateAgentTyping(value: string) {
    setText(value);

    if (!active || active.status === "closed") return;

    await supabaseBrowser.from("chat_typing").upsert({
      conversation_id: active.id,
      sender_type: "agent",
      sender_name: agentName,
      is_typing: value.trim().length > 0,
      updated_at: new Date().toISOString(),
    });
  }

  async function sendMessage() {
    if (!active || !text.trim() || active.status === "closed") return;

    const messageText = text.trim();
    setText("");

    await supabaseBrowser.from("chat_typing").upsert({
      conversation_id: active.id,
      sender_type: "agent",
      sender_name: agentName,
      is_typing: false,
      updated_at: new Date().toISOString(),
    });

    await supabaseBrowser.from("chat_messages").insert({
      conversation_id: active.id,
      sender_type: "agent",
      sender_id: userId,
      sender_name: agentName,
      message: messageText,
    });
  }

  async function closeChat() {
    if (!active || active.status === "closed") return;

    await supabaseBrowser.from("chat_messages").insert({
      conversation_id: active.id,
      sender_type: "system",
      sender_name: "System",
      message:
        "An agent has ended the chat. Thank you for choosing Timeless Studio!",
    });

    await supabaseBrowser
      .from("chat_conversations")
      .update({
        status: "closed",
        ended_by: "agent",
        ended_at: new Date().toISOString(),
      })
      .eq("id", active.id);

    setActive({ ...active, status: "closed" });
    loadConversations();
  }

  async function autoCloseChat() {
    if (!active || active.status === "closed") return;

    await supabaseBrowser.from("chat_messages").insert({
      conversation_id: active.id,
      sender_type: "system",
      sender_name: "System",
      message: AUTO_END_MESSAGE,
    });

    await supabaseBrowser
      .from("chat_conversations")
      .update({
        status: "closed",
        ended_by: "agent",
        ended_at: new Date().toISOString(),
      })
      .eq("id", active.id);

    setActive({ ...active, status: "closed" });
    loadConversations();
  }

  async function searchBooking() {
    const query = trackerQuery.trim();

    if (!query) {
      alert("Enter email, phone, or confirmation number.");
      return;
    }

    setBookingLoading(true);
    setBookingResults([]);
    setSelectedBooking(null);

    let request = supabaseBrowser.from("bookings").select("*");

    if (trackerMode === "confirmation") {
      request = request.eq("confirmation_number", query);
    } else {
      request = request.or(`email.eq.${query},phone.eq.${query}`);
    }

    const { data, error } = await request.order("created_at", {
      ascending: false,
    });

    setBookingLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setBookingResults((data as Booking[]) || []);
  }

  function selectBooking(booking: Booking) {
    setSelectedBooking(booking);
    setBookingStatus(booking.status);
    setBookingDate(booking.date || "");
    setBookingPackage(booking.package_type || "");
    setBookingMessage(booking.message || "");
  }

  async function updateBooking() {
    if (!selectedBooking) return;

    const { error } = await supabaseBrowser
      .from("bookings")
      .update({
        status: bookingStatus,
        date: bookingDate,
        package_type: bookingPackage,
        message: bookingMessage,
      })
      .eq("id", selectedBooking.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Booking updated.");

    setSelectedBooking({
      ...selectedBooking,
      status: bookingStatus,
      date: bookingDate,
      package_type: bookingPackage,
      message: bookingMessage,
    });

    searchBooking();
  }

  async function cancelBooking() {
    if (!selectedBooking) return;

    const { error } = await supabaseBrowser
      .from("bookings")
      .update({
        status: "cancelled",
      })
      .eq("id", selectedBooking.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Booking cancelled.");

    setBookingStatus("cancelled");
    setSelectedBooking({
      ...selectedBooking,
      status: "cancelled",
    });

    searchBooking();
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push("/customer-service/login");
  }

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/customer-service/login");
        return;
      }

      setUserId(data.user.id);

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .single();

      if (profile?.full_name) setAgentName(profile.full_name);
    });

    loadConversations();

    const channel = supabaseBrowser
      .channel("customer-service-queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
        },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    if (!active) return;

    supabaseBrowser
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", active.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) || []));

    const messageChannel = supabaseBrowser
      .channel(`agent-chat-${active.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${active.id}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    const conversationChannel = supabaseBrowser
      .channel(`agent-conversation-status-${active.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${active.id}`,
        },
        (payload) => {
          if (payload.new.status === "closed") {
            setActive((prev) => (prev ? { ...prev, status: "closed" } : prev));
          }
        }
      )
      .subscribe();

    const typingChannel = supabaseBrowser
      .channel(`agent-typing-${active.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing",
          filter: `conversation_id=eq.${active.id}`,
        },
        (payload) => {
          const typing = payload.new as {
            sender_type: string;
            is_typing: boolean;
          };

          if (typing.sender_type === "client") {
            setClientTyping(typing.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(messageChannel);
      supabaseBrowser.removeChannel(conversationChannel);
      supabaseBrowser.removeChannel(typingChannel);
    };
  }, [active?.id]);

  useEffect(() => {
    if (!active || active.status === "closed") return;

    const interval = setInterval(async () => {
      const currentMessages = messages.filter(
        (msg) => msg.conversation_id === active.id
      );

      const clientMessages = currentMessages.filter(
        (msg) => msg.sender_type === "client"
      );

      if (clientMessages.length === 0) return;

      const lastClientMessage = clientMessages[clientMessages.length - 1];
      const lastClientTime = new Date(lastClientMessage.created_at).getTime();

      const checkMessages = currentMessages.filter(
        (msg) => msg.sender_type === "system" && msg.message === CHECK_MESSAGE
      );

      const latestCheckMessage = checkMessages[checkMessages.length - 1];

      const autoEndMessages = currentMessages.filter(
        (msg) => msg.sender_type === "system" && msg.message === AUTO_END_MESSAGE
      );

      const latestAutoEndMessage = autoEndMessages[autoEndMessages.length - 1];
      const now = Date.now();

      if (
        latestAutoEndMessage &&
        new Date(latestAutoEndMessage.created_at).getTime() > lastClientTime
      ) {
        return;
      }

      if (
        latestCheckMessage &&
        new Date(latestCheckMessage.created_at).getTime() > lastClientTime
      ) {
        const checkTime = new Date(latestCheckMessage.created_at).getTime();

        if (now - checkTime >= 1 * 60 * 1000) {
          await autoCloseChat();
        }

        return;
      }

      if (now - lastClientTime >= 2 * 60 * 1000) {
        await supabaseBrowser.from("chat_messages").insert({
          conversation_id: active.id,
          sender_type: "system",
          sender_name: "System",
          message: CHECK_MESSAGE,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [active, messages]);

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Front Desk </h1>
          <p className="text-zinc-400">Timeless Studio Client Chat</p>
          <p className="mt-1 text-sm text-zinc-500">Logged in as: {agentName}</p>
        </div>

        <button
          onClick={logout}
          className="rounded-xl bg-red-600 px-4 py-2 font-semibold"
        >
          Logout
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
        <aside className="rounded-3xl bg-zinc-900 p-4">
          <h2 className="font-semibold">Client Queue</h2>

          <div className="mt-4 space-y-3">
            {conversations.map((chat) => (
              <div key={chat.id} className="rounded-2xl bg-zinc-800 p-4">
                <button
                  onClick={() => setActive(chat)}
                  className="w-full text-left"
                >
                  <p className="font-semibold">{chat.customer_name}</p>
                  <p className="text-xs text-zinc-400">
                    {chat.customer_email || "No email"}
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${
                      chat.status === "waiting"
                        ? "bg-yellow-500 text-black"
                        : chat.status === "assigned"
                        ? "bg-green-600 text-white"
                        : "bg-zinc-600 text-white"
                    }`}
                  >
                    {chat.status}
                  </span>
                </button>

                {chat.status === "waiting" && (
                  <button
                    onClick={() => acceptChat(chat)}
                    className="mt-3 w-full rounded-xl bg-white p-2 text-sm font-semibold text-black"
                  >
                    Accept & Assign to Me
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl bg-zinc-900 p-4">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold">{active.customer_name}</h2>
                  <p className="text-sm text-zinc-400">
                    {active.customer_email || "No email"}
                  </p>
                  {active.status === "closed" && (
                    <p className="mt-1 text-sm font-medium text-red-400">
                      This chat has ended.
                    </p>
                  )}
                </div>

                <button
                  onClick={closeChat}
                  disabled={active.status === "closed"}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Close Chat
                </button>
              </div>

              <div className="mt-4 h-[500px] space-y-2 overflow-y-auto rounded-2xl bg-zinc-950 p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.sender_type === "agent" ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 text-left ${
                        msg.sender_type === "agent"
                          ? "bg-white text-black"
                          : msg.sender_type === "system"
                          ? "bg-yellow-100 text-black"
                          : "bg-zinc-800 text-white"
                      }`}
                    >
                      <p className="text-sm break-words">
                        <span className="font-semibold">
                          {msg.sender_name ||
                            (msg.sender_type === "agent"
                              ? agentName
                              : msg.sender_type === "system"
                              ? "System"
                              : active.customer_name)}
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

                {clientTyping && active.status !== "closed" && <TypingDots />}

                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  disabled={active.status === "closed"}
                  className="flex-1 rounded-xl bg-zinc-800 p-3 outline-none disabled:opacity-50"
                  value={text}
                  onChange={(e) => updateAgentTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder={
                    active.status === "closed"
                      ? "Chat has ended"
                      : "Reply to client..."
                  }
                />

                <button
                  onClick={sendMessage}
                  disabled={active.status === "closed"}
                  className="rounded-xl bg-white px-6 font-semibold text-black disabled:opacity-50"
                >
                  Send
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="text-lg font-bold">Booking / Reservation Tracker</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Pull up client booking by email, phone, or confirmation number.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                  <select
                    value={trackerMode}
                    onChange={(e) =>
                      setTrackerMode(e.target.value as "contact" | "confirmation")
                    }
                    className="rounded-xl bg-zinc-800 p-3 outline-none"
                  >
                    <option value="contact">Email / Phone</option>
                    <option value="confirmation">Confirmation #</option>
                  </select>

                  <input
                    value={trackerQuery}
                    onChange={(e) => setTrackerQuery(e.target.value)}
                    className="rounded-xl bg-zinc-800 p-3 outline-none"
                    placeholder={
                      trackerMode === "contact"
                        ? "Enter client email or phone"
                        : "Enter confirmation number"
                    }
                  />

                  <button
                    onClick={searchBooking}
                    className="rounded-xl bg-white px-5 font-semibold text-black"
                  >
                    {bookingLoading ? "Searching..." : "Search"}
                  </button>
                </div>

                {bookingResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-zinc-300">
                      Select a booking:
                    </p>

                    {bookingResults.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => selectBooking(booking)}
                        className="w-full rounded-2xl bg-zinc-800 p-4 text-left hover:bg-zinc-700"
                      >
                        <p className="font-semibold">
                          {booking.name} — {booking.confirmation_number}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {booking.email} | {booking.phone}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {booking.package_type} | {booking.date}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-zinc-700 px-3 py-1 text-xs">
                          {booking.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {bookingResults.length === 0 && trackerQuery && !bookingLoading && (
                  <p className="mt-4 text-sm text-zinc-500">
                    No booking selected or no result found.
                  </p>
                )}

                {selectedBooking && (
                  <div className="mt-5 rounded-2xl bg-zinc-900 p-4">
                    <h4 className="font-bold">Booking Details</h4>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-zinc-500">Client Name</p>
                        <p>{selectedBooking.name}</p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500">Confirmation #</p>
                        <p>{selectedBooking.confirmation_number}</p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p>{selectedBooking.email}</p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500">Phone</p>
                        <p>{selectedBooking.phone}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs text-zinc-500">Status</label>
                        <select
                          value={bookingStatus}
                          onChange={(e) =>
                            setBookingStatus(e.target.value as BookingStatus)
                          }
                          className="mt-1 w-full rounded-xl bg-zinc-800 p-3 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="in_process">In Process</option>
                          <option value="for_pick_up">For Pick Up</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-zinc-500">Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-zinc-800 p-3 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-zinc-500">Package</label>
                        <input
                          value={bookingPackage}
                          onChange={(e) => setBookingPackage(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-zinc-800 p-3 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-zinc-500">Message</label>
                        <textarea
                          value={bookingMessage}
                          onChange={(e) => setBookingMessage(e.target.value)}
                          className="mt-1 min-h-24 w-full rounded-xl bg-zinc-800 p-3 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={updateBooking}
                        className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
                      >
                        Update Reservation
                      </button>

                      <button
                        onClick={cancelBooking}
                        disabled={bookingStatus === "cancelled"}
                        className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-[600px] items-center justify-center text-zinc-500">
              Select a client chat.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}