const express = require("express");
const cors = require("cors");
const { initDb, all, get, run } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

let db;

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/api/products", async (req, res) => {
    try {
        const rows = await all(db, "SELECT * FROM products ORDER BY id");
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.get("/api/user", async (req, res) => {
    try {
        const user = await get(db, "SELECT * FROM users WHERE id = 1");
        const vouchers = await all(
            db,
            `SELECT v.id, v.title, v.percent
       FROM vouchers v
       JOIN user_vouchers uv ON uv.voucherId = v.id
       WHERE uv.userId = 1
       ORDER BY v.percent`
        );
        res.json({ ...user, vouchers });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.get("/api/orders", async (req, res) => {
    try {
        const rows = await all(
            db,
            "SELECT * FROM orders WHERE userId = 1 ORDER BY createdAt DESC"
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.get("/api/orders/:id", async (req, res) => {
    try {
        const order = await get(
            db,
            "SELECT * FROM orders WHERE id = ? AND userId = 1",
            [req.params.id]
        );
        if (!order) return res.status(404).json({ error: "Order not found" });

        const items = await all(
            db,
            "SELECT * FROM order_items WHERE orderId = ? ORDER BY id",
            [req.params.id]
        );

        res.json({ ...order, items });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.post("/api/orders", async (req, res) => {
    try {
        const o = req.body;

        if (!o?.id || !Array.isArray(o.items) || o.items.length === 0) {
            return res.status(400).json({ error: "Invalid order payload" });
        }

        await run(
            db,
            `INSERT INTO orders
       (id, userId, createdAt, fullName, phone, email, city, address, note, payment, voucherId,
        subtotal, productDiscount, voucherDiscount, total)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                o.id,
                o.createdAt,
                o.customer?.fullName || "",
                o.customer?.phone || "",
                o.customer?.email || "",
                o.customer?.city || "",
                o.customer?.address || "",
                o.customer?.note || "",
                o.payment || "cash",
                o.voucherId || null,
                Number(o.totals?.subtotal || 0),
                Number(o.totals?.productDiscount || 0),
                Number(o.totals?.voucherDiscount || 0),
                Number(o.totals?.finalTotal || 0),
            ]
        );

        for (const it of o.items) {
            await run(
                db,
                `INSERT INTO order_items
         (orderId, productId, name, image, qty, unitPrice, lineTotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    o.id,
                    Number(it.productId),
                    it.name || "",
                    it.image || "placeholder.jpg",
                    Number(it.qty || 1),
                    Number(it.unitPrice || 0),
                    Number(it.lineTotal || 0),
                ]
            );
        }

        if (o.payment === "wallet" && typeof o.walletAfter === "number") {
            await run(db, "UPDATE users SET wallet = ? WHERE id = 1", [o.walletAfter]);
        }

        res.status(201).json({ ok: true, id: o.id });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

const PORT = 3001;

initDb()
    .then((_db) => {
        db = _db;
        app.listen(PORT, () => {
            console.log(`API running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("DB init failed:", err);
        process.exit(1);
    });
