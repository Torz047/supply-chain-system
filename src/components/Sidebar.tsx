'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  ScanLine,
  Factory,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/purchasing', label: 'Purchasing', icon: ShoppingCart },
  { href: '/logistics', label: 'Logistics', icon: Truck },
  { href: '/ot-list', label: 'OT List', icon: ClipboardList },
  { href: '/planning/ocr', label: 'OCR Upload', icon: ScanLine },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #3b5bdb, #5c7cfa)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Factory size={20} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
              SupplyChain
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>SCM System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>
            Main Menu
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 8,
                  marginBottom: 2,
                  textDecoration: 'none',
                  background: active ? 'rgba(59, 91, 219, 0.18)' : 'transparent',
                  color: active ? '#93b4ff' : '#94a3b8',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                  }
                }}
              >
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      background: '#5c7cfa',
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                )}
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ color: '#475569', fontSize: 11 }}>v1.0.0 · Supply Chain SCM</div>
      </div>
    </aside>
  );
}
