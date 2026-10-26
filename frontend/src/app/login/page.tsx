
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import {
  Store,
  Leaf,
  ArrowRight,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf9f5] px-4 py-8 sm:px-6 sm:py-12">
      {/* Subtle decorative background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#e8ecdf]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-28 h-96 w-96 rounded-full bg-[#e6eadc]/60 blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#294b35] text-white shadow-lg shadow-[#294b35]/15">
            <Store size={23} strokeWidth={1.9} />
          </span>

          <span>
            <span className="block text-[29px] font-bold tracking-[-1.2px] text-[#25392a]">
              FreshCart<span className="text-[#87965f]">.</span>
            </span>
            <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#898b7e]">
              <Leaf size={11} className="text-[#87965f]" />
              Fresh choices, every day
            </span>
          </span>
        </Link>

        {/* Login card */}
        <section className="rounded-[28px] border border-[#e9e9df] bg-white p-6 shadow-[0_20px_70px_-35px_rgba(41,75,53,0.24)] sm:p-9">
          <div className="mb-7">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#edf1e6] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#294b35]">
              <Leaf size={12} />
              Welcome back
            </span>

            <h1 className="text-[28px] font-bold tracking-[-1px] text-[#25392a]">
              Good to see you.
            </h1>

            <p className="mt-2 text-[13px] leading-6 text-[#85877c]">
              Sign in to continue to your FreshCart account.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Email and password */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[12px] font-semibold text-[#454d43]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96998d]"
                />

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
                  className="w-full rounded-xl border border-[#e5e5da] bg-[#fdfdfa] py-3.5 pl-11 pr-4 text-[13px] text-[#25392a] outline-none transition placeholder:text-[#b1b2a8] focus:border-[#87965f] focus:bg-white focus:ring-4 focus:ring-[#edf1e6] disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-[12px] font-semibold text-[#454d43]"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-[#496c4c] transition hover:text-[#294b35]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96998d]"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-[#e5e5da] bg-[#fdfdfa] py-3.5 pl-11 pr-12 text-[13px] text-[#25392a] outline-none transition placeholder:text-[#b1b2a8] focus:border-[#87965f] focus:bg-white focus:ring-4 focus:ring-[#edf1e6] disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#96998d] transition hover:text-[#294b35]"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#294b35] px-4 py-3.5 text-[13px] font-semibold text-white shadow-md shadow-[#294b35]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#203c2a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to FreshCart"}
              {!loading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#eeeee6]" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[9px] font-semibold tracking-[0.14em] text-[#a0a194]">
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
                  setError(
                    "Google did not return a credential. Please try again."
                  );
                }
              }}
              onError={() => {
                setError(
                  "Google sign-in was unsuccessful. Please try again."
                );
              }}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="320"
            />
          </div>

          {/* Registration link */}
          <p className="mt-7 text-center text-[12px] text-[#85877c]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[#496c4c] transition hover:text-[#294b35]"
            >
              Create an account
            </Link>
          </p>
        </section>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium text-[#929487]">
          <ShieldCheck size={14} className="text-[#87965f]" />
          A fresher way to shop, every day.
        </div>
      </div>
    </main>
  );
}
