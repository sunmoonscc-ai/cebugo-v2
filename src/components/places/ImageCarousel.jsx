import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageHelper';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="carousel-placeholder">
        <span>이미지 정보가 없습니다.</span>
      </div>
    );
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="carousel-container">
      <img
        src={getOptimizedImageUrl(images[currentIndex], 800)}
        alt={`slide-${currentIndex}`}
        className="carousel-main-img fade-in"
      />

      {images.length > 1 && (
        <>
          <button className="carousel-btn prev" onClick={prevSlide}>
            <RiArrowLeftSLine />
          </button>
          <button className="carousel-btn next" onClick={nextSlide}>
            <RiArrowRightSLine />
          </button>

          <div className="carousel-dots">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
