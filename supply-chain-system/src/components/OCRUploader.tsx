'use client';
import { useState, useRef } from 'react';
import { extractTextFromImage, parseOrderFromText } from '@/lib/ocr';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, FileText, X, ScanLine } from 'lucide-react';

export default function OCRUploader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof parseOrderFromText> | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setPreview(null);
    setProgress('Reading image...');
    try {
      const text = await extractTextFromImage(file);
      setProgress('Parsing order data...');
      const parsed = parseOrderFromText(text);
      setPreview(parsed);
      toast.success('OCR Complete!');
    } catch (err) {
      toast.error('OCR Failed – please try a clearer image');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const saveOrder = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const { data: customer } = await supabase
        .from('customers')
        .upsert({ name: preview.customer }, { onConflict: 'name' })
        .select()
        .single();

      const { data: order, error: orderError } = await supabase
        .from('customer_orders')
        .insert({
          order_number: preview.order_number,
          customer_id: customer?.id,
          source: 'OCR',
          ocr_raw_text: preview.raw_text,
          status: 'NEW',
          order_date: preview.order_date,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (order && preview.items.length) {
        await supabase.from('customer_order_items').insert(
          preview.items.map((it) => ({
            order_id: order.id,
            quantity: it.quantity,
            unit_price: it.unit_price,
          }))
        );
      }
      toast.success('Order auto-encoded!');
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900 }} className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">OCR Order Upload</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            Upload an image of a customer order to auto-encode it into the system
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: loading ? '#f8fafc' : 'white',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && fileInputRef.current) {
              const dt = new DataTransfer();
              dt.items.add(file);
              fileInputRef.current.files = dt.files;
              fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <p style={{ color: '#64748b', fontWeight: 500 }}>{progress}</p>
            </div>
          ) : (
            <>
              <div style={{ background: '#e0e9ff', width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ScanLine size={28} color="#3b5bdb" />
              </div>
              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop an order image here</p>
              <p style={{ color: '#64748b', fontSize: 14 }}>or click to browse · PNG, JPG, PDF supported</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="card animate-in" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="#3b5bdb" />
              <span style={{ fontWeight: 600 }}>Parsed Order Preview</span>
            </div>
            <button
              onClick={() => setPreview(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Number</label>
              <p style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, marginTop: 4 }}>{preview.order_number}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer</label>
              <p style={{ fontWeight: 500, marginTop: 4 }}>{preview.customer}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Date</label>
              <p style={{ fontWeight: 500, marginTop: 4 }}>{preview.order_date}</p>
            </div>
          </div>

          {preview.items.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{item.sku}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>₱{item.unit_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: 20, color: '#64748b', fontSize: 14 }}>No line items detected – you can save the order header and add items manually.</p>
          )}

          <div style={{ padding: 16, background: '#f8fafc', display: 'flex', gap: 10 }}>
            <button onClick={saveOrder} disabled={saving} className="btn btn-primary">
              {saving ? <><div className="spinner" /> Saving...</> : <><CheckCircle size={16} /> Auto-Encode to System</>}
            </button>
            <button onClick={() => setPreview(null)} className="btn btn-secondary">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Raw text (collapsed) */}
      {preview?.raw_text && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: 13, padding: '8px 0' }}>
            View raw OCR text
          </summary>
          <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 12, overflow: 'auto', maxHeight: 200, marginTop: 8, fontFamily: 'DM Mono, monospace' }}>
            {preview.raw_text}
          </pre>
        </details>
      )}
    </div>
  );
}
