import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Binder from './components/Binder';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import CardDetailsModal from './components/CardDetailsModal';
import SettingsModal from './components/SettingsModal';
import { useAuth } from './hooks/useAuth';
import { useBinderState } from './hooks/useBinderState';

function App() {
  const { user, loading: authLoading, error, login, register, logout, setError, handleOAuthLogin } = useAuth();
  const { 
    pages, 
    titles, 
    isLoading: binderLoading, 
    updateTitle, 
    updateSlot, 
    updateCardDetails, 
    clearSlot, 
    addPage, 
    removePage 
  } = useBinderState(user);

  // Modal State for editing card details (metadata)
  const [editingCard, setEditingCard] = useState(null);
  // Settings modal open state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Toast state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    const userId = params.get('user_id');
    const linked = params.get('linked');
    const provider = params.get('provider');
    const errorParam = params.get('error');

    if (token && username && userId) {
      handleOAuthLogin(token, username, userId);
      setToast({ message: `Welcome back, ${username}!`, type: 'success' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (linked && provider) {
      setToast({ message: `Successfully connected to ${provider}!`, type: 'success' });
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsSettingsOpen(true);
    } else if (errorParam) {
      setToast({ message: decodeURIComponent(errorParam), type: 'error' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleEditDetails = (pageIndex, slotIndex) => {
    setEditingCard({
      pageIndex,
      slotIndex,
      card: pages[pageIndex][slotIndex]
    });
  };

  if (authLoading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="text-slate-400 text-sm font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="text-slate-100">
      
      {!user ? (
        <AuthScreen 
          onLogin={login} 
          onRegister={register} 
          error={error} 
          setError={setError} 
        />
      ) : (
        <>
          <Header 
            username={user.username} 
            onLogout={logout} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
          />

          <main style={{ width: '100%', maxWidth: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 1, padding: '2rem' }}>
            {binderLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-slate-400 text-sm font-medium">Loading collection...</span>
              </div>
            ) : (
              <Binder
                pages={pages}
                titles={titles}
                onUpdateTitle={updateTitle}
                onUpdateSlot={updateSlot}
                onClearSlot={clearSlot}
                onAddPage={addPage}
                onRemovePage={removePage}
                onEditDetails={handleEditDetails}
              />
            )}
          </main>

          {editingCard && (
            <CardDetailsModal
              card={editingCard.card}
              onSave={(name, setName) => {
                updateCardDetails(editingCard.pageIndex, editingCard.slotIndex, name, setName);
              }}
              onClose={() => setEditingCard(null)}
            />
          )}

          {isSettingsOpen && (
            <SettingsModal user={user} onClose={() => setIsSettingsOpen(false)} />
          )}
        </>
      )}

      {toast && (
        <div className={`toast-message glass-panel ${toast.type} animate-fade-in`}>
          {toast.type === 'success' ? (
            <div className="toast-icon success">✓</div>
          ) : (
            <div className="toast-icon error">⚠</div>
          )}
          <span className="toast-text">{toast.message}</span>
        </div>
      )}

      <footer style={{ width: '100%', textAlign: 'center', padding: '1rem', zIndex: 10 }} className="text-slate-500 text-xs bg-slate-900/50 backdrop-blur-md border-t border-slate-800/50">
        Pokémon Card Binder &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
