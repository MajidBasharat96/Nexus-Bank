import { useEffect, useState } from 'react';
import { Plus, TrendingUp, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function NewLoanModal({ onClose, onCreated }: any) {
  const [form, setForm] = useState({ customerId: '', loanType: 'personal', principalAmount: '', interestRate: '12', tenureMonths: '12', purpose: '', isIslamic: false });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.applyLoan({ ...form, principalAmount: parseFloat(form.principalAmount), interestRate: parseFloat(form.interestRate), tenureMonths: parseInt(form.tenureMonths) });
      setResult(res.data.data);
      toast.success('Loan application submitted');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  if (result) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-white">Loan Application Submitted</h2>
        <div className="bg-surface/50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Loan #</span><span className="font-mono text-white">{result.loan?.loan_number}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-white">PKR {parseFloat(form.principalAmount).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Monthly EMI</span><span className="text-green-400 font-bold">PKR {parseFloat(result.emi || 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Tenure</span><span className="text-white">{form.tenureMonths} months</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { onCreated(); onClose(); }} className="btn-primary flex-1 justify-center">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-xl">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">New Loan Application</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div><label className="text-sm text-gray-400 mb-1.5 block">Customer ID *</label><input className="input-field" placeholder="Customer UUID" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-400 mb-1.5 block">Loan Type</label>
              <select className="input-field" value={form.loanType} onChange={e => setForm({ ...form, loanType: e.target.value })}>
                <option value="personal">Personal Loan</option>
                <option value="home">Home Financing</option>
                <option value="auto">Auto Loan</option>
                <option value="sme">SME Loan</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Islamic?</label>
              <select className="input-field" value={String(form.isIslamic)} onChange={e => setForm({ ...form, isIslamic: e.target.value === 'true' })}>
                <option value="false">Conventional</option>
                <option value="true">Islamic (Murabaha)</option>
              </select>
            </div>
          </div>
          <div><label className="text-sm text-gray-400 mb-1.5 block">Principal Amount (PKR) *</label><input type="number" className="input-field" value={form.principalAmount} onChange={e => setForm({ ...form, principalAmount: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-400 mb-1.5 block">Interest Rate (% p.a.)</label><input type="number" step="0.01" className="input-field" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} /></div>
            <div><label className="text-sm text-gray-400 mb-1.5 block">Tenure (Months)</label><input type="number" className="input-field" value={form.tenureMonths} onChange={e => setForm({ ...form, tenureMonths: e.target.value })} /></div>
          </div>
          <div><label className="text-sm text-gray-400 mb-1.5 block">Purpose</label><textarea className="input-field resize-none h-20" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
          {form.principalAmount && form.interestRate && form.tenureMonths && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3">
              <p className="text-primary-400 text-sm">Estimated EMI: <strong className="text-white">PKR {(
                (() => { const p = parseFloat(form.principalAmount); const r = parseFloat(form.interestRate)/100/12; const n = parseInt(form.tenureMonths); return r === 0 ? p/n : (p*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1); })()
              ).toLocaleString('en', { maximumFractionDigits: 0 })}</strong></p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const [lr, sr] = await Promise.all([
        api.getLoans({ page, limit: 20, status: filter || undefined }),
        api.getLoanStats()
      ]);
      setLoans(lr.data.loans);
      setPagination(lr.data.pagination);
      setStats(sr.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      await api.approveLoan(id, { action: 'approve' });
      toast.success('Loan approved');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const totalOutstanding = stats.reduce((sum, s) => sum + parseFloat(s.total_outstanding || 0), 0);
  const totalPrincipal = stats.reduce((sum, s) => sum + parseFloat(s.total_principal || 0), 0);

  return (
    <div className="space-y-6">
      {showModal && <NewLoanModal onClose={() => setShowModal(false)} onCreated={load} />}
      <div className="page-header flex items-start justify-between">
        <div><h1 className="page-title">Loans & Credit</h1><p className="page-subtitle">Full lifecycle loan management — {pagination.total?.toLocaleString() || 0} loans</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} />New Application</button>
      </div>

      {/* Loan stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.status} className="card">
            <div className="text-gray-400 text-sm capitalize">{s.status} Loans</div>
            <div className="text-xl font-bold text-white mt-1">{parseInt(s.count).toLocaleString()}</div>
            <div className="text-gray-500 text-xs mt-1">PKR {(parseFloat(s.total_outstanding||0)/1000000).toFixed(1)}M outstanding</div>
          </div>
        ))}
        <div className="card">
          <div className="text-gray-400 text-sm">Total Portfolio</div>
          <div className="text-xl font-bold text-white mt-1">PKR {(totalOutstanding/1000000).toFixed(1)}M</div>
          <div className="text-gray-500 text-xs mt-1">of PKR {(totalPrincipal/1000000).toFixed(1)}M disbursed</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        {['', 'pending', 'approved', 'active', 'closed', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={clsx('px-4 py-2 rounded-xl text-sm font-medium border transition-all', filter === s ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-surface-border/50 text-gray-400 border-surface-border hover:text-white')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">Loan #</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Customer</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Type</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Principal</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Outstanding</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">EMI</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="text-center py-16"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></td></tr>
              : loans.length === 0 ? <tr><td colSpan={8} className="text-center py-16 text-gray-500">No loans found</td></tr>
              : loans.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">{l.loan_number}</td>
                  <td className="px-4 py-4 text-white">{l.customer_name}</td>
                  <td className="px-4 py-4 text-gray-300 capitalize">{l.loan_type} {l.is_islamic && <span className="text-xs text-yellow-400 ml-1">(Islamic)</span>}</td>
                  <td className="px-4 py-4 font-mono text-white">PKR {parseFloat(l.principal_amount).toLocaleString()}</td>
                  <td className="px-4 py-4 font-mono text-yellow-400">PKR {parseFloat(l.outstanding_amount||0).toLocaleString()}</td>
                  <td className="px-4 py-4 font-mono text-gray-300">PKR {parseFloat(l.emi_amount||0).toLocaleString('en', {maximumFractionDigits:0})}</td>
                  <td className="px-4 py-4"><span className={clsx('badge border', statusBadge[l.status]||statusBadge.pending)}>{l.status}</span></td>
                  <td className="px-4 py-4">
                    {l.status === 'pending' && (
                      <button onClick={() => handleApprove(l.id)} className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 px-2 py-1 rounded-lg">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
