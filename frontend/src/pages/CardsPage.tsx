import { useEffect, useState } from 'react';
import { CreditCard, Plus, ShieldOff, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerId:'', accountId:'', cardType:'debit', cardHolderName:'', cardScheme:'Visa' });

  const load = async () => { setLoading(true); try { const r = await api.getCards(); setCards(r.data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const createCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.createCard(form); toast.success('Card issued'); setShowModal(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'blocked' ? 'active' : 'blocked';
    const reason = newStatus === 'blocked' ? prompt('Block reason:') || 'Admin block' : undefined;
    try { await api.updateCardStatus(id, newStatus, reason); toast.success(`Card ${newStatus}`); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const cardBg: Record<string,string> = { debit:'from-primary-800 to-primary-900', credit:'from-purple-800 to-purple-900', virtual:'from-gray-800 to-gray-900' };

  return (
    <div className="space-y-6">
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">Issue New Card</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={createCard} className="p-6 space-y-4">
              <div><label className="text-sm text-gray-400 mb-1.5 block">Customer ID *</label><input className="input-field" value={form.customerId} onChange={e => setForm({...form,customerId:e.target.value})} required /></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Account ID *</label><input className="input-field" value={form.accountId} onChange={e => setForm({...form,accountId:e.target.value})} required /></div>
              <div><label className="text-sm text-gray-400 mb-1.5 block">Card Holder Name *</label><input className="input-field" value={form.cardHolderName} onChange={e => setForm({...form,cardHolderName:e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 mb-1.5 block">Type</label><select className="input-field" value={form.cardType} onChange={e => setForm({...form,cardType:e.target.value})}><option value="debit">Debit</option><option value="credit">Credit</option><option value="virtual">Virtual</option></select></div>
                <div><label className="text-sm text-gray-400 mb-1.5 block">Scheme</label><select className="input-field" value={form.cardScheme} onChange={e => setForm({...form,cardScheme:e.target.value})}><option value="Visa">Visa</option><option value="Mastercard">Mastercard</option><option value="UnionPay">UnionPay</option></select></div>
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button><button type="submit" className="btn-primary flex-1 justify-center">Issue Card</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="page-header flex items-start justify-between">
        <div><h1 className="page-title">Cards</h1><p className="page-subtitle">Debit, credit & virtual card management — {cards.length} cards</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16}/> Issue Card</button>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(c => (
            <div key={c.id} className="space-y-3">
              <div className={clsx('rounded-2xl p-5 bg-gradient-to-br border border-white/10 relative overflow-hidden', cardBg[c.card_type]||cardBg.debit)} style={{minHeight:160}}>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider">{c.card_type} Card</div>
                  <div className="text-white/80 text-sm font-bold">{c.card_scheme}</div>
                </div>
                <div className="font-mono text-white text-lg tracking-[0.2em] mb-3">{c.card_number_masked}</div>
                <div className="flex items-end justify-between">
                  <div><div className="text-white/50 text-xs">Card Holder</div><div className="text-white font-medium text-sm">{c.card_holder_name}</div></div>
                  <div className="text-right"><div className="text-white/50 text-xs">Expires</div><div className="text-white font-mono text-sm">{String(c.expiry_month).padStart(2,'0')}/{c.expiry_year}</div></div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5"/>
              </div>
              <div className="flex items-center justify-between">
                <span className={clsx('badge border text-xs', c.status==='active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')}>{c.status}</span>
                <div className="text-gray-500 text-xs">{c.customer_name}</div>
                <button onClick={() => toggleStatus(c.id, c.status)} className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all', c.status==='blocked' ? 'text-green-400 border-green-500/30 hover:bg-green-500/10' : 'text-red-400 border-red-500/30 hover:bg-red-500/10')}>
                  {c.status==='blocked' ? <><CheckCircle size={12}/>Unblock</> : <><ShieldOff size={12}/>Block</>}
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && <div className="col-span-3 text-center py-16 text-gray-500">No cards found</div>}
        </div>}
    </div>
  );
}
