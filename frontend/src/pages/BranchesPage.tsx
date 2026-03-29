import { useEffect, useState } from 'react';
import { Building2, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
export function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ branchCode:'', name:'', type:'branch', phone:'', email:'', address:{city:'', country:'Pakistan'} });
  const load = async () => { setLoading(true); try { const r = await api.getBranches(); setBranches(r.data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.createBranch(form); toast.success('Branch added'); setShowModal(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  const typeColors: Record<string,string> = { headquarters:'bg-accent-400/20 text-accent-400 border-accent-400/30', branch:'bg-primary-500/20 text-primary-400 border-primary-500/30', atm:'bg-green-500/20 text-green-400 border-green-500/30' };
  return (
    <div className="space-y-6">
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-surface-border flex items-center justify-between"><h2 className="font-display text-xl font-semibold text-white">Add Branch</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button></div>
            <form onSubmit={create} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 mb-1.5 block">Branch Code *</label><input className="input-field" value={form.branchCode} onChange={e => setForm({...form,branchCode:e.target.value})} required/></div>
                <div><label className="text-sm text-gray-400 mb-1.5 block">Type</label><select className="input-field" value={form.type} onChange={e => setForm({...form,type:e.target.value})}><option value="branch">Branch</option><option value="headquarters">Headquarters</option><option value="atm">ATM</option></select></div>
              </div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Branch Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 mb-1.5 block">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></div>
                <div><label className="text-sm text-gray-400 mb-1.5 block">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></div>
              </div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">City</label><input className="input-field" value={form.address.city} onChange={e => setForm({...form,address:{...form.address,city:e.target.value}})}/></div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button><button type="submit" className="btn-primary flex-1 justify-center">Add Branch</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="page-header flex items-start justify-between">
        <div><h1 className="page-title">Branches</h1><p className="page-subtitle">{branches.length} locations across the network</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16}/> Add Branch</button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div><div className="font-semibold text-white">{b.name}</div><div className="font-mono text-gray-500 text-xs mt-0.5">{b.branch_code}</div></div>
                <span className={`badge border text-xs ${typeColors[b.type]||typeColors.branch}`}>{b.type}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                {b.address?.city && <div className="flex items-center gap-2 text-gray-400"><MapPin size={14}/>{b.address.city}, {b.address.country}</div>}
                {b.phone && <div className="flex items-center gap-2 text-gray-400"><Phone size={14}/>{b.phone}</div>}
                {b.email && <div className="flex items-center gap-2 text-gray-400"><Mail size={14}/>{b.email}</div>}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${b.status==='active'?'text-green-400':'text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${b.status==='active'?'bg-green-400 animate-pulse':'bg-gray-500'}`}/>
                {b.status}
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}
