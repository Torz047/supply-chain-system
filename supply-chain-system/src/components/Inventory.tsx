'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import type { Item, InventoryRecord } from '@/types';

type InventoryWithItem = InventoryRecord & { items: Item };

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState<'RECEIVE' | 'ISSUE'>('RECEIVE');
  const [newItem, setNewItem] = useState({ sku: '', name: '', unit: 'pcs', reorder_level: 10, unit_cost: 0 });
  const [txn, setTxn] = useState({ item_id: '', quantity: 1, reference: '', notes: '' });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*, items(*)')
      .order('updated_at', { ascending: false });
    setInventory((data as any) || []);
    const { data: itemsData } = await supabase.from('items').select('*').order('name');
    setItems(itemsData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = inventory.filter((i) =>
    i.items?.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.items?.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = async () => {
    const { error } = await supabase.from('items').insert(newItem);
    if (error) { toast.error(error.message); return; }
    toast.success('Item added!');
    setShowItemModal(false);
    setNewItem({ sku: '', name: '', unit: 'pcs', reorder_level: 10, unit_cost: 0 });
    load();
  };

  const addTransaction = async () => {
    const { error } = await supabase.from('inventory_transactions').insert({
      ...txn,
      type: txnType,
      created_by: 'system',
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${txnType === 'RECEIVE' ? 'Stock received' : 'Stock issued'} successfully!`);
    setShowTxnModal(false);
    setTxn({ item_id: '', quantity: 1, reference: '', notes: '' });
    load();
  };

  const stockLevel = (qty: number, reorder: number) => {
    if (qty === 0) return { label: 'Out of Stock', cls: 'badge-red' };
    if (qty <= reorder) return { label: 'Low Stock', cls: 'badge-yellow' };
    return { label: 'In Stock', cls: 'badge-green' };
  };

  return (
    <div style={{ padding: 32, maxWidth: 1400 }} className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>Manage stock levels and transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-secondary" onClick={() => { setTxnType('ISSUE'); setShowTxnModal(true); }}>
            <ArrowUpCircle size={14} /> Issue Stock
          </button>
          <button className="btn btn-secondary" onClick={() => { setTxnType('RECEIVE'); setShowTxnModal(true); }}>
            <ArrowDownCircle size={14} /> Receive Stock
          </button>
          <button className="btn btn-primary" onClick={() => setShowItemModal(true)}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          className="input"
          style={{ paddingLeft: 38 }}
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading inventory...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Qty on Hand</th>
                <th>Reorder Level</th>
                <th>Unit Cost</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>No items found</td></tr>
              ) : filtered.map((inv) => {
                const level = stockLevel(inv.quantity, inv.items?.reorder_level || 10);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#475569' }}>{inv.items?.sku}</td>
                    <td style={{ fontWeight: 500 }}>{inv.items?.name}</td>
                    <td style={{ color: '#64748b' }}>{inv.items?.unit}</td>
                    <td style={{ fontWeight: 600, fontSize: 16 }}>{inv.quantity.toLocaleString()}</td>
                    <td style={{ color: '#64748b' }}>{inv.items?.reorder_level}</td>
                    <td>₱{(inv.items?.unit_cost || 0).toFixed(2)}</td>
                    <td><span className={`badge ${level.cls}`}>{level.label}</span></td>
                    <td style={{ color: '#64748b' }}>{inv.location}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <Modal title="Add New Item" onClose={() => setShowItemModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="SKU">
              <input className="input" placeholder="e.g. ITEM-001" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} />
            </Field>
            <Field label="Name">
              <input className="input" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Unit">
                <select className="input" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>
                  {['pcs', 'kg', 'ltr', 'box', 'set', 'roll', 'bag'].map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Reorder Level">
                <input className="input" type="number" min={0} value={newItem.reorder_level} onChange={(e) => setNewItem({ ...newItem, reorder_level: +e.target.value })} />
              </Field>
              <Field label="Unit Cost (₱)">
                <input className="input" type="number" min={0} step="0.01" value={newItem.unit_cost} onChange={(e) => setNewItem({ ...newItem, unit_cost: +e.target.value })} />
              </Field>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>
        </Modal>
      )}

      {/* Transaction Modal */}
      {showTxnModal && (
        <Modal
          title={txnType === 'RECEIVE' ? '📥 Receive Stock' : '📤 Issue Stock'}
          onClose={() => setShowTxnModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Item">
              <select className="input" value={txn.item_id} onChange={(e) => setTxn({ ...txn, item_id: e.target.value })}>
                <option value="">Select item...</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            </Field>
            <Field label="Quantity">
              <input className="input" type="number" min={1} value={txn.quantity} onChange={(e) => setTxn({ ...txn, quantity: +e.target.value })} />
            </Field>
            <Field label="Reference (PO/DO number)">
              <input className="input" placeholder="Optional" value={txn.reference} onChange={(e) => setTxn({ ...txn, reference: e.target.value })} />
            </Field>
            <Field label="Notes">
              <input className="input" placeholder="Optional" value={txn.notes} onChange={(e) => setTxn({ ...txn, notes: e.target.value })} />
            </Field>
            <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={addTransaction} disabled={!txn.item_id}>
              {txnType === 'RECEIVE' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
              Confirm {txnType === 'RECEIVE' ? 'Receipt' : 'Issuance'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-in" style={{ width: 480, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
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
