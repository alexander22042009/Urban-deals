// assets/js/common.js

(function () {
  "use strict";

  function updateHeader() {
    if (!window.Store) return;

    const u = window.Store.getUser();
    const count = window.Store.cartCount();

    document.querySelectorAll("[data-user-name]").forEach((el) => {
      el.textContent = `${u.firstName} ${u.lastName}`;
    });

    document.querySelectorAll("[data-user-wallet]").forEach((el) => {
      el.textContent = window.Store.money(u.wallet);
    });

    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(count);
    });
  }

  window.UI = { updateHeader };

  document.addEventListener("DOMContentLoaded", () => {
    if (window.Store) {
      window.Store.ensureSeed();
      updateHeader();
    }
  });
})();
