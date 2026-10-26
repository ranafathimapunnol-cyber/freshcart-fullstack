
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  FileText,
  RefreshCw,
  Search,
  ShoppingCart,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type Bill = {
  id: number | string;
  bill_number?: string;
  invoice_number?: string;
  total?: number | string;
  total_amount?: number | string;
  created_at?: string;
  updated_at?: string;
  date?: string;
  status?: string;
};

function readList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "results" in data) {
    const results = (data as { results: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

function money(value: number | string | undefined) {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateLabel(bill: Bill) {
  const value = bill.created_at || bill.date || bill.updated_at;
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBills() {
    setLoading(true);
    setError("");

    try {
      let response = await fetch(`${API}/bills/history/`, {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 404) {
        response = await fetch(`${API}/bills/`, {
          credentials: "include",
          cache: "no-store",
        });
      }

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load bill history.");
      }

      setBills(readList<Bill>(await response.json()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBills();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bills;

    return bills.filter((bill) =>
      String(
        bill.bill_number || bill.invoice_number || bill.id
      )
        .toLowerCase()
        .includes(q)
    );
  }, [bills, search]);

  const totalSales = bills.reduce(
    (sum, bill) => sum + Number(bill.total_amount ?? bill.total ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f9f5] text-slate-900">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              TRANSACTION CENTRE
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Bill History
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review previous transactions and recorded sales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadBills()}
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
              New sale
            </Link>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <FileText size={21} />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Total bills
            </p>
            <p className="mt-1 text-3xl font-black">
              {loading ? "—" : bills.length.toLocaleString("en-IN")}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CircleDollarSign size={21} />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Recorded sales total
            </p>
            <p className="mt-1 break-words text-3xl font-black">
              {loading ? "—" : money(totalSales)}
            </p>
          </article>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <h2 className="text-lg font-black">All transactions</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filtered.length} bill(s) shown
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
                placeholder="Search bill number…"
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
              Loading bill history…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center">
              <FileText size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-extrabold">No bills found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Completed sales will appear here when they are returned by the API.
              </p>
              <Link
                href="/pos"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Create a sale <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-7 py-4 font-bold">Bill reference</th>
                      <th className="px-5 py-4 font-bold">Date</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-7 py-4 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((bill) => (
                      <tr key={bill.id} className="transition hover:bg-slate-50/80">
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                              <FileText size={18} />
                            </span>
                            <span className="font-bold">
                              {bill.bill_number ||
                                bill.invoice_number ||
                                `#${bill.id}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays size={15} />
                            {dateLabel(bill)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            {bill.status || "Recorded"}
                          </span>
                        </td>
                        <td className="px-7 py-4 text-right font-black">
                          {money(bill.total_amount ?? bill.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {filtered.map((bill) => (
                  <article
                    key={bill.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <FileText size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="break-all text-sm font-extrabold">
                            {bill.bill_number ||
                              bill.invoice_number ||
                              `#${bill.id}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {dateLabel(bill)}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-black">
                        {money(bill.total_amount ?? bill.total)}
                      </p>
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        {bill.status || "Recorded"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © FreshCart. Fresh choices, every day.
        </footer>
      </div>
    </main>
  );
}
