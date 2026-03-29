import { useState } from 'react';
import { Link2, CheckCircle, XCircle, Send } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
const integrations = [
  { id:'raast', name:'Raast', desc:'Pakistan instant payment system', status:'connected', color:'text-green-400' },
  { id:'nadra', name:'NADRA', desc:'National ID verification', status:'connected', color:'text-green-400' },
  { id:'credit-bureau', name:'Credit Bureau', desc:'Credit scoring & history', status:'connected', color:'text-green-400' },
  { id:'visa', name:'Visa/Mastercard', desc:'Card network processing', status:'simulated', color:'text-yellow-400' },
  { id:'swift', name:'SWIFT', desc:'International wire transfers', status:'simulated', color:'text-yellow-400' },
];
export function IntegrationsPage() {
  const [ibanForm, setIbanForm] = useState({ iban:'' });
  const [ibanResult, setIbanResult] = useState<any>(null);
  const [nadraForm, setNadraForm] = useState({ cnic:'' });
  const [nadraResult, setNadraResult] = useState<any>(null);
  const [creditForm, setCreditForm] = useState({ cnic:'' });
  const [creditResult, setCreditResult] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string,boolean>>({});
  const setLoad = (k: string, v: boolean) => setLoading(p => ({...p,[k]:v}));
  const verifyIban = async (e: React.FormEvent) => { e.preventDefault(); setLoad('iban',true); try { const r = await api.verifyIBAN(ibanForm.iban); setIbanResult(r.data.data); } catch {} finally { setLoad('iban',false); } };
  const verifyNadra = async (e: React.FormEvent) => { e.preventDefault(); setLoad('nadra',true); try { const r = await api.verifyNADRA({ cnic:nadraForm.cnic }); setNadraResult(r.data.data); toast.success('NADRA verification complete'); } catch {} finally { setLoad('nadra',false); } };
  const checkCredit = async (e: React.FormEvent) => { e.preventDefault(); setLoad('credit',true); try { const r = await api.getCreditScore(creditForm.cnic); setCreditResult(r.data.data); } catch {} finally { setLoad('credit',false); } };
  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Integrations</h1><p className="page-subtitle">External system connectors — Raast, NADRA, Credit Bureau, Payment Networks</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(i => (
          <div key={i.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-border flex items-center justify-center"><Link2 size={18} className="text-primary-400"/></div>
            <div className="flex-1"><div className="font-semibold text-white">{i.name}</div><div className="text-gray-500 text-xs">{i.desc}</div></div>
            <span className={clsx('text-xs font-medium', i.color)}>{i.status}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Raast IBAN */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Raast IBAN Verification</h3>
          <form onSubmit={verifyIban} className="space-y-3">
            <input className="input-field text-sm" placeholder="PK36EXMP0123456789012345" value={ibanForm.iban} onChange={e => setIbanForm({iban:e.target.value})} required/>
            <button type="submit" disabled={loading.iban} className="btn-primary w-full justify-center text-sm py-2">{loading.iban?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Send size={14}/>Verify IBAN</>}</button>
          </form>
          {ibanResult && <div className="bg-surface/50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex items-center gap-2">{ibanResult.valid?<CheckCircle size={14} className="text-green-400"/>:<XCircle size={14} className="text-red-400"/>}<span className={ibanResult.valid?'text-green-400':'text-red-400'}>{ibanResult.valid?'Valid IBAN':'Invalid IBAN'}</span></div>
            {ibanResult.valid && <><div className="text-gray-400">Bank: <span className="text-white">{ibanResult.bankName}</span></div><div className="text-gray-400">Holder: <span className="text-white">{ibanResult.accountHolder}</span></div></>}
          </div>}
        </div>
        {/* NADRA */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">NADRA KYC Verification</h3>
          <form onSubmit={verifyNadra} className="space-y-3">
            <input className="input-field text-sm" placeholder="42201-1234567-1" value={nadraForm.cnic} onChange={e => setNadraForm({cnic:e.target.value})} required/>
            <button type="submit" disabled={loading.nadra} className="btn-primary w-full justify-center text-sm py-2">{loading.nadra?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Send size={14}/>Verify CNIC</>}</button>
          </form>
          {nadraResult && <div className="bg-surface/50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/><span className="text-green-400">Verified</span></div>
            <div className="text-gray-400">CNIC: <span className="font-mono text-white">{nadraResult.cnic}</span></div>
            <div className="text-gray-400">Confidence: <span className="text-white">{(nadraResult.confidence*100).toFixed(0)}%</span></div>
          </div>}
        </div>
        {/* Credit Bureau */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Credit Bureau Check</h3>
          <form onSubmit={checkCredit} className="space-y-3">
            <input className="input-field text-sm" placeholder="42201-1234567-1" value={creditForm.cnic} onChange={e => setCreditForm({cnic:e.target.value})} required/>
            <button type="submit" disabled={loading.credit} className="btn-primary w-full justify-center text-sm py-2">{loading.credit?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Send size={14}/>Check Score</>}</button>
          </form>
          {creditResult && <div className="bg-surface/50 rounded-xl p-3 text-sm space-y-2">
            <div className="text-center"><div className="text-3xl font-display font-bold" style={{color:creditResult.score>=700?'#22c55e':creditResult.score>=600?'#eab308':'#ef4444'}}>{creditResult.score}</div><div className="text-gray-400 text-xs">Credit Score</div></div>
            <div className="flex justify-between"><span className="text-gray-400">Rating</span><span className="text-white font-medium">{creditResult.rating}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Active Loans</span><span className="text-white">{creditResult.activeLoans}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Defaults</span><span className={creditResult.defaults>0?'text-red-400':'text-green-400'}>{creditResult.defaults}</span></div>
          </div>}
        </div>
      </div>
    </div>
  );
}
