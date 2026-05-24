-- ============================================
-- SUPPLY CHAIN MANAGEMENT SYSTEM SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ITEMS / PRODUCTS
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  reorder_level INT DEFAULT 10,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY (current stock)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  location TEXT DEFAULT 'MAIN',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ADD CONSTRAINT IF NOT EXISTS inventory_item_unique UNIQUE(item_id);

-- INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  type TEXT CHECK (type IN ('RECEIVE','ISSUE','ADJUST')),
  quantity INT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','RECEIVED','CANCELLED')),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  total_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2),
  received_qty INT DEFAULT 0
);

-- CUSTOMER ORDERS
CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW','PROCESSING','PICKED','SHIPPED','DELIVERED','CANCELLED')),
  order_date DATE DEFAULT CURRENT_DATE,
  required_date DATE,
  total_amount DECIMAL(12,2),
  source TEXT DEFAULT 'MANUAL',
  ocr_raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2)
);

-- SHIPMENTS / LOGISTICS
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES customer_orders(id),
  carrier TEXT,
  status TEXT DEFAULT 'PREPARING' CHECK (status IN ('PREPARING','IN_TRANSIT','DELIVERED','RETURNED')),
  shipped_date DATE,
  delivered_date DATE,
  current_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT,
  location TEXT,
  remarks TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update inventory trigger
CREATE OR REPLACE FUNCTION update_inventory_on_txn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'RECEIVE' THEN
    INSERT INTO inventory(item_id, quantity)
    VALUES (NEW.item_id, NEW.quantity)
    ON CONFLICT (item_id) DO UPDATE 
      SET quantity = inventory.quantity + NEW.quantity, updated_at = NOW();
  ELSIF NEW.type = 'ISSUE' THEN
    UPDATE inventory 
      SET quantity = quantity - NEW.quantity, updated_at = NOW()
    WHERE item_id = NEW.item_id;
  ELSIF NEW.type = 'ADJUST' THEN
    UPDATE inventory 
      SET quantity = NEW.quantity, updated_at = NOW()
    WHERE item_id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_update ON inventory_transactions;
CREATE TRIGGER trg_inventory_update
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_inventory_on_txn();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (for demo; restrict in production)
CREATE POLICY "Allow all" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON customer_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON customer_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON shipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON shipment_tracking FOR ALL USING (true) WITH CHECK (true);
