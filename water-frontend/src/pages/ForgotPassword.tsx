import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Droplet } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.text();

      if (!response.ok) {
        throw new Error(data || 'Failed to request password reset.');
      }

      setMessage(data);
    } catch (err: any) {
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Generate random bubbles for background
  const bubbles = Array.from({ length: 15 }, (_, i) => ({
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 bg-gradient-to-br from-[#48CAE4] to-[#00B4D8] rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
            <Droplet className="w-7 h-7 text-white fill-white/10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-3">HydroBS</h1>
        </div>

        <div className="glass-morphic bg-white/10 border border-white/20 rounded-[28px] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-sm text-slate-300 mb-6">Enter your email to receive a recovery link</p>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-2xl text-xs font-semibold"
              >
                ⚠️ {error}
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-2xl text-xs font-semibold"
              >
                ✅ {message}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] text-white font-bold py-4 rounded-2xl shadow-[0_8px_25px_rgba(0,180,216,0.3)] transition-all text-sm tracking-wide mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-1.5 justify-center mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
