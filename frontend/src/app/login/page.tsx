
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Invalid email or password."
        );
      }

      router.push("/pos");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-emerald-800 p-10 text-white md:flex">
          <Link href="/" className="text-2xl font-black">
            FreshCart.
          </Link>

          <div>
            <div className="text-7xl">🛒</div>
            <h1 className="mt-6 text-4xl font-black leading-tight">
              Fresh choices start here.
            </h1>
            <p className="mt-4 leading-7 text-emerald-100">
              Sign in to continue to your FreshCart store experience.
            </p>
          </div>

          <p className="text-sm text-emerald-100">
            Good food. Better living.
          </p>
        </section>

        <section className="p-7 sm:p-12">
          <Link
            href="/"
            className="font-black text-emerald-700 md:hidden"
          >
            FreshCart.
          </Link>

          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-emerald-700">
            Welcome back
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">
            Sign in to FreshCart
          </h2>

          <p className="mt-2 text-slate-600">
            Enter your account details below.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={inputClass}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-700 py-3.5 font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to FreshCart?{" "}
            <Link
              href="/signup"
              className="font-bold text-emerald-700 hover:underline"
            >
              Create an account
            </Link>
          </p>

          <Link
            href="/"
            className="mt-5 block text-center text-sm text-slate-500 transition hover:text-emerald-700"
          >
            ← Back to home
          </Link>
        </section>
      </div>
    </main>
  );
}
