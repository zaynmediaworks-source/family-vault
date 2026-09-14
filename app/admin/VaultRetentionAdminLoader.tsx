'use client';

import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import VaultRetentionAdmin from './VaultRetentionAdmin';

type R=Record<string,any>;

export default function VaultRetentionAdminLoader(){
  const [houses,setHouses]=useState<R[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState('');

  useEffect(()=>{
    let alive=true;
    supabase.from('households').select('id,name,status,vault_type').order('name').then(({data,error})=>{
      if(!alive)return;
      if(error)setErr(error.message);else setHouses(data||[]);
      setLoading(false);
    });
    return()=>{alive=false};
  },[]);

  if(loading)return <section className="admin-section"><div className="admin-card">Memuat kontrol retensi Vault…</div></section>;
  if(err)return <section className="admin-section"><div className="admin-card"><p className="admin-error">{err}</p></div></section>;
  if(!houses.length)return null;
  return <VaultRetentionAdmin houses={houses}/>;
}
