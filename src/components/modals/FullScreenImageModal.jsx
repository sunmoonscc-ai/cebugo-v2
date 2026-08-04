import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiZoomInLine, RiZoomOutLine, RiRefreshLine } from 'react-icons/ri';
import { extractDateFromImageUrl } from '../../utils/imageHelper';
import './FullScreenImageModal.css';

export default function FullScreenImageModal({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, time: 0 });

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setScale((prev) => {
      const nextScale = Math.max(prev - 0.5, 1);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
      return nextScale;
    });
  };

  const handleResetZoom = (e) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = (e) => {
    e?.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.2, 4));
    } else {
      setScale((prev) => {
        const nextScale = Math.max(prev - 0.2, 1);
        if (nextScale === 1) setPosition({ x: 0, y: 0 });
        return nextScale;
      });
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        dist: 0,
        time: Date.now()
      };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = newDist / touchStartRef.current.dist;
      setScale((prev) => {
        const newScale = Math.min(Math.max(prev * ratio, 1), 4);
        if (newScale === 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
      touchStartRef.current.dist = newDist;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1 && scale === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 100 && deltaTime < 400) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="fullscreen-image-modal-overlay" onClick={onClose}>
      {/* Top Header Control Toolbar */}
      <div className="fullscreen-modal-controls" onClick={(e) => e.stopPropagation()}>
        <span className="fullscreen-counter">{currentIndex + 1} / {images.length}</span>
        
        <div className="fullscreen-zoom-btns">
          <button type="button" onClick={handleZoomOut} title="축소" disabled={scale <= 1}>
            <RiZoomOutLine />
          </button>
          <span className="scale-indicator">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={handleZoomIn} title="확대" disabled={scale >= 4}>
            <RiZoomInLine />
          </button>
          {scale > 1 && (
            <button type="button" onClick={handleResetZoom} title="원래대로" className="reset-btn">
              <RiRefreshLine />
            </button>
          )}
        </div>

        <button type="button" className="fullscreen-close-btn" onClick={onClose} title="닫기 (ESC)">
          <RiCloseLine />
        </button>
      </div>

      {/* Main Image Stage */}
      <div 
        className="fullscreen-image-stage"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`full-${currentIndex}`}
          className="fullscreen-image"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transition: scale === 1 ? 'transform 0.25s ease' : 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button type="button" className="fullscreen-nav-btn prev" onClick={handlePrev} title="이전 사진">
            <RiArrowLeftSLine />
          </button>
          <button type="button" className="fullscreen-nav-btn next" onClick={handleNext} title="다음 사진">
            <RiArrowRightSLine />
          </button>
        </>
      )}

      {/* Bottom Center Date Overlay Badge */}
      <div className="fullscreen-date-badge">
        {extractDateFromImageUrl(images[currentIndex])}
      </div>
    </div>,
    document.body
  );
}
