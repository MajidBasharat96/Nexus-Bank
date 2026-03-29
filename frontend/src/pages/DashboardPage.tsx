import { useEffect, useState } from 'react';
import { Users, Banknote, ArrowLeftRight, TrendingUp, AlertTriangle, CreditCard, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import { format } from 'date-fns';

interface DashStats {
  customers: { total: string; kyc_verified: string; new_month: string };
  accounts: { total: string; total_balance: string };
  transactions: { total: string; volume: string; today_count: string };
  loans: { total: string; outstanding: string; pending: string };
  fraud: { open_alerts: string };
}

const COLORS = ['#4361ee', '#f72585', '#7209b7', '#3a0ca3', '#4cc9f0'];

function StatCard({ icon: Icon, label, value, sub, trend, color = 'primary' }: any) {
  const colors: Record<string, string> = {
    primary: 'from-primary-500/20 to-primary-600/5 border-primary-500/20',
    accent: 'from-accent-400/20 to-accent-500/5 border-accent-400/20',
    green: 'from-green-500/20 to-green-600/5 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20',
  };
  const iconColors: Record<string, string> = {
    primary: 'text-primary-400', accent: 'text-accent-400', green: 'text-green-400',
    yellow: 'text-yellow-400', red: 'text-red-400'
  };

  return (
    <div className={`stat-card bg-gradient-to-br border ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="font-display text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-surface-card/50 ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-medium">{typeof p.value === 'number' && p.value > 1000
            ? `PKR ${(p.value/1000).toFixed(1)}K` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardReport(), api.getTransactionVolume()])
      .then(([statsRes, volRes]) => {
        setStats(statsRes.data.data);
        // Process volume data
        const raw = volRes.data.data as any[];
        const byDate: Record<string, any> = {};
        raw.forEach(r => {
          if (!byDate[r.date]) byDate[r.date] = { date: format(new Date(r.date), 'MMM d') };
          byDate[r.date][r.transaction_type] = parseFloat(r.volume);
        });
        setVolumeData(Object.values(byDate).slice(-14));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: string | undefined) => {
    const num = parseFloat(n || '0');
    if (num >= 1_000_000) return `PKR ${(num/1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `PKR ${(num/1_000).toFixed(1)}K`;
    return `PKR ${num.toFixed(0)}`;
  };

  const pieData = stats ? [
    { name: 'Active Accounts', value: parseInt(stats.accounts.total) },
    { name: 'Active Loans', value: parseInt(stats.loans.total) },
    { name: 'KYC Verified', value: parseInt(stats.customers.kyc_verified || '0') },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time overview of banking operations • {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Customers" value={parseInt(stats?.customers.total||'0').toLocaleString()}
          sub={`+${stats?.customers.new_month} this month`} trend={12} color="primary" />
        <StatCard icon={Banknote} label="Total Deposits" value={fmt(stats?.accounts.total_balance)}
          sub={`${stats?.accounts.total} accounts`} trend={8} color="green" />
        <StatCard icon={ArrowLeftRight} label="Transactions Today"
          value={parseInt(stats?.transactions.today_count||'0').toLocaleString()}
          sub={`${fmt(stats?.transactions.volume)} total vol.`} trend={-3} color="primary" />
        <StatCard icon={TrendingUp} label="Loan Portfolio" value={fmt(stats?.loans.outstanding)}
          sub={`${stats?.loans.pending} pending`} trend={5} color="yellow" />
        <StatCard icon={AlertTriangle} label="Fraud Alerts" value={stats?.fraud.open_alerts||'0'}
          sub="Open alerts" color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Transaction Volume</h3>
              <p className="text-gray-500 text-sm">Last 14 days by type</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg border border-green-500/20">
              <Activity size={12} />Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gDeposit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gTransfer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f72585" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f72585" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="deposit" name="Deposits" stroke="#4361ee" fill="url(#gDeposit)" strokeWidth={2} />
              <Area type="monotone" dataKey="transfer" name="Transfers" stroke="#f72585" fill="url(#gTransfer)" strokeWidth={2} />
              <Area type="monotone" dataKey="withdrawal" name="Withdrawals" stroke="#4cc9f0" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Mix */}
        <div className="card">
          <h3 className="font-display font-semibold text-white mb-1">Portfolio Mix</h3>
          <p className="text-gray-500 text-sm mb-6">Key metrics distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-semibold text-white">Daily Transaction Count</h3>
            <p className="text-gray-500 text-sm">Transactions per day — last 14 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={volumeData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="deposit" name="Deposits" fill="#4361ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="transfer" name="Transfers" fill="#f72585" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
