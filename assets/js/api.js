(function () {
    "use strict";

    const API_BASE = "http://localhost:3001";

    async function json(url, options) {
        const res = await fetch(url, options);
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
        }
        return res.json();
    }

    window.Api = {
        getProducts: () => json(`${API_BASE}/api/products`),
        getUser: () => json(`${API_BASE}/api/user`),
        getOrders: () => json(`${API_BASE}/api/orders`),
        getOrder: (id) => json(`${API_BASE}/api/orders/${encodeURIComponent(id)}`),
        createOrder: (order) =>
            json(`${API_BASE}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(order),
            }),
    };
})();
