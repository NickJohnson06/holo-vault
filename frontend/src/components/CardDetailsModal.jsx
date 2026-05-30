import { useState, useEffect } from 'react';
import { Tag, Layers, X, Save, AlertCircle } from 'lucide-react';
import './CardDetailsModal.css';

export default function CardDetailsModal({ card, onSave, onClose }) {
  const [name, setName] = useState('');
  const [setNameField, setSetNameField] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setName(card.name || '');
      setSetNameField(card.set_name || '');
    }
  }, [card]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Card name is required to fetch pricing.');
      return;
    }

    onSave(name.trim(), setNameField.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-logo-container">
            <Tag size={22} className="text-blue-400" />
          </div>
          <h2>Card Details</h2>
          <p className="modal-subtitle">Define metadata to resolve live market values</p>
        </div>

        {error && (
          <div className="modal-error-banner flex items-center p-3 mb-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-sm gap-2">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-input-group">
            <label htmlFor="card-name-input">Pokémon Card Name</label>
            <div className="modal-input-wrapper">
              <Tag className="modal-input-icon" size={16} />
              <input
                id="card-name-input"
                type="text"
                placeholder="e.g., Charizard, Pikachu, Mewtwo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-input-group">
            <label htmlFor="card-set-input">Expansion Set</label>
            <div className="modal-input-wrapper">
              <Layers className="modal-input-icon" size={16} />
              <input
                id="card-set-input"
                type="text"
                placeholder="e.g., Base Set, Jungle, Neo Genesis"
                value={setNameField}
                onChange={(e) => setSetNameField(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions mt-6">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-save-btn">
              <Save size={16} className="mr-2" />
              Save & Value Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
