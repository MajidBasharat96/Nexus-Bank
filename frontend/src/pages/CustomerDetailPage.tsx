import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Banknote, ArrowLeftRight, FileText, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import clsx from 'clsx';
export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    Promise.all([api.getCustomer(id), api.getCustomerTransactions(id, { limit: 20 })])
      .then(([cr, tr]) => { setCustomer(cr.data.data); setTransactions(tr.data.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div>;
  if (!customer) return <div className="text-center py-24 text-gray-500">Customer not found</div>;
  const kycColors: Record<string,string> = { verified:'text-green-400', pending:'text-yellow-400', rejected:'text-red-400' };
  return (
    <div className="space-y-6 max-w-5xl">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={16}/>Back to Customers</button>
      {/* Header */}
      <div className="card flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600/40 to-primary-800/40 flex items-center justify-center text-2xl font-bold text-primary-300 border border-primary-500/20">{customer.full_name?.[0]?.toUpperCase()}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-white">{customer.full_name}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="font-mono text-gray-400 text-sm">{customer.cif_number}</span>
            <span className={clsx('text-sm font-medium',kycColors[customer.kyc_status]||kycColors.pending)}>KYC: {customer.kyc_status}</span>
            <span className="text-gray-500 text-sm capitalize">{customer.segment} • {customer.customer_type}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-sm">Total Balance</div>
          <div className="text-2xl font-display font-bold text-white">PKR {parseFloat(customer.accounts?.reduce((s: number, a: any) => s + parseFloat(a.balance||0), 0)||0).toLocaleString('en',{maximumFractionDigits:0})}</div>
        </div>
      </div>
      {/* Info grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Email', value:customer.email },
          { label:'Phone', value:customer.phone },
          { label:'National ID', value:customer.national_id, mono:true },
          { label:'Date of Birth', value:customer.date_of_birth?format(new Date(customer.date_of_birth),'MMM d, yyyy'):undefined },
          { label:'Occupation', value:customer.occupation },
          { label:'Monthly Income', value:customer.monthly_income?`PKR ${parseFloat(customer.monthly_income).toLocaleString()}`:undefined },
          { label:'Risk Category', value:customer.risk_category },
          { label:'Onboarded', value:customer.onboarded_at?format(new Date(customer.onboarded_at),'MMM d, yyyy'):undefined },
        ].map((f,i) => f.value ? (
          <div key={i} className="card"><div className="text-gray-400 text-xs mb-1">{f.label}</div><div className={clsx('text-white text-sm font-medium', f.mono && 'font-mono')}>{f.value}</div></div>
        ) : null)}
      </div>
      {/* Accounts */}
      {customer.accounts?.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Accounts ({customer.accounts.length})</h3>
          <div className="space-y-2">
            {customer.accounts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-surface-border/50">
                <div><div className="font-mono text-white text-sm">{a.accountNumber}</div><div className="text-gray-500 text-xs capitalize">{a.accountType?.replace('_',' ')}</div></div>
                <div className="text-right"><div className="font-mono text-white font-medium">{a.currency} {parseFloat(a.balance||0).toLocaleString()}</div><span className={clsx('text-xs',a.status==='active'?'text-green-400':'text-gray-500')}>{a.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Recent transactions */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? <div className="text-center py-8 text-gray-500">No transactions</div>
          : <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-surface-border/50">
                <div><div className="text-white text-sm font-medium capitalize">{t.transaction_type?.replace('_',' ')}</div><div className="text-gray-500 text-xs font-mono">{t.transaction_reference}</div></div>
                <div className="text-right"><div className={clsx('font-mono font-bold',t.transaction_type==='deposit'?'text-green-400':'text-red-400')}>PKR {parseFloat(t.amount).toLocaleString()}</div><div className="text-gray-500 text-xs">{t.created_at?format(new Date(t.created_at),'MMM d, HH:mm'):'—'}</div></div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}
