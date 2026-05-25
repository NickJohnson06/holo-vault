import { useState } from 'react';
import { User, Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import './AuthScreen.css';

export default function AuthScreen({ onLogin, onRegister, error, setError }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    // Simple Validations
    if (!username.trim()) {
      setLocalError('Username is required.');
      return;
    }
    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters.');
      return;
    }
    if (!isLogin) {
      if (!email.trim()) {
        setLocalError('Email is required.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLocalError('Please enter a valid email address.');
        return;
      }
    }
    if (!password) {
      setLocalError('Password is required.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await onLogin(username, password);
      } else {
        await onRegister(username, email, password);
      }
    } catch (err) {
      // Errors are caught and updated in the useAuth hook/App.jsx wrapper
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError || error;

  return (
    <div className="auth-screen-container">
      <div className="auth-background-glow"></div>
      
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo-glow">
            <Sparkles className="logo-sparkle animate-pulse" size={32} />
          </div>
          <h1>HoloVault</h1>
          <p className="auth-subtitle">Collect. Secure. Organize.</p>
        </div>

        {displayedError && (
          <div className="auth-error-banner flex items-center p-3 mb-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-sm gap-2">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{displayedError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="username-input">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="username-input"
                type="text"
                placeholder={isLogin ? "Username or Email" : "Create a username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="email-input">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email-input"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="password-input">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password-input"
                type="password"
                placeholder={isLogin ? "Enter your password" : "Minimum 8 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="confirm-password-input">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="confirm-password-input"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit-btn mt-6" disabled={submitting}>
            {submitting ? (
              <span className="spinner"></span>
            ) : isLogin ? (
              <>
                <LogIn size={18} className="mr-2" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} className="mr-2" />
                Register Account
              </>
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <span>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button onClick={handleToggle} className="toggle-btn" disabled={submitting}>
            {isLogin ? "Register here" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
