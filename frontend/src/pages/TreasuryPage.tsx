import { useEffect, useState } from 'react';
import { api } from '../services/api';
export function TreasuryPage() {
  const [liquidity, setLiquidity] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.getLiquidity(), api.getCashFlow()])
      .then(([lr, cfr]) => { setLiquidity(lr.data.data); setCashFlow(cfr.data.data); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Treasury & Liquidity</h1><p className="page-subtitle">Cash flow monitoring, liquidity ratios, forex management</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {liquidity.map((l, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">{l.currency}</div>
              <div className="text-xs text-gray-500">{l.accounts} accounts</div>
            </div>
            <div className="space-y-3">
              <div><div className="text-gray-400 text-xs mb-1">Total Balance</div><div className="text-2xl font-display font-bold text-white">{parseFloat(l.total_balance).toLocaleString('en',{maximumFractionDigits:0})}</div></div>
              <div><div className="text-gray-400 text-xs mb-1">Available</div><div className="text-xl font-bold text-green-400">{parseFloat(l.available).toLocaleString('en',{maximumFractionDigits:0})}</div></div>
              <div className="w-full h-2 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{width:`${Math.min(100,(parseFloat(l.available)/parseFloat(l.total_balance))*100||0)}%`}}/>
              </div>
              <div className="text-gray-500 text-xs">{((parseFloat(l.available)/parseFloat(l.total_balance))*100||0).toFixed(1)}% liquidity ratio</div>
            </div>
          </div>
        ))}
        {liquidity.length === 0 && !loading && <div className="col-span-3 text-center py-16 text-gray-500">No liquidity data</div>}
        {loading && <div className="col-span-3 flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div>}
      </div>
      <div className="card">
        <h3 className="font-display font-semibold text-white mb-4">Cash Flow (Last 30 Days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium py-3 pr-6">Date</th>
              <th className="text-left text-gray-400 font-medium py-3 pr-6">Type</th>
              <th className="text-left text-gray-400 font-medium py-3">Volume (PKR)</th>
            </tr></thead>
            <tbody>
              {cashFlow.slice(0,20).map((r,i) => (
                <tr key={i} className="border-b border-surface-border/50 hover:bg-primary-500/5">
                  <td className="py-3 pr-6 text-gray-400 text-xs">{r.date}</td>
                  <td className="py-3 pr-6 text-gray-300 capitalize">{r.transaction_type?.replace('_',' ')}</td>
                  <td className="py-3 font-mono text-white">PKR {parseFloat(r.volume).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
