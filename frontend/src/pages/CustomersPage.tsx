import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const kycBadge: Record<string, string> = {
  verified: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const kycIcon: Record<string, any> = { verified: CheckCircle, pending: Clock, rejected: XCircle };
const riskBadge: Record<string, string> = {
  low: 'bg-green-500/10 text-green-400', medium: 'bg-yellow-500/10 text-yellow-400', high: 'bg-red-500/10 text-red-400'
};

function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', nationalId: '',
    dateOfBirth: '', gender: 'male', customerType: 'individual',
    occupation: '', monthlyIncome: '', address: { city: '', country: 'Pakistan' }
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createCustomer({ ...form, monthlyIncome: parseFloat(form.monthlyIncome) || 0 });
      toast.success('Customer created successfully');
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create customer');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">New Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">First Name *</label>
              <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Last Name *</label>
              <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Phone *</label>
              <input className="input-field" placeholder="+92-300-0000000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">CNIC / National ID *</label>
              <input className="input-field" placeholder="42201-1234567-1" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Date of Birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Occupation</label>
              <input className="input-field" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Monthly Income (PKR)</label>
              <input type="number" className="input-field" value={form.monthlyIncome} onChange={e => setForm({ ...form, monthlyIncome: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Customer Type</label>
              <select className="input-field" value={form.customerType} onChange={e => setForm({ ...form, customerType: e.target.value })}>
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
                <option value="sme">SME</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ page, limit: 20, search: search || undefined, kycStatus: kycFilter || undefined });
      setCustomers(res.data.customers);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, kycFilter]);

  return (
    <div className="space-y-6">
      {showModal && <NewCustomerModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />}

      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Customer Information File (CIF) — {pagination.total?.toLocaleString() || 0} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input-field pl-9 py-2.5 text-sm" placeholder="Search by name, CIF, email, CNIC..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto py-2.5 text-sm" value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
          <option value="">All KYC Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">Customer</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">CIF #</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Contact</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">KYC</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Risk</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Accounts</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Balance</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-500">
                <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
              </td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-500">No customers found</td></tr>
            ) : customers.map(c => {
              const KycIcon = kycIcon[c.kyc_status] || Clock;
              return (
                <tr key={c.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600/40 to-primary-800/40 flex items-center justify-center text-sm font-bold text-primary-300 border border-primary-500/20">
                        {(c.first_name?.[0] || c.full_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{c.full_name}</div>
                        <div className="text-gray-500 text-xs capitalize">{c.customer_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-gray-300 text-xs">{c.cif_number}</td>
                  <td className="px-4 py-4">
                    <div className="text-gray-300 text-xs">{c.email}</div>
                    <div className="text-gray-500 text-xs">{c.phone}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={clsx('badge border', kycBadge[c.kyc_status] || kycBadge.pending)}>
                      <KycIcon size={11} />
                      {c.kyc_status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={clsx('badge capitalize', riskBadge[c.risk_category] || riskBadge.low)}>
                      {c.risk_category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{c.account_count || 0}</td>
                  <td className="px-4 py-4 text-white font-mono text-sm">
                    PKR {parseFloat(c.total_balance || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 text-gray-500 hover:text-primary-400 transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Pagination */}
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
