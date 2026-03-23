import { useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import './Card.css';

export default function Card({ image, onUpload, onClear }) {
  const fileRef = useRef(null);

  const handleClick = () => {
    if (!image) {
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
      className={`card ${image ? 'card-filled' : 'card-empty'} glass-panel`}
      onClick={handleClick}
    >
      {image ? (
        <>
          <img src={image} alt="Card" className="card-image w-full h-full object-cover" />
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="card-clear-btn"
            title="Remove card"
          >
            <Trash2 size={16} />
          </button>
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
