"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  emoji: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export default function POSPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const response = await fetch(`${API}/auth/logout/`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Logout failed. Please check the backend.");
        setLoggingOut(false);
        return;
      }

      setCart([]);
      setProducts([]);
      setBill(null);
      window.location.replace("/login");
    } catch {
      setError("Cannot reach the server. Please check Django.");
      setLoggingOut(false);
    }
  }


  async function loadProducts(term = "") {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/products/?search=${encodeURIComponent(term)}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Could not load products.");

      setProducts(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkLogin() {
      try {
        const response = await fetch(`${API}/me/`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setAuthChecking(false);
          void loadProducts();
        }
      } catch {
        router.replace("/login");
      }
    }

    void checkLogin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      ),
    [cart]
  );

  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  function addProduct(product: Product) {
    setError("");
    setBill(null);

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return current;

        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (product.stock < 1) return current;

      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: number, quantity: number) {
    setBill(null);
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function checkout() {
    setError("");

    try {
      const response = await fetch(`${API}/bills/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Checkout failed. Please log in and verify the server configuration."
        );
      }

      setBill(data);
      setCart([]);
      await loadProducts(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    }
  }

  if (authChecking) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-black">Checking your login...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-8">
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">FreshCart</h1>
          <p className="text-sm text-slate-500">Grocery point of sale</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            className="rounded-lg border bg-white px-4 py-2 text-slate-900"
            href="/"
          >
            Home
          </a>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <input
              className="w-full rounded-lg border p-3"
              placeholder="Search groceries..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                void loadProducts(e.target.value);
              }}
            />
            <button
              className="rounded-lg border px-4 py-2"
              onClick={() => void loadProducts(search)}
            >
              Refresh
            </button>
          </div>

          {loading && <p>Loading products...</p>}
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}

          {!loading && products.length === 0 && (
            <p className="text-slate-500">No products found.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-xl border p-4">
                <div className="text-4xl">{product.emoji}</div>
                <h2 className="mt-3 font-semibold">{product.name}</h2>
                <p className="text-sm text-slate-500">{product.category}</p>
                <p className="mt-2 text-lg font-bold">
                  ₹{Number(product.price).toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">
                  Stock: {product.stock}
                </p>
                <button
                  disabled={product.stock < 1}
                  onClick={() => addProduct(product)}
                  className="mt-3 w-full rounded-lg bg-blue-900 px-3 py-2 text-white disabled:bg-slate-300"
                >
                  {product.stock ? "Add to cart" : "Out of stock"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Shopping cart</h2>

          {cart.length === 0 && (
            <p className="text-slate-500">Your cart is empty.</p>
          )}

          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between gap-3 border-b py-3"
            >
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-slate-500">
                  ₹{Number(item.product.price).toFixed(2)} each
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded border px-2"
                  onClick={() =>
                    changeQuantity(item.product.id, item.quantity - 1)
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  className="rounded border px-2"
                  disabled={item.quantity >= item.product.stock}
                  onClick={() =>
                    changeQuantity(item.product.id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <div className="mt-5 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5% estimate)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => void checkout()}
            className="mt-5 w-full rounded-lg bg-blue-900 p-3 font-semibold text-white disabled:bg-slate-300"
          >
            Create bill
          </button>

          {bill && (
            <div className="mt-5 rounded-xl border p-4">
              <h3 className="text-lg font-bold">Receipt #{bill.id}</h3>
              <p>Subtotal: ₹{Number(bill.subtotal).toFixed(2)}</p>
              <p>GST: ₹{Number(bill.gst).toFixed(2)}</p>
              <p className="font-bold">
                Total: ₹{Number(bill.total).toFixed(2)}
              </p>
              <button
                onClick={() => window.print()}
                className="mt-3 w-full rounded-lg border p-2"
              >
                Print receipt
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
