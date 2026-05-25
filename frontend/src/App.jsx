import React from 'react';
import Binder from './components/Binder';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import { useAuth } from './hooks/useAuth';
import { useBinderState } from './hooks/useBinderState';

function App() {
  const { user, loading: authLoading, error, login, register, logout, setError } = useAuth();
  const { pages, titles, isLoading: binderLoading, updateTitle, updateSlot, clearSlot, addPage, removePage } = useBinderState(user);

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
          <Header username={user.username} onLogout={logout} />

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
              />
            )}
          </main>
        </>
      )}

      <footer style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', textAlign: 'center', padding: '1rem', zIndex: 10 }} className="text-slate-500 text-xs bg-slate-900/50 backdrop-blur-md border-t border-slate-800/50">
        Pokémon Card Binder &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
