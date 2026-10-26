
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Package,
  Search,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
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
  category?: string | { name?: string } | null;
  image?: string | null;
  image_url?: string | null;
};

function readList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "results" in data) {
    const results = (data as { results: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

function money(value: number | string) {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/products/`, {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/login");
        return;
      }

      if (!response.ok) throw new Error("Could not load the product catalogue.");

      setProducts(readList<Product>(await response.json()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const totalUnits = products.reduce(
    (sum, p) => sum + Number(p.stock ?? p.quantity ?? 0),
    0
  );
  const lowStock = products.filter((p) => {
    const quantity = Number(p.stock ?? p.quantity ?? 0);
    return quantity > 0 && quantity <= 5;
  }).length;
  const outOfStock = products.filter(
    (p) => Number(p.stock ?? p.quantity ?? 0) <= 0
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f9f5] text-slate-900">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              CATALOGUE MANAGEMENT
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Products & Stock
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep an eye on your product catalogue and available stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadProducts()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              <ShoppingCart size={17} />
              Open POS
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Products",
              value: products.length,
              icon: Package,
              style: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Total stock units",
              value: totalUnits,
              icon: Boxes,
              style: "bg-sky-50 text-sky-700",
            },
            {
              label: "Needs attention",
              value: lowStock + outOfStock,
              icon: AlertTriangle,
              style: "bg-amber-50 text-amber-700",
            },
          ].map(({ label, value, icon: Icon, style }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style}`}>
                <Icon size={21} />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight">
                {loading ? "—" : value.toLocaleString("en-IN")}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <h2 className="text-lg font-black">Your catalogue</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filtered.length} product(s) shown
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-sm font-semibold text-slate-500">
              Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center">
              <Package size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-extrabold">No products found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or add products through your existing management flow.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-7 py-4 font-bold">Product</th>
                      <th className="px-5 py-4 font-bold">Category</th>
                      <th className="px-5 py-4 font-bold">Price</th>
                      <th className="px-5 py-4 font-bold">Stock</th>
                      <th className="px-7 py-4 text-right font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => {
                      const quantity = Number(p.stock ?? p.quantity ?? 0);
                      const category =
                        typeof p.category === "string"
                          ? p.category
                          : p.category?.name || "General";
                      const status =
                        quantity <= 0
                          ? "Out of stock"
                          : quantity <= 5
                            ? "Low stock"
                            : "In stock";

                      return (
                        <tr key={p.id} className="transition hover:bg-slate-50/80">
                          <td className="px-7 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Package size={19} />
                              </span>
                              <span className="font-bold text-slate-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500">{category}</td>
                          <td className="px-5 py-4 font-bold">{money(p.price)}</td>
                          <td className="px-5 py-4 font-semibold">{quantity}</td>
                          <td className="px-7 py-4 text-right">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                                quantity <= 0
                                  ? "bg-red-50 text-red-700"
                                  : quantity <= 5
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {filtered.map((p) => {
                  const quantity = Number(p.stock ?? p.quantity ?? 0);
                  return (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Package size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-extrabold">{p.name}</h3>
                          <p className="mt-1 text-lg font-black text-emerald-800">
                            {money(p.price)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="text-slate-500">Stock: {quantity}</span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-bold ${
                            quantity <= 0
                              ? "bg-red-50 text-red-700"
                              : quantity <= 5
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {quantity <= 0
                            ? "Out of stock"
                            : quantity <= 5
                              ? "Low stock"
                              : "In stock"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>© FreshCart. Fresh choices, every day.</span>
          <span>
            {lowStock} low-stock · {outOfStock} out-of-stock
          </span>
        </div>
      </div>
    </main>
  );
}
