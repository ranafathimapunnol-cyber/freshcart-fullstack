"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            data.message ||
            "Invalid email or password. Please try again."
        );
      }

      router.replace("/pos");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            data.message ||
            "Google sign-in failed. Please try again."
        );
      }

      router.replace("/pos");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in with Google."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-2xl font-bold text-white shadow-sm">
            F
          </div>

          <span className="text-3xl font-bold tracking-tight text-slate-900">
            Fresh<span className="text-green-600">Cart</span>
          </span>
        </Link>

        {/* Login card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to your account to continue shopping.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Email and password */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:opacity-60"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-green-700 transition hover:text-green-800"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium text-slate-500">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Google sign-in */}
          <div className="flex min-h-10 justify-center">
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) {
                  void handleGoogleSuccess(response.credential);
                } else {
                  setError("Google did not return a credential. Please try again.");
                }
              }}
              onError={() => {
                setError("Google sign-in was unsuccessful. Please try again.");
              }}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="320"
            />
          </div>

          <p className="mt-7 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-green-700 transition hover:text-green-800"
            >
              Create an account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Fresh choices, every day. 🥬
        </p>
      </div>
    </main>
  );
}