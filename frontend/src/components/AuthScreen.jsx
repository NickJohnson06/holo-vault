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

        <div className="oauth-divider">
          <span>or continue with</span>
        </div>

        <div className="oauth-buttons">
          <button 
            type="button" 
            onClick={() => window.location.href = 'http://localhost:8000/api/v1/auth/google/login?flow=login'} 
            className="oauth-btn google-btn"
            disabled={submitting}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.746-.08-1.32-.176-1.886H12.24z"/>
            </svg>
            Google
          </button>
          
          <button 
            type="button" 
            onClick={() => window.location.href = 'http://localhost:8000/api/v1/auth/github/login?flow=login'} 
            className="oauth-btn github-btn"
            disabled={submitting}
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <div className="auth-toggle">
          <span>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button type="button" onClick={handleToggle} className="toggle-btn" disabled={submitting}>
            {isLogin ? "Register here" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
