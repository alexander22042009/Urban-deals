(function () {
    "use strict";

    const KEY_USER = "ud_user";
    const KEY_CART = "ud_cart";
    const KEY_PRODUCTS = "ud_products";
    const KEY_APPLIED_VOUCHER = "ud_applied_voucher";
    const KEY_LAST_ORDER = "ud_last_order";
    const KEY_ORDERS = "ud_orders";

    const seedUser = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        wallet: 120.0,
        vouchers: [
            { id: "V10", title: "Voucher 10%", percent: 10 },
            { id: "V15", title: "Voucher 15%", percent: 15 },
            { id: "V25", title: "Voucher 25%", percent: 25 }
        ]
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
        if (!localStorage.getItem(KEY_APPLIED_VOUCHER)) write(KEY_APPLIED_VOUCHER, null);
        if (!localStorage.getItem(KEY_LAST_ORDER)) write(KEY_LAST_ORDER, null);
        if (!localStorage.getItem(KEY_ORDERS)) write(KEY_ORDERS, []);

        const u = read(KEY_USER, null);
        if (!u) {
            write(KEY_USER, seedUser);
        } else {
            if (!Array.isArray(u.vouchers)) u.vouchers = seedUser.vouchers;
            if (typeof u.wallet !== "number") u.wallet = seedUser.wallet;
            if (!u.firstName) u.firstName = seedUser.firstName;
            if (!u.lastName) u.lastName = seedUser.lastName;
            if (!u.id) u.id = seedUser.id;
            write(KEY_USER, u);
        }

        const p = read(KEY_PRODUCTS, null);
        if (!Array.isArray(p) || !p.length) write(KEY_PRODUCTS, seedProducts);

        const c = read(KEY_CART, null);
        if (!Array.isArray(c)) write(KEY_CART, []);
    }

    function money(n) {
        return `€${Number(n || 0).toFixed(2)}`;
    }

    function discountedPrice(p) {
        const pct = Number(p?.discountPct || 0);
        const val = Number(p?.price || 0) * (1 - pct / 100);
        return Math.round(val * 100) / 100;
    }

    function getUser() {
        const u = read(KEY_USER, seedUser);
        if (u && u.name) return u;
        return { ...u, name: `${u.firstName || "John"} ${u.lastName || "Doe"}`.trim() };
    }

    function setUser(u) {
        if (!u) return;
        if (!u.firstName || !u.lastName) {
            const full = (u.name || "").trim();
            if (full) {
                const parts = full.split(/\s+/);
                u.firstName = u.firstName || parts[0] || seedUser.firstName;
                u.lastName = u.lastName || parts.slice(1).join(" ") || seedUser.lastName;
            } else {
                u.firstName = u.firstName || seedUser.firstName;
                u.lastName = u.lastName || seedUser.lastName;
            }
        }
        if (!u.name) u.name = `${u.firstName} ${u.lastName}`.trim();
        write(KEY_USER, u);
    }

    function getProducts() {
        return read(KEY_PRODUCTS, seedProducts);
    }

    function getProductById(id) {
        return (read(KEY_PRODUCTS, seedProducts) || []).find((p) => p.id === Number(id)) || null;
    }

    function getCart() {
        return read(KEY_CART, []);
    }

    function setCart(c) {
        write(KEY_CART, Array.isArray(c) ? c : []);
    }

    function cartCount() {
        return (read(KEY_CART, []) || []).reduce((s, i) => s + (i.qty || 0), 0);
    }

    function getVouchers() {
        return (read(KEY_USER, seedUser)?.vouchers || []);
    }

    function getAppliedVoucher() {
        return read(KEY_APPLIED_VOUCHER, null);
    }

    function setAppliedVoucher(voucherIdOrNull) {
        write(KEY_APPLIED_VOUCHER, voucherIdOrNull || null);
    }

    function getOrders() {
        const o = read(KEY_ORDERS, []);
        return Array.isArray(o) ? o : [];
    }

    function addOrder(order) {
        const all = getOrders();
        all.unshift(order);
        write(KEY_ORDERS, all);
    }

    function getLastOrder() {
        return read(KEY_LAST_ORDER, null);
    }

    function setLastOrder(order) {
        write(KEY_LAST_ORDER, order || null);
    }

    window.Store = {
        ensureSeed,
        money,
        discountedPrice,
        getUser,
        setUser,
        getProducts,
        getProductById,
        getCart,
        setCart,
        cartCount,
        getVouchers,
        getAppliedVoucher,
        setAppliedVoucher,
        getOrders,
        addOrder,
        getLastOrder,
        setLastOrder
    };
})();
