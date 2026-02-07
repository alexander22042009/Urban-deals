document.addEventListener("DOMContentLoaded", () => {
  const host = document.querySelector("[data-product]");
  if (!host) return;

  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));

  if (!id) {
    host.innerHTML = "<p>Product not found.</p>";
    return;
  }

  const product = window.Store.getProducts().find(p => p.id === id);
  if (!product) {
    host.innerHTML = "<p>Product not found.</p>";
    return;
  }

  const hasDisc = (product.discountPct || 0) > 0;
  const price = window.Store.discountedPrice(product);
  const img = `/assets/images/products/${product.image}`;

  host.innerHTML = `
    <div class="product-detail">
      <div class="product-detail__img">
        <img src="${img}" alt="${product.name}">
      </div>

      <div class="product-detail__info">
        <h1>${product.name}</h1>
        <p class="desc">${product.desc}</p>

        <div class="price">
          ${hasDisc ? `<span class="old">${window.Store.money(product.price)}</span>` : ""}
          <span class="new">${window.Store.money(price)}</span>
        </div>

        <div class="actions">
          <button class="btn primary" id="addToCart">Add to cart</button>
          <a href="../ShopPage/shopPage.html" class="btn">Back to shop</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById("addToCart").addEventListener("click", () => {
    const cart = window.Store.getCart();
    const item = cart.find(x => x.productId === id);
    if (item) item.qty++;
    else cart.push({ productId: id, qty: 1 });
    window.Store.setCart(cart);
    window.UI.updateHeader();
  });
});
