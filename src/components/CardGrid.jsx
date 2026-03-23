import Card from './Card';
import './CardGrid.css';

export default function CardGrid({ pageIndex, face, images, title, onUpdateSlot, onClearSlot, onUpdateTitle }) {
  // face is 'front' (indices 0-8) or 'back' (indices 9-17)
  const offset = face === 'front' ? 0 : 9;

  return (
    <div className="card-grid-container flex flex-col h-full">
      <div className="card-page-title-container flex justify-center mb-3">
        <input
          type="text"
          value={title || ''}
          onChange={(e) => onUpdateTitle(pageIndex, face, e.target.value)}
          placeholder={`Page ${face === 'front' ? pageIndex * 2 + 1 : pageIndex * 2 + 2}`}
          className="text-center bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 transition-colors text-slate-200 font-semibold text-lg outline-none w-2/3 pb-1"
        />
      </div>
      <div className="card-grid flex-1">
        {Array.from({ length: 9 }).map((_, i) => {
          const slotIndex = offset + i;
          const img = images ? images[slotIndex] : null;
          return (
            <Card 
              key={slotIndex} 
              image={img} 
              onUpload={(file) => onUpdateSlot(pageIndex, slotIndex, file)}
              onClear={() => onClearSlot(pageIndex, slotIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}
