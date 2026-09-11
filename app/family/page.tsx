'use client';
import {useState} from 'react';
import Link from 'next/link';
import MemberManager from './MemberManager';
import ActivityPanel from './ActivityPanel';
import SessionGuard from '@/app/components/SessionGuard';
import styles from './family.module.css';
type R=Record<string,any>;
export default function FamilyPage(){
 const [ctx,setCtx]=useState<{uid:string;email:string;name:string;hid:string;members:R[];profiles:R[];house:R|null}>({uid:'',email:'',name:'',hid:'',members:[],profiles:[],house:null});
 return <main className={styles.page}><SessionGuard minutes={60}/><div className={styles.top}><div><Link href="/dashboard" className={styles.back}>← Dashboard</Link><h1>Keluarga</h1><p>Tambah anggota Family Vault dan lihat siapa yang menginput data.</p></div>{ctx.house&&<span className={styles.house}>{ctx.house.name}</span>}</div><MemberManager onReady={setCtx}/><ActivityPanel hid={ctx.hid} uid={ctx.uid} email={ctx.email} name={ctx.name} profiles={ctx.profiles}/></main>
}
