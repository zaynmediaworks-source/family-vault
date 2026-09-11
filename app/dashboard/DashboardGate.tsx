'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import DashboardApp from './DashboardApp';

type Profile={status:string;can_create_household:boolean;display_name:string|null;email:string|null};
type House={id:string;name:string;status:string};

export default function DashboardGate(){
  const router=useRouter();
  const [loading,setLoading]=useState(true),[profile,setProfile]=useState<Profile|null>(null),[houses,setHouses]=useState<House[]>([]),[admin,setAdmin]=useState(false),[err,setErr]=useState('');

  useEffect(()=>{(async()=>{
    const {data}=await supabase.auth.getUser();
    if(!data.user){router.replace('/login');return}
    const [p,h,a]=await Promise.all([
      supabase.from('profiles').select('status,can_create_household,display_name,email').eq('id',data.user.id).maybeSingle(),
      supabase.from('households').select('id,name,status').order('created_at'),
      supabase.from('platform_admins').select('role').eq('user_id',data.user.id).maybeSingle(),
    ]);
    if(p.error){setErr(p.error.message);setLoading(false);return}
    setProfile(p.data as Profile|null);setHouses((h.data||[]) as House[]);setAdmin(!!a.data);setLoading(false);
  })()},[router]);

  if(loading)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p>Memeriksa akses…</p></section></main>;
  if(err)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p className="status error">{err}</p></section></main>;
  if(!profile)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Profil belum tersedia</h1><p className="muted">Silakan logout lalu login kembali. Jika tetap muncul, hubungi admin Family Vault.</p></section></main>;

  if(profile.status==='pending')return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Menunggu Persetujuan Admin</h1><p className="muted">Akunmu sudah dibuat, tetapi belum dapat mengakses Family Vault sampai admin menyetujuinya.</p></section></main>;
  if(profile.status==='suspended')return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Akses Dinonaktifkan</h1><p className="muted">Akses akun ini sedang dinonaktifkan oleh admin.</p></section></main>;

  const blocked=houses.find(h=>h.status!=='active');
  const active=houses.find(h=>h.status==='active');
  if(!active&&blocked)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>{blocked.status==='pending'?'Household Menunggu Persetujuan':'Household Dinonaktifkan'}</h1><p><b>{blocked.name}</b></p><p className="muted">{blocked.status==='pending'?'Household sudah dibuat. Admin perlu mengaktifkannya sebelum data keuangan dapat digunakan.':'Household ini sedang disuspend oleh admin.'}</p>{admin&&<Link className="btn" href="/admin">Buka Admin Panel</Link>}</section></main>;

  if(!active&&!profile.can_create_household&&!admin)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Akun Sudah Disetujui</h1><p className="muted">Akun ini belum diberi izin membuat household. Kamu masih bisa bergabung ke household keluarga melalui kode undangan.</p><Link className="btn" href="/family">Gabung Household</Link></section></main>;

  return <><DashboardApp/>{admin&&<Link href="/admin" style={{position:'fixed',right:20,bottom:76,zIndex:20,background:'#315f9d',color:'#fff',padding:'11px 14px',borderRadius:10,textDecoration:'none',fontWeight:800,boxShadow:'0 5px 18px rgba(0,0,0,.16)'}}>🛡️ Admin</Link>}</>;
}
