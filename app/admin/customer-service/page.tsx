"use client";

import { useState } from "react";

export default function CreateCustomerServiceAgentPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function createAgent() {
    const res = await fetch("/api/customer-service/create-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Customer service account created.");

    setFullName("");
    setEmail("");
    setPassword("");
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-xl rounded-3xl bg-zinc-900 p-8">
        <h1 className="text-3xl font-bold">Create Customer Service Agent</h1>
        <p className="mt-2 text-zinc-400">
          Add an agent account that can login to the customer service panel.
        </p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl bg-zinc-800 p-3 outline-none"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <input
            className="w-full rounded-xl bg-zinc-800 p-3 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl bg-zinc-800 p-3 outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={createAgent}
            className="w-full rounded-xl bg-white p-3 font-semibold text-black"
          >
            Create Agent
          </button>
        </div>
      </div>
    </main>
  );
}