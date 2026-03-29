import { useEffect, useState } from 'react';
import { Plus, Banknote } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const statusColors: Record<string,string> = { active:'bg-green-500/20 text-green-400 border-green-500/30', inactive:'bg-gray-500/20 text-gray-400 border-gray-500/30', closed:'bg-red-500/20 text-red-400 border-red-500/30', frozen:'bg-blue-500/20 text-blue-400 border-blue-500/30' };

export function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerId:'', accountType:'savings', currency:'PKR', isIslamic:false });

  const load = async () => {
    setLoading(true);
    try {
      const [ar, dr] = await Promise.all([api.getAccounts({ limit:50 }), api.getAccountsDashboard()]);
      setAccounts(ar.data.accounts);
      setSummary(dr.data.data?.summary || {});
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAccount(form);
      toast.success('Account created');
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">Open Account</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={createAccount} className="p-6 space-y-4">
              <div><label className="text-sm text-gray-400 mb-1.5 block">Customer ID *</label><input className="input-field" value={form.customerId} onChange={e => setForm({...form,customerId:e.target.value})} required /></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Account Type</label>
                <select className="input-field" value={form.accountType} onChange={e => setForm({...form,accountType:e.target.value})}>
                  <option value="savings">Savings</option><option value="current">Current</option>
                  <option value="fixed_deposit">Fixed Deposit</option><option value="forex">Foreign Currency</option>
                </select>
              </div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Currency</label>
                <select className="input-field" value={form.currency} onChange={e => setForm({...form,currency:e.target.value})}>
                  <option value="PKR">PKR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select>
              </div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Islamic Account?</label>
                <select className="input-field" value={String(form.isIslamic)} onChange={e => setForm({...form,isIslamic:e.target.value==='true'})}>
                  <option value="false">Conventional</option><option value="true">Islamic</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Open Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header flex items-start justify-between">
        <div><h1 className="page-title">Accounts</h1><p className="page-subtitle">{summary.total || 0} accounts — PKR {parseFloat(summary.total_balance||0).toLocaleString()} total deposits</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16}/> Open Account</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card"><div className="text-gray-400 text-sm">Total Accounts</div><div className="text-2xl font-bold text-white mt-1">{parseInt(summary.total||0).toLocaleString()}</div></div>
        <div className="card"><div className="text-gray-400 text-sm">Total Balance</div><div className="text-2xl font-bold text-white mt-1">PKR {parseFloat(summary.total_balance||0).toLocaleString('en',{maximumFractionDigits:0})}</div></div>
        <div className="card"><div className="text-gray-400 text-sm">Dormant</div><div className="text-2xl font-bold text-yellow-400 mt-1">{parseInt(summary.dormant||0)}</div></div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-surface-border">
            <th className="text-left text-gray-400 font-medium px-6 py-4">Account Number</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Customer</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Type</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Balance</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Currency</th>
            <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-16"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div></td></tr>
              : accounts.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="px-6 py-4 font-mono text-gray-200">{a.account_number}</td>
                  <td className="px-4 py-4 text-white">{a.customer_name}<div className="text-gray-500 text-xs">{a.cif_number}</div></td>
                  <td className="px-4 py-4 text-gray-300 capitalize">{a.account_type.replace('_',' ')} {a.is_islamic && <span className="text-xs text-yellow-400">(Islamic)</span>}</td>
                  <td className="px-4 py-4 font-mono text-white">{parseFloat(a.balance).toLocaleString('en',{maximumFractionDigits:2})}</td>
                  <td className="px-4 py-4 text-gray-400">{a.currency}</td>
                  <td className="px-4 py-4"><span className={clsx('badge border', statusColors[a.status]||statusColors.active)}>{a.status}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
