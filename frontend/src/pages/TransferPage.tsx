import { useState } from 'react';
import { ArrowLeftRight, Send, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export function TransferPage() {
  const [form, setForm] = useState({ fromAccountId: '', toAccountNumber: '', amount: '', paymentType: 'internal', description: '', beneficiaryName: '', beneficiaryBank: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.transfer({ ...form, amount: parseFloat(form.amount) });
      setResult(res.data.data);
      toast.success('Transfer successful');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Transfer failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="page-header"><h1 className="page-title">Fund Transfer</h1><p className="page-subtitle">Intrabank & Interbank transfers (IBFT, Raast)</p></div>

      {result ? (
        <div className="card text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"><CheckCircle size={32} className="text-green-400" /></div>
          <h2 className="text-xl font-display font-bold text-white">Transfer Successful</h2>
          <div className="bg-surface/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Reference</span><span className="font-mono text-white">{result.transaction?.transaction_reference}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Amount</span><span className="text-white">PKR {parseFloat(form.amount).toLocaleString()}</span></div>
            {result.fee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Fee</span><span className="text-yellow-400">PKR {result.fee}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-gray-400">New Balance</span><span className="text-green-400">PKR {parseFloat(result.fromNewBalance || 0).toLocaleString()}</span></div>
          </div>
          <button onClick={() => { setResult(null); setForm({ fromAccountId: '', toAccountNumber: '', amount: '', paymentType: 'internal', description: '', beneficiaryName: '', beneficiaryBank: '' }); }} className="btn-primary justify-center">New Transfer</button>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-5">
          <div><label className="text-sm text-gray-400 mb-1.5 block">From Account ID *</label><input className="input-field" placeholder="Account UUID" value={form.fromAccountId} onChange={e => setForm({ ...form, fromAccountId: e.target.value })} required /></div>
          <div><label className="text-sm text-gray-400 mb-1.5 block">Payment Type</label>
            <select className="input-field" value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value })}>
              <option value="internal">Internal Transfer</option>
              <option value="ibft">IBFT (Interbank)</option>
              <option value="raast">Raast</option>
              <option value="rtgs">RTGS</option>
            </select>
          </div>
          <div><label className="text-sm text-gray-400 mb-1.5 block">To Account Number *</label><input className="input-field" placeholder="1234000000000" value={form.toAccountNumber} onChange={e => setForm({ ...form, toAccountNumber: e.target.value })} required /></div>
          {form.paymentType !== 'internal' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-400 mb-1.5 block">Beneficiary Name</label><input className="input-field" value={form.beneficiaryName} onChange={e => setForm({ ...form, beneficiaryName: e.target.value })} /></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Beneficiary Bank</label><input className="input-field" value={form.beneficiaryBank} onChange={e => setForm({ ...form, beneficiaryBank: e.target.value })} /></div>
            </div>
          )}
          <div><label className="text-sm text-gray-400 mb-1.5 block">Amount (PKR) *</label><input type="number" min="1" className="input-field" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
          {form.paymentType === 'ibft' && <p className="text-yellow-400 text-sm bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">IBFT fee of PKR 25 will be applied</p>}
          <div><label className="text-sm text-gray-400 mb-1.5 block">Description</label><input className="input-field" placeholder="Payment description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />Send Transfer</>}
          </button>
        </form>
      )}
    </div>
  );
}
