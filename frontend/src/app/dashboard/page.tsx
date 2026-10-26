
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type Product = {
  id: number;
  name: string;
  price: number | string;
  stock?: number;
  quantity?: number;
};

type Bill = {
  id: number | string;
  total?: number | string;
  total_amount?: number | string;
  created_at?: string;
  date?: string;
};

type User = {
  name?: string;
  first_name?: string;
  username?: string;
  email?: string;
};

function money(value: number | string | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function listFrom<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }

  return [];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const options = {
          credentials: "include" as RequestCredentials,
          cache: "no-store" as RequestCache,
          signal: controller.signal,
        };

        const [meResponse, productsResponse, billsResponse] =
          await Promise.all([
            fetch(`${API}/me/`, options),
            fetch(`${API}/products/`, options),
            fetch(`${API}/bills/`, options),
          ]);

        if (
          meResponse.status === 401 ||
          meResponse.status === 403
        ) {
          window.location.replace("/login");
          return;
        }

        if (meResponse.ok) {
          setUser(await meResponse.json());
        }

        if (productsResponse.ok) {
          setProducts(
            listFrom<Product>(await productsResponse.json())
          );
        }

        if (billsResponse.ok) {
          setBills(listFrom<Bill>(await billsResponse.json()));
        }

        if (!productsResponse.ok && !billsResponse.ok) {
          setError(
            "We couldn't load your store data. Please try again."
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          "Unable to connect to FreshCart. Check that the backend is running."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, []);

  const stockCount = products.reduce(
    (sum, product) =>
      sum + Number(product.stock ?? product.quantity ?? 0),
    0
  );

  const revenue = bills.reduce(
    (sum, bill) =>
      sum + Number(bill.total_amount ?? bill.total ?? 0),
    0
  );

  const displayName =
    user?.first_name || user?.name || user?.username || "Store owner";

  const stats = [
    {
      label: "Total products",
      value: products.length.toLocaleString("en-IN"),
      hint: "Products in your catalogue",
      icon: Package,
      tone: "bg-[#edf2e5] text-[#49633c]",
    },
    {
      label: "Stock units",
      value: stockCount.toLocaleString("en-IN"),
      hint: "Units across your products",
      icon: Boxes,
      tone: "bg-[#eaf0e9] text-[#365c46]",
    },
    {
      label: "Bills created",
      value: bills.length.toLocaleString("en-IN"),
      hint: "Bills available in history",
      icon: ReceiptText,
      tone: "bg-[#f0eee4] text-[#797044]",
    },
    {
      label: "Recorded sales",
      value: money(revenue),
      hint: "Total of bills currently loaded",
      icon: CircleDollarSign,
      tone: "bg-[#e7eee7] text-[#294b35]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#faf9f5] text-[#26372b]">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#294b35] px-6 py-8 text-white shadow-lg shadow-[#294b35]/10 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/[0.06]" />
          <div className="pointer-events-none absolute bottom-0 right-44 h-40 w-40 rounded-full bg-[#87965f]/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[#e0e7d4]">
                <Sparkles size={13} />
                YOUR STORE AT A GLANCE
              </span>

              <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Welcome back, {displayName}!
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#e0e7d4]">
                A little overview of your store, your products, and
                everything happening at FreshCart.
              </p>
            </div>

            <Link
              href="/pos"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#d9e2c5] px-5 py-3.5 text-sm font-bold text-[#294b35] transition hover:-translate-y-0.5 hover:bg-white"
            >
              <ShoppingCart size={17} />
              Open Point of Sale
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-[#e5d9b8] bg-[#f7f1df] p-4 text-sm text-[#765c2e]">
            {error}
          </div>
        )}

        {/* Store overview */}
        <section className="mt-9">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718052]">
                STORE OVERVIEW
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#294b35] sm:text-3xl">
                The big picture.
              </h2>
              <p className="mt-2 text-sm text-[#7a8277]">
                Your daily store activity at a glance.
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#e4e7dd] bg-white px-3 py-1.5 text-[11px] font-medium text-[#687566]">
              {loading ? "Updating…" : "Live API data"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, hint, icon: Icon, tone }) => (
              <article
                key={label}
                className="rounded-2xl border border-[#e8e9df] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#cbd5bf] hover:shadow-md sm:rounded-3xl sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight size={17} className="text-[#b3bbae]" />
                </div>

                <p className="mt-5 text-sm font-medium text-[#788174]">
                  {label}
                </p>

                <p className="mt-2 break-words text-2xl font-bold tracking-tight text-[#294b35] sm:text-3xl">
                  {loading ? "—" : value}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#92988e]">
                  {hint}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Products and quick actions */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="overflow-hidden rounded-3xl border border-[#e8e9df] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-[#eeefe8] px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-lg font-bold text-[#294b35]">
                  Recent products
                </h2>
                <p className="mt-1 text-sm text-[#82897d]">
                  A quick look at your catalogue
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-bold text-[#526b43] transition hover:text-[#294b35]"
              >
                View all <ArrowRight size={15} />
              </Link>
            </div>

            {loading && products.length === 0 ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex animate-pulse gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[#eff1e9]" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-1/2 rounded bg-[#eff1e9]" />
                      <div className="h-3 w-1/4 rounded bg-[#f4f4ef]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf2e5] text-[#61764d]">
                  <Package size={26} />
                </span>

                <p className="mt-4 font-bold text-[#294b35]">
                  No products to show yet
                </p>

                <p className="mt-1 text-sm text-[#82897d]">
                  Start by adding products to your catalogue.
                </p>

                <Link
                  href="/products"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#294b35] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3c6247]"
                >
                  Add your first product <Plus size={15} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0e9]">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#fafbf7] sm:px-7"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf2e5] text-[#526b43]">
                        <Package size={19} strokeWidth={1.8} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#334638]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-[#899084]">
                          Stock:{" "}
                          {Number(product.stock ?? product.quantity ?? 0)}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-[#294b35]">
                      {money(product.price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-3xl border border-[#e8e9df] bg-white p-5 shadow-sm sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718052]">
              QUICK ACTIONS
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#294b35]">
              What’s next?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#82897d]">
              Everything you need to keep your store moving.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/pos"
                className="group flex items-center gap-4 rounded-2xl border border-[#e8e9df] p-4 transition hover:border-[#cbd5bf] hover:bg-[#f7f9f2]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf2e5] text-[#49633c]">
                  <ShoppingCart size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#344638]">
                    New sale
                  </span>
                  <span className="mt-1 block text-xs text-[#899084]">
                    Open the checkout counter
                  </span>
                </span>

                <ArrowRight
                  size={17}
                  className="text-[#a5ad9d] transition group-hover:translate-x-1 group-hover:text-[#526b43]"
                />
              </Link>

              <Link
                href="/products"
                className="group flex items-center gap-4 rounded-2xl border border-[#e8e9df] p-4 transition hover:border-[#cbd5bf] hover:bg-[#f7f9f2]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf0e9] text-[#365c46]">
                  <Package size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#344638]">
                    Manage products
                  </span>
                  <span className="mt-1 block text-xs text-[#899084]">
                    Review prices and stock
                  </span>
                </span>

                <ArrowRight
                  size={17}
                  className="text-[#a5ad9d] transition group-hover:translate-x-1 group-hover:text-[#526b43]"
                />
              </Link>

              <Link
                href="/bills"
                className="group flex items-center gap-4 rounded-2xl border border-[#e8e9df] p-4 transition hover:border-[#cbd5bf] hover:bg-[#f7f9f2]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0eee4] text-[#797044]">
                  <ReceiptText size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#344638]">
                    Bill history
                  </span>
                  <span className="mt-1 block text-xs text-[#899084]">
                    Find a previous transaction
                  </span>
                </span>

                <ArrowRight
                  size={17}
                  className="text-[#a5ad9d] transition group-hover:translate-x-1 group-hover:text-[#526b43]"
                />
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e6e9dc] bg-[#f5f7ef] p-4">
              <Clock3
                size={17}
                className="mt-0.5 shrink-0 text-[#64784d]"
              />
              <p className="text-xs leading-5 text-[#6f7869]">
                <span className="font-bold text-[#40563b]">
                  A little tip:
                </span>{" "}
                Keep your product stock updated for a smoother checkout
                experience.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-[#e5e7dc] pt-6 text-xs text-[#858c80] sm:flex-row">
          <p>© FreshCart. Fresh choices, every day.</p>
          <p className="inline-flex items-center gap-1">
            <ArrowDownRight size={13} />
            Built with care for your store
          </p>
        </footer>
      </div>
    </main>
  );
}
