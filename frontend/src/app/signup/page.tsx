
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Could not create your account."
        );
      }

      router.push("/pos");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign up. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#dfe3d8] bg-white px-3.5 py-3 text-sm text-[#294b35] placeholder:text-[#9a9e91] outline-none transition focus:border-[#87965f] focus:ring-2 focus:ring-[#87965f]/20";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f5] px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-[#e9e9e0] bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-[#294b35]"
        >
          FreshCart<span className="text-[#87965f]">.</span>
        </Link>

        <div className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#87965f]">
            Join FreshCart
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#294b35]">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-[#777d72]">
            Sign up for your everyday essentials.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#344638]">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#344638]">
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
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#344638]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-[#344638]">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Enter password again"
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
            className="w-full rounded-lg bg-[#294b35] py-3 text-sm font-semibold text-white transition hover:bg-[#203c2a] focus:outline-none focus:ring-2 focus:ring-[#87965f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#777d72]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#294b35] hover:text-[#87965f]"
          >
            Sign in
          </Link>
        </p>

        <Link
          href="/"
          className="mt-4 block text-center text-sm text-[#8a8e82] transition hover:text-[#294b35]"
        >
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
