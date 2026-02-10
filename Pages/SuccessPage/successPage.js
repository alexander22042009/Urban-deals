(function () {
    "use strict";

    const IMG_BASE = "/assets/images/products/";
    const PLACEHOLDER = `${IMG_BASE}placeholder.jpg`;

    const ORDER_KEYS = [
        "ud_last_order",
        "ud_lastOrder",
        "last_order",
        "lastOrder",
        "order_last"
    ];

    function money(v) {
        return window.Store?.money ? window.Store.money(v) : `€${Number(v || 0).toFixed(2)}`;
    }

    function fmtDate(iso) {
        try {
            return new Date(iso).toLocaleString("bg-BG");
        } catch {
            return iso || "—";
        }
    }

    function loadOrder() {
        for (const key of ORDER_KEYS) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const data = JSON.parse(raw);
                if (data && typeof data === "object") return data;
            } catch { }
        }
        return null;
    }

    function paymentLabel(v) {
        if (v === "wallet") return "Wallet balance";
        if (v === "cash") return "Cash on delivery";
        return v || "—";
    }

    function safeText(v) {
        return (v ?? "").toString().trim() || "—";
    }

    function render() {
        const host = document.querySelector("[data-order-card]");
        if (!host) return;

        const order = loadOrder();

        if (!order) {
            host.innerHTML = `
        <h2 style="margin:0 0 8px;">Order details</h2>
        <p style="opacity:.75;margin:0 0 10px;">
          No recent order found. Please place an order from Checkout first.
        </p>
        <a class="btn primary" href="../ShopPage/shopPage.html">Back to shop</a>
      `;
            return;
        }

        const id = order.id || order.orderId || `ORD-${Date.now()}`;
        const createdAt = order.createdAt || order.date || order.created || null;

        const customer = order.customer || order.delivery || {};
        const address = [
            customer.city,
            customer.address
        ].filter(Boolean).join(", ");

        const payment = paymentLabel(order.payment);

        const items = Array.isArray(order.items) ? order.items : [];
        const totals = order.totals || {};

        const finalTotal = totals.finalTotal ?? totals.total ?? order.finalTotal ?? 0;

        host.innerHTML = `
      <div class="order-top">
        <div>
          <h2 class="order-title">Order ${id}</h2>
          <div class="order-meta">${createdAt ? fmtDate(createdAt) : ""}</div>
        </div>
        <span class="badge">Payment: ${payment}</span>
      </div>

      <div class="notice">
        We will deliver your items in <strong>3-5 days</strong>.
      </div>

      <div class="order-grid">
        <div class="order-box">
          <div class="lbl">Delivery to</div>
          <div class="val">${safeText(customer.fullName)}</div>
          <div class="muted">${safeText(address)}</div>
          <div class="muted">${safeText(customer.phone)}</div>
          <div class="muted">${safeText(customer.email)}</div>
        </div>

        <div class="order-box">
          <div class="lbl">Payment method</div>
          <div class="val">${payment}</div>
          <div class="muted">Voucher: ${order.voucherId || "—"}</div>
          <div class="muted">Items: ${totals.itemsCount ?? items.reduce((a, x) => a + (x.qty || 0), 0)}</div>
        </div>
      </div>

      <h3 class="section-title">Items</h3>

      <div class="items">
        ${items.length ? items.map(it => {
            const img = `${IMG_BASE}${it.image || "placeholder.jpg"}`;
            const qty = Number(it.qty || 0);
            const unit = Number(it.unitPrice ?? it.price ?? 0);
            const line = Number(it.lineTotal ?? (unit * qty) ?? 0);

            return `
            <div class="item">
              <div class="item-left">
                <div class="thumb">
                  <img src="${img}" alt="${safeText(it.name)}"
                       onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
                </div>
                <div>
                  <div class="item-name">${safeText(it.name)}</div>
                  <div class="item-meta">Qty: <strong>${qty}</strong> • ${money(unit)} / item</div>
                </div>
              </div>
              <div class="item-right">
                <div class="item-sum">${money(line)}</div>
              </div>
            </div>
          `;
        }).join("") : `
          <p style="opacity:.75;margin:0;">No items found in this order.</p>
        `}
      </div>

      <div class="totals">
        <div class="r"><span>Subtotal</span><span>${money(totals.subtotal ?? 0)}</span></div>
        <div class="r"><span>Product discount</span><span>- ${money(totals.productDiscount ?? totals.discount ?? 0)}</span></div>
        <div class="r"><span>Voucher discount</span><span>- ${money(totals.voucherDiscount ?? 0)}</span></div>
        <div class="r total"><span>Total</span><span>${money(finalTotal)}</span></div>
      </div>
    `;
    }

    document.addEventListener("DOMContentLoaded", () => {
        window.Store?.ensureSeed?.();
        window.UI?.updateHeader?.();
        render();
    });
})();
