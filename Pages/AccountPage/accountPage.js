(function () {
    "use strict";

    function money(v) {
        return window.Store.money(v);
    }

    function cartItemsCount(cart) {
        return (cart || []).reduce((sum, r) => sum + (r.qty || 0), 0);
    }

    function fmtDate(iso) {
        try {
            return new Date(iso).toLocaleString("bg-BG");
        } catch {
            return "";
        }
    }

    function renderProfile() {
        const user = window.Store.getUser();
        const cart = window.Store.getCart();

        const name = user?.name || `${user?.firstName || "John"} ${user?.lastName || "Doe"}`.trim();
        const wallet = user?.wallet ?? 0;

        document.querySelector("[data-acc-name]").textContent = name;
        document.querySelector("[data-acc-wallet]").textContent = money(wallet);
        document.querySelector("[data-acc-cart-items]").textContent = String(cartItemsCount(cart));
    }

    function renderVouchers() {
        const host = document.querySelector("[data-voucher-list]");
        const status = document.querySelector("[data-voucher-status]");
        if (!host) return;

        const vouchers = window.Store.getVouchers?.() || [];
        const applied = window.Store.getAppliedVoucher?.() || null;

        if (status) status.textContent = applied ? `Applied: ${applied}` : "";

        if (!vouchers.length) {
            host.innerHTML = `<div class="mini" style="opacity:.75">No vouchers available.</div>`;
            return;
        }

        host.innerHTML = vouchers
            .map((v) => {
                const isApplied = applied === v.id;
                return `
          <div class="voucher-item">
            <div class="voucher-left">
              <div class="voucher-title">${v.title}</div>
              <div class="voucher-code">Code: ${v.id}</div>
            </div>
            <span class="badge sale">-${v.percent}%${isApplied ? " ✓" : ""}</span>
          </div>
        `;
            })
            .join("");
    }

    function renderApplied() {
        const wrap = document.querySelector("[data-applied-wrap]");
        if (!wrap) return;

        const appliedId = window.Store.getAppliedVoucher?.() || null;
        if (!appliedId) {
            wrap.hidden = true;
            return;
        }

        const voucher = (window.Store.getVouchers?.() || []).find((v) => v.id === appliedId) || null;
        if (!voucher) {
            wrap.hidden = true;
            return;
        }

        wrap.hidden = false;
        document.querySelector("[data-applied-title]").textContent = voucher.title;
        document.querySelector("[data-applied-code]").textContent = `Code: ${voucher.id}`;
        document.querySelector("[data-applied-badge]").textContent = `-${voucher.percent}%`;
    }

    function renderOrders() {
        const host = document.querySelector("[data-orders-list]");
        const countEl = document.querySelector("[data-orders-count]");
        if (!host) return;

        const orders = window.Store.getOrders?.() || [];
        if (countEl) countEl.textContent = orders.length ? `${orders.length} orders` : "No orders";

        if (!orders.length) {
            host.innerHTML = `<div class="mini" style="opacity:.75">No orders yet.</div>`;
            return;
        }

        host.innerHTML = orders
            .map((o) => {
                const pay = o.payment === "wallet" ? "Wallet" : "Cash";
                const total = o.totals?.finalTotal ?? 0;
                return `
          <div class="order-item" data-order-id="${o.id}">
            <div class="order-left">
              <div class="order-id">${o.id}</div>
              <div class="order-meta">${fmtDate(o.createdAt)} • ${pay}</div>
            </div>
            <div class="order-total">${money(total)}</div>
          </div>
        `;
            })
            .join("");
    }

    function wireActions() {
        document.addEventListener("click", (e) => {
            const clear = e.target.closest("[data-clear-applied]");
            if (clear) {
                window.Store.setAppliedVoucher?.(null);
                window.UI?.updateHeader?.();
                renderVouchers();
                renderApplied();
                return;
            }

            const item = e.target.closest("[data-order-id]");
            if (item) {
                const id = item.dataset.orderId;
                const orders = window.Store.getOrders?.() || [];
                const ord = orders.find((x) => x.id === id);
                if (ord) {
                    window.Store.setLastOrder?.(ord);
                    localStorage.setItem("ud_last_order", JSON.stringify(ord));
                    location.href = "../SuccessPage/success.html";
                }
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!window.Store) {
            console.error("Store missing. Ensure store.js is loaded before accountPage.js");
            return;
        }

        window.Store.ensureSeed();
        window.UI?.updateHeader?.();

        renderProfile();
        renderVouchers();
        renderApplied();
        renderOrders();
        wireActions();
    });
})();
