CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  pickup_preference TEXT,
  customer_note TEXT,
  items_json TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  payment_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'creating'
);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
