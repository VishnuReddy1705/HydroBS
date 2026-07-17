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

  return (
    <div className="login-page-root">
      {/* CSS Styles embedded for login page */}
      <style>{`
        .login-page-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          overflow: hidden;
          position: relative;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0a1628 0%, #0d2847 35%, #143d6b 65%, #1a4f7a 100%);
        }

        .login-page-root::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 20%, rgba(0, 180, 216, 0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, rgba(15, 76, 129, 0.08) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .login-brand-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
          z-index: 10;
          position: relative;
        }

        .login-droplet-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #17c8d8 0%, #00b4d8 50%, #0f8cc3 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0, 180, 216, 0.35),
                      0 2px 8px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .login-brand-title {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-top: 0.875rem;
          line-height: 1;
        }

        .login-brand-subtitle {
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(148, 175, 205, 0.9);
          margin-top: 0.375rem;
          letter-spacing: 0.02em;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: linear-gradient(180deg, 
            rgba(220, 232, 245, 0.92) 0%, 
            rgba(235, 242, 250, 0.95) 40%,
            rgba(245, 249, 253, 0.97) 100%);
          border-radius: 24px;
          padding: 2rem 2.25rem 2rem;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25),
                      0 8px 24px rgba(0, 0, 0, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.35);
          position: relative;
          z-index: 10;
          backdrop-filter: blur(20px);
        }

        .login-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0d2847;
          margin-bottom: 1.5rem;
          letter-spacing: -0.01em;
        }

        .login-field-label {
          display: block;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(100, 130, 160, 0.85);
          margin-bottom: 0.375rem;
          padding-left: 0.125rem;
        }

        .login-input-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .login-input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(120, 150, 180, 0.6);
          z-index: 2;
        }

        .login-input {
          width: 100%;
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.88) 0%, rgba(13, 40, 71, 0.92) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 0.875rem 1rem 0.875rem 2.875rem;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .login-input::placeholder {
          color: rgba(148, 175, 205, 0.5);
        }

        .login-input:focus {
          border-color: rgba(0, 180, 216, 0.5);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15),
                      0 0 0 3px rgba(0, 180, 216, 0.12);
        }

        .login-input-password {
          padding-right: 3rem;
        }

        .login-eye-btn {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(120, 150, 180, 0.6);
          z-index: 2;
          padding: 4px;
          transition: color 0.2s;
        }

        .login-eye-btn:hover {
          color: rgba(200, 220, 240, 0.9);
        }

        .login-row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .login-remember-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(80, 110, 140, 0.85);
          cursor: pointer;
          user-select: none;
        }

        .login-remember-label:hover {
          color: #0d2847;
        }

        .login-remember-checkbox {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          accent-color: #00b4d8;
          cursor: pointer;
        }

        .login-forgot-link {
          font-size: 0.75rem;
          font-weight: 600;
          color: #17c8d8;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-forgot-link:hover {
          color: #0fa8c0;
        }

        .login-submit-btn {
          width: 100%;
          padding: 0.9375rem 1.5rem;
          background: linear-gradient(135deg, #00b4d8 0%, #0f8cc3 50%, #0f6da0 100%);
          border: none;
          border-radius: 14px;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px rgba(0, 180, 216, 0.3),
                      0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .login-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #17c8d8 0%, #00b4d8 50%, #0f8cc3 100%);
          box-shadow: 0 8px 28px rgba(0, 180, 216, 0.4),
                      0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: login-spin 0.8s linear infinite;
        }

        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }

        .login-divider {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(180, 200, 220, 0.4);
        }

        .login-reg-label {
          text-align: center;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(100, 130, 160, 0.7);
          margin-bottom: 0.875rem;
        }

        .login-reg-row {
          display: flex;
          gap: 0.75rem;
        }

        .login-reg-btn {
          flex: 1;
          padding: 0.6875rem 0.75rem;
          background: linear-gradient(135deg, rgba(0, 180, 216, 0.12) 0%, rgba(15, 76, 129, 0.12) 100%);
          border: 1px solid rgba(0, 180, 216, 0.2);
          border-radius: 12px;
          color: #0d2847;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          transition: all 0.2s ease;
        }

        .login-reg-btn:hover {
          background: linear-gradient(135deg, rgba(0, 180, 216, 0.2) 0%, rgba(15, 76, 129, 0.18) 100%);
          border-color: rgba(0, 180, 216, 0.35);
          transform: translateY(-1px);
        }

        .login-reg-btn:active {
          transform: translateY(0);
        }

        .login-reg-btn svg {
          color: #00b4d8;
        }

        .login-footer {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.6875rem;
          font-weight: 500;
          color: rgba(148, 175, 205, 0.5);
          letter-spacing: 0.02em;
          z-index: 10;
          position: relative;
        }

        .login-alert {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .login-alert-error {
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          color: #b91c1c;
        }

        .login-alert-success {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #047857;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem 1.5rem;
          }
          .login-reg-row {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Brand Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="login-brand-section"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="login-droplet-icon"
        >
          <Droplet className="w-7 h-7 text-white" style={{ fill: 'rgba(255,255,255,0.15)' }} />
        </motion.div>
        <h1 className="login-brand-title">HydroBS</h1>
        <p className="login-brand-subtitle">Smart Water Management & Billing SaaS</p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
        className="login-card"
      >
        <h2 className="login-card-title">Welcome Back</h2>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="login-alert login-alert-error"
            >
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="login-alert login-alert-success"
            >
              ✅ {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLoginSubmit}>
          {/* Email */}
          <label className="login-field-label">Email Address</label>
          <div className="login-input-wrapper">
            <Mail className="login-input-icon" style={{ width: 18, height: 18 }} />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={handleInputChange}
              className="login-input"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <label className="login-field-label">Password</label>
          <div className="login-input-wrapper">
            <Lock className="login-input-icon" style={{ width: 18, height: 18 }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleInputChange}
              className="login-input login-input-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="login-eye-btn"
            >
              {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
            </button>
          </div>

          {/* Remember Me & Forgot */}
          <div className="login-row-between">
            <label className="login-remember-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={credentials.rememberMe}
                onChange={handleInputChange}
                className="login-remember-checkbox"
              />
              Remember me
            </label>
            <a href="/forgot-password" className="login-forgot-link">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            type="submit"
            disabled={loading}
            className="login-submit-btn"
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                Processing...
              </>
            ) : (
              <>
                Log In
                <ChevronRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </motion.button>
        </form>

        {/* Registration Hub */}
        <div className="login-divider">
          <p className="login-reg-label">Registration Hub</p>
          <div className="login-reg-row">
            <button onClick={handleCreateCommunity} className="login-reg-btn">
              <Building2 style={{ width: 14, height: 14 }} />
              Create Community
            </button>
            <button onClick={handleJoinCommunity} className="login-reg-btn">
              <UserPlus style={{ width: 14, height: 14 }} />
              Join Community
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="login-footer">
        <p>© 2026 HydroBS Smart Water Management Utilities.</p>
      </footer>
    </div>
  );
}