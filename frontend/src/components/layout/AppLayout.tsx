import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight, TrendingUp,
  ShieldAlert, FileText, Settings, Building2, Banknote, AlertTriangle,
  Landmark, Layers, LogOut, Bell, Search, Menu, X, ChevronRight,
  Activity, Link2, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Banknote, label: 'Accounts', path: '/accounts' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: ArrowLeftRight, label: 'Transfer', path: '/transfer' },
  { icon: TrendingUp, label: 'Loans & Credit', path: '/loans' },
  { icon: CreditCard, label: 'Cards', path: '/cards' },
  { type: 'divider', label: 'Compliance' },
  { icon: ShieldAlert, label: 'Compliance', path: '/compliance' },
  { icon: AlertTriangle, label: 'Fraud Detection', path: '/fraud' },
  { type: 'divider', label: 'Operations' },
  { icon: Landmark, label: 'Treasury', path: '/treasury' },
  { icon: Building2, label: 'Branches', path: '/branches' },
  { icon: Link2, label: 'Integrations', path: '/integrations' },
  { type: 'divider', label: 'Analytics' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Shield, label: 'Admin Panel', path: '/admin' },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (refreshToken) await api.logout(refreshToken);
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-accent-400/20 text-accent-400 border-accent-400/30',
    admin: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    compliance_officer: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    teller: 'bg-green-500/20 text-green-400 border-green-500/30',
    customer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className={clsx(
        'flex-shrink-0 flex flex-col border-r border-surface-border transition-all duration-300 relative z-20',
        sidebarOpen ? 'w-64' : 'w-16'
      )} style={{ background: 'linear-gradient(180deg, #0d1526 0%, #111e38 100%)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center flex-shrink-0 glow-primary">
            <Landmark size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">NexusBank</div>
              <div className="text-gray-500 text-xs mt-0.5">Core Banking v1.0</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-gray-500 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return sidebarOpen ? (
                <div key={idx} className="pt-4 pb-1 px-3">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{item.label}</span>
                </div>
              ) : <div key={idx} className="py-2 border-t border-surface-border/50 mx-2" />;
            }
            const Icon = item.icon!;
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => clsx(
                  'nav-item group relative',
                  isActive && 'active',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-50" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-surface-border p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.username}</div>
                <span className={clsx('badge text-[10px] border', roleColors[user?.role || 'customer'])}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-500 hover:text-red-400 transition-colors py-1">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-surface-border bg-surface-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search customers, accounts, transactions..."
                className="w-full bg-surface-border/50 border border-surface-border/50 text-gray-300 placeholder-gray-600 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-green-400">
              <Activity size={14} className="animate-pulse" />
              <span className="font-mono text-xs">Live</span>
            </div>
            <button className="relative p-2.5 rounded-xl bg-surface-border/50 hover:bg-surface-border text-gray-400 hover:text-white transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-400 rounded-full"></span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 grid-pattern">
          <div className="animate-fade-in max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
