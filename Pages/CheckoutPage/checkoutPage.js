(function () {
    "use strict";

    const KEY_LAST_ORDER = "ud_last_order";
    const KEY_ORDERS = "ud_orders";

    function money(v) { return window.Store.money(v); }
    function getCart() { return window.Store.getCart(); }

    function findProduct(id) {
        return window.Store.getProducts().find(p => p.id === id) || null;
    }

    function getAppliedVoucherId() {
        return window.Store.getAppliedVoucher?.() ?? null;
    }

    function getVoucherById(id) {
        return window.Store.getVouchers?.().find(v => v.id === id) || null;
    }

    function round2(n) {
        return Math.round(Number(n || 0) * 100) / 100;
    }

    function calcTotals(cart) {
        let itemsCount = 0;
        let subtotal = 0;
        let total = 0;

        for (const row of cart) {
            const p = findProduct(row.productId);
            if (!p) continue;

            const qty = Number(row.qty || 0);
            const sale = window.Store.discountedPrice(p);

            itemsCount += qty;
            subtotal += Number(p.price) * qty;
            total += Number(sale) * qty;
        }

        subtotal = round2(subtotal);
        total = round2(total);

        const discount = Math.max(0, round2(subtotal - total));

        const appliedId = getAppliedVoucherId();
        const voucher = appliedId ? getVoucherById(appliedId) : null;

        let voucherDiscount = 0;
        let finalTotal = total;

        if (voucher) {
            voucherDiscount = round2(total * (Number(voucher.percent || 0) / 100));
            finalTotal = Math.max(0, round2(total - voucherDiscount));
        }

        return { itemsCount, subtotal, discount, total, voucher, voucherDiscount, finalTotal };
    }

    function renderSummary() {
        const cart = getCart();
        const listHost = document.querySelector("[data-summary-list]");
        const sItems = document.querySelector("[data-s-items]");
        const sSubtotal = document.querySelector("[data-s-subtotal]");
        const sDiscount = document.querySelector("[data-s-discount]");
        const sVoucher = document.querySelector("[data-s-voucher]");
        const sTotal = document.querySelector("[data-s-total]");

        if (!cart.length) {
            listHost.innerHTML = `<p style="opacity:.75">Your cart is empty. <a href="../ShopPage/shopPage.html">Go to shop</a></p>`;
            sItems.textContent = "0";
            sSubtotal.textContent = money(0);
            sDiscount.textContent = `- ${money(0)}`;
            sVoucher.textContent = "—";
            sTotal.textContent = money(0);
            return;
        }

        listHost.innerHTML = cart.map(row => {
            const p = findProduct(row.productId);
            if (!p) return "";
            const sale = window.Store.discountedPrice(p);
            const qty = Number(row.qty || 0);

            return `
        <div class="sum-item">
          <div class="sum-left">
            <div class="name">${p.name}</div>
            <div class="meta">x${qty} • ${money(sale)} each</div>
          </div>
          <div class="sum-right">${money(round2(Number(sale) * qty))}</div>
        </div>
      `;
        }).join("");

        const t = calcTotals(cart);
        sItems.textContent = String(t.itemsCount);
        sSubtotal.textContent = money(t.subtotal);
        sDiscount.textContent = `- ${money(t.discount)}`;
        sVoucher.textContent = t.voucher ? `-${t.voucher.percent}% (${t.voucher.id})` : "—";
        sTotal.textContent = money(t.finalTotal);
    }

    function setError(name, msg) {
        const el = document.querySelector(`[data-err="${name}"]`);
        if (el) el.textContent = msg || "";
    }

    function setFormMsg(text, isError = false) {
        const el = document.querySelector("[data-form-msg]");
        if (!el) return;
        el.textContent = text || "";
        el.classList.toggle("error", !!isError);
    }

    function validate(form) {
        let ok = true;

        const fullName = form.fullName.value.trim();
        const phone = form.phone.value.trim();
        const email = form.email.value.trim();
        const city = form.city.value.trim();
        const address = form.address.value.trim();

        setError("fullName", "");
        setError("phone", "");
        setError("email", "");
        setError("city", "");
        setError("address", "");

        if (fullName.length < 3) { setError("fullName", "Enter full name."); ok = false; }
        if (phone.length < 6) { setError("phone", "Enter valid phone."); ok = false; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { setError("email", "Enter valid email."); ok = false; }
        if (city.length < 2) { setError("city", "Enter city."); ok = false; }
        if (address.length < 5) { setError("address", "Enter address."); ok = false; }

        return ok;
    }

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function saveOrder(order) {
        writeJson(KEY_LAST_ORDER, order);

        const orders = readJson(KEY_ORDERS, []);
        const next = Array.isArray(orders) ? orders : [];
        next.unshift(order);
        writeJson(KEY_ORDERS, next);

        if (typeof window.Store.addOrder === "function") {
            window.Store.addOrder(order);
        }
        if (typeof window.Store.setLastOrder === "function") {
            window.Store.setLastOrder(order);
        }
    }

    function placeOrder(form) {
        const cart = getCart();
        if (!cart.length) {
            setFormMsg("Your cart is empty.", true);
            return;
        }

        const totals = calcTotals(cart);
        const payment = form.payment.value;

        const userBefore = window.Store.getUser();
        const walletBefore = round2(userBefore.wallet);

        if (payment === "wallet") {
            if (walletBefore < totals.finalTotal) {
                setFormMsg(
                    `Insufficient wallet balance. You need ${money(totals.finalTotal)}, but you have ${money(walletBefore)}.`,
                    true
                );
                return;
            }
        }

        const voucherId = getAppliedVoucherId();

        const items = cart.map(row => {
            const p = findProduct(row.productId);
            if (!p) return null;
            const unit = window.Store.discountedPrice(p);
            const qty = Number(row.qty || 0);
            return {
                productId: p.id,
                name: p.name,
                image: p.image,
                qty,
                unitPrice: round2(unit),
                lineTotal: round2(Number(unit) * qty)
            };
        }).filter(Boolean);

        if (!items.length) {
            setFormMsg("Cannot place order: products not found.", true);
            return;
        }

        const order = {
            id: `ORD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            customer: {
                fullName: form.fullName.value.trim(),
                phone: form.phone.value.trim(),
                email: form.email.value.trim(),
                city: form.city.value.trim(),
                address: form.address.value.trim(),
                note: (form.note.value || "").trim()
            },
            payment,
            voucherId,
            items,
            totals: {
                itemsCount: totals.itemsCount,
                subtotal: totals.subtotal,
                productDiscount: totals.discount,
                voucherDiscount: totals.voucherDiscount,
                totalAfterProductDiscount: totals.total,
                finalTotal: totals.finalTotal
            },
            walletBefore,
            walletAfter: payment === "wallet"
                ? round2(walletBefore - totals.finalTotal)
                : walletBefore
        };

        if (payment === "wallet") {
            const updated = window.Store.getUser();
            updated.wallet = order.walletAfter;
            window.Store.setUser(updated);
            window.UI?.updateHeader?.();
        }

        saveOrder(order);

        window.Store.setCart([]);
        window.Store.setAppliedVoucher?.(null);
        window.UI?.updateHeader?.();

        location.href = "../SuccessPage/successPage.html";
    }

    function initPaymentSelect() {
        const select = document.querySelector('[data-select="payment"]');
        const native = document.querySelector('select[name="payment"]');
        if (!select || !native) return;

        const btn = select.querySelector(".select__btn");
        const valueEl = select.querySelector("[data-select-value]");
        const options = Array.from(select.querySelectorAll(".select__option"));

        function setValue(val) {
            native.value = val;
            const opt = options.find(o => o.dataset.value === val);
            valueEl.textContent = opt ? opt.textContent.trim() : val;
        }

        setValue(native.value || "wallet");

        btn.addEventListener("click", () => {
            select.classList.toggle("open");
            btn.setAttribute("aria-expanded", select.classList.contains("open") ? "true" : "false");
        });

        options.forEach(opt => {
            opt.addEventListener("click", () => {
                setValue(opt.dataset.value);
                select.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
            });
        });

        document.addEventListener("click", (e) => {
            if (select.contains(e.target)) return;
            select.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                select.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!window.Store) {
            console.error("Store missing. Ensure store.js is loaded before checkoutPage.js");
            return;
        }

        window.Store.ensureSeed();
        window.UI?.updateHeader?.();

        renderSummary();
        initPaymentSelect();

        const form = document.getElementById("checkoutForm");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            setFormMsg("");

            if (!validate(form)) {
                setFormMsg("Please fix the errors above.", true);
                return;
            }

            placeOrder(form);
        });
    });
})();
