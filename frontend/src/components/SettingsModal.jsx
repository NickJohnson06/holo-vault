import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle, AlertTriangle, Link2, Unlink } from 'lucide-react';
import './SettingsModal.css';

const API_BASE = 'http://localhost:8000/api/v1';

export default function SettingsModal({ user, onClose }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure token is attached (it should be, but let's be explicit)
      const token = user?.token;
      const res = await axios.get(`${API_BASE}/auth/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch connected accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider) => {
    // Redirect to backend OAuth login with link flow
    const token = user?.token;
    if (!token) return;
    window.location.href = `${API_BASE}/auth/${provider}/login?flow=link&token=${token}`;
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${provider} account?`)) {
      return;
    }
    setDisconnecting(provider);
    try {
      const token = user?.token;
      await axios.delete(`${API_BASE}/auth/connections/${provider}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setConnections(prev => 
        prev.map(conn => 
          conn.provider === provider 
            ? { ...conn, connected: false, email: null, username: null } 
            : conn
        )
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to disconnect ${provider} account.`);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="settings-modal-card glass-panel animate-fade-in">
        <div className="settings-modal-header">
          <h2>Account Settings</h2>
          <button onClick={onClose} className="close-btn" title="Close Settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="user-profile-section">
            <h3>Your Profile</h3>
            <div className="profile-details-card">
              <div className="detail-row">
                <span className="detail-label">Username</span>
                <span className="detail-value">{user?.username}</span>
              </div>
            </div>
          </div>

          <div className="connections-section">
            <h3>Connected Accounts</h3>
            <p className="section-description">Link external accounts to sign in with them or link to your profile.</p>

            {loading ? (
              <div className="connections-loader">
                <div className="spinner"></div>
                <span>Checking connection status...</span>
              </div>
            ) : error ? (
              <div className="connections-error">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="connections-list">
                {connections.map((conn) => {
                  const isProviderGoogle = conn.provider === 'google';
                  return (
                    <div key={conn.provider} className="connection-item">
                      <div className="provider-info">
                        <div className={`provider-logo ${conn.provider}`}>
                          {isProviderGoogle ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.746-.08-1.32-.176-1.886H12.24z"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                          )}
                        </div>
                        <div className="provider-details">
                          <span className="provider-name">{isProviderGoogle ? 'Google' : 'GitHub'}</span>
                          {conn.connected ? (
                            <span className="connection-status connected">
                              <CheckCircle size={12} className="inline mr-1" />
                              Connected as {conn.email || conn.username}
                            </span>
                          ) : (
                            <span className="connection-status disconnected">Not connected</span>
                          )}
                        </div>
                      </div>

                      <div className="connection-action">
                        {conn.connected ? (
                          <button
                            onClick={() => handleDisconnect(conn.provider)}
                            disabled={disconnecting === conn.provider}
                            className="disconnect-btn"
                          >
                            <Unlink size={14} className="mr-1 inline" />
                            {disconnecting === conn.provider ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(conn.provider)}
                            className="connect-btn"
                          >
                            <Link2 size={14} className="mr-1 inline" />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
