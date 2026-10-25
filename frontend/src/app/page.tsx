import Link from "next/link";

const products = [
  { emoji: "🥑", name: "Fresh Avocados", category: "Fresh produce", price: "₹120" },
  { emoji: "🍓", name: "Sweet Strawberries", category: "Fresh fruits", price: "₹180" },
  { emoji: "🥛", name: "Farm Fresh Milk", category: "Dairy", price: "₹30" },
  { emoji: "🥖", name: "Artisan Bread", category: "Bakery", price: "₹45" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8faf6] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-2xl font-black tracking-tight text-emerald-700">
          FreshCart<span className="text-slate-900">.</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2 font-semibold hover:bg-white">
            Login
          </Link>
          <Link href="/signup" className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
            🌿 Freshness delivered daily
          </span>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            Good food.
            <br />
            <span className="text-emerald-700">Better living.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Your everyday essentials, fresh produce and pantry favourites —
            all in one simple shopping experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/signup" className="rounded-xl bg-emerald-700 px-7 py-4 font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800">
              Start shopping →
            </Link>
            <Link href="/pos" className="rounded-xl border border-slate-200 bg-white px-7 py-4 font-bold hover:border-emerald-600">
              Open store POS
            </Link>
          </div>
          <div className="mt-10 flex gap-8 text-sm text-slate-600">
            <div><strong className="block text-xl text-slate-900">Fresh</strong>Quality first</div>
            <div><strong className="block text-xl text-slate-900">Easy</strong>Simple checkout</div>
            <div><strong className="block text-xl text-slate-900">Local</strong>Everyday value</div>
          </div>
        </div>

        <div className="relative rounded-[2rem] bg-emerald-100 p-6 sm:p-10">
          <div className="absolute right-8 top-8 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-bold">Fresh picks ✨</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-12">
            {products.map((product) => (
              <div key={product.name} className="rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-1">
                <div className="flex h-24 items-center justify-center rounded-2xl bg-[#f8faf6] text-6xl">
                  {product.emoji}
                </div>
                <p className="mt-4 text-xs text-slate-500">{product.category}</p>
                <h2 className="mt-1 font-bold">{product.name}</h2>
                <p className="mt-2 font-black text-emerald-700">{product.price}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm font-medium text-emerald-900">
            Everyday essentials, made easy 🛒
          </p>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Your everyday store</p>
          <h2 className="mt-3 text-3xl font-black">Everything you need, in one cart.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Browse products, manage your cart and enjoy a straightforward checkout experience.
          </p>
          <Link href="/signup" className="mt-6 inline-block rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-sm text-slate-500">
        © {2026} FreshCart. Fresh choices, every day.
      </footer>
    </main>
  );
}
