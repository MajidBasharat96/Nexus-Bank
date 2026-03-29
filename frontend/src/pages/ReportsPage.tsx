import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { format } from 'date-fns';
export function ReportsPage() {
  const [volData, setVolData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getTransactionVolume().then(r => {
      const raw = r.data.data as any[];
      const byDate: Record<string,any> = {};
      raw.forEach(r => { if (!byDate[r.date]) byDate[r.date] = { date: format(new Date(r.date),'MMM d') }; byDate[r.date][r.transaction_type] = parseFloat(r.volume); });
      setVolData(Object.values(byDate));
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active||!payload?.length) return null;
    return <div className="bg-surface-card border border-surface-border rounded-xl p-3 shadow-xl text-sm"><p className="text-gray-400 text-xs mb-2">{label}</p>{payload.map((p: any,i: number) => <div key={i} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:p.color}}/><span className="text-gray-300">{p.name}:</span><span className="text-white">PKR {parseFloat(p.value||0).toLocaleString()}</span></div>)}</div>;
  };
  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Financial insights, transaction analytics, custom dashboards</p></div>
      <div className="card">
        <h3 className="font-display font-semibold text-white mb-1">30-Day Transaction Volume by Type</h3>
        <p className="text-gray-500 text-sm mb-6">PKR amounts per transaction category</p>
        {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div>
          : <ResponsiveContainer width="100%" height={300}><BarChart data={volData} margin={{top:0,right:0,left:-10,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a"/>
            <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:11}}/>
            <YAxis tick={{fill:'#64748b',fontSize:11}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="deposit" name="Deposits" fill="#4361ee" radius={[4,4,0,0]}/>
            <Bar dataKey="transfer" name="Transfers" fill="#f72585" radius={[4,4,0,0]}/>
            <Bar dataKey="withdrawal" name="Withdrawals" fill="#4cc9f0" radius={[4,4,0,0]}/>
          </BarChart></ResponsiveContainer>}
      </div>
      <div className="card">
        <h3 className="font-display font-semibold text-white mb-1">Transaction Volume Trend</h3>
        <p className="text-gray-500 text-sm mb-6">Daily cumulative flow</p>
        <ResponsiveContainer width="100%" height={250}><LineChart data={volData} margin={{top:0,right:0,left:-10,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a"/>
          <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:11}}/>
          <YAxis tick={{fill:'#64748b',fontSize:11}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Line type="monotone" dataKey="deposit" name="Deposits" stroke="#4361ee" strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="transfer" name="Transfers" stroke="#f72585" strokeWidth={2} dot={false}/>
        </LineChart></ResponsiveContainer>
      </div>
    </div>
  );
}
