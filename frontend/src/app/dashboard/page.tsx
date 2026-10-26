
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ReceiptText,
  LogOut,
  Search,
  Bell,
  TrendingUp,
  IndianRupee,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Clock,
  RefreshCw,
  Menu,
  X,
  UserRound,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type AnyRecord = Record<string, unknown>;

type DashboardData = {
  user: AnyRecord | null;
  products: AnyRecord[];
  bills: AnyRecord[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function getText(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getBillTotal(bill: AnyRecord): number {
  for (const key of [
    "grand_total",
    "total_amount",
    "total",
    "amount",
    "final_amount",
  ]) {
    if (bill[key] !== undefined && bill[key] !== null) {
      return getNumber(bill[key]);
    }
  }

  return 0;
}

function getBillDate(bill: AnyRecord): string {
  const value =
    bill.created_at ?? bill.date ?? bill.created_on ?? bill.bill_date;

  if (!value) return "Date unavailable";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${API}${path}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

function asArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value as AnyRecord[];

  if (value && typeof value === "object") {
    const data = value as AnyRecord;

    if (Array.isArray(data.results)) return data.results as AnyRecord[];
    if (Array.isArray(data.products)) return data.products as AnyRecord[];
    if (Array.isArray(data.bills)) return data.bills as AnyRecord[];
  }

  return [];
}

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData>({
    user: null,
    products: [],
    bills: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        fetchJson("/me/"),
        fetchJson("/products/"),
        fetchJson("/bills/history/"),
      ]);

      const userResult = results[0];
      const productsResult = results[1];
      const billsResult = results[2];

      if (
        userResult.status === "rejected" &&
        String(userResult.reason).includes("401")
      ) {
        router.replace("/login");
        return;
      }

      setData({
        user:
          userResult.status === "fulfilled" &&
          userResult.value &&
          typeof userResult.value === "object"
            ? (userResult.value as AnyRecord)
            : null,
        products:
          productsResult.status === "fulfilled"
            ? asArray(productsResult.value)
            : [],
        bills:
          billsResult.status === "fulfilled"
            ? asArray(billsResult.value)
            : [],
      });

      if (
        productsResult.status === "rejected" &&
        billsResult.status === "rejected"
      ) {
        setError(
          "We couldn't load your products or bills. Check that the backend is running."
        );
      }
    } catch {
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch(`${API}/auth/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Redirect even if the logout endpoint is temporarily unavailable.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const totalSales = data.bills.reduce(
    (sum, bill) => sum + getBillTotal(bill),
    0
  );

  const lowStockProducts = data.products.filter((product) => {
    const stock = getNumber(
      product.stock_quantity ?? product.stock ?? product.quantity
    );
    const threshold = getNumber(product.low_stock_threshold ?? 5);
    return stock <= threshold;
  });

  const filteredBills = data.bills
    .filter((bill) => {
      const query = search.toLowerCase();

      return (
        getText(bill.id, "").toLowerCase().includes(query) ||
        getText(bill.bill_number, "").toLowerCase().includes(query) ||
        getText(bill.customer_name, "").toLowerCase().includes(query)
      );
    })
    .slice(0, 5);

  const displayName =
    getText(data.user?.name, "") ||
    getText(data.user?.first_name, "") ||
    getText(data.user?.username, "") ||
    "there";

  const navigation = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Point of Sale", href: "/pos", icon: ShoppingCart },
    { label: "Products & Stock", href: "/products", icon: Package },
    { label: "Bill History", href: "/bills", icon: ReceiptText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShoppingCart size={21} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">
                FreshCart
              </p>
              <p className="text-xs text-slate-500">Retail management</p>
            </div>
          </Link>

          <button
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/dashboard";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-emerald-600" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <Boxes size={19} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Manage your store
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Keep track of products, sales, and bills in one place.
            </p>
            <Link
              href="/pos"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open POS <ArrowRight size={15} />
            </Link>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={19} />
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-sm text-slate-500">Workspace / Overview</p>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Refresh dashboard"
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={18} />
            </button>

            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={18} />
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="max-w-36 truncate text-sm font-semibold">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">Store account</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
          <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Store overview
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, {displayName}! 👋
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Here&apos;s what&apos;s happening with your store.
              </p>
            </div>

            <Link
              href="/pos"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <ShoppingCart size={18} />
              Start a sale
              <ArrowUpRight size={17} />
            </Link>
          </section>

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={19} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
              <button
                onClick={() => void loadDashboard()}
                className="shrink-0 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total sales"
              value={loading ? "Loading..." : formatCurrency(totalSales)}
              description="Across the bills returned by the API"
              icon={<IndianRupee size={20} />}
              color="emerald"
            />
            <StatCard
              title="Bills created"
              value={loading ? "Loading..." : String(data.bills.length)}
              description="Bills available in history"
              icon={<ReceiptText size={20} />}
              color="blue"
            />
            <StatCard
              title="Products"
              value={loading ? "Loading..." : String(data.products.length)}
              description="Products returned by the API"
              icon={<Package size={20} />}
              color="violet"
            />
            <StatCard
              title="Low-stock items"
              value={loading ? "Loading..." : String(lowStockProducts.length)}
              description="Products at or below their threshold"
              icon={<AlertTriangle size={20} />}
              color="amber"
            />
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold">Recent bills</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your latest available transactions
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search bills..."
                    aria-label="Search bills"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 sm:w-52"
                  />
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[510px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 pr-4 font-semibold">Bill ID</th>
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 pr-4 text-right font-semibold">
                        Amount
                      </th>
                      <th className="pb-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-sm text-slate-500"
                        >
                          Loading bills...
                        </td>
                      </tr>
                    ) : filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <ReceiptText
                            size={27}
                            className="mx-auto text-slate-300"
                          />
                          <p className="mt-3 text-sm font-medium text-slate-700">
                            No bills found
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Create a sale or try another search.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill, index) => (
                        <tr
                          key={String(bill.id ?? index)}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-4 pr-4 text-sm font-semibold text-slate-800">
                            {getText(
                              bill.bill_number,
                              `#${getText(bill.id, String(index + 1))}`
                            )}
                          </td>
                          <td className="py-4 pr-4 text-sm text-slate-500">
                            {getBillDate(bill)}
                          </td>
                          <td className="py-4 pr-4 text-right text-sm font-semibold text-slate-800">
                            {formatCurrency(getBillTotal(bill))}
                          </td>
                          <td className="py-4 text-right">
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              {getText(bill.status, "Recorded")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <Link
                  href="/bills"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all bills <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Stock alerts</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Items that may need restocking
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <p className="py-4 text-sm text-slate-500">
                      Checking inventory...
                    </p>
                  ) : lowStockProducts.length === 0 ? (
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">
                        No low-stock products detected
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        This is based on the stock fields returned by your API.
                      </p>
                    </div>
                  ) : (
                    lowStockProducts.slice(0, 4).map((product, index) => (
                      <div
                        key={String(product.id ?? index)}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {getText(product.name, "Unnamed product")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Stock remaining
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 text-sm font-bold text-amber-800">
                          {getNumber(
                            product.stock_quantity ??
                              product.stock ??
                              product.quantity
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/products"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Manage stock <ArrowRight size={16} />
                </Link>
              </div>

              <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ShoppingCart size={21} />
                </div>
                <h3 className="mt-4 text-lg font-bold">Ready for a sale?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Open the POS to select products and create a new bill.
                </p>
                <Link
                  href="/pos"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-400"
                >
                  Open Point of Sale <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </section>

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <p>FreshCart · Retail management</p>
            <p className="flex items-center gap-1.5">
              <Clock size={13} />
              Dashboard data reflects the latest successful API responses.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber";
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${styles[color]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
