'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, MapPin, Truck } from 'lucide-react';
import type { Shipment, CustomerOrder } from '@/types';

type ShipmentWithOrder = Shipment & { customer_orders?: CustomerOrder & { customers?: { name: string } } };

export default function LogisticsPage() {
  const [shipments, setShipments] = useState<ShipmentWithOrder[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState<string | null>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [newShipment, setNewShipment] = useState({ tracking_number: `TRK-${Date.now()}`, order_id: '', carrier: '', current_location: '', notes: '' });
  const [trackEntry, setTrackEntry] = useState({ status: 'IN_TRANSIT', location: '', remarks: '' });

  const load = async () => {
    setLoading(true);
    const [shipsRes, ordersRes] = await Promise.all([
      supabase.from('shipments').select('*, customer_orders(*, customers(name))').order('created_at', { ascending: false }),
      supabase.from('customer_orders').select('*, customers(name)').in('status', ['NEW', 'PROCESSING', 'PICKED']),
    ]);
    setShipments((shipsRes.data as any) || []);
    setOrders((ordersRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createShipment = async () => {
    const { error } = await supabase.from('shipments').insert({ ...newShipment, status: 'PREPARING', shipped_date: new Date().toISOString().split('T')[0] });
    if (error) { toast.error(error.message); return; }
    if (newShipment.order_id) {
      await supabase.from('customer_orders').update({ status: 'SHIPPED' }).eq('id', newShipment.order_id);
    }
    toast.success('Shipment created!');
    setShowModal(false);
    setNewShipment({ tracking_number: `TRK-${Date.now()}`, order_id: '', carrier: '', current_location: '', notes: '' });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'DELIVERED') updates.delivered_date = new Date().toISOString().split('T')[0];
    await supabase.from('shipments').update(updates).eq('id', id);
    if (status === 'DELIVERED') {
      const ship = shipments.find((s) => s.id === id);
      if (ship?.order_id) await supabase.from('customer_orders').update({ status: 'DELIVERED' }).eq('id', ship.order_id);
    }
    toast.success('Status updated!');
    load();
  };

  const viewTracking = async (id: string) => {
    const { data } = await supabase.from('shipment_tracking').select('*').eq('shipment_id', id).order('timestamp', { ascending: false });
    setTracking(data || []);
    setShowTrackModal(id);
  };

  const addTrackingEntry = async () => {
    if (!showTrackModal) return;
    await supabase.from('shipment_tracking').insert({ ...trackEntry, shipment_id: showTrackModal });
    await supabase.from('shipments').update({ current_location: trackEntry.location, status: trackEntry.status }).eq('id', showTrackModal);
    toast.success('Tracking updated!');
    viewTracking(showTrackModal);
    setTrackEntry({ status: 'IN_TRANSIT', location: '', remarks: '' });
    load();
  };

  const statusColor: Record<string, string> = {
    PREPARING: 'badge-yellow', IN_TRANSIT: 'badge-blue', DELIVERED: 'badge-green', RETURNED: 'badge-red',
  };

  const filtered = shipments.filter((s) =>
    s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_orders as any)?.customers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 32, maxWidth: 1400 }} className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logistics</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>Track shipments and manage delivery status</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> New Shipment</button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search tracking # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>Tracking #</th><th>Order</th><th>Customer</th><th>Carrier</th><th>Status</th><th>Location</th><th>Shipped</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>No shipments</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{s.tracking_number}</td>
                <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b' }}>
                  {(s.customer_orders as any)?.order_number || '—'}
                </td>
                <td style={{ fontWeight: 500 }}>{(s.customer_orders as any)?.customers?.name || '—'}</td>
                <td style={{ color: '#64748b' }}>{s.carrier || '—'}</td>
                <td>
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer' }}
                  >
                    {['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].map((st) => <option key={st}>{st}</option>)}
                  </select>
                </td>
                <td style={{ color: '#64748b', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {s.current_location && <MapPin size={12} />}
                    {s.current_location || '—'}
                  </div>
                </td>
                <td style={{ color: '#64748b' }}>{s.shipped_date || '—'}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => viewTracking(s.id)}>
                    <Truck size={13} /> Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Shipment Modal */}
      {showModal && (
        <Modal title="Create Shipment" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Tracking Number">
              <input className="input" value={newShipment.tracking_number} onChange={(e) => setNewShipment({ ...newShipment, tracking_number: e.target.value })} />
            </Field>
            <Field label="Link to Order (optional)">
              <select className="input" value={newShipment.order_id} onChange={(e) => setNewShipment({ ...newShipment, order_id: e.target.value })}>
                <option value="">No linked order</option>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} – {(o as any).customers?.name}</option>)}
              </select>
            </Field>
            <Field label="Carrier">
              <input className="input" placeholder="e.g. LBC, J&T, Ninja Van" value={newShipment.carrier} onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })} />
            </Field>
            <Field label="Current Location">
              <input className="input" placeholder="e.g. Manila Warehouse" value={newShipment.current_location} onChange={(e) => setNewShipment({ ...newShipment, current_location: e.target.value })} />
            </Field>
            <Field label="Notes">
              <input className="input" placeholder="Optional" value={newShipment.notes} onChange={(e) => setNewShipment({ ...newShipment, notes: e.target.value })} />
            </Field>
            <button className="btn btn-primary" onClick={createShipment}>Create Shipment</button>
          </div>
        </Modal>
      )}

      {/* Tracking Modal */}
      {showTrackModal && (
        <Modal title="Shipment Tracking" onClose={() => setShowTrackModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>Add Tracking Update</p>
            <Field label="Status">
              <select className="input" value={trackEntry.status} onChange={(e) => setTrackEntry({ ...trackEntry, status: e.target.value })}>
                {['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input className="input" placeholder="e.g. Cebu Sorting Hub" value={trackEntry.location} onChange={(e) => setTrackEntry({ ...trackEntry, location: e.target.value })} />
            </Field>
            <Field label="Remarks">
              <input className="input" placeholder="Optional" value={trackEntry.remarks} onChange={(e) => setTrackEntry({ ...trackEntry, remarks: e.target.value })} />
            </Field>
            <button className="btn btn-primary" onClick={addTrackingEntry}><MapPin size={14} /> Add Update</button>
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>History</p>
            {tracking.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>No tracking entries yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tracking.map((t) => (
                  <div key={t.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b5bdb', marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.status} {t.location ? `— ${t.location}` : ''}</div>
                      {t.remarks && <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{t.remarks}</div>}
                      <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>{new Date(t.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-in" style={{ width: 520, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
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
