'use client';
import { FormEvent,useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type R=Record<string,any>;
const rp=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const today=()=>new Date().toISOString().slice(0,10);
function keyFor(s:string){const d=new Date(s+'T00:00:00');let y=d.getFullYear(),m=d.getMonth();if(d.getDate()<22){m--;if(m<0){m=11;y--;}}return `${y}-${String(m+1).padStart(2,'0')}`}
function bounds(k:string){const [y,m]=k.split('-').map(Number),a=new Date(y,m-1,22),b=new Date(y,m,22);const z=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const l=new Date(b);l.setDate(l.getDate()-1);return{start:z(a),end:z(b),last:z(l)}}
function label(k:string){const b=bounds(k),f=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'});return `${f.format(new Date(b.start+'T00:00:00'))} – ${f.format(new Date(b.last+'T00:00:00'))}`}

export default function Dashboard(){
 const router=useRouter();
 const [uid,setUid]=useState(''),[email,setEmail]=useState(''),[busy,setBusy]=useState(true),[err,setErr]=useState('');
 const [houses,setHouses]=useState<R[]>([]),[hid,setHid]=useState(''),[houseName,setHouseName]=useState('Keluarga Kita');
 const [period,setPeriod]=useState(keyFor(today())),[income,setIncome]=useState<R[]>([]),[expenses,setExpenses]=useState<R[]>([]);
 async function loadHouse(){const r=await supabase.from('households').select('id,name').order('created_at');if(r.error)throw r.error;setHouses(r.data||[]);return r.data||[]}
 async function loadRows(id:string){const [a,b]=await Promise.all([supabase.from('income').select('*').eq('household_id',id),supabase.from('expenses').select('*').eq('household_id',id)]);if(a.error||b.error)throw a.error||b.error;setIncome(a.data||[]);setExpenses(b.data||[])}
 async function openFirstHouse(){const h=await loadHouse();if(h[0]){setHid(h[0].id);await loadRows(h[0].id);return true}return false}
 useEffect(()=>{(async()=>{const {data,error}=await supabase.auth.getUser();if(error||!data.user){router.replace('/login');return}setUid(data.user.id);setEmail(data.user.email||'');try{await openFirstHouse()}catch(e:any){setErr(e.message||'Gagal memuat data')}finally{setBusy(false)}})()},[router]);
 async function createHouse(e:FormEvent){e.preventDefault();if(!houseName.trim())return;setBusy(true);setErr('');try{const r=await supabase.from('households').insert({name:houseName.trim(),created_by:uid}).select('id,name').single();if(r.error)throw r.error;setHouses([r.data]);setHid(r.data.id);await loadRows(r.data.id);router.replace('/dashboard');router.refresh()}catch(e:any){setErr(e.message||'Household gagal dibuat')}finally{setBusy(false)}}
 async function logout(){await supabase.auth.signOut();router.replace('/login')}
 const b=bounds(period),inside=(d:string)=>!!d&&d>=b.start&&d<b.end;
 const pi=income.filter(x=>inside(x.happened_at)),pe=expenses.filter(x=>inside(x.happened_at));
 const inc=pi.reduce((s,x)=>s+Number(x.amount||0),0),exp=pe.reduce((s,x)=>s+Number(x.amount||0),0);
 if(busy&&!uid)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p>Memuat…</p></section></main>;
 if(!houses.length)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Buat Household</h1><p className="muted">Buat ruang keuangan keluarga yang bisa dipakai bersama istri.</p>{err&&<p className="status error" role="alert">{err}</p>}<form onSubmit={createHouse}><label>Nama Household<input value={houseName} onChange={e=>setHouseName(e.target.value)} maxLength={100} required /></label><button className="primary" disabled={busy||!houseName.trim()}>{busy?'Membuat…':'Buat Household'}</button></form><p className="muted" style={{fontSize:12,marginTop:16}}>Akun: {email}</p></section></main>;
 return <main className="shell"><aside className="sidebar"><div className="logo">Family Vault</div><p className="side-muted">Shared Family Finance</p><nav><span className="nav-active">Dashboard</span></nav><div className="side-bottom"><small>{email}</small><button onClick={logout}>Keluar</button></div></aside><section className="content"><div className="topbar"><div><h1>Dashboard</h1><p className="muted">Periode {label(period)}</p></div><input type="month" value={period} onChange={e=>setPeriod(e.target.value)}/></div>{err&&<p className="status error">{err}</p>}<label>Household<select value={hid} onChange={async e=>{setHid(e.target.value);await loadRows(e.target.value)}}>{houses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><div className="stats"><article className="card"><span>Income</span><strong>{rp(inc)}</strong></article><article className="card"><span>Expenses</span><strong>{rp(exp)}</strong></article><article className="card"><span>Leftover</span><strong>{rp(inc-exp)}</strong></article></div><article className="card" style={{padding:18}}><h2>Household aktif</h2><p>{houses.find(h=>h.id===hid)?.name}</p><p className="muted">Data household sudah aktif dan tersambung ke database Family Vault.</p></article><p className="muted" style={{fontSize:11}}>Build: online-v12-dashboard-fix</p></section></main>
}
