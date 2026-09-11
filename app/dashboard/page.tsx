'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
type Row = { id: string; type: string; label: string; amount: number; happened_at: string };
type Household = { id: string; name: string };
const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export default function DashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('Keluarga Kita');
  async function loadRows(id: string) {
    setRows([]);
    const [income, expenses] = await Promise.all([
      supabase.from('income').select('id,source,amount,happened_at').eq('household_id', id).order('happened_at', { ascending: false }).limit(1000),
      supabase.from('expenses').select('id,name,amount,happened_at').eq('household_id', id).order('happened_at', { ascending: false }).limit(1000),
    ]);
    if (income.error || expenses.error) throw new Error(income.error?.message || expenses.error?.message);
    setRows([
      ...(income.data || []).map(r => ({ id: r.id, type: 'income', label: r.source, amount: Number(r.amount), happened_at: r.happened_at })),
      ...(expenses.data || []).map(r => ({ id: r.id, type: 'expense', label: r.name, amount: Number(r.amount), happened_at: r.happened_at })),
    ].sort((a, b) => b.happened_at.localeCompare(a.happened_at)));
  }
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setRows([]); router.replace('/login'); }
    });
    (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) { router.replace('/login'); return; }
        setEmail(data.user.email || ''); setUserId(data.user.id);
        const result = await supabase.from('households').select('id,name').order('created_at');
        if (result.error) throw result.error;
        setHouseholds(result.data || []);
        if (result.data?.[0]) { setHouseholdId(result.data[0].id); await loadRows(result.data[0].id); }
      } catch (e) { setError(e instanceof Error ? e.message : 'Data belum bisa dimuat. Coba muat ulang.'); }
      finally { setLoading(false); }
    })();
    return () => listener.subscription.unsubscribe();
  }, [router]);
  async function createHousehold(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await supabase.from('households').insert({ name: name.trim(), created_by: userId }).select('id,name').single();
      if (result.error) throw result.error;
      setHouseholds([result.data]); setHouseholdId(result.data.id); await loadRows(result.data.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Keluarga belum bisa dibuat.'); }
    finally { setBusy(false); }
  }
  async function changeHousehold(id: string) {
    setHouseholdId(id); setBusy(true); setError('');
    try { await loadRows(id); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat transaksi.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return setError(error.message);
    setRows([]); router.replace('/login');
  }
  const income = rows.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const expense = rows.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  if (loading || !userId) return <main className="center"><section className="auth-card"><p role="status">{error || 'Memuat Family Vault…'}</p><a href="/login">Kembali ke login</a></section></main>;
  return <main className="shell"><aside className="sidebar"><div className="logo">Family Vault</div><p className="side-muted">Your Family Finance Hub</p><nav aria-label="Menu utama"><span className="nav-active">Dashboard</span></nav><div className="side-bottom"><small>{email}</small><button onClick={logout}>Keluar</button></div></aside>
    <section className="content"><h1>Dashboard</h1><p className="muted">Keuangan keluarga, dalam satu tempat.</p>{error && <p role="alert" className="status error">{error}</p>}
      {!households.length ? <article className="card"><h2>Selamat datang di Family Vault</h2><p>Buat ruang keluarga untuk menghubungkan data keuanganmu.</p><form onSubmit={createHousehold}><label>Nama keluarga<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><button className="primary" disabled={busy || !name.trim()}>{busy ? 'Menyimpan…' : 'Buat keluarga'}</button></form><p className="muted">Jika keluarga sudah dibuat oleh pasangan, tunggu penambahan akunmu oleh pemilik keluarga.</p></article> : <>
        <label>Keluarga<select disabled={busy} value={householdId} onChange={e => void changeHousehold(e.target.value)}>{households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label><p className="muted">Ringkasan hingga 1.000 catatan terbaru per jenis transaksi.</p>
        <div className="stats"><article className="card"><span>Pemasukan</span><strong>{error || busy ? '—' : rp(income)}</strong></article><article className="card"><span>Pengeluaran</span><strong>{error || busy ? '—' : rp(expense)}</strong></article><article className="card"><span>Sisa</span><strong>{error || busy ? '—' : rp(income - expense)}</strong></article></div>
        <article className="card"><h2>Transaksi terbaru</h2>{busy ? <p role="status">Memuat transaksi…</p> : error ? <button onClick={() => void changeHousehold(householdId)}>Coba lagi</button> : !rows.length ? <p className="muted">Belum ada transaksi di keluarga ini.</p> : <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Nama</th><th>Jenis</th><th>Nominal</th></tr></thead><tbody>{rows.slice(0, 10).map(r => <tr key={`${r.type}-${r.id}`}><td>{r.happened_at}</td><td>{r.label}</td><td>{r.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td><td>{rp(r.amount)}</td></tr>)}</tbody></table></div>}</article></>}
      <article className="card roadmap"><h2>Family Vault Online v1</h2><p>Versi awal ini menyediakan login, ruang keluarga, dan ringkasan data. Form pencatatan, undangan pasangan, budgeting, investasi, tabungan, hutang, dan wishlist belum tersedia di paket ini.</p></article>
    </section></main>;
}
