import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Eye, EyeOff, Shield, Zap, Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@NexusBank123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(username, password);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden" style={{background:'linear-gradient(135deg, #080d1a 0%, #0f1729 50%, #0a1020 100%)'}}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{background:'radial-gradient(circle, #4361ee 0%, transparent 70%)'}} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center">
            <Landmark size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">NexusBank</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display text-5xl font-bold text-white leading-tight">
              Enterprise Core<br />
              <span className="text-gradient">Banking System</span>
            </h1>
            <p className="mt-4 text-gray-400 text-lg leading-relaxed max-w-md">
              A complete digital backbone for modern financial institutions — from customer onboarding to real-time payments and AI fraud detection.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Shield, label: 'AML/KYC', desc: 'Compliance Engine' },
              { icon: Zap, label: 'Real-time', desc: 'Payments (Raast)' },
              { icon: Lock, label: 'PCI-DSS', desc: 'Security Standard' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card p-4">
                <Icon size={20} className="text-primary-400 mb-2" />
                <div className="font-semibold text-white text-sm">{label}</div>
                <div className="text-gray-500 text-xs">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-600 text-sm">
          © 2024 NexusBank. Enterprise Banking Platform.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8" style={{background:'#0d1526'}}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center">
              <Landmark size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">NexusBank</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-white">Sign in</h2>
            <p className="text-gray-500 mt-1 text-sm">Access your banking dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-2">Username or Email</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl border border-surface-border bg-surface/50">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials</p>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Username:</span><span className="text-primary-400">admin</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Password:</span><span className="text-primary-400">Admin@NexusBank123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
