import DashboardGate from './DashboardGate';
import SessionGuard from '@/app/components/SessionGuard';

export default function Page(){
  return <><SessionGuard minutes={60}/><DashboardGate/></>;
}
