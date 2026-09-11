import Link from 'next/link';
import DashboardGate from './DashboardGate';

export default function Page(){
  return <><Link href="/family" style={{position:'fixed',right:18,bottom:18,zIndex:50,background:'#111821',color:'#fff',textDecoration:'none',padding:'11px 14px',borderRadius:12,fontWeight:800,boxShadow:'0 8px 24px rgba(0,0,0,.16)'}}>👥 Keluarga</Link><DashboardGate/></>;
}
