(function () {
    "use strict";

    const IMG_BASE = "/assets/images/products/";
    const PLACEHOLDER = `${IMG_BASE}placeholder.jpg`;

    function getCart() {
        return window.Store.getCart();
    }

    function setCart(cart) {
        window.Store.setCart(cart);
        if (window.UI && typeof window.UI.updateHeader === "function") {
            window.UI.updateHeader();
        }
    }

    function addToCart(productId, qty = 1) {
        const cart = getCart();
        const item = cart.find((x) => x.productId === productId);

        if (item) item.qty += qty;
        else cart.push({ productId, qty });

        setCart(cart);
    }

    function resolveImgSrc(p) {
        if (typeof p.image === "string" && (p.image.startsWith("/") || p.image.startsWith("http"))) {
            return p.image;
        }

        return `${IMG_BASE}${p.image || "placeholder.jpg"}`;
    }

    function renderProducts(list) {
        const host = document.querySelector("[data-products]");
        if (!host) return;

        host.innerHTML = list
            .map((p) => {
                const hasDisc = (p.discountPct || 0) > 0;
                const sale = window.Store.discountedPrice(p);

                const imgSrc = resolveImgSrc(p);

                return `
          <article class="card product">
            <div class="product__thumb">
              <img
                src="${imgSrc}"
                alt="${p.name}"
                loading="lazy"
                onerror="this.onerror=null;this.src='${PLACEHOLDER}'"
              >
            </div>

            <div class="product__title">
              <a href="../ProductPage/productPage.html?id=${p.id}">${p.name}</a>
              ${hasDisc ? `<span class="badge sale">-${p.discountPct}%</span>` : ``}
            </div>

            <div class="product__desc">${p.desc}</div>

            <div class="product__price">
              ${hasDisc ? `<span class="old">${window.Store.money(p.price)}</span>` : ``}
              <span class="new">${window.Store.money(sale)}</span>
            </div>

            <div class="product__actions">
              <button class="btn" data-view="${p.id}">View</button>
              <button class="btn primary" data-add="${p.id}">Add to cart</button>
            </div>
          </article>
        `;
            })
            .join("");
    }

    function applyFiltersAndRender() {
        const search = (document.querySelector("[data-search]")?.value || "")
            .trim()
            .toLowerCase();

        const sort = document.querySelector("[data-sort]")?.value || "discount";
        const onlyDiscount = !!document.querySelector("[data-only-discount]")?.checked;

        let list = window.Store.getProducts();

        if (search) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.desc.toLowerCase().includes(search)
            );
        }

        if (onlyDiscount) {
            list = list.filter((p) => (p.discountPct || 0) > 0);
        }

        const byName = (a, b) => a.name.localeCompare(b.name);
        const salePrice = (p) => window.Store.discountedPrice(p);

        switch (sort) {
            case "priceAsc":
                list = list.slice().sort((a, b) => salePrice(a) - salePrice(b));
                break;
            case "priceDesc":
                list = list.slice().sort((a, b) => salePrice(b) - salePrice(a));
                break;
            case "nameAsc":
                list = list.slice().sort((a, b) => byName(a, b));
                break;
            case "nameDesc":
                list = list.slice().sort((a, b) => byName(b, a));
                break;
            default:
                list = list
                    .slice()
                    .sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0));
                break;
        }

        renderProducts(list);
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!window.Store) {
            console.error(
                "window.Store is not loaded. Check script order in HTML: store.js must be before this file."
            );
            return;
        }

        window.Store.ensureSeed();
        if (window.UI && typeof window.UI.updateHeader === "function") {
            window.UI.updateHeader();
        }

        console.log("ShopPage JS loaded");
        console.log("Products:", window.Store.getProducts());

        const first = window.Store.getProducts()?.[0];
        if (first) console.log("First image URL:", resolveImgSrc(first));

        document
            .querySelector("[data-search]")
            ?.addEventListener("input", applyFiltersAndRender);

        document
            .querySelector("[data-sort]")
            ?.addEventListener("change", applyFiltersAndRender);

        document
            .querySelector("[data-only-discount]")
            ?.addEventListener("change", applyFiltersAndRender);

        const host = document.querySelector("[data-products]");
        if (host) {
            host.addEventListener("click", (e) => {
                const add = e.target.closest("[data-add]");
                if (add) {
                    addToCart(Number(add.dataset.add), 1);
                    return;
                }

                const view = e.target.closest("[data-view]");
                if (view) {
                    const id = Number(view.dataset.view);
                    location.href = `../ProductPage/productPage.html?id=${id}`;
                }
            });
        }

        applyFiltersAndRender();
    });
})();
