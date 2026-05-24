'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Factory, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div className="card" style={{ width: 380, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #3b5bdb, #5c7cfa)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Factory size={26} color="white" />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 20 }}>SupplyChain SCM</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Sign in to your account</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>
          <button className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 6 }} onClick={handleLogin} disabled={loading}>
            {loading ? <div className="spinner" /> : <LogIn size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
