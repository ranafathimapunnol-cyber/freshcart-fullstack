"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  UserRound,
  Store,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  emoji: string;
  active: boolean;
};

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  emoji: string;
};

type LoggedInUser = {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  is_staff?: boolean;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "Grocery",
  price: "",
  stock: "0",
  emoji: "🛒",
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/products/`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const data: Product[] = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      try {
        const response = await fetch(`${API}/me/`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const user: LoggedInUser = await response.json();

        if (!user.is_staff) {
          router.replace("/pos");
          return;
        }

        if (!cancelled) {
          setCurrentUser(user);
          setChecking(false);
          await loadProducts();
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    void checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [router, loadProducts]);

  const userName =
    [
      currentUser?.first_name,
      currentUser?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.email?.split("@")[0] ||
    "Administrator";

  const userInitial = userName.charAt(0).toUpperCase();

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: String(product.stock),
      emoji: product.emoji || "🛒",
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.name.trim() || !form.category.trim()) {
      setError("Enter a product name and category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0 || price > 99999999) {
      setError("Enter a valid product price.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0 || stock > 4294967295) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: price.toFixed(2),
      stock,
      emoji: form.emoji.trim() || "🛒",
    };

    setSaving(true);

    try {
      const url = editingId
        ? `${API}/products/admin/${editingId}/`
        : `${API}/products/admin/create/`;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Access denied. Sign in with an administrator account."
        );
      }

      if (!response.ok) {
        const detail =
          typeof data === "object" && data !== null
            ? Object.entries(data)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(" ")
            : "";

        throw new Error(detail || "Could not save the product.");
      }

      setMessage(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivateProduct(product: Product) {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"? It will no longer appear in the POS.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/products/admin/${product.id}/`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Administrator permission is required.");
      }

      if (!response.ok) {
        throw new Error("Could not deactivate this product.");
      }

      setMessage(`${product.name} was deactivated.`);

      if (editingId === product.id) {
        cancelEdit();
      }

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deactivate product."
      );
    }
  }

  const visibleProducts = products.filter((product) => {
    const term = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  });

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 animate-spin" size={26} />
          <p className="font-medium">Checking administrator access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <button
            type="button"
            onClick={() => router.push("/pos")}
            className="flex shrink-0 items-center gap-3 rounded-xl text-left"
            aria-label="Go to FreshCart POS"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Store size={22} />
            </span>

            <span>
              <span className="block text-lg font-black tracking-tight">
                FreshCart
              </span>
              <span className="hidden text-xs text-slate-500 sm:block">
                Grocery management
              </span>
            </span>
          </button>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                {userInitial || <UserRound size={20} />}
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-40 truncate text-sm font-bold text-slate-800">
                  {userName}
                </p>
                <p className="flex items-center gap-1 text-xs text-emerald-700">
                  <ShieldCheck size={12} />
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>

            <h1 className="text-3xl font-black tracking-tight">
              Product management
            </h1>

            <p className="mt-1 text-slate-500">
              Manage your FreshCart products, prices and stock.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
            <ShieldCheck size={18} />
            Administrator access
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
          {/* Add/edit form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
                {editingId ? <Pencil size={22} /> : <Plus size={22} />}
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  {editingId ? "Edit product" : "Add a product"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingId
                    ? `Product #${editingId}`
                    : "Enter product details"}
                </p>
              </div>
            </div>

            <form onSubmit={saveProduct} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Product name
                </label>
                <input
                  id="name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Fresh apples"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Category
                </label>
                <input
                  id="category"
                  required
                  maxLength={80}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Fruits, Dairy, Bakery..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="price"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Price (₹)
                  </label>
                  <input
                    id="price"
                    type="number"
                    required
                    min="0"
                    max="99999999"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Stock
                  </label>
                  <input
                    id="stock"
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="emoji"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Product emoji
                </label>
                <input
                  id="emoji"
                  maxLength={10}
                  value={form.emoji}
                  onChange={(e) =>
                    setForm({ ...form, emoji: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="🥦"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add product"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-50"
                >
                  Cancel editing
                </button>
              )}
            </form>
          </section>

          {/* Product list */}
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Products</h2>
                <p className="text-sm text-slate-500">
                  {products.length} active product
                  {products.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadProducts()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <input
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="mb-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

            {loading ? (
              <p className="py-10 text-center text-slate-500">
                Loading products...
              </p>
            ) : visibleProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package
                  className="mx-auto mb-3 text-slate-400"
                  size={36}
                />
                <p className="font-semibold">No products found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add a product or try another search.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleProducts.map((product) => (
                  <article
                    key={product.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-3xl">
                        {product.emoji || "🛒"}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold">
                          {product.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {product.category}
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-800">
                          ₹{Number(product.price).toFixed(2)}
                          <span className="ml-3 font-normal text-slate-500">
                            Stock: {product.stock}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void deactivateProduct(product)}
                        aria-label={`Deactivate ${product.name}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Deactivate
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 pb-4 text-center text-xs text-slate-500">
          FreshCart Admin · Product changes are saved to your store database.
        </footer>
      </div>
    </main>
  );
}
