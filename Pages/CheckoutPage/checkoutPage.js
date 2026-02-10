(function () {
  "use strict";

  function money(v) { return window.Store.money(v); }
  function getCart() { return window.Store.getCart(); }

  function findProduct(id) {
    return window.Store.getProducts().find(p => p.id === id);
  }

  function getAppliedVoucherId() {
    return window.Store.getAppliedVoucher?.() ?? null;
  }

  function getVoucherById(id) {
    return window.Store.getVouchers?.().find(v => v.id === id) || null;
  }

  function calcTotals(cart) {
    let itemsCount = 0;
    let subtotal = 0;
    let total = 0;

    for (const row of cart) {
      const p = findProduct(row.productId);
      if (!p) continue;
      const qty = row.qty || 0;

      const sale = window.Store.discountedPrice(p);
      itemsCount += qty;
      subtotal += p.price * qty;
      total += sale * qty;
    }

    const discount = Math.max(0, subtotal - total);

    const appliedId = getAppliedVoucherId();
    const voucher = appliedId ? getVoucherById(appliedId) : null;

    let voucherDiscount = 0;
    let finalTotal = total;

    if (voucher) {
      voucherDiscount = Math.round(total * (voucher.percent / 100) * 100) / 100;
      finalTotal = Math.max(0, Math.round((total - voucherDiscount) * 100) / 100);
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

      return `
        <div class="sum-item">
          <div class="sum-left">
            <div class="name">${p.name}</div>
            <div class="meta">x${row.qty} • ${money(sale)} each</div>
          </div>
          <div class="sum-right">${money(sale * row.qty)}</div>
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
    el.classList.toggle("error", isError);
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

  function placeOrder(form) {
    const cart = getCart();
    if (!cart.length) {
      setFormMsg("Your cart is empty.", true);
      return;
    }

    const totals = calcTotals(cart);
    const payment = form.payment.value;

    if (payment === "wallet") {
      const user = window.Store.getUser();
      if (user.wallet < totals.finalTotal) {
        setFormMsg("Insufficient wallet balance. Choose cash or add funds.", true);
        return;
      }

      user.wallet = Math.round((user.wallet - totals.finalTotal) * 100) / 100;
      window.Store.setUser(user);
      window.UI?.updateHeader?.();
    }

    window.Store.setCart([]);
    window.Store.setAppliedVoucher?.(null);
    window.UI?.updateHeader?.();

    document.querySelector("[data-success]").hidden = false;
    document.querySelector(".checkout-layout").style.display = "none";
    document.querySelector(".hero__sub").textContent = "Thank you! Your order is confirmed.";
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
