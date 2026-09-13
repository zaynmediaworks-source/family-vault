'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import DashboardAppV2 from './DashboardAppV2';
import InvestmentExperience from './InvestmentExperience';
import PeriodExperience from './PeriodExperience';
import WealthExperienceV4 from './WealthExperienceV4';
import ReceivableExperience from './ReceivableExperience';
import FeedbackNavLink from './FeedbackNavLink';
import BrandNavEnhancer from './BrandNavEnhancer';
import BrandExperience from './BrandExperience';
import DashboardMetricsExperience from './DashboardMetricsExperience';
import DashboardLiveClock from './DashboardLiveClock';
import VaultWordingExperience from './VaultWordingExperience';
import DashboardTicker from './DashboardTicker';

type Profile={status:string;can_create_household:boolean;display_name:string|null;email:string|null};
type House={id:string;name:string;status:string;period_start_day?:number;timezone?:string;vault_type?:'personal'|'shared'};

export default function DashboardGate(){
  const router=useRouter();
  const [loading,setLoading]=useState(true),[profile,setProfile]=useState<Profile|null>(null),[houses,setHouses]=useState<House[]>([]),[admin,setAdmin]=useState(false),[settings,setSettings]=useState<any>(null),[pendingJoin,setPendingJoin]=useState(false),[err,setErr]=useState('');

  useEffect(()=>{(async()=>{
    const {data}=await supabase.auth.getUser();
    if(!data.user){router.replace('/login');return}
    const [p,h,a,s,j]=await Promise.all([
      supabase.from('profiles').select('status,can_create_household,display_name,email').eq('id',data.user.id).maybeSingle(),
      supabase.from('households').select('id,name,status,period_start_day,timezone,vault_type').order('created_at'),
      supabase.from('platform_admins').select('role').eq('user_id',data.user.id).maybeSingle(),
      supabase.from('platform_settings').select('*').eq('id',true).maybeSingle(),
      supabase.from('household_join_requests').select('id').eq('user_id',data.user.id).eq('status','pending').limit(1),
    ]);
    if(p.error){setErr(p.error.message);setLoading(false);return}
    setProfile(p.data as Profile|null);setHouses((h.data||[]) as House[]);setAdmin(!!a.data);setSettings(s.data||null);setPendingJoin((j.data||[]).length>0);setLoading(false);
  })()},[router]);

  if(loading)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p>Memeriksa akses…</p></section></main>;
  if(err)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p className="status error">{err}</p></section></main>;
  if(!profile)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Profil belum tersedia</h1><p className="muted">Silakan logout lalu login kembali. Jika tetap muncul, hubungi admin Family Vault.</p></section></main>;

  if(profile.status==='suspended')return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Akses Dinonaktifkan</h1><p className="muted">Akses akun ini sedang dinonaktifkan oleh admin.</p></section></main>;
  if(settings?.maintenance_enabled&&!admin)return <main className="center maintenance-screen"><section className="auth-card maintenance-card"><div className="maintenance-orb">⚙️</div><div className="kicker">Scheduled Maintenance</div><h1>{settings.maintenance_title||'Maintenance Mode'}</h1><p className="muted">{settings.maintenance_message||'Family Vault sedang dalam pemeliharaan. Silakan coba lagi nanti.'}</p><p className="small muted">Data kamu tetap tersimpan. Akses akan kembali setelah admin menyelesaikan maintenance.</p></section></main>;

  const blocked=houses.find(h=>h.status!=='active');
  const activeHouses=houses.filter(h=>h.status==='active');
  const active=activeHouses[0];
  if(!active&&blocked)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>{blocked.status==='pending'?'Vault Menunggu Persetujuan Admin':'Vault Dinonaktifkan'}</h1><p><b>{blocked.name}</b></p><p className="muted">{blocked.status==='pending'?'Akunmu sudah aktif. Vault yang kamu buat perlu diaktifkan admin sebelum data keuangan dapat digunakan.':'Vault ini sedang disuspend oleh admin.'}</p><Link className="btn alt" href="/family">Pengaturan Vault</Link>{admin&&<Link className="btn" href="/admin">Buka Admin Panel</Link>}</section></main>;
  if(!active)return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>{pendingJoin?'Menunggu Persetujuan Owner':'Mulai Family Vault'}</h1><p className="muted">{pendingJoin?'Permintaan bergabungmu sudah terkirim. Owner Vault perlu menyetujuinya sebelum kamu mendapat akses.':'Akunmu sudah aktif. Kamu bisa membuat Personal Vault, Shared Vault, atau bergabung ke Vault yang sudah ada.'}</p><Link className="btn" href="/family">{pendingJoin?'Lihat Status Vault':'Buat / Gabung Vault'}</Link></section></main>;

  return <><DashboardAppV2/><PeriodExperience houses={activeHouses}/><InvestmentExperience houses={activeHouses}/><WealthExperienceV4 houses={activeHouses}/><ReceivableExperience houses={activeHouses}/><FeedbackNavLink/><BrandNavEnhancer/><BrandExperience houses={activeHouses}/><DashboardMetricsExperience/><DashboardTicker enabled={!!settings?.dashboard_ticker_enabled} text={settings?.dashboard_ticker_text||''}/><DashboardLiveClock houses={activeHouses}/><VaultWordingExperience houses={activeHouses}/>{admin&&<Link href="/admin" className="floating-admin">🛡️ Admin</Link>}</>;
}
