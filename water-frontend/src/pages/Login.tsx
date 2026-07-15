import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveSession } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Eye, EyeOff, Lock, Mail, ChevronRight, UserPlus, Building2 } from 'lucide-react';

export default function HydroBSLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ email: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.registered) {
      setSuccess('Account created successfully! Please verify your email or log in.');
    }
  }, [location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCredentials({ ...credentials, [e.target.name]: value });
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      console.log('Login successful! Session data:', data);
      
      saveSession(data.token, data.refreshToken, data.role, data.fullName || 'User');
      
      if (data.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.role === 'RESIDENT') {
        navigate('/resident/dashboard');
      } else {
        throw new Error('Unknown user role.');
      }

    } catch (err: any) {
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = () => {
    navigate('/register/admin');
  };

  const handleJoinCommunity = () => {
    navigate('/register/resident');
  };

  // Generate random bubbles for water background
  const bubbles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 20 + 8,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 6,
  }));

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-tr from-[#0b1b3d] via-[#0f2954] to-[#173e75] flex flex-col items-center justify-center p-4 antialiased overflow-hidden select-none">
      
      {/* Floating Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="water-bubble"
            style={{
              left: b.left,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: `riseUp ${b.duration}s infinite linear`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Overlapping Waves at bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none opacity-30">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[200%] h-[140px] fill-[#00B4D8] animate-[waveFlow_25s_linear_infinite]">
          <path d="M0,50 C300,90 600,30 900,80 C1200,120 1500,40 1800,60 L1800,120 L0,120 Z" />
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 block w-[200%] h-[110px] fill-[#0F4C81] animate-[waveFlow_15s_linear_infinite_reverse]">
          <path d="M0,30 C300,70 600,10 900,60 C1200,100 1500,20 1800,40 L1800,120 L0,120 Z" />
        </svg>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[460px] z-10"
      >
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="h-16 w-16 bg-gradient-to-br from-[#48CAE4] to-[#00B4D8] rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,180,216,0.3)] border border-[#ffffff]/20 cursor-pointer"
          >
            <Droplet className="w-8 h-8 text-white fill-white/10" />
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-4 bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#48CAE4]">
            HydroBS
          </h1>
          <p className="text-sm font-medium text-slate-300 mt-1">Smart Water Management & Billing SaaS</p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-morphic bg-white/10 border border-white/20 rounded-[28px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden backdrop-blur-2xl">
          
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#00B4D8]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          {/* Feedback alerts */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2"
              >
                <span>⚠️ {error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2"
              >
                <span>✅ {success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-12 pr-12 py-3.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-300 cursor-pointer hover:text-white transition-colors select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={credentials.rememberMe}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-white/20 bg-white/5 text-[#00B4D8] focus:ring-[#00B4D8] focus:ring-offset-[#0b1b3d] h-4 w-4"
                />
                Remember me
              </label>
              <a href="/forgot-password" className="font-bold text-[#48CAE4] hover:text-[#00B4D8] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] text-white font-bold py-4 rounded-2xl shadow-[0_8px_25px_rgba(0,180,216,0.35)] transition-all text-sm tracking-wide mt-6 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>
                  Log In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Registration Portals */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Registration Hub</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCreateCommunity}
                className="flex-1 bg-white/5 hover:bg-white/10 hover:border-[#00B4D8]/50 border border-white/10 text-white py-3.5 px-4 rounded-2xl text-xs font-bold tracking-wide transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#00B4D8]" />
                Create Community
              </button>
              <button
                onClick={handleJoinCommunity}
                className="flex-1 bg-white/5 hover:bg-white/10 hover:border-[#00B4D8]/50 border border-white/10 text-white py-3.5 px-4 rounded-2xl text-xs font-bold tracking-wide transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#00B4D8]" />
                Join Community
              </button>
            </div>
          </div>

        </div>
      </motion.div>
      
      {/* Dynamic water-marks footer */}
      <footer className="mt-8 text-center text-slate-400 text-xs font-medium tracking-wide z-10 opacity-70">
        <p>© 2026 HydroBS Smart Water Management Utilities.</p>
      </footer>
    </div>
  );
}