import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageHelper';
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiZoomInLine } from 'react-icons/ri';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], maxWidth = '50%' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="carousel-placeholder">
        <span>이미지 정보가 없습니다.</span>
      </div>
    );
  }

  const prevSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="carousel-container" style={{ maxWidth: maxWidth || '50%' }}>
        <div className="carousel-img-wrapper" onClick={() => setIsZoomOpen(true)} title="클릭하여 원본 크기로 확대보기">
          <img
            src={getOptimizedImageUrl(images[currentIndex], 800)}
            alt={`slide-${currentIndex}`}
            className="carousel-main-img fade-in"
          />
          <div className="zoom-hint-overlay">
            <RiZoomInLine /> <span>확대보기</span>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button type="button" className="carousel-btn prev" onClick={prevSlide}>
              <RiArrowLeftSLine />
            </button>
            <button type="button" className="carousel-btn next" onClick={nextSlide}>
              <RiArrowRightSLine />
            </button>

            <div className="carousel-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === currentIndex ? 'active' : ''}`}
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
        <div className="image-zoom-modal fade-in" onClick={() => setIsZoomOpen(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={() => setIsZoomOpen(false)} title="닫기">
              <RiCloseLine />
            </button>

            <div className="zoom-img-container">
              <img
                src={images[currentIndex]}
                alt={`zoom-${currentIndex}`}
                className="zoom-main-img"
              />
            </div>

            {images.length > 1 && (
              <>
                <button type="button" className="zoom-btn prev" onClick={prevSlide}>
                  <RiArrowLeftSLine />
                </button>
                <button type="button" className="zoom-btn next" onClick={nextSlide}>
                  <RiArrowRightSLine />
                </button>
                <div className="zoom-counter">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
