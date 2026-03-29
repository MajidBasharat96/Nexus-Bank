import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Eye } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
const sevColors: Record<string,string> = { critical:'bg-red-500/20 text-red-400 border-red-500/30', high:'bg-orange-500/20 text-orange-400 border-orange-500/30', medium:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', low:'bg-blue-500/20 text-blue-400 border-blue-500/30' };
export function CompliancePage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [aml, setAml] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('alerts');
  const load = async () => { setLoading(true); try { const [ar, amr] = await Promise.all([api.getComplianceAlerts(), api.getAmlReport()]); setAlerts(ar.data.data); setAml(amr.data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const resolve = async (id: string) => {
    const notes = prompt('Resolution notes:'); if (!notes) return;
    try { await api.updateComplianceAlert(id, { status: 'resolved', notes }); toast.success('Alert resolved'); load(); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Compliance & AML</h1><p className="page-subtitle">Anti-Money Laundering, KYC, regulatory reporting</p></div>
      <div className="flex gap-3">
        {['alerts','aml-report'].map(t => <button key={t} onClick={() => setTab(t)} className={clsx('px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize', tab===t ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-surface-border/50 text-gray-400 border-surface-border')}>{t.replace('-',' ')}</button>)}
      </div>
      {tab === 'alerts' ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">Type</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Customer</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Severity</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Description</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Risk Score</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
              <th className="px-4 py-4"></th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-16"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div></td></tr>
                : alerts.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-gray-500">No compliance alerts — system is clean</td></tr>
                : alerts.map(a => (
                  <tr key={a.id} className="table-row">
                    <td className="px-6 py-4 text-gray-300 capitalize">{a.alert_type?.replace('_',' ')}</td>
                    <td className="px-4 py-4 text-white">{a.customer_name || '—'}</td>
                    <td className="px-4 py-4"><span className={clsx('badge border', sevColors[a.severity]||sevColors.medium)}>{a.severity}</span></td>
                    <td className="px-4 py-4 text-gray-400 max-w-[200px] truncate">{a.description}</td>
                    <td className="px-4 py-4"><div className={clsx('font-mono text-sm font-bold', parseFloat(a.risk_score)>=70 ? 'text-red-400' : parseFloat(a.risk_score)>=40 ? 'text-yellow-400' : 'text-green-400')}>{parseFloat(a.risk_score||0).toFixed(0)}</div></td>
                    <td className="px-4 py-4"><span className={clsx('badge border', a.status==='resolved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30')}>{a.status}</span></td>
                    <td className="px-4 py-4">{a.status==='open' && <button onClick={() => resolve(a.id)} className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 px-2 py-1 rounded-lg">Resolve</button>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-surface-border"><h3 className="font-medium text-white">AML Report — Transactions ≥ PKR 500,000 (Last 30 Days)</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">Reference</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Customer</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">CNIC</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Amount</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Date</th>
            </tr></thead>
            <tbody>
              {aml.map((r, i) => (
                <tr key={i} className="table-row">
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">{r.transaction_reference}</td>
                  <td className="px-4 py-4 text-white">{r.full_name}</td>
                  <td className="px-4 py-4 font-mono text-gray-400 text-xs">{r.national_id}</td>
                  <td className="px-4 py-4 font-mono text-yellow-400 font-bold">PKR {parseFloat(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{r.created_at ? format(new Date(r.created_at),'MMM d, yyyy') : '—'}</td>
                </tr>
              ))}
              {aml.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">No reportable transactions</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
