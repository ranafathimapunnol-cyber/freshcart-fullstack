
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Package,
  ReceiptText,
  LogOut,
  Menu,
  X,
  Leaf,
  ArrowUpRight,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { label: "Products & Stock", href: "/products", icon: Package },
  { label: "Bill History", href: "/bills", icon: ReceiptText },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isLandingPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup";

  const activeLink = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch(`${API}/auth/logout/`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Continue to login even if the server is unavailable.
    } finally {
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
    }
  }

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] transition-all duration-200 ${
      activeLink(href)
        ? "bg-[#edf1e6] font-semibold text-[#294b35]"
        : "font-medium text-[#74796e] hover:bg-[#f5f5ef] hover:text-[#294b35]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9e9df] bg-[#faf9f5]/95 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex min-h-[78px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
        {/* Brand */}
        <Link
          href={isLandingPage ? "/" : "/dashboard"}
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#294b35] text-white shadow-sm">
            <Store size={21} strokeWidth={1.9} />
          </span>

          <span>
            <span className="block text-[21px] font-bold tracking-[-0.8px] text-[#25392a]">
              FreshCart<span className="text-[#87965f]">.</span>
            </span>
            <span className="mt-0.5 hidden items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#898b7e] sm:flex">
              <Leaf size={11} className="text-[#87965f]" />
              Fresh choices, every day
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        {isLandingPage ? (
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[#596257] transition hover:bg-[#f0f0e8] hover:text-[#294b35]"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#294b35] px-5 py-3 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#203c2a]"
            >
              Create account
              <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <nav className="hidden items-center gap-1 lg:flex">
              {navigation.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={activeLink(href) ? "page" : undefined}
                  className={linkClass(href)}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="hidden items-center gap-2 rounded-xl border border-[#e5e5da] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#666c61] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 lg:flex"
            >
              <LogOut size={15} />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </>
        )}

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e5da] bg-white text-[#294b35] transition hover:bg-[#f0f0e8] sm:hidden"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-[#e9e9df] bg-[#faf9f5] px-4 py-4 sm:hidden">
          {isLandingPage ? (
            <div className="grid gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-[#596257] transition hover:bg-[#f0f0e8]"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#294b35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#203c2a]"
              >
                Create account
                <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : (
            <nav className="grid gap-1">
              {navigation.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={activeLink(href) ? "page" : undefined}
                  className={linkClass(href)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
                </Link>
              ))}

              <div className="my-2 border-t border-[#e5e5da]" />

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void handleLogout();
                }}
                disabled={loggingOut}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={18} />
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
