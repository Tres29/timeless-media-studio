"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username === "admin" && password === "admin123") {
      document.cookie =
        "adminAuthenticated=true; path=/; max-age=86400; SameSite=Lax";

      router.push("/admin");
      return;
    }

    setError("Invalid admin username or password.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl"
      >
        <h1 className="mb-2 text-3xl font-bold">Admin Login</h1>
        <p className="mb-6 text-sm text-gray-400">
          Login to manage bookings.
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="mb-4 h-12 w-full rounded-xl border border-gray-700 bg-black px-4 text-white outline-none focus:border-white"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mb-6 h-12 w-full rounded-xl border border-gray-700 bg-black px-4 text-white outline-none focus:border-white"
        />

        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-white font-bold text-black transition hover:bg-gray-200"
        >
          Login
        </button>

        <p className="mt-4 text-xs text-gray-500">
          Default login: admin / admin123
        </p>
      </form>
    </div>
  );
}