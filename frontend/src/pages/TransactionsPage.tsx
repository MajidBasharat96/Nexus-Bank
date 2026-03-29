import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Search, Filter, RotateCcw, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const txnTypeColor: Record<string, string> = {
  deposit: 'text-green-400 bg-green-500/10',
  withdrawal: 'text-red-400 bg-red-500/10',
  transfer: 'text-primary-400 bg-primary-500/10',
  loan_disbursement: 'text-yellow-400 bg-yellow-500/10',
  loan_repayment: 'text-purple-400 bg-purple-500/10',
};
const txnIcon: Record<string, any> = {
  deposit: ArrowDownLeft, withdrawal: ArrowUpRight, transfer: ArrowLeftRight,
  loan_disbursement: ArrowDownLeft, loan_repayment: ArrowUpRight,
};
const statusBadge: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  reversed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', startDate: '', endDate: '' });
  const [reverseId, setReverseId] = useState<string | null>(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getTransactions({ page, limit: 25, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const handleReverse = async (id: string) => {
    const reason = prompt('Enter reversal reason:');
    if (!reason) return;
    try {
      await api.reverseTransaction(id, reason);
      toast.success('Transaction reversed');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Reversal failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Real-time transaction ledger — {pagination.total?.toLocaleString() || 0} records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input-field pl-9 py-2.5 text-sm" placeholder="Search reference, description..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="input-field w-auto py-2.5 text-sm" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="transfer">Transfer</option>
          <option value="loan_disbursement">Loan Disbursement</option>
          <option value="loan_repayment">Loan Repayment</option>
        </select>
        <select className="input-field w-auto py-2.5 text-sm" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
        </select>
        <input type="date" className="input-field w-auto py-2.5 text-sm" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" className="input-field w-auto py-2.5 text-sm" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">Reference</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Type</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Amount</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Description</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Channel</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Date</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
              </td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-500">No transactions found</td></tr>
            ) : transactions.map(t => {
              const Icon = txnIcon[t.transaction_type] || ArrowLeftRight;
              const colorClass = txnTypeColor[t.transaction_type] || 'text-gray-400 bg-gray-500/10';
              return (
                <tr key={t.id} className="table-row">
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">{t.transaction_reference}</td>
                  <td className="px-4 py-4">
                    <span className={clsx('flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-xs font-medium', colorClass)}>
                      <Icon size={12} />{t.transaction_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-mono text-white font-medium">PKR {parseFloat(t.amount).toLocaleString()}</div>
                    {parseFloat(t.fee) > 0 && <div className="text-gray-500 text-xs">Fee: PKR {t.fee}</div>}
                  </td>
                  <td className="px-4 py-4 text-gray-400 max-w-[180px] truncate">{t.description || '—'}</td>
                  <td className="px-4 py-4">
                    <span className={clsx('badge border', statusBadge[t.status] || statusBadge.pending)}>{t.status}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs capitalize">{t.channel || '—'}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {t.created_at ? format(new Date(t.created_at), 'MMM d, HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-4">
                    {t.status === 'completed' && !t.reversed_at && (
                      <button onClick={() => handleReverse(t.id)} className="p-1.5 text-gray-600 hover:text-yellow-400 transition-colors" title="Reverse">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
            <span className="text-gray-500 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
