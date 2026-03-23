import React from 'react';
import Binder from './components/Binder';
import { useBinderState } from './hooks/useBinderState';

function App() {
  const { pages, titles, isLoading, updateTitle, updateSlot, clearSlot, addPage, removePage } = useBinderState();

  return (
    <div style={{ width: '100vw', minHeight: '100vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="text-slate-100">

      <main style={{ width: '100%', maxWidth: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 1, padding: '2rem' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

      <footer style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', textAlign: 'center', padding: '1rem', zIndex: 10 }} className="text-slate-500 text-xs bg-slate-900/50 backdrop-blur-md border-t border-slate-800/50">
        Pokemon Card Binder &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
