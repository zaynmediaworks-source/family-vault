'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage(''); setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (error) throw error;
        if (data.session) router.replace('/dashboard');
        else setMessage('Cek email untuk mengonfirmasi akun, lalu masuk ke Family Vault.');
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Koneksi gagal. Silakan coba lagi.'); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    if (!email.trim()) return setMessage('Isi email terlebih dahulu.');
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      setMessage('Jika email terdaftar, tautan reset password akan dikirim.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Koneksi gagal. Silakan coba lagi.'); }
    finally { setBusy(false); }
  }
  return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p className="muted">Your Family Finance Hub</p><div className="segmented"><button disabled={busy} aria-pressed={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>Login</button><button disabled={busy} aria-pressed={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage(''); }}>Buat Akun</button></div>
    <form onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} required /></label><button className="primary" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Buat Akun'}</button></form>{mode === 'login' && <button className="link-btn" disabled={busy} onClick={resetPassword}>Lupa password?</button>}{message && <p className="status" role="status">{message}</p>}</section></main>;
}
