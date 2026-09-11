import Link from 'next/link';
import DashboardGate from './DashboardGate';
import SessionGuard from '@/app/components/SessionGuard';

export default function Page(){
  return <><SessionGuard minutes={60}/><Link href="/security" style={{position:'fixed',right:18,bottom:74,zIndex:50,background:'#315f9d',color:'#fff',textDecoration:'none',padding:'11px 14px',borderRadius:12,fontWeight:800,boxShadow:'0 8px 24px rgba(0,0,0,.14)'}}>🔐 Keamanan</Link><Link href="/family" style={{position:'fixed',right:18,bottom:18,zIndex:50,background:'#111821',color:'#fff',textDecoration:'none',padding:'11px 14px',borderRadius:12,fontWeight:800,boxShadow:'0 8px 24px rgba(0,0,0,.16)'}}>👥 Keluarga</Link><DashboardGate/></>;
}
