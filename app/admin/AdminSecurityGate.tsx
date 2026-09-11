'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import SessionGuard from '@/app/components/SessionGuard';
export default function AdminSecurityGate({children}:{children:React.ReactNode}){
 const router=useRouter();const [ok,setOk]=useState(false);
 useEffect(()=>{(async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user){router.replace('/login');return}const [admin,aal]=await Promise.all([supabase.from('platform_admins').select('role').eq('user_id',u.user.id).maybeSingle(),supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);if(!admin.data){router.replace('/dashboard');return}if(aal.data?.currentLevel!=='aal2'){router.replace('/security?next=/admin');return}setOk(true)})()},[router]);
 if(!ok)return <main className="security-shell"><div className="security-card">Memverifikasi sesi admin…</div></main>;
 return <><SessionGuard minutes={20}/>{children}</>;
}
