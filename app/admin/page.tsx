'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import AdminBrandExperiencePanel from './AdminBrandExperiencePanel';

type R=Record<string,any>;
const rp=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const sum=(rows:R[],field='amount')=>rows.reduce((s,x)=>s+Number(x[field]||0),0);

export default function AdminPage(){
  const router=useRouter();
  const [loading,setLoading]=useState(true),[err,setErr]=useState('');
  const [profiles,setProfiles]=useState<R[]>([]),[houses,setHouses]=useState<R[]>([]),[members,setMembers]=useState<R[]>([]);
  const [selected,setSelected]=useState(''),[finance,setFinance]=useState<Record<string,R[]>>({}),[financeLoading,setFinanceLoading]=useState(false);

  const profileMap=useMemo(()=>Object.fromEntries(profiles.map(p=>[p.id,p])),[profiles]);

  async function reload(){
    setErr('');
    const {data:userData}=await supabase.auth.getUser();
    if(!userData.user){router.replace('/login');return}
    const admin=await supabase.from('platform_admins').select('role').eq('user_id',userData.user.id).maybeSingle();
    if(admin.error||!admin.data){setErr('Akun ini bukan admin Family Vault.');setLoading(false);return}
    const [p,h,m]=await Promise.all([
      supabase.from('profiles').select('*').order('created_at',{ascending:false}),
      supabase.from('households').select('*').order('created_at',{ascending:false}),
      supabase.from('household_members').select('*').order('created_at',{ascending:false}),
    ]);
    if(p.error||h.error||m.error){setErr(p.error?.message||h.error?.message||m.error?.message||'Gagal memuat admin panel');setLoading(false);return}
    setProfiles(p.data||[]);setHouses(h.data||[]);setMembers(m.data||[]);setLoading(false);
  }

  useEffect(()=>{reload()},[]);

  async function approveUser(id:string){
    const {data:u}=await supabase.auth.getUser();
    const r=await supabase.from('profiles').update({status:'approved',approved_at:new Date().toISOString(),approved_by:u.user?.id||null}).eq('id',id);
    if(r.error)setErr(r.error.message);else reload();
  }
  async function suspendUser(id:string){
    const r=await supabase.from('profiles').update({status:'suspended',can_create_household:false}).eq('id',id);
    if(r.error)setErr(r.error.message);else reload();
  }
  async function toggleCreate(p:R){
    const r=await supabase.from('profiles').update({can_create_household:!p.can_create_household}).eq('id',p.id);
    if(r.error)setErr(r.error.message);else reload();
  }
  async function setHouseStatus(h:R,status:'active'|'suspended'){
    const {data:u}=await supabase.auth.getUser();
    const patch:any={status};
    if(status==='active'){patch.approved_at=new Date().toISOString();patch.approved_by=u.user?.id||null}
    const r=await supabase.from('households').update(patch).eq('id',h.id);
    if(r.error)setErr(r.error.message);else reload();
  }
  async function deleteHouse(h:R){
    const yes=window.confirm(`HAPUS PERMANEN household “${h.name}”? Semua data keuangannya juga akan terhapus.`);
    if(!yes)return;
    const typed=window.prompt(`Ketik nama household persis untuk konfirmasi:\n${h.name}`,'');
    if(typed!==h.name)return;
    const r=await supabase.from('households').delete().eq('id',h.id);
    if(r.error)setErr(r.error.message);else{if(selected===h.id){setSelected('');setFinance({})}reload()}
  }
  async function removeMember(hid:string,uid:string){
    if(!window.confirm('Cabut akses anggota ini dari household?'))return;
    const r=await supabase.from('household_members').delete().eq('household_id',hid).eq('user_id',uid);
    if(r.error)setErr(r.error.message);else reload();
  }

  async function viewFinance(hid:string){
    setSelected(hid);setFinanceLoading(true);setErr('');
    const tables=['income','expenses','budgets','obligations','etf_assets','etf_transactions','gold_assets','gold_transactions','dividend_stocks','dividend_stock_transactions','dividends','savings','saving_transactions','debts','debt_payments','wishlists'] as const;
    const topTables=new Set(['income','expenses','budgets','obligations','etf_assets','gold_assets','dividend_stocks','savings','debts','wishlists']);
    const data:Record<string,R[]>={};
    for(const t of tables){
      if(topTables.has(t as any)){
        const r=await supabase.from(t).select('*').eq('household_id',hid).order('created_at',{ascending:false});
        if(r.error){setErr(r.error.message);setFinanceLoading(false);return}data[t]=r.data||[];
      }
    }
    const etfIds=(data.etf_assets||[]).map(x=>x.id),goldIds=(data.gold_assets||[]).map(x=>x.id),stockIds=(data.dividend_stocks||[]).map(x=>x.id),savingIds=(data.savings||[]).map(x=>x.id),debtIds=(data.debts||[]).map(x=>x.id);
    const childSpecs:[string,string,string[]][]=[['etf_transactions','asset_id',etfIds],['gold_transactions','asset_id',goldIds],['dividend_stock_transactions','stock_id',stockIds],['dividends','stock_id',stockIds],['saving_transactions','saving_id',savingIds],['debt_payments','debt_id',debtIds]];
    for(const [t,col,ids] of childSpecs){
      if(!ids.length){data[t]=[];continue}
      const r=await supabase.from(t).select('*').in(col,ids).order('created_at',{ascending:false});
      if(r.error){setErr(r.error.message);setFinanceLoading(false);return}data[t]=r.data||[];
    }
    setFinance(data);setFinanceLoading(false);
  }

  if(loading)return <main className="admin-shell"><div className="admin-card">Memuat Admin Family Vault…</div></main>;
  if(err&&profiles.length===0)return <main className="admin-shell"><div className="admin-card"><h1>Admin Family Vault</h1><p className="admin-error">{err}</p><Link href="/dashboard">← Kembali</Link></div></main>;

  const selectedHouse=houses.find(h=>h.id===selected);
  const totalIncome=sum(finance.income||[]),totalExpenses=sum(finance.expenses||[]);
  const etfValue=sum(finance.etf_assets||[],'current_value');
  const goldValue=(finance.gold_assets||[]).reduce((s,a)=>{const tx=(finance.gold_transactions||[]).filter(x=>x.asset_id===a.id),grams=tx.reduce((g,x)=>g+(x.type==='sell'?-1:1)*Number(x.grams||0),0);return s+Math.max(0,grams)*Number(a.current_price_per_gram||0)},0);
  const stockValue=(finance.dividend_stocks||[]).reduce((s,a)=>{const tx=(finance.dividend_stock_transactions||[]).filter(x=>x.stock_id===a.id),units=tx.reduce((u,x)=>u+(x.type==='sell'?-1:1)*Number(x.units||0),0);return s+Math.max(0,units)*Number(a.current_price||0)},0);
  const savingValue=sum(finance.saving_transactions||[]);
  const debtRemaining=(finance.debts||[]).reduce((s,d)=>s+Math.max(0,Number(d.original_amount||0)-sum((finance.debt_payments||[]).filter(x=>x.debt_id===d.id))),0);

  return <main className="admin-shell">
    <header className="admin-head"><div><div className="kicker">Platform Control</div><h1>Admin Family Vault</h1><p>Approve akun, kontrol akses membuat household, kelola household, dan lihat data keuangan secara read-only.</p></div><Link className="btn alt" href="/dashboard">Dashboard Saya</Link></header>
    {err&&<p className="status error">{err}</p>}
    <AdminBrandExperiencePanel/>

    <section className="admin-section">
      <div className="admin-title"><div><div className="kicker">Accounts</div><h2>Akun Pengguna</h2></div><span>{profiles.length} akun</span></div>
      <div className="admin-table-wrap"><table><thead><tr><th>Pengguna</th><th>Status</th><th>Buat Household</th><th>Household</th><th>Aksi</th></tr></thead><tbody>{profiles.map(p=>{const ms=members.filter(m=>m.user_id===p.id);return <tr key={p.id}><td><b>{p.display_name||p.email||'Tanpa nama'}</b><div className="muted small">{p.email}</div></td><td><span className={`admin-pill ${p.status}`}>{p.status}</span></td><td>{p.can_create_household?'Diizinkan':'Tidak'}</td><td>{ms.map(m=>houses.find(h=>h.id===m.household_id)?.name).filter(Boolean).join(', ')||'—'}</td><td><div className="admin-actions">{p.status!=='approved'&&<button className="btn" onClick={()=>approveUser(p.id)}>Setujui</button>}<button className="btn alt" onClick={()=>toggleCreate(p)}>{p.can_create_household?'Cabut Izin Household':'Izinkan Household'}</button>{p.status!=='suspended'&&<button className="icon" onClick={()=>suspendUser(p.id)}>Nonaktifkan</button>}</div></td></tr>})}</tbody></table></div>
    </section>

    <section className="admin-section">
      <div className="admin-title"><div><div className="kicker">Households</div><h2>Semua Household</h2></div><span>{houses.length} household</span></div>
      <div className="admin-grid">{houses.map(h=>{const ms=members.filter(m=>m.household_id===h.id);return <article className="admin-card" key={h.id}><div className="admin-card-head"><div><h3>{h.name}</h3><span className={`admin-pill ${h.status}`}>{h.status}</span></div><button className="btn alt" onClick={()=>viewFinance(h.id)}>Lihat Keuangan</button></div><p className="muted small">Dibuat oleh: {profileMap[h.created_by]?.display_name||profileMap[h.created_by]?.email||h.created_by}</p><div className="member-list">{ms.map(m=><div key={m.user_id}><span><b>{profileMap[m.user_id]?.display_name||profileMap[m.user_id]?.email||m.user_id}</b> · {m.role}</span>{m.role!=='owner'&&<button className="icon" onClick={()=>removeMember(h.id,m.user_id)}>Cabut</button>}</div>)}</div><div className="admin-actions">{h.status!=='active'&&<button className="btn" onClick={()=>setHouseStatus(h,'active')}>Aktifkan</button>}{h.status!=='suspended'&&<button className="btn alt" onClick={()=>setHouseStatus(h,'suspended')}>Suspend</button>}<button className="icon danger" onClick={()=>deleteHouse(h)}>Hapus Permanen</button></div></article>})}</div>
    </section>

    {selectedHouse&&<section className="admin-section">
      <div className="admin-title"><div><div className="kicker">Read-only Finance</div><h2>{selectedHouse.name}</h2></div><button className="icon" onClick={()=>{setSelected('');setFinance({})}}>Tutup</button></div>
      {financeLoading?<div className="admin-card">Memuat data keuangan…</div>:<>
        <div className="admin-metrics"><div><span>Total Income</span><b>{rp(totalIncome)}</b></div><div><span>Total Expenses</span><b>{rp(totalExpenses)}</b></div><div><span>Cashflow</span><b>{rp(totalIncome-totalExpenses)}</b></div><div><span>Total Aset</span><b>{rp(etfValue+goldValue+stockValue+savingValue)}</b></div><div><span>Sisa Hutang</span><b>{rp(debtRemaining)}</b></div></div>
        <div className="admin-grid"><article className="admin-card"><h3>Aset</h3><div className="admin-fin-row"><span>ETF</span><b>{rp(etfValue)}</b></div><div className="admin-fin-row"><span>Emas</span><b>{rp(goldValue)}</b></div><div className="admin-fin-row"><span>Saham Dividen</span><b>{rp(stockValue)}</b></div><div className="admin-fin-row"><span>Tabungan</span><b>{rp(savingValue)}</b></div></article><article className="admin-card"><h3>Data</h3><div className="admin-fin-row"><span>Income</span><b>{(finance.income||[]).length}</b></div><div className="admin-fin-row"><span>Expenses</span><b>{(finance.expenses||[]).length}</b></div><div className="admin-fin-row"><span>Budget</span><b>{(finance.budgets||[]).length}</b></div><div className="admin-fin-row"><span>Wishlist</span><b>{(finance.wishlists||[]).length}</b></div></article></div>
        <div className="admin-card"><h3>Transaksi Terbaru</h3><div className="admin-table-wrap"><table><thead><tr><th>Tipe</th><th>Tanggal</th><th>Nama</th><th>Nominal</th><th>Diinput oleh</th></tr></thead><tbody>{[...(finance.income||[]).map(x=>({...x,_type:'Income',_name:x.source})),...(finance.expenses||[]).map(x=>({...x,_type:'Expense',_name:x.name}))].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,30).map(x=><tr key={`${x._type}-${x.id}`}><td>{x._type}</td><td>{x.happened_at}</td><td>{x._name}</td><td>{rp(x.amount)}</td><td>{profileMap[x.created_by]?.display_name||profileMap[x.created_by]?.email||'Data lama'}</td></tr>)}</tbody></table></div></div>
      </>}
    </section>}
  </main>
}

