export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  reorder_level: number;
  unit_cost: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface InventoryRecord {
  id: string;
  item_id: string;
  quantity: number;
  location: string;
  updated_at: string;
  items?: Item;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: 'RECEIVE' | 'ISSUE' | 'ADJUST';
  quantity: number;
  reference?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  items?: Item;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_amount?: number;
  created_at: string;
  suppliers?: Supplier;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  item_id: string;
  quantity: number;
  unit_price?: number;
  received_qty: number;
  items?: Item;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_id?: string;
  status: 'NEW' | 'PROCESSING' | 'PICKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  order_date: string;
  required_date?: string;
  total_amount?: number;
  source: 'MANUAL' | 'OCR';
  ocr_raw_text?: string;
  created_at: string;
  customers?: Customer;
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price?: number;
  items?: Item;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  order_id?: string;
  carrier?: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  shipped_date?: string;
  delivered_date?: string;
  current_location?: string;
  notes?: string;
  created_at: string;
  customer_orders?: CustomerOrder;
}

export interface ShipmentTracking {
  id: string;
  shipment_id: string;
  status: string;
  location?: string;
  remarks?: string;
  timestamp: string;
}
