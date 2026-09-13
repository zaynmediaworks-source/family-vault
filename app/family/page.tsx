'use client';
import {useState} from 'react';
import Link from 'next/link';
import MemberManager from './MemberManager';
import ActivityPanel from './ActivityPanel';
import HouseholdPeriodSettings from './HouseholdPeriodSettings';
import VaultTypeSettings from './VaultTypeSettings';
import SessionGuard from '@/app/components/SessionGuard';
import styles from './family.module.css';
type R=Record<string,any>;
export default function FamilyPage(){
 const [ctx,setCtx]=useState<{uid:string;email:string;name:string;hid:string;members:R[];profiles:R[];house:R|null}>({uid:'',email:'',name:'',hid:'',members:[],profiles:[],house:null});
 const type=ctx.house?.vault_type==='personal'?'personal':'shared';
 const title=ctx.house?(type==='personal'?'Personal Vault':'Shared Vault'):'Vault';
 const desc=ctx.house?(type==='personal'?'Kelola identitas Vault pribadi, periode, zona waktu, akses, dan riwayat aktivitas.':'Kelola Vault bersama, anggota, periode, zona waktu, dan riwayat aktivitas.'):'Buat Personal Vault, buat Shared Vault, atau bergabung ke Vault yang sudah ada.';
 return <main className={styles.page}><SessionGuard minutes={60}/><div className={styles.top}><div><Link href="/dashboard" className={styles.back}>← Dashboard</Link><h1>{title}</h1><p>{desc}</p></div>{ctx.house&&<span className={styles.house}>{ctx.house.name} · {type==='personal'?'Personal':'Shared'}</span>}</div><MemberManager onReady={setCtx}/><VaultTypeSettings house={ctx.house} uid={ctx.uid} members={ctx.members} onSaved={vault_type=>setCtx(v=>({...v,house:v.house?{...v.house,vault_type}:v.house}))}/><HouseholdPeriodSettings house={ctx.house} uid={ctx.uid} members={ctx.members} onSaved={(day,timezone)=>setCtx(v=>({...v,house:v.house?{...v.house,period_start_day:day,timezone}:v.house}))}/><ActivityPanel hid={ctx.hid} uid={ctx.uid} email={ctx.email} name={ctx.name} profiles={ctx.profiles}/></main>
}
