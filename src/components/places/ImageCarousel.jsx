import React, { useState, useRef } from 'react';
import { getOptimizedImageUrl, extractDateFromImageUrl } from '../../utils/imageHelper';
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiZoomInLine } from 'react-icons/ri';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], maxWidth = '50%' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const validImages = (images || []).filter(Boolean);
  const displayImages = validImages.length > 0 ? validImages : ['/default_cafe.png'];
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

  const currentImgUrl = displayImages[safeIndex] || '/default_cafe.png';

  return (
    <>
      <div 
        className="carousel-container" 
        style={{ maxWidth: maxWidth || '50%' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="carousel-img-wrapper" onClick={() => setIsZoomOpen(true)} title="클릭하여 원본 크기로 확대보기">
          <img
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

      {/* Full-screen Zoom Modal */}
      {isZoomOpen && (
        <div 
          className="image-zoom-modal fade-in" 
          onClick={() => setIsZoomOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={() => setIsZoomOpen(false)} title="닫기">
              <RiCloseLine />
            </button>

            <div className="zoom-img-container">
              <img
                src={currentImgUrl}
                alt={`zoom-${safeIndex}`}
                className="zoom-main-img"
                onError={(e) => {
                  e.target.src = '/default_cafe.png';
                }}
              />
            </div>

            <div className="zoom-date-badge">
              {extractDateFromImageUrl(currentImgUrl)}
            </div>

            {displayImages.length > 1 && (
              <>
                <button type="button" className="zoom-btn prev" onClick={prevSlide} title="이전 사진">
                  <RiArrowLeftSLine />
                </button>
                <button type="button" className="zoom-btn next" onClick={nextSlide} title="다음 사진">
                  <RiArrowRightSLine />
                </button>
                <div className="zoom-counter">
                  {safeIndex + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
