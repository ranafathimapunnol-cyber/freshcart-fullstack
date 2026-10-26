"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const API_ORIGIN = API.replace(/\/api\/?$/, "");

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

type CartItem = {
  product: Product;
  quantity: number;
};

type Bill = {
  id?: number | string;
  bill_number?: string;
  invoice_number?: string;
  total?: number | string;
  total_amount?: number | string;
  created_at?: string;
  date?: string;
};

function getList<T>(data: unknown): T[] {
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

function money(value: number | string) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function stockOf(product: Product) {
  return Number(product.stock ?? product.quantity ?? 0);
}

function productImage(product: Product): string | null {
  const raw = product.image_url || product.image;

  if (!raw || typeof raw !== "string") return null;

  const path = raw.trim();

  if (!path) return null;

  if (/^(https?:\/\/|data:image\/)/i.test(path)) return path;

  if (path.startsWith("//")) return `https:${path}`;

  return `${API_ORIGIN}/${path.replace(/^\/+/, "")}`;
}

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const src = productImage(product);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl bg-[#f1f6ec] text-emerald-800">
        <Package size={34} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-[#f1f6ec]">
      {/* Regular img supports Django media URLs without Next image configuration. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={product.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [paperSize, setPaperSize] = useState<"58mm" | "80mm">("80mm");

  const loadProducts = useCallback(async () => {
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

      if (!response.ok) {
        throw new Error("Unable to load products. Please try again.");
      }

      setProducts(getList<Product>(await response.json()));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
  }, [products, search]);

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    setError("");
    setSuccess("");

    const stock = stockOf(product);
    const existing = cart.find(
      (item) => item.product.id === product.id
    );

    if (stock <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }

    if (existing && existing.quantity >= stock) {
      setError(`Only ${stock} unit(s) of ${product.name} are available.`);
      return;
    }

    setCart((current) => {
      const item = current.find(
        (entry) => entry.product.id === product.id
      );

      if (item) {
        return current.map((entry) =>
          entry.product.id === product.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: number, change: number) {
    setError("");

    const item = cart.find((entry) => entry.product.id === productId);
    if (!item) return;

    const nextQuantity = item.quantity + change;
    const stock = stockOf(item.product);

    if (nextQuantity > stock) {
      setError(
        `Only ${stock} unit(s) of ${item.product.name} are available.`
      );
      return;
    }

    setCart((current) =>
      current
        .map((entry) =>
          entry.product.id === productId
            ? { ...entry, quantity: nextQuantity }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  }

  function removeItem(productId: number) {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  async function checkout() {
    if (!cart.length || checkoutLoading) return;

    setCheckoutLoading(true);
    setError("");
    setSuccess("");

    // Preserve purchased items for the receipt before emptying the cart.
    const purchasedItems = cart.map((item) => ({ ...item }));

    try {
      const response = await fetch(`${API}/bills/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: purchasedItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/login");
        return;
      }

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.error ||
          data?.message ||
          "Checkout failed. Check stock and try again.";

        throw new Error(
          typeof message === "string" ? message : JSON.stringify(message)
        );
      }

      setReceiptItems(purchasedItems);
      setLastBill(data as Bill);
      setCart([]);
      setSuccess("Sale completed successfully!");

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9f5] text-slate-900">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              FRESHCART CHECKOUT
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Point of Sale
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Select products, build the basket, and complete the sale.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Checkout ready
            </span>

            <button
              type="button"
              onClick={() => void loadProducts()}
              disabled={loading}
              aria-label="Refresh products"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={19} />
            {success}
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto"
              aria-label="Dismiss success"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[1fr_390px]">
          <section className="min-w-0">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-black">Choose products</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {products.length} product(s) in your catalogue
                  </p>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-slate-500">
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <Package size={34} className="mx-auto text-slate-300" />
                  <p className="mt-3 font-bold">No matching products</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another search or add products to your catalogue.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {filteredProducts.map((product) => {
                    const stock = stockOf(product);
                    const selected = cart.find(
                      (item) => item.product.id === product.id
                    );
                    const outOfStock = stock <= 0;

                    return (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={outOfStock}
                        className="group relative rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:p-4"
                      >
                        <ProductImage product={product} />

                        <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-extrabold leading-5">
                          {product.name}
                        </h3>

                        <p className="mt-2 text-base font-black text-emerald-800">
                          {money(product.price)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {outOfStock ? "Out of stock" : `${stock} in stock`}
                        </p>

                        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white opacity-0 transition group-hover:opacity-100">
                          {selected ? selected.quantity : <Plus size={16} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm xl:sticky xl:top-24">
            <div className="bg-emerald-800 p-5 text-white sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
                    CURRENT ORDER
                  </p>
                  <h2 className="mt-2 text-xl font-black">Your basket</h2>
                </div>
                <ShoppingCart size={24} />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-emerald-100">
                <span>{itemCount} item(s)</span>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  disabled={!cart.length}
                  className="font-semibold hover:text-white disabled:opacity-40"
                >
                  Clear basket
                </button>
              </div>
            </div>

            <div className="max-h-[430px] min-h-32 divide-y divide-slate-100 overflow-y-auto px-5 sm:px-6">
              {!cart.length ? (
                <div className="py-12 text-center">
                  <ShoppingCart
                    size={25}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-4 text-sm font-bold">
                    Your basket is empty
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a product to start a new sale.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {money(item.product.price)} each
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black">
                        {money(Number(item.product.price) * item.quantity)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, -1)}
                          aria-label={`Decrease ${item.product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, 1)}
                          disabled={item.quantity >= stockOf(item.product)}
                          aria-label={`Increase ${item.product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {money(subtotal)}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Taxes and discounts should be calculated by the backend.
              </p>

              <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-bold">Basket total</span>
                <span className="text-2xl font-black">
                  {money(subtotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void checkout()}
                disabled={!cart.length || checkoutLoading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checkoutLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <ReceiptText size={18} />
                )}
                {checkoutLoading ? "Processing sale..." : "Complete sale"}
              </button>
            </div>
          </aside>
        </div>

        {lastBill && (
          <section className="receipt-area mt-8 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-black">Sale completed</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bill{" "}
                  {lastBill.bill_number ||
                    lastBill.invoice_number ||
                    lastBill.id ||
                    "created"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <label className="text-xs font-semibold text-slate-500">
                  Paper
                </label>
                <select
                  value={paperSize}
                  onChange={(event) =>
                    setPaperSize(event.target.value as "58mm" | "80mm")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="58mm">58 mm</option>
                  <option value="80mm">80 mm</option>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Printer size={16} />
                  Print receipt
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <div
                className={`receipt-paper border border-dashed border-slate-300 p-5 text-slate-900 ${
                  paperSize === "58mm" ? "receipt-58" : "receipt-80"
                }`}
              >
                <div className="text-center">
                  <h3 className="text-xl font-black">FreshCart</h3>
                  <p className="mt-1 text-xs">Fresh choices, every day.</p>
                  <div className="my-4 border-t border-dashed border-slate-400" />
                  <p className="text-xs font-bold">SALES RECEIPT</p>
                  <p className="mt-1 text-xs">
                    Bill:{" "}
                    {lastBill.bill_number ||
                      lastBill.invoice_number ||
                      lastBill.id ||
                      "—"}
                  </p>
                  <p className="mt-1 text-xs">
                    {lastBill.created_at || lastBill.date
                      ? new Date(
                          lastBill.created_at || lastBill.date!
                        ).toLocaleString("en-IN")
                      : new Date().toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="my-4 border-t border-dashed border-slate-400" />

                {receiptItems.map((item) => (
                  <div key={item.product.id} className="mb-3 text-xs">
                    <p className="font-bold">{item.product.name}</p>
                    <div className="mt-1 flex justify-between gap-2">
                      <span>
                        {item.quantity} × {money(item.product.price)}
                      </span>
                      <span>
                        {money(Number(item.product.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="my-4 border-t border-dashed border-slate-400" />
                <div className="flex justify-between gap-3 text-sm font-black">
                  <span>Total</span>
                  <span>
                    {money(lastBill.total_amount ?? lastBill.total ?? 0)}
                  </span>
                </div>
                <p className="mt-5 text-center text-xs">
                  Thank you! Visit again.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }

          body {
            margin: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .receipt-area,
          .receipt-area * {
            visibility: visible !important;
          }

          .receipt-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          .receipt-paper {
            width: var(--receipt-width) !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
          }

          .receipt-58 {
            --receipt-width: 58mm;
          }

          .receipt-80 {
            --receipt-width: 80mm;
          }
        }

        .receipt-58 {
          width: 58mm;
        }

        .receipt-80 {
          width: 80mm;
        }
      `}</style>
    </main>
  );
}