'use client';
import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('Memeriksa tautan…');
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) { setReady(true); setMessage('Masukkan password baru.'); }
    });
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) { setReady(true); setMessage('Masukkan password baru.'); }
      else setMessage('Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru melalui halaman login.');
    }).catch(() => setMessage('Koneksi gagal. Coba buka kembali tautan reset.'));
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (password !== confirm) return setMessage('Kedua password harus sama.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut(); setDone(true); setMessage('Password berhasil diperbarui. Silakan login kembali.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Password belum bisa diperbarui.'); }
    finally { setBusy(false); }
  }
  return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Password baru</h1><p role="status">{message}</p>{ready && !done && <form onSubmit={submit}><label>Password baru<input autoComplete="new-password" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label><label>Ulangi password<input autoComplete="new-password" type="password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label><button className="primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan password'}</button></form>}<p><a href="/login">Kembali ke login</a></p></section></main>;
}
