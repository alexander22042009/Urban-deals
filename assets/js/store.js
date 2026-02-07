// assets/js/store.js
// Shared data layer (mock now, later DB/API)

(function () {
    "use strict";

    const KEY_USER = "ud_user";
    const KEY_CART = "ud_cart";
    const KEY_PRODUCTS = "ud_products";

    const seedUser = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        wallet: 120.0,
    };

    const seedProducts = [
        { id: 1, name: "Wireless Earbuds X200", desc: "...", price: 120, discountPct: 25, image: "earbuds.jpg" },
        { id: 2, name: "Smart Watch Fit Pro", desc: "...", price: 180, discountPct: 15, image: "watch.jpg" },
        { id: 3, name: "LED Desk Lamp Minimal", desc: "...", price: 75, discountPct: 30, image: "lamp.jpg" },
        { id: 4, name: "Power Bank 20 000mAh", desc: "...", price: 90, discountPct: 10, image: "powerbank.jpg" },
        { id: 5, name: "Bluetooth Speaker Mini", desc: "...", price: 110, discountPct: 20, image: "speaker.jpg" },
        { id: 6, name: "Thermo Mug Steel 450ml", desc: "...", price: 45, discountPct: 0, image: "mug.jpg" },
        { id: 7, name: "Fitness Resistance Bands", desc: "...", price: 35, discountPct: 10, image: "bands.jpg" },
        { id: 8, name: "Smart Body Scale", desc: "...", price: 85, discountPct: 18, image: "scale.jpg" }
    ];


    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function ensureSeed() {
        if (!localStorage.getItem(KEY_USER)) write(KEY_USER, seedUser);
        if (!localStorage.getItem(KEY_PRODUCTS)) write(KEY_PRODUCTS, seedProducts);
        if (!localStorage.getItem(KEY_CART)) write(KEY_CART, []);
    }

    function money(n) {
        return `€${Number(n).toFixed(2)}`;
    }

    function discountedPrice(p) {
        const pct = Number(p.discountPct || 0);
        const val = Number(p.price) * (1 - pct / 100);
        return Math.round(val * 100) / 100;
    }

    // Expose Store
    window.Store = {
        ensureSeed,
        money,
        discountedPrice,

        getUser: () => read(KEY_USER, seedUser),
        setUser: (u) => write(KEY_USER, u),

        getProducts: () => read(KEY_PRODUCTS, seedProducts),
        getProductById: (id) => (read(KEY_PRODUCTS, seedProducts) || []).find((p) => p.id === Number(id)),

        getCart: () => read(KEY_CART, []),
        setCart: (c) => write(KEY_CART, c),

        cartCount: () => (read(KEY_CART, []) || []).reduce((s, i) => s + (i.qty || 0), 0),
    };
})();
