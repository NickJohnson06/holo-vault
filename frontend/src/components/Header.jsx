import { Sparkles, User, LogOut, Settings } from 'lucide-react';
import './Header.css';

export default function Header({ username, onLogout, onOpenSettings }) {
  return (
    <header className="app-header glass-panel">
      <div className="header-brand">
        <div className="brand-logo">
          <Sparkles className="brand-icon" size={20} />
        </div>
        <span className="brand-name">HoloVault</span>
      </div>

      <div className="header-actions">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <span className="user-name">{username}</span>
        </div>

        <button onClick={onOpenSettings} className="settings-btn" title="Account Settings">
          <Settings size={16} className="settings-icon" />
          <span>Settings</span>
        </button>

        <button onClick={onLogout} className="logout-btn" title="Sign Out">
          <LogOut size={16} className="logout-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

