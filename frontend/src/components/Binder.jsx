import { useState } from 'react';
import CardGrid from './CardGrid';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import './Binder.css';

export default function Binder({ pages, titles, onUpdateSlot, onClearSlot, onAddPage, onRemovePage, onUpdateTitle, onEditDetails }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next'); // 'next' or 'prev'

  const maxPages = pages.length;

  const handleNextPage = () => {
    if (currentIndex < maxPages && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  const handlePrevPage = () => {
    if (currentIndex > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(i => i - 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  // The Binder presents two "faces" side by side: left and right.
  // When currentIndex = 0, left is empty/cover, right is page 0 front.
  // When currentIndex = 1, left is page 0 back, right is page 1 front.
  // When currentIndex = maxPages, left is page (maxPages-1) back, right is empty/cover back.

  const renderLeftPage = (index) => {
    if (index === 0) {
      return <div className="binder-cover binder-cover-inside-front">Cover Back</div>;
    }
    return (
      <CardGrid
        pageIndex={index - 1}
        face="back"
        images={pages[index - 1]}
        title={titles[(index - 1) * 2 + 1]}
        onUpdateTitle={onUpdateTitle}
        onUpdateSlot={onUpdateSlot}
        onClearSlot={onClearSlot}
        onEditDetails={onEditDetails}
      />
    );
  };

  const renderRightPage = (index) => {
    if (index >= maxPages) {
      return (
        <div className="binder-empty-right flex flex-col items-center justify-center p-8 text-center h-full">
          <div className="binder-cover binder-cover-inside-back">Back Cover inside</div>
        </div>
      );
    }
    return (
      <CardGrid
        pageIndex={index}
        face="front"
        images={pages[index]}
        title={titles[index * 2]}
        onUpdateTitle={onUpdateTitle}
        onUpdateSlot={onUpdateSlot}
        onClearSlot={onClearSlot}
        onEditDetails={onEditDetails}
      />
    );
  };

  // During flip 'next':
  // We see a 3D page turning from right to left.
  // The animated page shows `pages[currentIndex] front` on its front face, 
  // and `pages[currentIndex] back` on its back face.
  // Before flip finishes, the right side under it shows `pages[currentIndex+1] front`.
  // Left side shows `pages[currentIndex-1] back`.

  return (
    <div className="binder-container">
      <div className="binder-book-wrapper">
        <div className="binder-book">
          {/* Static Left Side */}
          <div className="book-half book-left">
            {renderLeftPage(currentIndex)}
          </div>

          {/* Static Right Side */}
          <div className="book-half book-right">
            {(isFlipping && flipDirection === 'next') ?
              renderRightPage(currentIndex + 1) :
              (isFlipping && flipDirection === 'prev') ?
                renderRightPage(currentIndex) :
                renderRightPage(currentIndex)}
          </div>

          {/* Animated Flipping Page */}
          {isFlipping && (
            <div className={`flip-page ${flipDirection === 'next' ? 'flipping-next' : 'flipping-prev'}`}>
              <div className="flip-face flip-front">
                {flipDirection === 'next' ? renderRightPage(currentIndex) : renderLeftPage(currentIndex)}
              </div>
              <div className="flip-face flip-back">
                {flipDirection === 'next' ? renderLeftPage(currentIndex + 1) : renderRightPage(currentIndex - 1)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="binder-actions mt-8">
        <div className="page-indicator">
          Page {currentIndex} of {maxPages}
        </div>
        <div className="binder-controls">
          <button
            className="action-btn"
            onClick={handlePrevPage}
            disabled={currentIndex === 0 || isFlipping}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            className="action-btn text-blue-400 border-blue-500/30"
            onClick={onAddPage}
            title="Add Page"
          >
            <PlusCircle size={20} className="mr-2" />
            Add Page
          </button>

          <button
            className="action-btn text-red-400 border-red-500/30"
            onClick={() => {
              // Delete current left page if valid
              if (currentIndex > 0) {
                onRemovePage(currentIndex - 1);
                setCurrentIndex(i => i - 1);
              }
            }}
            disabled={maxPages <= 1 || currentIndex === 0}
            title="Remove Left Page"
          >
            <Trash2 size={20} className="mr-2" />
            Delete Page
          </button>

          <button
            className="action-btn"
            onClick={handleNextPage}
            disabled={currentIndex >= maxPages || isFlipping}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
