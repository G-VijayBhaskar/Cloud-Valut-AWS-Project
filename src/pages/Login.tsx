import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Unlock, Mail, AlertCircle, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CloudVaultLogo } from '../components/CloudVaultLogo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Vault Unlock Auth State: 'idle' | 'verifying' | 'success' | 'error'
  const [authState, setAuthState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthState('verifying');
    setStatusMessage('Verifying access...');
    setError('');

    try {
      // REAL FastAPI Backend Call
      const authData = await api.login({ email, password });
      
      // REAL API response succeeded -> trigger Vault Unlock sequence
      setAuthState('success');
      setStatusMessage('Access verified');
      login(authData);

      // Smooth step to "Vault unlocked" and transition to Dashboard
      setTimeout(() => {
        setStatusMessage('Vault unlocked');
      }, 450);

      setTimeout(() => {
        if (authData.user.role === 'developer') {
          navigate('/developer');
        } else {
          navigate('/dashboard');
        }
      }, 950);

    } catch (err: any) {
      setAuthState('error');
      setError(err.message || 'Invalid email or password.');
      setStatusMessage('Access denied');

      // Return to normal form after subtle error feedback
      setTimeout(() => {
        setAuthState('idle');
      }, 1400);
    }
  };

  const isLockedOut = authState === 'verifying' || authState === 'success';

  return (
    <div className="login-page-wrapper">
      {/* Background Animated Ambient Elements */}
      <div className={`ambient-glow glow-blue ${authState === 'success' ? 'glow-success' : ''}`}></div>
      <div className={`ambient-glow glow-purple ${authState === 'error' ? 'glow-error' : ''}`}></div>

      {/* Subtle Data Stream Background Particles */}
      <div className="particle-container">
        <div className="floating-dot p1"></div>
        <div className="floating-dot p2"></div>
        <div className="floating-dot p3"></div>
        <div className="floating-dot p4"></div>
      </div>

      <div className="login-content-box">
        {/* Vault Header Visual */}
        <div className="vault-header-visual">
          <div className={`vault-shield-container ${authState}`}>
            {/* Security Scanner Line / Ring */}
            <div className="vault-scanner-ring"></div>
            <div className="vault-scanner-line"></div>

            {/* Inbound Data Particles traveling to Vault */}
            <div className="data-streak streak-1"></div>
            <div className="data-streak streak-2"></div>
            <div className="data-streak streak-3"></div>

            {/* Central CloudVault Emblem Icon */}
            <div className="vault-center-icon">
              {authState === 'success' ? (
                <Unlock size={28} className="icon-unlock-anim" />
              ) : authState === 'error' ? (
                <ShieldAlert size={28} className="icon-error-anim" />
              ) : authState === 'verifying' ? (
                <KeyRound size={28} className="icon-verifying-anim" />
              ) : (
                <CloudVaultLogo size={34} />
              )}
            </div>
          </div>

          <h2 className="login-title">
            {authState === 'success' ? 'Vault Unlocking...' : 'Welcome to CloudVault'}
          </h2>
          <p className="login-subtitle">
            {authState === 'idle' && 'Enter your credentials to access your storage'}
            {authState === 'verifying' && 'Scanning credentials & establishing secure channel...'}
            {authState === 'success' && 'Decrypting user space & opening vault...'}
            {authState === 'error' && 'Authentication failed. Please verify credentials.'}
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className={`login-card ${authState}`}>
          {/* Active Vault Status Indicator during Auth */}
          {authState !== 'idle' && (
            <div className={`vault-status-banner ${authState}`}>
              {authState === 'verifying' && (
                <div className="status-flex">
                  <div className="status-pulse-dot"></div>
                  <span>{statusMessage}</span>
                </div>
              )}
              {authState === 'success' && (
                <div className="status-flex success">
                  <CheckCircle2 size={16} />
                  <span>{statusMessage}</span>
                </div>
              )}
              {authState === 'error' && (
                <div className="status-flex error">
                  <AlertCircle size={16} />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          )}

          {error && authState === 'idle' && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={isLockedOut ? 'form-dimmed' : ''}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="text"
                  className="form-input animated-input"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLockedOut}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password"
                  className="form-input animated-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLockedOut}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary animated-login-btn ${authState}`}
              disabled={isLockedOut}
            >
              {authState === 'verifying' ? (
                <span className="btn-status-text">Verifying Vault Access...</span>
              ) : authState === 'success' ? (
                <span className="btn-status-text">Opening Vault...</span>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          <div className="signup-footer-link">
            Don't have an account?{' '}
            <Link to="/signup" className="signup-highlight-link">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded High-Performance CSS for Vault Unlock Animation */}
      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          background-color: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient Glow Blobs */
        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
          transition: all 0.6s ease;
        }
        .glow-blue {
          width: 450px;
          height: 450px;
          background: #3b82f6;
          top: 10%;
          left: 20%;
          animation: floatGlow 14s ease-in-out infinite alternate;
        }
        .glow-purple {
          width: 400px;
          height: 400px;
          background: #8b5cf6;
          bottom: 15%;
          right: 20%;
          animation: floatGlow 18s ease-in-out infinite alternate-reverse;
        }
        .glow-blue.glow-success {
          background: #10b981;
          opacity: 0.25;
          transform: scale(1.3);
        }
        .glow-purple.glow-error {
          background: #ef4444;
          opacity: 0.25;
        }

        @keyframes floatGlow {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(-20px, 30px) scale(0.95); }
        }

        /* Background Floating Dots */
        .particle-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .floating-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: rgba(96, 165, 250, 0.35);
          border-radius: 50%;
          animation: floatDot 12s linear infinite;
        }
        .p1 { top: 25%; left: 15%; animation-duration: 14s; }
        .p2 { top: 65%; left: 80%; animation-duration: 18s; animation-delay: -3s; }
        .p3 { top: 80%; left: 25%; animation-duration: 16s; animation-delay: -5s; }
        .p4 { top: 20%; left: 75%; animation-duration: 13s; animation-delay: -2s; }

        @keyframes floatDot {
          0% { transform: translateY(0) scale(0.8); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.45; }
          100% { transform: translateY(-60px) scale(0.8); opacity: 0.15; }
        }

        .login-content-box {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }

        .vault-header-visual {
          text-align: center;
          margin-bottom: 1.75rem;
        }

        /* Vault Shield Container & Scanner */
        .vault-shield-container {
          position: relative;
          width: 68px;
          height: 68px;
          margin: 0 auto 1.25rem auto;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
        }

        .vault-center-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
          position: relative;
          z-index: 3;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* State Modifiers for Center Icon */
        .vault-shield-container.verifying .vault-center-icon {
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.6);
          animation: pulseVerifying 1.5s ease-in-out infinite alternate;
        }
        .vault-shield-container.success .vault-center-icon {
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
          box-shadow: 0 0 35px rgba(16, 185, 129, 0.7);
          transform: scale(1.12);
        }
        .vault-shield-container.error .vault-center-icon {
          background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
          animation: shakeError 0.4s ease-in-out;
        }

        @keyframes pulseVerifying {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        /* Icon Animation Keyframes */
        .icon-verifying-anim {
          animation: rotateKey 2s ease-in-out infinite alternate;
        }
        @keyframes rotateKey {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(45deg); }
        }

        .icon-unlock-anim {
          animation: popUnlock 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes popUnlock {
          0% { transform: scale(0.6) rotate(-20deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .icon-error-anim {
          animation: pulseError 0.4s ease;
        }

        /* Neon Laser Scanner Ring */
        .vault-scanner-ring {
          position: absolute;
          inset: -6px;
          border-radius: 22px;
          border: 1.5px solid transparent;
          pointer-events: none;
          z-index: 2;
          transition: all 0.4s ease;
        }
        .vault-shield-container.verifying .vault-scanner-ring {
          border-top-color: #60a5fa;
          border-right-color: #c084fc;
          animation: scanRotate 1.2s linear infinite;
        }
        .vault-shield-container.success .vault-scanner-ring {
          border-color: #34d399;
          box-shadow: 0 0 15px rgba(52, 211, 153, 0.5);
        }
        .vault-shield-container.error .vault-scanner-ring {
          border-color: #ef4444;
        }

        @keyframes scanRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Data Stream Particles */
        .data-streak {
          position: absolute;
          width: 14px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #60a5fa);
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }
        .vault-shield-container.verifying .data-streak {
          animation: streamIn 1.5s ease-in-out infinite;
        }
        .streak-1 { top: 20px; left: -25px; animation-delay: 0s; }
        .streak-2 { top: 38px; right: -25px; animation-delay: 0.5s; background: linear-gradient(90deg, #c084fc, transparent); }
        .streak-3 { bottom: -10px; left: 26px; transform: rotate(90deg); animation-delay: 0.9s; }

        @keyframes streamIn {
          0% { opacity: 0; transform: scaleX(0.4) translate(-10px, 0); }
          50% { opacity: 0.9; }
          100% { opacity: 0; transform: scaleX(1) translate(20px, 0); }
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }
        .login-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
          min-height: 1.25rem;
          transition: color 0.3s ease;
        }

        /* Glassmorphic Login Card */
        .login-card {
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.05);
          transition: all 0.4s ease;
        }
        .login-card.verifying {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.15);
        }
        .login-card.success {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.2);
          transform: translateY(-4px) scale(1.01);
        }
        .login-card.error {
          border-color: rgba(239, 68, 68, 0.4);
          animation: cardShake 0.4s ease-in-out;
        }

        @keyframes cardShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        /* Vault Status Banner */
        .vault-status-banner {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
          background-color: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          animation: bannerSlide 0.3s ease-out;
        }
        .vault-status-banner.success {
          background-color: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
        }
        .vault-status-banner.error {
          background-color: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        @keyframes bannerSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .status-flex {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          justify-content: center;
        }

        .status-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #60a5fa;
          animation: statusDotPulse 1s ease-in-out infinite alternate;
        }
        @keyframes statusDotPulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.3); }
        }

        .form-dimmed {
          opacity: 0.45;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        /* Form Inputs */
        .input-with-icon {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          transition: color 0.2s ease;
        }
        .animated-input {
          padding-left: 38px;
          background-color: rgba(13, 19, 34, 0.85);
          border: 1px solid var(--border-color);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animated-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 0 15px rgba(59, 130, 246, 0.15);
        }
        .animated-input:focus + .input-icon,
        .input-with-icon:focus-within .input-icon {
          color: #60a5fa;
        }

        /* Animated Button */
        .animated-login-btn {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.95rem;
          transition: all 0.25s ease;
        }
        .animated-login-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .animated-login-btn.verifying {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        }
        .animated-login-btn.success {
          background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
        }

        .btn-status-text {
          letter-spacing: 0.02em;
          font-weight: 600;
        }

        .signup-footer-link {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .signup-highlight-link {
          color: var(--accent-primary);
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .signup-highlight-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        /* Prefers Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .ambient-glow,
          .floating-dot,
          .vault-scanner-ring,
          .data-streak,
          .icon-verifying-anim,
          .icon-unlock-anim,
          .status-pulse-dot {
            animation: none !important;
          }
          .login-card.error,
          .vault-shield-container.error .vault-center-icon {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
