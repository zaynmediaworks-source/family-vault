'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import DashboardAppV2 from './DashboardAppV2';
import InvestmentExperience from './InvestmentExperience';
import PeriodExperience from './PeriodExperience';
import WealthExperienceV4 from './WealthExperienceV4';
import FeedbackNavLink from './FeedbackNavLink';
import BrandNavEnhancer from './BrandNavEnhancer';
import BrandExperience from './BrandExperience';
import DashboardMetricsExperience from './DashboardMetricsExperience';

type Profile={status:string;can_create_household:boolean;display_name:string|null;email:string|null};
type House={id:string;name:string;status:string;period_start_day?:number;timezone?:string};

export default function DashboardGate(){
  const router=useRouter();
  const [loading,setLoading]=useState(true),[profile,setProfile]=useState<Profile|null>(null),[houses,setHouses]=useState<House[]>([]),[admin,setAdmin]=useState(false),[settings,setSettings]=useState<any>(null),[err,setErr]=useState('');

  useEffect(()=>{(async()=>{
    const {data}=await supabase.auth.getUser();
    if(!data.user){router.replace('/login');return}
    const [p,h,a,s]=await Promise.all([
      supabase.from('profiles').select('status,can_create_household,display_name,email').eq('id',data.user.id).maybeSingle(),
      supabase.from('households').select('id,name,status,period_start_day,timezone').order('created_at'),
      supabase.from('platform_admins').select('role').eq('user_id',data.user.id).maybeSingle(),
      supabase.from('platform_settings').select('*').eq('id',true).maybeSingle(),
    ]);
    if(p.error){setErr(p.error.message);setLoading(false);return}
    setProfile(p.data as Profile|null);setHouses((h.data||[]) as House[]);setAdmin(!!a.data);setSettings(s.data||null);setLoading(false);
  })()},[router]);

  if(loading)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p>Memeriksa akses…</p></section></main>;
  if(err)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p className="status error">{err}</p></section></main>;
  if(!profile)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Profil belum tersedia</h1><p className="muted">Silakan logout lalu login kembali. Jika tetap muncul, hubungi admin Family Vault.</p></section></main>;

  if(profile.status==='pending')return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Menunggu Persetujuan Admin</h1><p className="muted">Akunmu sudah dibuat, tetapi belum dapat mengakses Family Vault sampai admin menyetujuinya.</p></section></main>;
  if(profile.status==='suspended')return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Akses Dinonaktifkan</h1><p className="muted">Akses akun ini sedang dinonaktifkan oleh admin.</p></section></main>;
  if(settings?.maintenance_enabled&&!admin)return <main className="center maintenance-screen"><section className="auth-card maintenance-card"><div className="maintenance-orb">⚙️</div><div className="kicker">Scheduled Maintenance</div><h1>{settings.maintenance_title||'Maintenance Mode'}</h1><p className="muted">{settings.maintenance_message||'Family Vault sedang dalam pemeliharaan. Silakan coba lagi nanti.'}</p><p className="small muted">Data kamu tetap tersimpan. Akses akan kembali setelah admin menyelesaikan maintenance.</p></section></main>;

  const blocked=houses.find(h=>h.status!=='active');
  const activeHouses=houses.filter(h=>h.status==='active');
  const active=activeHouses[0];
  if(!active&&blocked)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>{blocked.status==='pending'?'Household Menunggu Persetujuan':'Household Dinonaktifkan'}</h1><p><b>{blocked.name}</b></p><p className="muted">{blocked.status==='pending'?'Household sudah dibuat. Admin perlu mengaktifkannya sebelum data keuangan dapat digunakan.':'Household ini sedang disuspend oleh admin.'}</p>{admin&&<Link className="btn" href="/admin">Buka Admin Panel</Link>}</section></main>;
  if(!active&&!profile.can_create_household&&!admin)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Akun Sudah Disetujui</h1><p className="muted">Akun ini belum diberi izin membuat household. Kamu masih bisa bergabung ke household keluarga melalui kode undangan.</p><Link className="btn" href="/family">Gabung Household</Link></section></main>;

  return <><DashboardAppV2/><PeriodExperience houses={activeHouses}/><InvestmentExperience houses={activeHouses}/><WealthExperienceV4 houses={activeHouses}/><FeedbackNavLink/><BrandNavEnhancer/><BrandExperience/><DashboardMetricsExperience/>{admin&&<Link href="/admin" className="floating-admin">🛡️ Admin</Link>}</>;
}
