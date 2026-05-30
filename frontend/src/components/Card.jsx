import { useRef } from 'react';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import './Card.css';

export default function Card({ card, onUpload, onClear, onEditDetails }) {
  const fileRef = useRef(null);

  // Handle both structured slot objects and raw legacy string image URLs
  const imageUrl = card && typeof card === 'object' ? card.image_url : card;
  const marketPrice = card && typeof card === 'object' ? card.market_price : null;
  const cardName = card && typeof card === 'object' ? card.name : '';

  const handleClick = () => {
    if (!imageUrl) {
      fileRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div 
      className={`card ${imageUrl ? 'card-filled' : 'card-empty'} glass-panel`}
      onClick={handleClick}
      title={cardName ? `${cardName}${card && card.set_name ? ` (${card.set_name})` : ''}` : undefined}
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt={cardName || "Pokemon Card"} className="card-image w-full h-full object-cover" />
          
          <div className="card-action-overlay">
            <button 
              onClick={(e) => { e.stopPropagation(); onEditDetails(); }}
              className="card-edit-btn"
              title="Edit Card Details"
            >
              <Edit3 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="card-clear-btn"
              title="Remove Card"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {marketPrice !== null && (
            <div className="card-price-badge">
              ${marketPrice.toFixed(2)}
            </div>
          )}
        </>
      ) : (
        <div className="card-placeholder">
          <Plus size={32} className="card-icon" />
          <span>Add Card</span>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }}
      />
    </div>
  );
}
