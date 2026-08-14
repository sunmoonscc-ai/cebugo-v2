import React, { useState, useRef } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageHelper';
import { RiArrowLeftSLine, RiArrowRightSLine, RiZoomInLine } from 'react-icons/ri';
import FullScreenImageModal from '../modals/FullScreenImageModal';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], maxWidth = '100%' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const safeImagesArray = Array.isArray(images)
    ? images.filter(Boolean)
    : (typeof images === 'string' && images.trim() ? [images.trim()] : []);
  const displayImages = safeImagesArray.length > 0 ? safeImagesArray : [];
  const safeIndex = currentIndex >= displayImages.length ? 0 : currentIndex;

  const prevSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    if (distance > 40) {
      nextSlide();
    } else if (distance < -40) {
      prevSlide();
    }
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const currentImgUrl = displayImages[safeIndex];

  return (
    <>
      <div 
        className="carousel-container" 
        style={{ maxWidth: maxWidth || '100%' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="carousel-img-wrapper" 
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomOpen(true);
          }} 
          title="클릭하여 화면 전체 크기로 확대보기"
        >
          <img
            key={currentImgUrl}
            src={getOptimizedImageUrl(currentImgUrl, 800)}
            alt={`slide-${safeIndex}`}
            className="carousel-main-img fade-in"
            onError={(e) => {
              if (e.target.src !== currentImgUrl) {
                e.target.src = currentImgUrl;
              }
            }}
          />
          <div className="zoom-hint-overlay">
            <RiZoomInLine /> <span>확대보기</span>
          </div>
        </div>

        {displayImages.length > 1 && (
          <>
            <button type="button" className="carousel-btn prev" onClick={prevSlide}>
              <RiArrowLeftSLine />
            </button>
            <button type="button" className="carousel-btn next" onClick={nextSlide}>
              <RiArrowRightSLine />
            </button>

            <div className="carousel-dots">
              {displayImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === safeIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Unified Full-screen Image Modal */}
      {isZoomOpen && (
        <FullScreenImageModal
          images={displayImages}
          initialIndex={safeIndex}
          onClose={() => setIsZoomOpen(false)}
        />
      )}
    </>
  );
}
