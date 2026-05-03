import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ background: 'var(--imdb-yellow)', display: 'inline-block', borderRadius: 4, padding: '6px 14px', fontWeight: 900, fontSize: 22, color: '#000', marginBottom: 12 }}>CB</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sign In</h1>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-light)' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" placeholder="you@example.com" style={{ paddingLeft: 38 }} />
              </div>
            </div>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-light)' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input" placeholder="••••••••" style={{ paddingLeft: 38, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                  {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 15 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            Demo: <code style={{ color: 'var(--accent)' }}>admin@cinebook.app</code> / <code style={{ color: 'var(--accent)' }}>password123</code>
          </div>
          <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>New to CineBook? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create account</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
