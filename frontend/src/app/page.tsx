
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Leaf,
  LoaderCircle,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const BACKEND_ORIGIN = API.replace(/\/api\/?$/, "");

type Product = {
  id: number | string;
  name: string;
  price: number | string;
  image?: string | null;
  image_url?: string | null;
  category?: string | { name?: string } | null;
  description?: string | null;
  stock?: number;
  active?: boolean;
  emoji?: string;
};

const categories = [
  { name: "All finds", emoji: "✳", value: "all" },
  { name: "Fruit", emoji: "🍊", value: "fruit" },
  { name: "Vegetables", emoji: "🥬", value: "vegetable" },
  { name: "Dairy", emoji: "🥛", value: "dairy" },
  { name: "Bakery", emoji: "🥖", value: "bakery" },
  { name: "Pantry", emoji: "🌾", value: "pantry" },
];

function getImage(product: Product) {
  const image = product.image_url || product.image;

  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${BACKEND_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getCategory(product: Product) {
  if (typeof product.category === "string") {
    return product.category;
  }

  return product.category?.name || "Everyday essentials";
}

function formatPrice(price: number | string) {
  const value = Number(price);

  if (!Number.isFinite(value)) return `₹${price}`;

  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function categoryMatches(product: Product, selected: string) {
  if (selected === "all") return true;

  const category = getCategory(product).toLowerCase();

  const aliases: Record<string, string[]> = {
    fruit: ["fruit"],
    vegetable: ["vegetable", "veggie"],
    dairy: ["dairy", "milk", "cheese", "egg"],
    bakery: ["bakery", "bread"],
    pantry: ["pantry", "grocery", "grains", "rice"],
  };

  return (aliases[selected] || [selected]).some((word) =>
    category.includes(word),
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(`${API}/products/`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data: unknown = await response.json();

        const items = Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              "results" in data &&
              Array.isArray(data.results)
            ? data.results
            : [];

        setProducts(
          (items as Product[]).filter((product) => product.active !== false),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;

        setLoadError(
          "We couldn't reach the product shelf. Please check your connection and try again.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProducts();

    return () => controller.abort();
  }, []);

  const visibleProducts = products
    .filter((product) =>
      categoryMatches(product, selectedCategory),
    )
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    )
    .slice(0, 8);

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f5] text-[#24382a]">
      {/* Navigation */}
      <header className="relative z-30 border-b border-[#e7e8df] bg-[#faf9f5]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#294b35] text-[#e9efc9] transition-transform duration-300 group-hover:rotate-[-8deg]">
              <Sprout size={21} strokeWidth={1.7} />
            </span>
            <span className="text-[22px] font-black tracking-[-0.07em] text-[#294b35]">
              freshcart<span className="text-[#8b9b62]">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            <a
              href="#shop"
              className="text-[13px] font-medium text-[#586557] transition hover:text-[#294b35]"
            >
              Shop
            </a>
            <a
              href="#categories"
              className="text-[13px] font-medium text-[#586557] transition hover:text-[#294b35]"
            >
              Categories
            </a>
            <a
              href="#our-way"
              className="text-[13px] font-medium text-[#586557] transition hover:text-[#294b35]"
            >
              Our way
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="px-3 py-2 text-[13px] font-semibold text-[#465747] transition hover:text-[#7d8e51]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#294b35] px-5 py-3 text-[12px] font-bold text-white transition hover:bg-[#1e3c29]"
            >
              Get started <ArrowUpRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e3e5d9] md:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-[#e7e8df] bg-[#faf9f5] px-5 py-5 shadow-lg md:hidden">
            <nav className="flex flex-col gap-5">
              <a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
              <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a>
              <a href="#our-way" onClick={() => setMenuOpen(false)}>Our way</a>
              <Link href="/login">Log in</Link>
              <Link
                href="/signup"
                className="w-fit rounded-full bg-[#294b35] px-5 py-3 text-sm font-bold text-white"
              >
                Get started <ArrowRight className="ml-2 inline" size={15} />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-9 sm:px-8 sm:pb-16 sm:pt-14 lg:px-12 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div className="relative z-10 max-w-[570px]">
            <div className="mb-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#748453] sm:text-[11px]">
              <span className="h-px w-7 bg-[#9eaa77]" />
              A little closer to nature
            </div>

            <h1 className="font-serif text-[54px] font-medium leading-[0.99] tracking-[-0.055em] text-[#294b35] sm:text-[68px] lg:text-[76px] xl:text-[88px]">
              Good things,
              <br />
              <span className="italic text-[#87965f]">grown</span> for
              <br />
              everyday.
            </h1>

            <p className="mt-7 max-w-[410px] text-[14px] leading-[1.95] text-[#697266] sm:text-[15px]">
              Fresh finds, everyday favourites, and the little things that
              make home feel like home. Shopping should feel this simple.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-4 rounded-full bg-[#294b35] px-6 py-[15px] text-[12px] font-bold text-white transition hover:bg-[#1d3b28]"
              >
                Find your favourites
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition group-hover:translate-x-1">
                  <ArrowRight size={15} />
                </span>
              </Link>

              <a
                href="#shop"
                className="inline-flex items-center gap-2 px-2 py-3 text-[12px] font-semibold text-[#53654f] transition hover:text-[#87965f]"
              >
                Explore the shop <ArrowDownRight size={16} />
              </a>
            </div>

            <div className="mt-10 flex items-center gap-3 border-t border-[#e5e6dc] pt-6 sm:mt-12">
              <div className="flex -space-x-2">
                {["🥑", "🍋", "🥬"].map((emoji) => (
                  <span
                    key={emoji}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#faf9f5] bg-[#e9eddf] text-[15px]"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <p className="text-[11px] leading-5 text-[#727a6d]">
                A little more fresh.
                <br />
                <span className="font-bold text-[#40553f]">
                  A little less fuss.
                </span>
              </p>
            </div>
          </div>

          {/* Photography-led hero */}
          <div className="relative">
            <div className="absolute -right-3 -top-3 z-10 flex h-[92px] w-[92px] rotate-[9deg] flex-col items-center justify-center rounded-full bg-[#e5e9d2] text-center text-[#3e5839] sm:-right-5 sm:-top-5 sm:h-[112px] sm:w-[112px]">
              <Sparkles size={16} strokeWidth={1.4} />
              <span className="mt-1 text-[10px] font-bold leading-4">
                Everyday
                <br />
                goodness
              </span>
            </div>

            <div className="relative h-[390px] overflow-hidden rounded-[46%_46%_5px_5px] bg-[#e8eadc] sm:h-[500px] lg:h-[580px]">
              {/* Decorative hero image; product photos are loaded from your API below. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pinimg.com/1200x/c0/11/e5/c011e531c51467be1c357dbf691d59ca.jpg"
                alt="Fresh colourful produce at a grocery market"
                className="h-full w-full object-cover object-center"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b2e20]/55 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6 text-white sm:p-9">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                    The everyday collection
                  </p>
                  <p className="mt-2 font-serif text-3xl italic sm:text-4xl">
                    Nature, on your table.
                  </p>
                </div>
                <a
                  href="#shop"
                  aria-label="Explore our products"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f6f4e9] text-[#294b35] transition hover:rotate-[-8deg]"
                >
                  <ArrowDownRight size={21} />
                </a>
              </div>
            </div>

            <p className="mt-3 text-right text-[10px] tracking-wide text-[#8a8e80]">
              GOOD FOOD. THOUGHTFULLY FOUND.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="our-way" className="border-y border-[#e8e8de] bg-[#f2f2e9]">
        <div className="mx-auto grid max-w-[1440px] gap-7 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-10 lg:px-12">
          {[
            {
              icon: <Leaf size={19} strokeWidth={1.5} />,
              title: "The everyday good",
              text: "Thoughtful picks for your everyday table.",
            },
            {
              icon: <Sprout size={19} strokeWidth={1.5} />,
              title: "A little more natural",
              text: "Fresh inspiration for a happier kitchen.",
            },
            {
              icon: <Check size={19} strokeWidth={1.5} />,
              title: "Shopping made simple",
              text: "Find your favourites without the fuss.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e1e6d5] text-[#4c6945]">
                {item.icon}
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-[#344b35]">
                  {item.title}
                </h2>
                <p className="mt-1.5 max-w-[260px] text-[12px] leading-6 text-[#777d70]">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-[1440px] px-5 pb-5 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#859267]">
              A good place to start
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.035em] text-[#294b35] sm:text-4xl">
              What sounds good today?
            </h2>
          </div>
          <p className="max-w-[310px] text-[12px] leading-6 text-[#797f72]">
            From something fresh to your kitchen staples, find a little of
            what you love.
          </p>
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-3">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => {
                setSelectedCategory(category.value);
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="group flex shrink-0 items-center gap-3 rounded-full border border-[#e3e5d9] bg-white/60 py-2.5 pl-3 pr-5 transition hover:border-[#b7c2a3] hover:bg-[#eef0e5]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf0e4] text-[17px] transition group-hover:scale-105">
                {category.emoji}
              </span>
              <span className="text-[12px] font-semibold text-[#53624f]">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Product catalogue */}
      <section
        id="shop"
        className="mx-auto max-w-[1440px] scroll-mt-6 px-5 pb-20 pt-12 sm:px-8 sm:pb-24 lg:px-12"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-[#e4e5db] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#859267]">
              Picked for your everyday
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[#294b35] sm:text-4xl">
              The fresh finds.
            </h2>
            <p className="mt-2 text-[12px] text-[#818578]">
              Good things for your basket and beyond.
            </p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-full border border-[#e4e5db] bg-white px-4 py-3 sm:w-[250px]">
            <Search size={16} className="shrink-0 text-[#7d8c6b]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find something lovely..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[#294b35] outline-none placeholder:text-[#a1a396]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} className="text-[#7d8c6b]" />
              </button>
            )}
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="flex items-center gap-3 text-[13px] text-[#697766]">
              <LoaderCircle size={19} className="animate-spin" />
              Gathering your fresh finds...
            </div>
          </div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl text-[#294b35]">
              A little pause.
            </p>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-[#777d70]">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-[#294b35] px-6 py-3 text-[12px] font-bold text-white transition hover:bg-[#1d3b28]"
            >
              Try again
            </button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🌱</span>
            <h3 className="mt-4 font-serif text-2xl text-[#294b35]">
              Nothing on this shelf just yet.
            </h3>
            <p className="mt-2 text-[13px] text-[#777d70]">
              Try another category or search for something else.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-5 text-[12px] font-bold text-[#667c4e] underline underline-offset-4"
            >
              See all products
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
            {visibleProducts.map((product, index) => {
              const image = getImage(product);

              return (
                <article key={product.id} className="group min-w-0">
                  <Link
                    href="/signup"
                    aria-label={`Shop ${product.name}`}
                    className="relative block overflow-hidden rounded-[4px] bg-[#eeeee5]"
                  >
                    <div className="relative aspect-[4/4.7] overflow-hidden">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-[#e9ecdf]">
                          <span className="text-5xl">
                            {product.emoji || "🛍️"}
                          </span>
                          <span className="mt-3 text-[10px] text-[#7a856b]">
                            FreshCart find
                          </span>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-[#faf9f2]/95 px-3 py-1.5 text-[9px] font-semibold text-[#53664c] sm:text-[10px]">
                        {getCategory(product)}
                      </span>

                      <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-[#faf9f2] text-[#294b35] opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <ArrowUpRight size={17} />
                      </span>
                    </div>
                  </Link>

                  <div className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href="/signup">
                          <h3 className="line-clamp-2 text-[12px] font-semibold leading-5 text-[#344b35] transition hover:text-[#81915e] sm:text-[13px]">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="mt-1.5 text-[10px] text-[#939587]">
                          {product.stock === 0
                            ? "Currently unavailable"
                            : "A little everyday goodness"}
                        </p>
                      </div>
                      <p className="shrink-0 text-[13px] font-bold text-[#294b35] sm:text-[14px]">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                  {index === 3 && (
                    <div className="sr-only">End of featured row</div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!loading && !loadError && products.length > 8 && (
          <div className="mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full border border-[#cfd5c5] px-6 py-3.5 text-[12px] font-bold text-[#405b3e] transition hover:border-[#294b35] hover:bg-[#f0f1e8]"
            >
              Discover more <ChevronRight size={15} />
            </Link>
          </div>
        )}
      </section>

      {/* Closing editorial banner */}
      <section className="mx-5 mb-16 sm:mx-8 lg:mx-12 lg:mb-20">
        <div className="relative mx-auto max-w-[1440px] overflow-hidden bg-[#294b35]">
          <div className="absolute -right-20 -top-28 h-[340px] w-[340px] rounded-full border border-white/10 sm:h-[450px] sm:w-[450px]" />
          <div className="absolute -right-4 -top-12 h-[250px] w-[250px] rounded-full border border-white/[0.08] sm:h-[350px] sm:w-[350px]" />

          <div className="relative grid items-center gap-8 px-7 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:px-20 lg:py-20">
            <div className="max-w-[600px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c6d4a5]">
                Make room for good things
              </p>
              <h2 className="mt-4 font-serif text-[39px] leading-[1.08] tracking-[-0.04em] text-[#faf9f0] sm:text-5xl lg:text-6xl">
                A little goodness
                <br />
                goes a long way.
              </h2>
              <p className="mt-5 max-w-[410px] text-[13px] leading-7 text-[#d0d8c9]">
                Find the things you love, discover something new, and make
                everyday shopping feel a little more special.
              </p>
            </div>

            <Link
              href="/signup"
              className="group inline-flex w-fit items-center gap-4 rounded-full bg-[#e6ebd1] py-3 pl-6 pr-3 text-[12px] font-bold text-[#294b35] transition hover:bg-white"
            >
              Come on in
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#294b35] text-white transition group-hover:rotate-[-8deg]">
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e6dc]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#294b35] text-[#e9efc9]">
              <Sprout size={19} />
            </span>
            <span className="text-[20px] font-black tracking-[-0.07em] text-[#294b35]">
              freshcart<span className="text-[#8b9b62]">.</span>
            </span>
          </Link>

          <p className="max-w-sm text-[11px] leading-6 text-[#818578]">
            Everyday essentials, fresh finds, and a little more goodness
            for your home.
          </p>

          <div className="flex flex-wrap items-center gap-5 text-[11px] font-medium text-[#65715f]">
            <Link href="/login" className="transition hover:text-[#294b35]">
              Log in
            </Link>
            <Link href="/signup" className="transition hover:text-[#294b35]">
              Create account
            </Link>
            <a href="#shop" className="transition hover:text-[#294b35]">
              Back to top ↑
            </a>
          </div>
        </div>

        <div className="border-t border-[#e9e9e0] px-5 py-4 text-center text-[10px] text-[#96998c]">
          © 2026 FreshCart. Made for everyday living.
        </div>
      </footer>
    </main>
  );
}
