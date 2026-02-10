(function () {
  "use strict";

  const IMG_BASE = "/assets/images/products/";
  const PLACEHOLDER = `${IMG_BASE}placeholder.jpg`;

  function money(v) {
    return window.Store.money(v);
  } 

  function getCart() {
    return window.Store.getCart();
  }

  function setCart(cart) {
    window.Store.setCart(cart);
    window.UI?.updateHeader?.();
  }

  function findProduct(id) {
    return window.Store.getProducts().find((p) => p.id === id) || null;
  }

  function getAppliedVoucherId() {
    return window.Store.getAppliedVoucher();
  }

  function setAppliedVoucherId(idOrNull) {
    window.Store.setAppliedVoucher(idOrNull);
  }

  function getVoucherById(id) {
    return window.Store.getVouchers().find((v) => v.id === id) || null;
  }

  function lineTotals(cart) {
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

    return {
      itemsCount,
      subtotal,
      discount,
      total,
      voucher,
      voucherDiscount,
      finalTotal,
    };
  }

  function setVoucherMessage(text, isError = false) {
    const msg = document.querySelector("[data-voucher-msg]");
    if (!msg) return;

    msg.textContent = text || "";
    msg.classList.toggle("error", !!isError);
  }

  function renderVouchers() {
    const host = document.querySelector("[data-voucher-list]");
    if (!host) return;

    const vouchers = window.Store.getVouchers();
    const applied = getAppliedVoucherId();

    host.innerHTML = vouchers
      .map((v) => {
        const checked = applied === v.id ? "checked" : "";
        return `
          <label class="voucher-item">
            <div class="voucher-left">
              <input type="checkbox" data-voucher="${v.id}" ${checked}>
              <div>
                <div><strong>${v.title}</strong></div>
                <div style="opacity:.75;font-size:13px;">Code: ${v.id}</div>
              </div>
            </div>
            <span class="badge sale">-${v.percent}%</span>
          </label>
        `;
      })
      .join("");

    setVoucherMessage(applied ? `Applied: ${applied}` : "", false);
  }

  function updateSummary(cart) {
    const { itemsCount, subtotal, discount, voucher, finalTotal } = lineTotals(cart);

    const elItems = document.querySelector("[data-summary-items]");
    const elSubtotal = document.querySelector("[data-summary-subtotal]");
    const elDiscount = document.querySelector("[data-summary-discount]");
    const elVoucher = document.querySelector("[data-summary-voucher]");
    const elTotal = document.querySelector("[data-summary-total]");

    if (elItems) elItems.textContent = String(itemsCount);
    if (elSubtotal) elSubtotal.textContent = money(subtotal);
    if (elDiscount) elDiscount.textContent = `- ${money(discount)}`;
    if (elVoucher) elVoucher.textContent = voucher ? `-${voucher.percent}% (${voucher.id})` : "—";
    if (elTotal) elTotal.textContent = money(finalTotal);
  }

  function render() {
    const listHost = document.querySelector("[data-cart-list]");
    const emptyEl = document.querySelector("[data-cart-empty]");

    if (!listHost) {
      console.error("Missing [data-cart-list] in cartPage.html");
      return;
    }
    if (!emptyEl) {
      console.warn("Missing [data-cart-empty] in cartPage.html (empty message will not toggle)");
    }

    const cart = getCart();
    const hasItems = cart.length > 0;

    if (emptyEl) emptyEl.hidden = hasItems;

    listHost.innerHTML = "";

    if (!hasItems) {
      updateSummary([]);
      return;
    }

    const html = cart
      .map((row) => {
        const p = findProduct(row.productId);
        if (!p) return "";

        const hasDisc = (p.discountPct || 0) > 0;
        const sale = window.Store.discountedPrice(p);
        const img = `${IMG_BASE}${p.image || "placeholder.jpg"}`;

        return `
          <article class="cart-item" data-row="${p.id}">
            <div class="cart-item__img">
              <img src="${img}" alt="${p.name}"
                   onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
            </div>

            <div class="cart-item__main">
              <div class="cart-item__title">
                <a href="../ProductPage/productPage.html?id=${p.id}">${p.name}</a>
                ${hasDisc ? `<span class="badge sale">-${p.discountPct}%</span>` : ``}
              </div>

              <div class="cart-item__meta">${p.desc || ""}</div>

              <div class="cart-item__price">
                ${hasDisc ? `<span class="old">${money(p.price)}</span>` : ``}
                <span class="new">${money(sale)}</span>
              </div>
            </div>

            <div class="cart-item__actions">
              <div class="qty">
                <button class="btn qty__btn" data-dec="${p.id}" aria-label="Decrease">−</button>
                <span class="qty__val" data-qty="${p.id}">${row.qty}</span>
                <button class="btn qty__btn" data-inc="${p.id}" aria-label="Increase">+</button>
              </div>

              <button class="btn remove" data-remove="${p.id}">Remove</button>
            </div>
          </article>
        `;
      })
      .join("");

    listHost.innerHTML = html;
    updateSummary(cart);
  }

  function changeQty(productId, delta) {
    const cart = getCart();
    const row = cart.find((x) => x.productId === productId);
    if (!row) return;

    row.qty = Math.max(1, (row.qty || 1) + delta);
    setCart(cart);
    render();
  }

  function removeRow(productId) {
    let cart = getCart();
    cart = cart.filter((x) => x.productId !== productId);
    setCart(cart);
    render();
  }

  function clearCart() {
    setCart([]);
    setAppliedVoucherId(null);
    setVoucherMessage("", false);
    renderVouchers();
    render();
  }

  function handleVoucherChange(changedEl) {
    const all = Array.from(document.querySelectorAll("[data-voucher]"));
    const checked = all.filter((x) => x.checked);

    if (checked.length > 1) {
      all.forEach((x) => {
        if (x !== changedEl) x.checked = false;
      });
      setVoucherMessage("Може да използваш само 1 ваучер наведнъж.", true);
    } else {
      setVoucherMessage(changedEl.checked ? `Applied: ${changedEl.dataset.voucher}` : "", false);
    }

    const appliedId = changedEl.checked ? changedEl.dataset.voucher : null;
    setAppliedVoucherId(appliedId);

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.Store) {
      console.error("Store not loaded. Check script order: store.js must be before cartPage.js");
      return;
    }

    if (
      typeof window.Store.getVouchers !== "function" ||
      typeof window.Store.getAppliedVoucher !== "function" ||
      typeof window.Store.setAppliedVoucher !== "function"
    ) {
      console.error(
        "Voucher API missing in Store. Add getVouchers/getAppliedVoucher/setAppliedVoucher to assets/js/store.js"
      );
      return;
    }

    window.Store.ensureSeed();
    window.UI?.updateHeader?.();

    document.addEventListener("click", (e) => {
      const inc = e.target.closest("[data-inc]");
      if (inc) return changeQty(Number(inc.dataset.inc), +1);

      const dec = e.target.closest("[data-dec]");
      if (dec) return changeQty(Number(dec.dataset.dec), -1);

      const rem = e.target.closest("[data-remove]");
      if (rem) return removeRow(Number(rem.dataset.remove));

      const clr = e.target.closest("[data-clear-cart]");
      if (clr) return clearCart();

      const checkout = e.target.closest("[data-checkout]");
      if (checkout) {
        const cart = getCart();
        if (!cart.length) {
          setVoucherMessage("Количката е празна.", true);
          return;
        }
        location.href = "../CheckoutPage/checkoutPage.html";
      }
    });

    document.addEventListener("change", (e) => {
      const box = e.target.closest("[data-voucher]");
      if (!box) return;
      handleVoucherChange(box);
    });

    renderVouchers();
    render();
  });
})();
