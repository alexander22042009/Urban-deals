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

    function money(n) {
        return `€${Number(n || 0).toFixed(2)}`;
    }

    function discountedPrice(p) {
        const pct = Number(p?.discountPct || 0);
        const val = Number(p?.price || 0) * (1 - pct / 100);
        return Math.round(val * 100) / 100;
    }

    function normalizeUser(u) {
        const user = u && typeof u === "object" ? { ...u } : { ...seedUser };
        if (!user.id) user.id = seedUser.id;
        if (!user.firstName) user.firstName = seedUser.firstName;
        if (!user.lastName) user.lastName = seedUser.lastName;
        if (typeof user.wallet !== "number") user.wallet = seedUser.wallet;
        if (!Array.isArray(user.vouchers)) user.vouchers = seedUser.vouchers;
        user.name = `${user.firstName} ${user.lastName}`.trim();
        return user;
    }

    function ensureLocalSeed() {
        if (!localStorage.getItem(KEY_USER)) write(KEY_USER, normalizeUser(seedUser));
        if (!localStorage.getItem(KEY_PRODUCTS)) write(KEY_PRODUCTS, seedProducts);
        if (!localStorage.getItem(KEY_CART)) write(KEY_CART, []);
        if (!localStorage.getItem(KEY_APPLIED_VOUCHER)) write(KEY_APPLIED_VOUCHER, null);
        if (!localStorage.getItem(KEY_LAST_ORDER)) write(KEY_LAST_ORDER, null);
        if (!localStorage.getItem(KEY_ORDERS)) write(KEY_ORDERS, []);

        const u = read(KEY_USER, null);
        write(KEY_USER, normalizeUser(u));

        const p = read(KEY_PRODUCTS, null);
        if (!Array.isArray(p) || !p.length) write(KEY_PRODUCTS, seedProducts);

        const c = read(KEY_CART, null);
        if (!Array.isArray(c)) write(KEY_CART, []);

        const o = read(KEY_ORDERS, null);
        if (!Array.isArray(o)) write(KEY_ORDERS, []);
    }

    async function ensureSeed() {
        ensureLocalSeed();

        if (!window.Api) return;

        try {
            const [products, user, orders] = await Promise.allSettled([
                window.Api.getProducts?.(),
                window.Api.getUser?.(),
                window.Api.getOrders?.()
            ]);

            if (products.status === "fulfilled" && Array.isArray(products.value)) {
                write(KEY_PRODUCTS, products.value);
            }

            if (user.status === "fulfilled" && user.value) {
                write(KEY_USER, normalizeUser(user.value));
            }

            if (orders.status === "fulfilled" && Array.isArray(orders.value)) {
                write(KEY_ORDERS, orders.value);
            }
        } catch {
        }
    }

    function getUser() {
        return normalizeUser(read(KEY_USER, seedUser));
    }

    function setUser(u) {
        write(KEY_USER, normalizeUser(u));
    }

    function getProducts() {
        const p = read(KEY_PRODUCTS, seedProducts);
        return Array.isArray(p) ? p : seedProducts;
    }

    function getProductById(id) {
        return getProducts().find((p) => p.id === Number(id)) || null;
    }

    function getCart() {
        const c = read(KEY_CART, []);
        return Array.isArray(c) ? c : [];
    }

    function setCart(c) {
        write(KEY_CART, Array.isArray(c) ? c : []);
    }

    function cartCount() {
        return getCart().reduce((s, i) => s + (i.qty || 0), 0);
    }

    function getVouchers() {
        return getUser().vouchers || [];
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

    function setOrders(list) {
        write(KEY_ORDERS, Array.isArray(list) ? list : []);
    }

    function addOrder(order) {
        const all = getOrders();
        all.unshift(order);
        setOrders(all);
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
        setOrders,
        addOrder,

        getLastOrder,
        setLastOrder
    };
})();
