'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Eye } from 'lucide-react';
import type { PurchaseOrder, Supplier, Item } from '@/types';

type POWithSupplier = PurchaseOrder & { suppliers?: Supplier };

export default function PurchasingPage() {
  const [orders, setOrders] = useState<POWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [poItems, setPOItems] = useState<any[]>([]);
  const [newPO, setNewPO] = useState({ po_number: `PO-${Date.now()}`, supplier_id: '', expected_date: '', status: 'PENDING' as const });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });
  const [lineItems, setLineItems] = useState([{ item_id: '', quantity: 1, unit_price: 0 }]);

  const load = async () => {
    setLoading(true);
    const [posRes, supRes, itemsRes] = await Promise.all([
      supabase.from('purchase_orders').select('*, suppliers(*)').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('items').select('*').order('name'),
    ]);
    setOrders((posRes.data as any) || []);
    setSuppliers(supRes.data || []);
    setItems(itemsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const viewPO = async (id: string) => {
    const { data } = await supabase.from('purchase_order_items').select('*, items(*)').eq('po_id', id);
    setPOItems(data || []);
    setSelectedPO(id);
  };

  const createPO = async () => {
    const { data: po, error } = await supabase.from('purchase_orders').insert(newPO).select().single();
    if (error) { toast.error(error.message); return; }
    const validLines = lineItems.filter((l) => l.item_id);
    if (validLines.length > 0) {
      await supabase.from('purchase_order_items').insert(validLines.map((l) => ({ ...l, po_id: po.id })));
    }
    const total = validLines.reduce((a, l) => a + l.quantity * l.unit_price, 0);
    await supabase.from('purchase_orders').update({ total_amount: total }).eq('id', po.id);
    toast.success('Purchase order created!');
    setShowPOModal(false);
    setLineItems([{ item_id: '', quantity: 1, unit_price: 0 }]);
    setNewPO({ po_number: `PO-${Date.now()}`, supplier_id: '', expected_date: '', status: 'PENDING' });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('purchase_orders').update({ status, ...(status === 'RECEIVED' ? { received_date: new Date().toISOString().split('T')[0] } : {}) }).eq('id', id);
    toast.success('Status updated!');
    load();
  };

  const addSupplier = async () => {
    const { error } = await supabase.from('suppliers').insert(newSupplier);
    if (error) { toast.error(error.message); return; }
    toast.success('Supplier added!');
    setShowSupplierModal(false);
    setNewSupplier({ name: '', contact_person: '', email: '', phone: '', address: '' });
    load();
  };

  const statusColor: Record<string, string> = {
    PENDING: 'badge-yellow', APPROVED: 'badge-blue', RECEIVED: 'badge-green', CANCELLED: 'badge-red',
  };

  const filtered = orders.filter((o) =>
    o.po_number.toLowerCase().includes(search.toLowerCase()) ||
    o.suppliers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOrder = orders.find((o) => o.id === selectedPO);

  return (
    <div style={{ padding: 32, maxWidth: 1400 }} className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchasing</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>Manage purchase orders and suppliers</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /></button>
          <button className="btn btn-secondary" onClick={() => setShowSupplierModal(true)}><Plus size={14} /> Add Supplier</button>
          <button className="btn btn-primary" onClick={() => setShowPOModal(true)}><Plus size={14} /> New PO</button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search PO number or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>PO Number</th><th>Supplier</th><th>Status</th><th>Order Date</th><th>Expected</th><th>Total</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>No purchase orders</td></tr>
            ) : filtered.map((po) => (
              <tr key={po.id}>
                <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{po.po_number}</td>
                <td style={{ fontWeight: 500 }}>{po.suppliers?.name || '—'}</td>
                <td>
                  <select
                    value={po.status}
                    onChange={(e) => updateStatus(po.id, e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer' }}
                  >
                    {['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ color: '#64748b' }}>{po.order_date}</td>
                <td style={{ color: '#64748b' }}>{po.expected_date || '—'}</td>
                <td style={{ fontWeight: 500 }}>₱{(po.total_amount || 0).toLocaleString()}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => viewPO(po.id)}>
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PO Detail Modal */}
      {selectedPO && selectedOrder && (
        <Modal title={`PO: ${selectedOrder.po_number}`} onClose={() => setSelectedPO(null)}>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Supplier: <strong>{selectedOrder.suppliers?.name || 'N/A'}</strong></p>
          <table className="data-table">
            <thead><tr><th>Item</th><th>SKU</th><th>Ordered</th><th>Received</th><th>Price</th></tr></thead>
            <tbody>
              {poItems.map((i) => (
                <tr key={i.id}>
                  <td>{i.items?.name}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{i.items?.sku}</td>
                  <td>{i.quantity}</td>
                  <td>{i.received_qty}</td>
                  <td>₱{(i.unit_price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {/* New PO Modal */}
      {showPOModal && (
        <Modal title="Create Purchase Order" onClose={() => setShowPOModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="PO Number">
              <input className="input" value={newPO.po_number} onChange={(e) => setNewPO({ ...newPO, po_number: e.target.value })} />
            </Field>
            <Field label="Supplier">
              <select className="input" value={newPO.supplier_id} onChange={(e) => setNewPO({ ...newPO, supplier_id: e.target.value })}>
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Expected Date">
              <input className="input" type="date" value={newPO.expected_date} onChange={(e) => setNewPO({ ...newPO, expected_date: e.target.value })} />
            </Field>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Line Items</p>
              {lineItems.map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <select className="input" value={line.item_id} onChange={(e) => { const l = [...lineItems]; l[idx].item_id = e.target.value; setLineItems(l); }}>
                    <option value="">Item...</option>
                    {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <input className="input" type="number" min={1} placeholder="Qty" value={line.quantity} onChange={(e) => { const l = [...lineItems]; l[idx].quantity = +e.target.value; setLineItems(l); }} />
                  <input className="input" type="number" min={0} step="0.01" placeholder="Price" value={line.unit_price} onChange={(e) => { const l = [...lineItems]; l[idx].unit_price = +e.target.value; setLineItems(l); }} />
                  <button onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => setLineItems([...lineItems, { item_id: '', quantity: 1, unit_price: 0 }])}>
                <Plus size={12} /> Add Line
              </button>
            </div>
            <button className="btn btn-primary" onClick={createPO}>Create Purchase Order</button>
          </div>
        </Modal>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <Modal title="Add Supplier" onClose={() => setShowSupplierModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(['name', 'contact_person', 'email', 'phone', 'address'] as const).map((f) => (
              <Field key={f} label={f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}>
                <input className="input" value={newSupplier[f]} onChange={(e) => setNewSupplier({ ...newSupplier, [f]: e.target.value })} />
              </Field>
            ))}
            <button className="btn btn-primary" onClick={addSupplier}>Add Supplier</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-in" style={{ width: 560, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
