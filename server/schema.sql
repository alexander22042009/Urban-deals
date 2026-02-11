PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  desc TEXT NOT NULL,
  price REAL NOT NULL,
  discountPct INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  wallet REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  percent INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_vouchers (
  userId INTEGER NOT NULL,
  voucherId TEXT NOT NULL,
  PRIMARY KEY (userId, voucherId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (voucherId) REFERENCES vouchers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  fullName TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  payment TEXT NOT NULL,
  voucherId TEXT,
  subtotal REAL NOT NULL,
  productDiscount REAL NOT NULL,
  voucherDiscount REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (voucherId) REFERENCES vouchers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  productId INTEGER NOT NULL,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unitPrice REAL NOT NULL,
  lineTotal REAL NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO users (id, firstName, lastName, wallet)
VALUES (1, 'John', 'Doe', 120.0);

INSERT OR IGNORE INTO vouchers (id, title, percent) VALUES
('V10', 'Voucher 10%', 10),
('V15', 'Voucher 15%', 15),
('V25', 'Voucher 25%', 25);

INSERT OR IGNORE INTO user_vouchers (userId, voucherId) VALUES
(1, 'V10'), (1, 'V15'), (1, 'V25');

INSERT OR IGNORE INTO products (id, name, desc, price, discountPct, image) VALUES
(1, 'Wireless Earbuds X200', '...', 120, 25, 'earbuds.jpg'),
(2, 'Smart Watch Fit Pro', '...', 180, 15, 'watch.jpg'),
(3, 'LED Desk Lamp Minimal', '...', 75, 30, 'lamp.jpg'),
(4, 'Power Bank 20 000mAh', '...', 90, 10, 'powerbank.jpg'),
(5, 'Bluetooth Speaker Mini', '...', 110, 20, 'speaker.jpg'),
(6, 'Thermo Mug Steel 450ml', '...', 45, 0, 'mug.jpg'),
(7, 'Fitness Resistance Bands', '...', 35, 10, 'bands.jpg'),
(8, 'Smart Body Scale', '...', 85, 18, 'scale.jpg');
