import { useEffect, useState } from 'react';
import { Settings, Users, FileText, Activity, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
export function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'teller' });
  const load = async () => {
    setLoading(true);
    try { const [ur, alr, hr] = await Promise.all([api.getUsers(), api.getAuditLogs(), api.getSystemHealth()]); setUsers(ur.data.data); setAuditLogs(alr.data.data); setHealth(hr.data.data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const toggleUser = async (id: string, isActive: boolean) => {
    try { await api.updateUserStatus(id, !isActive); toast.success(`User ${!isActive?'activated':'deactivated'}`); load(); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.createUser(form); toast.success('User created'); setShowModal(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  const roleColors: Record<string,string> = { super_admin:'text-accent-400', admin:'text-primary-400', compliance_officer:'text-yellow-400', teller:'text-green-400', loan_officer:'text-blue-400', customer:'text-gray-400' };
  return (
    <div className="space-y-6">
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-surface-border flex items-center justify-between"><h2 className="font-display text-xl font-semibold text-white">Create User</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button></div>
            <form onSubmit={createUser} className="p-6 space-y-4">
              <div><label className="text-sm text-gray-400 mb-1.5 block">Username *</label><input className="input-field" value={form.username} onChange={e => setForm({...form,username:e.target.value})} required/></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Email *</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Password *</label><input type="password" className="input-field" value={form.password} onChange={e => setForm({...form,password:e.target.value})} required/></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm({...form,role:e.target.value})}>
                  <option value="admin">Admin</option><option value="branch_manager">Branch Manager</option>
                  <option value="compliance_officer">Compliance Officer</option><option value="teller">Teller</option>
                  <option value="loan_officer">Loan Officer</option><option value="customer">Customer</option>
                </select>
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button><button type="submit" className="btn-primary flex-1 justify-center">Create</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="page-header flex items-start justify-between">
        <div><h1 className="page-title">Admin Panel</h1><p className="page-subtitle">User management, audit logs, system configuration</p></div>
        {tab==='users' && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16}/>Create User</button>}
      </div>
      {/* System health */}
      {health && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card"><div className="text-gray-400 text-sm">Status</div><div className="text-green-400 font-bold mt-1 flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>{health.status}</div></div>
          <div className="card"><div className="text-gray-400 text-sm">Uptime</div><div className="text-white font-mono font-bold mt-1">{(health.uptime/3600).toFixed(1)}h</div></div>
          <div className="card"><div className="text-gray-400 text-sm">Memory (RSS)</div><div className="text-white font-mono font-bold mt-1">{(health.memory?.rss/1048576).toFixed(0)} MB</div></div>
          <div className="card"><div className="text-gray-400 text-sm">Node.js</div><div className="text-white font-mono font-bold mt-1">{health.nodeVersion}</div></div>
        </div>
      )}
      {/* Tabs */}
      <div className="flex gap-3">
        {['users','audit-logs'].map(t => <button key={t} onClick={() => setTab(t)} className={clsx('px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize', tab===t?'bg-primary-500/20 text-primary-400 border-primary-500/30':'bg-surface-border/50 text-gray-400 border-surface-border')}>{t.replace('-',' ')}</button>)}
      </div>
      {tab === 'users' ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">User</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Role</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">MFA</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Last Login</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
              <th className="px-4 py-4"></th>
            </tr></thead>
            <tbody>
              {loading?<tr><td colSpan={6} className="text-center py-16"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div></td></tr>
                :users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary-600/30 flex items-center justify-center text-sm font-bold text-primary-300">{u.username[0].toUpperCase()}</div><div><div className="text-white font-medium">{u.username}</div><div className="text-gray-500 text-xs">{u.email}</div></div></div></td>
                    <td className="px-4 py-4"><span className={clsx('text-sm font-medium capitalize', roleColors[u.role]||roleColors.customer)}>{u.role?.replace('_',' ')}</span></td>
                    <td className="px-4 py-4"><span className={clsx('text-xs',u.mfa_enabled?'text-green-400':'text-gray-500')}>{u.mfa_enabled?'Enabled':'Disabled'}</span></td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{u.last_login?format(new Date(u.last_login),'MMM d, HH:mm'):'Never'}</td>
                    <td className="px-4 py-4"><span className={clsx('badge border',u.is_active?'bg-green-500/20 text-green-400 border-green-500/30':'bg-gray-500/20 text-gray-400 border-gray-500/30')}>{u.is_active?'Active':'Inactive'}</span></td>
                    <td className="px-4 py-4"><button onClick={() => toggleUser(u.id, u.is_active)} className={clsx('text-xs px-2 py-1 rounded-lg border transition-all',u.is_active?'text-red-400 border-red-500/30 hover:bg-red-500/10':'text-green-400 border-green-500/30 hover:bg-green-500/10')}>{u.is_active?'Deactivate':'Activate'}</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-border">
              <th className="text-left text-gray-400 font-medium px-6 py-4">User</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Action</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Status</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">IP</th>
              <th className="text-left text-gray-400 font-medium px-4 py-4">Time</th>
            </tr></thead>
            <tbody>
              {auditLogs.slice(0,50).map(l => (
                <tr key={l.id} className="table-row">
                  <td className="px-6 py-4 text-white">{l.username||'System'}</td>
                  <td className="px-4 py-4 font-mono text-gray-300 text-xs">{l.action}</td>
                  <td className="px-4 py-4"><span className={clsx('badge border text-xs',l.status==='success'?'bg-green-500/20 text-green-400 border-green-500/30':'bg-red-500/20 text-red-400 border-red-500/30')}>{l.status}</span></td>
                  <td className="px-4 py-4 font-mono text-gray-500 text-xs">{l.ip_address}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{l.created_at?format(new Date(l.created_at),'MMM d, HH:mm:ss'):'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
