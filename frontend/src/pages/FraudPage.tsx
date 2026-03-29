import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
export function FraudPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const [ar, sr] = await Promise.all([api.getFraudAlerts({ limit:50 }), api.getFraudStats()]); setAlerts(ar.data.alerts||[]); setStats(sr.data.data||{}); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const review = async (id: string, action: string) => {
    const notes = prompt(`${action} notes:`); if (!notes) return;
    try { await api.reviewFraudAlert(id, action, notes); toast.success('Alert updated'); load(); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Fraud Detection</h1><p className="page-subtitle">AI-powered anomaly detection & transaction risk scoring</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-red-500/20 bg-red-500/5"><div className="text-gray-400 text-sm">Open Alerts</div><div className="text-2xl font-bold text-red-400 mt-1">{stats.last24h||0}</div><div className="text-gray-500 text-xs">Last 24h</div></div>
        {(stats.byRiskLevel||[]).map((r: any) => (
          <div key={r.risk_level} className="card"><div className="text-gray-400 text-sm capitalize">{r.risk_level} Risk</div><div className="text-2xl font-bold text-white mt-1">{r.count}</div></div>
        ))}
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-surface-border">
            <th className="text-left text-gray-400 font-medium px-6 py-4">Transaction</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Customer</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Amount</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Fraud Score</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Date</th>
            <th className="px-4 py-4">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-16"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div></td></tr>
              : alerts.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-gray-500">No fraud alerts detected</td></tr>
              : alerts.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">{a.transaction_reference||'—'}</td>
                  <td className="px-4 py-4 text-white">{a.customer_name||'—'}</td>
                  <td className="px-4 py-4 font-mono text-white">PKR {a.amount ? parseFloat(a.amount).toLocaleString() : '—'}</td>
                  <td className="px-4 py-4"><div className={clsx('flex items-center gap-2')}><div className="w-24 h-2 rounded-full bg-surface-border overflow-hidden"><div className={clsx('h-full rounded-full', parseFloat(a.fraud_score)>=70?'bg-red-500':parseFloat(a.fraud_score)>=40?'bg-yellow-500':'bg-green-500')} style={{width:`${Math.min(100,a.fraud_score)}%`}}/></div><span className={clsx('text-sm font-bold font-mono', parseFloat(a.fraud_score)>=70?'text-red-400':parseFloat(a.fraud_score)>=40?'text-yellow-400':'text-green-400')}>{parseFloat(a.fraud_score).toFixed(0)}</span></div></td>
                  <td className="px-4 py-4"><span className={clsx('badge border', a.status==='open'?'bg-yellow-500/20 text-yellow-400 border-yellow-500/30':a.status==='confirmed'?'bg-red-500/20 text-red-400 border-red-500/30':'bg-green-500/20 text-green-400 border-green-500/30')}>{a.status}</span></td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{a.created_at?format(new Date(a.created_at),'MMM d, HH:mm'):'—'}</td>
                  <td className="px-4 py-4">
                    {a.status==='open' && <div className="flex gap-2">
                      <button onClick={() => review(a.id,'clear')} className="text-xs text-green-400 border border-green-500/30 px-2 py-1 rounded-lg">Clear</button>
                      <button onClick={() => review(a.id,'confirm')} className="text-xs text-red-400 border border-red-500/30 px-2 py-1 rounded-lg">Confirm</button>
                    </div>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
