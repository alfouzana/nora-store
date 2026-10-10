import "./style.css";
import { SETTINGS } from "./settings.js";
import { CATEGORIES, PRODUCTS } from "./products.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => `${n} ${SETTINGS.currency}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const TINTS = { bags: "from-blush to-rose/60", cases: "from-cream to-latte/40", phone: "from-rose/40 to-blush", acc: "from-ivory to-rose/50" };
const ICONS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]));

// ---------- WhatsApp links ----------
const waLink = (text) => `https://wa.me/${SETTINGS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
$$("[data-wa]").forEach((a) => (a.href = waLink("السلام عليكم، عندي استفسار عن منتجات نورا 🌸")));
[["instagram", "[data-ig]"], ["tiktok", "[data-tt]"], ["snapchat", "[data-sc]"]].forEach(([k, sel]) => {
  $$(sel).forEach((a) => (SETTINGS[k] ? (a.href = SETTINGS[k]) : a.remove()));
});
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------- cart state ----------
let cart = JSON.parse(localStorage.getItem("nora-cart") || "[]").filter((l) => PRODUCTS.some((p) => p.id === l.id));
const save = () => {
  localStorage.setItem("nora-cart", JSON.stringify(cart));
  renderCart();
};
const product = (id) => PRODUCTS.find((p) => p.id === id);
const lineKey = (l) => `${l.id}|${l.color}|${l.size}`;
const subtotal = () => cart.reduce((s, l) => s + product(l.id).price * l.qty, 0);
const count = () => cart.reduce((s, l) => s + l.qty, 0);

function addToCart(id, color, size) {
  const key = `${id}|${color}|${size}`;
  const line = cart.find((l) => lineKey(l) === key);
  if (line) line.qty += 1;
  else cart.push({ id, color, size, qty: 1 });
  save();
  toast(`تمت إضافة «${product(id).name}» للسلة 🛍️`);
}

// ---------- product cards ----------
function image(p, cls = "") {
  if (p.image) return `<img src="./${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" class="h-full w-full object-cover ${cls}" />`;
  return `<div class="stitch flex h-full w-full items-center justify-center bg-gradient-to-br ${TINTS[p.category] || TINTS.bags} ${cls}">
    <span class="text-6xl drop-shadow-sm">${ICONS[p.category] || "🧶"}</span>
    <span class="absolute bottom-2 left-2 rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-cocoa/70">صورة توضيحية</span>
  </div>`;
}

function card(p) {
  return `
  <article class="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_6px_24px_-12px_rgba(107,79,63,.25)] transition hover:-translate-y-1" data-card="${p.id}">
    <div class="relative aspect-square overflow-hidden">${image(p, "transition duration-500 group-hover:scale-105")}</div>
    <div class="flex flex-1 flex-col p-4">
      <h3 class="font-bold text-cocoa">${esc(p.name)}</h3>
      <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-cocoa/60">${esc(p.description)}</p>
      ${p.colors.length ? `
      <div class="mt-3 flex flex-wrap gap-1.5" data-colors>
        ${p.colors.map((c, i) => `<button type="button" data-color="${esc(c)}" class="rounded-full border px-2.5 py-1 text-xs transition ${i === 0 ? "border-rose-deep bg-blush font-bold text-cocoa" : "border-cocoa/15 text-cocoa/70"}">${esc(c)}</button>`).join("")}
      </div>` : ""}
      ${p.sizes.length ? `
      <select data-size class="mt-2 w-full rounded-xl border border-cocoa/15 bg-cream px-3 py-2 text-sm text-cocoa outline-none focus:border-rose-deep">
        ${p.sizes.map((s) => `<option>${esc(s)}</option>`).join("")}
      </select>` : ""}
      <div class="mt-auto flex items-center justify-between gap-2 pt-4">
        <span class="text-lg font-extrabold text-cocoa">${money(p.price)}</span>
        <button type="button" data-add class="rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white transition hover:bg-cocoa">أضيفي للسلة</button>
      </div>
    </div>
  </article>`;
}

function bindCards(root) {
  $$("[data-card]", root).forEach((el) => {
    const id = el.dataset.card;
    $$("[data-color]", el).forEach((b) =>
      b.addEventListener("click", () => {
        $$("[data-color]", el).forEach((x) => (x.className = "rounded-full border px-2.5 py-1 text-xs transition border-cocoa/15 text-cocoa/70"));
        b.className = "rounded-full border px-2.5 py-1 text-xs transition border-rose-deep bg-blush font-bold text-cocoa";
        el.dataset.selColor = b.dataset.color;
      }),
    );
    $("[data-add]", el).addEventListener("click", () => {
      const p = product(id);
      const color = el.dataset.selColor || p.colors[0] || "";
      const size = $("[data-size]", el)?.value || "";
      addToCart(id, color, size);
    });
  });
}

// featured
const featured = $("#featured-grid");
featured.innerHTML = PRODUCTS.filter((p) => p.featured).slice(0, 4).map(card).join("");
bindCards(featured);

// categories + shop
let activeCat = "all";
const tabs = $("#cat-tabs");
const grid = $("#shop-grid");
function renderShop() {
  tabs.innerHTML = [{ id: "all", name: "الكل", icon: "🧶" }, ...CATEGORIES]
    .map((c) => `<button type="button" data-cat="${c.id}" class="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${activeCat === c.id ? "bg-cocoa text-white" : "bg-white text-cocoa/70 hover:bg-blush"}">${c.icon} ${c.name}</button>`)
    .join("");
  $$("[data-cat]", tabs).forEach((b) => b.addEventListener("click", () => ((activeCat = b.dataset.cat), renderShop())));
  grid.innerHTML = PRODUCTS.filter((p) => activeCat === "all" || p.category === activeCat).map(card).join("");
  bindCards(grid);
}
renderShop();

$("#cat-cards").innerHTML = CATEGORIES.map(
  (c) => `<a href="#shop" data-jump="${c.id}" class="stitch flex flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br ${TINTS[c.id]} p-6 text-center transition hover:-translate-y-1">
    <span class="text-4xl">${c.icon}</span><span class="font-bold text-cocoa">${c.name}</span>
    <span class="text-xs text-cocoa/60">${PRODUCTS.filter((p) => p.category === c.id).length} منتجات</span></a>`,
).join("");
$$("[data-jump]").forEach((a) => a.addEventListener("click", () => ((activeCat = a.dataset.jump), renderShop())));

// ---------- drawer ----------
const drawer = $("#drawer");
const overlay = $("#overlay");
function openDrawer(view = "cart") {
  showView(view);
  drawer.classList.remove("-translate-x-full");
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  drawer.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
  document.body.style.overflow = "";
}
function showView(v) {
  $$("[data-view]").forEach((el) => el.classList.toggle("hidden", el.dataset.view !== v));
  if (v === "checkout") renderSummary();
}
$$("[data-open-cart]").forEach((b) => b.addEventListener("click", () => openDrawer("cart")));
$$("[data-close]").forEach((b) => b.addEventListener("click", closeDrawer));
overlay.addEventListener("click", closeDrawer);
$("#to-checkout").addEventListener("click", () => cart.length && showView("checkout"));
$("#back-to-cart").addEventListener("click", () => showView("cart"));

function renderCart() {
  const n = count();
  $$("[data-count]").forEach((el) => {
    el.textContent = n;
    el.classList.toggle("hidden", n === 0);
  });
  const list = $("#cart-items");
  if (!cart.length) {
    list.innerHTML = `<div class="py-16 text-center text-cocoa/60"><p class="text-5xl">🧺</p><p class="mt-3 font-bold">سلتك فاضية</p><p class="mt-1 text-sm">اختاري قطعك المفضلة وأضيفيها هنا</p></div>`;
  } else {
    list.innerHTML = cart
      .map((l, i) => {
        const p = product(l.id);
        return `<div class="flex gap-3 rounded-2xl bg-white p-3">
          <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">${image(p).replace("text-6xl", "text-3xl").replace(/<span class="absolute[^]*?<\/span>/, "")}</div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-cocoa">${esc(p.name)}</p>
            <p class="text-xs text-cocoa/60">${[l.color && `اللون: ${esc(l.color)}`, l.size && `المقاس: ${esc(l.size)}`].filter(Boolean).join(" · ")}</p>
            <div class="mt-2 flex items-center justify-between">
              <div class="flex items-center gap-2 rounded-full bg-cream px-1">
                <button data-dec="${i}" class="h-7 w-7 rounded-full text-lg text-cocoa">−</button>
                <span class="w-5 text-center text-sm font-bold">${l.qty}</span>
                <button data-inc="${i}" class="h-7 w-7 rounded-full text-lg text-cocoa">+</button>
              </div>
              <span class="font-bold text-cocoa">${money(p.price * l.qty)}</span>
            </div>
          </div>
          <button data-del="${i}" aria-label="حذف" class="self-start text-cocoa/40 hover:text-rose-deep">✕</button>
        </div>`;
      })
      .join("");
    $$("[data-inc]", list).forEach((b) => b.addEventListener("click", () => (cart[b.dataset.inc].qty++, save())));
    $$("[data-dec]", list).forEach((b) =>
      b.addEventListener("click", () => {
        const l = cart[b.dataset.dec];
        l.qty > 1 ? l.qty-- : cart.splice(b.dataset.dec, 1);
        save();
      }),
    );
    $$("[data-del]", list).forEach((b) => b.addEventListener("click", () => (cart.splice(b.dataset.del, 1), save())));
  }
  $("#cart-subtotal").textContent = money(subtotal());
  $("#to-checkout").disabled = !cart.length;
}
renderCart();

// ---------- checkout ----------
function renderSummary() {
  $("#summary").innerHTML =
    cart
      .map((l) => {
        const p = product(l.id);
        return `<div class="flex justify-between gap-3 py-2 text-sm"><span class="text-cocoa/80">${esc(p.name)} × ${l.qty}<span class="block text-xs text-cocoa/50">${[l.color, l.size].filter(Boolean).map(esc).join(" · ")}</span></span><span class="font-bold">${money(p.price * l.qty)}</span></div>`;
      })
      .join("") +
    `<div class="mt-2 flex justify-between border-t border-cocoa/10 pt-3 font-extrabold"><span>إجمالي المنتجات</span><span>${money(subtotal())}</span></div>
     <p class="mt-1 text-xs text-cocoa/50">الشحن: ${SETTINGS.shippingNote}</p>`;
}

function buildMessage({ name, phone, address, notes }) {
  const items = cart
    .map((l, i) => {
      const p = product(l.id);
      const rows = [`${i + 1}. ${p.name}`];
      if (l.color) rows.push(`    اللون: ${l.color}`);
      if (l.size) rows.push(`    المقاس: ${l.size}`);
      rows.push(`    الكمية: ${l.qty}`);
      rows.push(`    السعر: ${p.price * l.qty} ${SETTINGS.currency}`);
      return rows.join("\n");
    })
    .join("\n");
  return [
    `🌸 طلب جديد من متجر ${SETTINGS.storeName} 🌸`,
    "",
    "👩🏻 بيانات العميلة:",
    `الاسم: ${name}`,
    `رقم الجوال: ${phone}`,
    `العنوان: ${address}`,
    "",
    "🛍️ تفاصيل الطلب:",
    "",
    items,
    "",
    "ـــــــــــــــــــــــ",
    `💰 إجمالي المنتجات: ${subtotal()} ${SETTINGS.currency}`,
    `🚚 الشحن: ${SETTINGS.shippingNote}`,
    "💳 الإجمالي النهائي: يحدد بعد احتساب الشحن.",
    "",
    `📝 ملاحظات العميلة: ${notes || "لا توجد."}`,
    "",
    "شكرًا لاختيارك نورا 🤍",
  ].join("\n");
}

const form = $("#checkout-form");
const saved = JSON.parse(localStorage.getItem("nora-customer") || "{}");
["name", "phone", "address"].forEach((k) => saved[k] && (form.elements[k].value = saved[k]));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  Object.keys(d).forEach((k) => (d[k] = String(d[k]).trim()));
  const err = $("#form-error");
  const phoneOk = /^(\+?966|0)?5\d{8}$/.test(d.phone.replace(/[\s-]/g, ""));
  const msg = !d.name ? "اكتبي اسمك" : !phoneOk ? "رقم الجوال غير صحيح (مثال: 05xxxxxxxx)" : d.address.length < 3 ? "اكتبي العنوان (المدينة والحي)" : !cart.length ? "السلة فاضية" : "";
  err.textContent = msg;
  err.classList.toggle("hidden", !msg);
  if (msg) return;
  localStorage.setItem("nora-customer", JSON.stringify({ name: d.name, phone: d.phone, address: d.address }));
  window.open(waLink(buildMessage(d)), "_blank");
  showView("sent");
});

$("#clear-cart").addEventListener("click", () => {
  cart = [];
  save();
  closeDrawer();
  toast("شكرًا لك 🤍 نتواصل معك على واتساب");
});
$("#resend").addEventListener("click", () => showView("checkout"));

// ---------- toast ----------
let t;
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.remove("opacity-0", "translate-y-4");
  clearTimeout(t);
  t = setTimeout(() => el.classList.add("opacity-0", "translate-y-4"), 2200);
}
