"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function CustomerServiceLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/customer-service/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Customer Service Login</h1>
        <p className="mt-2 text-zinc-400">Login to receive client messages.</p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl bg-zinc-800 p-3 outline-none"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl bg-zinc-800 p-3 outline-none"
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full rounded-xl bg-white p-3 font-semibold text-black transition hover:scale-[1.02]"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}