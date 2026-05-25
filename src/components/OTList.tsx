'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, X, Filter, Download } from 'lucide-react';

interface OTRecord {
  id: string;
  reference: string;
  bu: string;
  site: string;
  uai_air: string;
  customer: string;
  po_date_received: string;
  cpo: string;
  alliance_po: string;
  po_item: string;
  prs: string;
  qty: number;
  order_status: string;
  type: string;
  part_number: string;
  description: string;
  drawing_number: string;
  rev: string;
  consumption_status: string;
  part_seta: string;
  crdd: string;
  po_rdd: string;
  cpo_rdd: string;
  rdd: string;
  alliance_unit_price: number;
  total_alliance_price: number;
  customer_unit_price: number;
  total_customer_price: number;
  assy_po_revision: string;
  assembly_po: string;
  po_month_year: string;
  quotation: string;
  pin_count: number;
  unit_price: number;
  total_cost: number;
  total_pins: number;
  assembly_invoice_num: string;
  pin_type: string;
  etd_month: string;
  etd: string;
  eta: string;
  ng_ok: string;
  assembly_invoice: string;
  so_num: string;
  sap_etd: string;
  general_status: string;
  remarks1: string;
  tracking_num: string;
  invoice_num: string;
  temporary_part: string;
  temporary_drawing: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Delivered: 'badge-green',
  'On going': 'badge-blue',
  Billing: 'badge-yellow',
  Closed: 'badge-gray',
  Cancelled: 'badge-red',
  'PRS - WAITING FOR PO': 'badge-purple',
};

const NGOK_COLORS: Record<string, string> = {
  OK: 'badge-green',
  OG: 'badge-blue',
  NG: 'badge-red',
};

const EMPTY: Partial<OTRecord> = {
  reference: '', bu: '', site: '', uai_air: '', customer: '',
  po_date_received: '', cpo: '', alliance_po: '', po_item: '', prs: '',
  qty: 0, order_status: 'New', type: 'assy', part_number: '', description: '',
  drawing_number: '', rev: '', consumption_status: '', part_seta: '', crdd: '',
  po_rdd: '', cpo_rdd: '', rdd: '', alliance_unit_price: 0, total_alliance_price: 0,
  customer_unit_price: 0, total_customer_price: 0, assy_po_revision: '',
  assembly_po: '', po_month_year: '', quotation: '', pin_count: 0, unit_price: 0,
  total_cost: 0, total_pins: 0, assembly_invoice_num: '', pin_type: '', etd_month: '',
  etd: '', eta: '', ng_ok: 'OG', assembly_invoice: '', so_num: '', sap_etd: '',
  general_status: 'On going', remarks1: '', tracking_num: '', invoice_num: '',
  temporary_part: '', temporary_drawing: '',
};

