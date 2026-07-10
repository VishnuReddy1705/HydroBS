import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession } from '@/lib/auth';

export default function HydroBSLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
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
      
      // Save session details
      saveSession(data.token, data.role, data.fullName || 'User');
      
      // Redirect based on role
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex flex-col items-center justify-center p-4 antialiased font-sans">
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-md transition-all duration-300">
        
        {/* HydroBS Water Droplet Icon */}
        <div className="mx-auto w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 border border-white/10">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c4.418 0 8-3.582 8-8 0-4.42-8-12-8-12S4 9.58 4 14c0 4.418 3.582 8 8 8z" />
          </svg>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-wide text-white drop-shadow-sm">HydroBS</h1>
          <p className="text-sm text-white/80 mt-1.5">Sign in to manage your community water monitor</p>
        </div>

        {/* Error Message Feedback Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-white rounded-xl text-xs font-semibold text-center tracking-wide">
            ⚠️ {error}
          </div>
        )}

        {/* Direct Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-white/90 mb-1.5 pl-1 tracking-wider uppercase">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={handleInputChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/90 mb-1.5 pl-1 tracking-wider uppercase">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.99] transition-all shadow-xl text-sm tracking-wide mt-4 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleCreateCommunity}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm active:scale-[0.98] text-center"
            >
              Create Community
            </button>
            <button
              onClick={handleJoinCommunity}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm active:scale-[0.98] text-center"
            >
              Join Community
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}