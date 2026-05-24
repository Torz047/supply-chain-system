'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { Package, ShoppingCart, Truck, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import type { InventoryRecord, CustomerOrder } from '@/types';

const COLORS = ['#3b5bdb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, inventory: 0, pos: 0, shipments: 0 });
  const [orderStatusData, setOrderStatusData] = useState<{ name: string; value: number }[]>([]);
  const [lowStock, setLowStock] = useState<(InventoryRecord & { items: { name: string; sku: string; reorder_level: number } })[]>([]);
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersRes, invRes, posRes, shipsRes, lowStockRes, recentRes] = await Promise.all([
        supabase.from('customer_orders').select('status'),
        supabase.from('inventory').select('quantity'),
        supabase.from('purchase_orders').select('id'),
        supabase.from('shipments').select('id'),
        supabase
          .from('inventory')
          .select('*, items(name, sku, reorder_level)')
          .lt('quantity', 20)
          .limit(5),
        supabase
          .from('customer_orders')
          .select('*, customers(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const orders = ordersRes.data || [];
      setStats({
        orders: orders.length,
        inventory: (invRes.data || []).reduce((a, b) => a + (b.quantity || 0), 0),
        pos: posRes.data?.length || 0,
        shipments: shipsRes.data?.length || 0,
      });

      const grouped: Record<string, number> = {};
      orders.forEach((o) => { grouped[o.status] = (grouped[o.status] || 0) + 1; });
      setOrderStatusData(Object.entries(grouped).map(([name, value]) => ({ name, value })));
      setLowStock((lowStockRes.data as any) || []);
      setRecentOrders((recentRes.data as any) || []);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: 'Customer Orders', value: stats.orders, icon: ClipboardList, color: '#3b5bdb', bg: '#e0e9ff' },
    { label: 'Total Stock Units', value: stats.inventory.toLocaleString(), icon: Package, color: '#10b981', bg: '#d1fae5' },
    { label: 'Purchase Orders', value: stats.pos, icon: ShoppingCart, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Shipments', value: stats.shipments, icon: Truck, color: '#8b5cf6', bg: '#ede9fe' },
  ];

  const statusColor: Record<string, string> = {
    NEW: 'badge-blue', PROCESSING: 'badge-yellow', PICKED: 'badge-purple',
    SHIPPED: 'badge-blue', DELIVERED: 'badge-green', CANCELLED: 'badge-red',
  };

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: '#64748b' }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1400 }} className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Planning Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            Real-time overview of your supply chain operations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e0e9ff', padding: '6px 14px', borderRadius: 8 }}>
          <TrendingUp size={16} color="#3b5bdb" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#3b5bdb' }}>Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>
                  {s.value}
                </p>
              </div>
              <div style={{ background: s.bg, padding: 10, borderRadius: 10 }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Orders by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orderStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ fontFamily: 'DM Sans', fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="value" fill="#3b5bdb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Status Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={orderStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {orderStatusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 13, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Low stock */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <h2 style={{ fontWeight: 600, fontSize: 15 }}>Low Stock Alerts</h2>
          </div>
          {lowStock.length === 0 ? (
            <p style={{ padding: 20, color: '#64748b', fontSize: 14 }}>All stock levels are healthy ✓</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{(s as any).items?.name}</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b' }}>{(s as any).items?.sku}</td>
                    <td>
                      <span className="badge badge-red">{s.quantity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent orders */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, fontSize: 15 }}>Recent Orders</h2>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ padding: 20, color: '#64748b', fontSize: 14 }}>No orders yet</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{o.order_number}</td>
                    <td>{(o as any).customers?.name || '—'}</td>
                    <td>
                      <span className={`badge ${statusColor[o.status] || 'badge-gray'}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