export default function OTListPage() {
  const [records, setRecords] = useState<OTRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Partial<OTRecord>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'assembly' | 'delivery'>('basic');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ot_list')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRecords((data as OTRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [r.reference, r.customer, r.part_number, r.drawing_number, r.description, r.tracking_num, r.invoice_num]
      .some((v) => v?.toLowerCase().includes(q));
    const matchStatus = !statusFilter || r.general_status === statusFilter;
    const matchSite = !siteFilter || r.site === siteFilter;
    return matchSearch && matchStatus && matchSite;
  });

  const sites = Array.from(new Set(records.map((r) => r.site).filter(Boolean)));
  const statuses = Array.from(new Set(records.map((r) => r.general_status).filter(Boolean)));

  const openNew = () => { setEditRecord({ ...EMPTY }); setShowModal(true); setActiveTab('basic'); };
  const openEdit = (r: OTRecord) => { setEditRecord({ ...r }); setShowModal(true); setActiveTab('basic'); };

  const save = async () => {
    setSaving(true);
    try {
      if (editRecord.id) {
        const { error } = await supabase.from('ot_list').update(editRecord).eq('id', editRecord.id);
        if (error) throw error;
        toast.success('Record updated!');
      } else {
        const { error } = await supabase.from('ot_list').insert(editRecord);
        if (error) throw error;
        toast.success('Record added!');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await supabase.from('ot_list').delete().eq('id', id);
    toast.success('Deleted');
    load();
  };

  const set = (field: keyof OTRecord, value: any) =>
    setEditRecord((prev) => ({ ...prev, [field]: value }));

  const exportCSV = () => {
    const headers = ['Reference','BU','Site','Customer','PO Date Received','CPO','Alliance PO#','PO Item#','PRS','QTY','Order Status','Type','P/N','Description','D/N','Rev','Consumption Status','Part SETA','CRDD','PO RDD','CPO RDD','RDD','Alliance Unit Price','Total Alliance Price','Customer Unit Price','Total Customer Price','Assembly PO','PO Month-Year','Quotation#','Pin Count','Unit Price','Total Cost','Total Pins','Assembly Invoice#','Pin Type','ETD Month','ETD','ETA','NG/OK','Assembly Invoice','SO#','SAP ETD','General Status','Remarks','Tracking#','Invoice#','Temp Part#','Temp Drawing#'];
    const rows = filtered.map((r) => [r.reference,r.bu,r.site,r.customer,r.po_date_received,r.cpo,r.alliance_po,r.po_item,r.prs,r.qty,r.order_status,r.type,r.part_number,r.description,r.drawing_number,r.rev,r.consumption_status,r.part_seta,r.crdd,r.po_rdd,r.cpo_rdd,r.rdd,r.alliance_unit_price,r.total_alliance_price,r.customer_unit_price,r.total_customer_price,r.assembly_po,r.po_month_year,r.quotation,r.pin_count,r.unit_price,r.total_cost,r.total_pins,r.assembly_invoice_num,r.pin_type,r.etd_month,r.etd,r.eta,r.ng_ok,r.assembly_invoice,r.so_num,r.sap_etd,r.general_status,r.remarks1,r.tracking_num,r.invoice_num,r.temporary_part,r.temporary_drawing]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `OT_List_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: 32, maxWidth: '100%' }} className="animate-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">OT List</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            {filtered.length} of {records.length} records
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /></button>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={14} /> Add Record</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search reference, customer, P/N, tracking..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        {(search || statusFilter || siteFilter) && (
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setSiteFilter(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} /> Loading OT List...
          </div>
        ) : (
          <table className="data-table" style={{ minWidth: 2400 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Reference</th>
                <th>BU</th>
                <th>Site</th>
                <th>UAI/AIR</th>
                <th style={{ whiteSpace: 'nowrap' }}>Customer</th>
                <th style={{ whiteSpace: 'nowrap' }}>PO Date Received</th>
                <th>CPO</th>
                <th style={{ whiteSpace: 'nowrap' }}>Alliance PO#</th>
                <th style={{ whiteSpace: 'nowrap' }}>PO Item#</th>
                <th>PRS</th>
                <th>QTY</th>
                <th style={{ whiteSpace: 'nowrap' }}>Order Status</th>
                <th>Type</th>
                <th style={{ whiteSpace: 'nowrap' }}>P/N</th>
                <th>Description</th>
                <th>D/N</th>
                <th>Rev</th>
                <th style={{ whiteSpace: 'nowrap' }}>Consumption Status</th>
                <th style={{ whiteSpace: 'nowrap' }}>Part SETA</th>
                <th>CRDD</th>
                <th style={{ whiteSpace: 'nowrap' }}>PO RDD</th>
                <th style={{ whiteSpace: 'nowrap' }}>CPO RDD</th>
                <th>RDD</th>
                <th style={{ whiteSpace: 'nowrap' }}>Alliance Unit Price</th>
                <th style={{ whiteSpace: 'nowrap' }}>Total Alliance Price</th>
                <th style={{ whiteSpace: 'nowrap' }}>Customer Unit Price</th>
                <th style={{ whiteSpace: 'nowrap' }}>Total Customer Price</th>
                <th style={{ whiteSpace: 'nowrap' }}>Assy PO Revision</th>
                <th style={{ whiteSpace: 'nowrap' }}>Assembly PO#</th>
                <th style={{ whiteSpace: 'nowrap' }}>PO Month-Year</th>
                <th>Quotation#</th>
                <th style={{ whiteSpace: 'nowrap' }}>Pin Count</th>
                <th style={{ whiteSpace: 'nowrap' }}>Unit Price</th>
                <th style={{ whiteSpace: 'nowrap' }}>Total Cost</th>
                <th style={{ whiteSpace: 'nowrap' }}>Total Pins</th>
                <th style={{ whiteSpace: 'nowrap' }}>Assembly Invoice#</th>
                <th style={{ whiteSpace: 'nowrap' }}>Pin Type</th>
                <th style={{ whiteSpace: 'nowrap' }}>ETD Month</th>
                <th>ETD</th>
                <th>ETA</th>
                <th>NG/OK</th>
                <th style={{ whiteSpace: 'nowrap' }}>Assembly Invoice</th>
                <th>SO#</th>
                <th style={{ whiteSpace: 'nowrap' }}>SAP ETD</th>
                <th style={{ whiteSpace: 'nowrap' }}>General Status</th>
                <th>Remarks</th>
                <th>Tracking#</th>
                <th>Invoice#</th>
                <th style={{ whiteSpace: 'nowrap' }}>Temp Part#</th>
                <th style={{ whiteSpace: 'nowrap' }}>Temp Drawing#</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={50} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                  No records found. Click "Add Record" to get started.
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onDoubleClick={() => openEdit(r)}>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, whiteSpace: 'nowrap', color: '#3b5bdb', fontWeight: 500 }}>{r.reference || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.bu}</td>
                  <td><span className="badge badge-gray">{r.site}</span></td>
                  <td style={{ fontSize: 12 }}>{r.uai_air || '—'}</td>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap', fontSize: 13 }}>{r.customer}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.po_date_received || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.cpo || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.alliance_po || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.po_item || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.prs || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.qty}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{r.order_status}</span></td>
                  <td style={{ fontSize: 12 }}>{r.type}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{r.part_number}</td>
                  <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description}>{r.description || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.drawing_number || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.rev || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.consumption_status || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.part_seta || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.crdd || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.po_rdd || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.cpo_rdd || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.rdd || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.alliance_unit_price ? `₱${r.alliance_unit_price.toLocaleString()}` : '—'}</td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{r.total_alliance_price ? `₱${r.total_alliance_price.toLocaleString()}` : '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.customer_unit_price ? `₱${r.customer_unit_price.toLocaleString()}` : '—'}</td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{r.total_customer_price ? `₱${r.total_customer_price.toLocaleString()}` : '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.assy_po_revision || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.assembly_po || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.po_month_year || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.quotation || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.pin_count || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.unit_price || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.total_cost || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.total_pins || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.assembly_invoice_num || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.pin_type || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.etd_month || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.etd || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.eta || '—'}</td>
                  <td><span className={`badge ${NGOK_COLORS[r.ng_ok] || 'badge-gray'}`}>{r.ng_ok || '—'}</span></td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.assembly_invoice || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.so_num || '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{r.sap_etd || '—'}</td>
                  <td><span className={`badge ${STATUS_COLORS[r.general_status] || 'badge-gray'}`} style={{ whiteSpace: 'nowrap', fontSize: 10 }}>{r.general_status || '—'}</span></td>
                  <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remarks1}>{r.remarks1 || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.tracking_num || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.invoice_num || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.temporary_part || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.temporary_drawing || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(r.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
        💡 Double-click any row to edit it quickly
      </p>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 780, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{editRecord.id ? 'Edit OT Record' : 'Add OT Record'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 22 }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              {(['basic', 'pricing', 'assembly', 'delivery'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#3b5bdb' : '#64748b',
                  borderBottom: activeTab === tab ? '2px solid #3b5bdb' : '2px solid transparent',
                  textTransform: 'capitalize',
                }}>
                  {tab === 'basic' ? '📋 Basic Info' : tab === 'pricing' ? '💰 Pricing' : tab === 'assembly' ? '🔧 Assembly' : '🚚 Delivery'}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="Reference" span={2}><input className="input" value={editRecord.reference || ''} onChange={(e) => set('reference', e.target.value)} /></F>
                  <F label="BU"><input className="input" value={editRecord.bu || ''} onChange={(e) => set('bu', e.target.value)} /></F>
                  <F label="Site"><input className="input" placeholder="e.g. ESPP, ENT, ETS" value={editRecord.site || ''} onChange={(e) => set('site', e.target.value)} /></F>
                  <F label="UAI/AIR"><input className="input" value={editRecord.uai_air || ''} onChange={(e) => set('uai_air', e.target.value)} /></F>
                  <F label="Customer"><input className="input" value={editRecord.customer || ''} onChange={(e) => set('customer', e.target.value)} /></F>
                  <F label="PO Date Received"><input className="input" value={editRecord.po_date_received || ''} onChange={(e) => set('po_date_received', e.target.value)} /></F>
                  <F label="CPO"><input className="input" value={editRecord.cpo || ''} onChange={(e) => set('cpo', e.target.value)} /></F>
                  <F label="Alliance PO#"><input className="input" value={editRecord.alliance_po || ''} onChange={(e) => set('alliance_po', e.target.value)} /></F>
                  <F label="PO Item#"><input className="input" value={editRecord.po_item || ''} onChange={(e) => set('po_item', e.target.value)} /></F>
                  <F label="PRS"><input className="input" value={editRecord.prs || ''} onChange={(e) => set('prs', e.target.value)} /></F>
                  <F label="QTY"><input className="input" type="number" value={editRecord.qty || 0} onChange={(e) => set('qty', +e.target.value)} /></F>
                  <F label="Order Status">
                    <select className="input" value={editRecord.order_status || ''} onChange={(e) => set('order_status', e.target.value)}>
                      {['New', 'Rep', 'Return'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Type">
                    <select className="input" value={editRecord.type || ''} onChange={(e) => set('type', e.target.value)}>
                      {['assy', 'jig', 'device', 'pin', 'part', 'NMP assy', 'nmp part'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Part Number (P/N)"><input className="input" value={editRecord.part_number || ''} onChange={(e) => set('part_number', e.target.value)} /></F>
                  <F label="Description" span={2}><input className="input" value={editRecord.description || ''} onChange={(e) => set('description', e.target.value)} /></F>
                  <F label="Drawing Number (D/N)"><input className="input" value={editRecord.drawing_number || ''} onChange={(e) => set('drawing_number', e.target.value)} /></F>
                  <F label="Rev"><input className="input" value={editRecord.rev || ''} onChange={(e) => set('rev', e.target.value)} /></F>
                  <F label="Consumption Status"><input className="input" value={editRecord.consumption_status || ''} onChange={(e) => set('consumption_status', e.target.value)} /></F>
                  <F label="Part SETA"><input className="input" value={editRecord.part_seta || ''} onChange={(e) => set('part_seta', e.target.value)} /></F>
                  <F label="General Status">
                    <select className="input" value={editRecord.general_status || ''} onChange={(e) => set('general_status', e.target.value)}>
                      {['On going', 'Delivered', 'Billing', 'Closed', 'Cancelled', 'PRS - WAITING FOR PO'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Remarks" span={2}><input className="input" value={editRecord.remarks1 || ''} onChange={(e) => set('remarks1', e.target.value)} /></F>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="CRDD"><input className="input" value={editRecord.crdd || ''} onChange={(e) => set('crdd', e.target.value)} /></F>
                  <F label="PO RDD"><input className="input" value={editRecord.po_rdd || ''} onChange={(e) => set('po_rdd', e.target.value)} /></F>
                  <F label="CPO RDD"><input className="input" value={editRecord.cpo_rdd || ''} onChange={(e) => set('cpo_rdd', e.target.value)} /></F>
                  <F label="RDD"><input className="input" value={editRecord.rdd || ''} onChange={(e) => set('rdd', e.target.value)} /></F>
                  <F label="Alliance Unit Price"><input className="input" type="number" step="0.01" value={editRecord.alliance_unit_price || 0} onChange={(e) => set('alliance_unit_price', +e.target.value)} /></F>
                  <F label="Total Alliance Price"><input className="input" type="number" step="0.01" value={editRecord.total_alliance_price || 0} onChange={(e) => set('total_alliance_price', +e.target.value)} /></F>
                  <F label="Customer Unit Price"><input className="input" type="number" step="0.01" value={editRecord.customer_unit_price || 0} onChange={(e) => set('customer_unit_price', +e.target.value)} /></F>
                  <F label="Total Customer Price"><input className="input" type="number" step="0.01" value={editRecord.total_customer_price || 0} onChange={(e) => set('total_customer_price', +e.target.value)} /></F>
                  <F label="Unit Price"><input className="input" type="number" step="0.01" value={editRecord.unit_price || 0} onChange={(e) => set('unit_price', +e.target.value)} /></F>
                  <F label="Total Cost"><input className="input" type="number" step="0.01" value={editRecord.total_cost || 0} onChange={(e) => set('total_cost', +e.target.value)} /></F>
                  <F label="Quotation#"><input className="input" value={editRecord.quotation || ''} onChange={(e) => set('quotation', e.target.value)} /></F>
                  <F label="SO#"><input className="input" value={editRecord.so_num || ''} onChange={(e) => set('so_num', e.target.value)} /></F>
                </div>
              )}

              {activeTab === 'assembly' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="Assy PO Revision"><input className="input" value={editRecord.assy_po_revision || ''} onChange={(e) => set('assy_po_revision', e.target.value)} /></F>
                  <F label="Assembly PO#"><input className="input" value={editRecord.assembly_po || ''} onChange={(e) => set('assembly_po', e.target.value)} /></F>
                  <F label="PO Month-Year"><input className="input" value={editRecord.po_month_year || ''} onChange={(e) => set('po_month_year', e.target.value)} /></F>
                  <F label="Pin Count"><input className="input" type="number" value={editRecord.pin_count || 0} onChange={(e) => set('pin_count', +e.target.value)} /></F>
                  <F label="Total Pins"><input className="input" type="number" value={editRecord.total_pins || 0} onChange={(e) => set('total_pins', +e.target.value)} /></F>
                  <F label="Assembly Invoice#"><input className="input" value={editRecord.assembly_invoice_num || ''} onChange={(e) => set('assembly_invoice_num', e.target.value)} /></F>
                  <F label="Assembly Invoice"><input className="input" value={editRecord.assembly_invoice || ''} onChange={(e) => set('assembly_invoice', e.target.value)} /></F>
                  <F label="Pin Type"><input className="input" value={editRecord.pin_type || ''} onChange={(e) => set('pin_type', e.target.value)} /></F>
                  <F label="Temp Part#"><input className="input" value={editRecord.temporary_part || ''} onChange={(e) => set('temporary_part', e.target.value)} /></F>
                  <F label="Temp Drawing#"><input className="input" value={editRecord.temporary_drawing || ''} onChange={(e) => set('temporary_drawing', e.target.value)} /></F>
                </div>
              )}

              {activeTab === 'delivery' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <F label="ETD Month"><input className="input" value={editRecord.etd_month || ''} onChange={(e) => set('etd_month', e.target.value)} /></F>
                  <F label="ETD"><input className="input" value={editRecord.etd || ''} onChange={(e) => set('etd', e.target.value)} /></F>
                  <F label="ETA"><input className="input" value={editRecord.eta || ''} onChange={(e) => set('eta', e.target.value)} /></F>
                  <F label="SAP ETD"><input className="input" value={editRecord.sap_etd || ''} onChange={(e) => set('sap_etd', e.target.value)} /></F>
                  <F label="NG/OK">
                    <select className="input" value={editRecord.ng_ok || ''} onChange={(e) => set('ng_ok', e.target.value)}>
                      {['OG', 'OK', 'NG'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Tracking#"><input className="input" value={editRecord.tracking_num || ''} onChange={(e) => set('tracking_num', e.target.value)} /></F>
                  <F label="Invoice#"><input className="input" value={editRecord.invoice_num || ''} onChange={(e) => set('invoice_num', e.target.value)} /></F>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" /> Saving...</> : '✓ Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  );
}
