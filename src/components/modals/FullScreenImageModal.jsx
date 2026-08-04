import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiZoomInLine, RiZoomOutLine, RiRefreshLine } from 'react-icons/ri';
import { extractDateFromImageUrl } from '../../utils/imageHelper';
import './FullScreenImageModal.css';

export default function FullScreenImageModal({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, time: 0 });

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setDragOffsetX(0);
  }, [currentIndex]);

  // Intercept smartphone / browser back button so back gesture closes modal first
  useEffect(() => {
    window.history.pushState({ modalOpen: 'fullscreen_image' }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalOpen === 'fullscreen_image') {
        window.history.back();
      }
    };
  }, [onClose]);

  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setDragOffsetX(0);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setDragOffsetX(0);
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

  const [isPanDragging, setIsPanDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsPanDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (scale > 1 && isPanDragging) {
      e.preventDefault();
      const deltaX = ((e.clientX - dragStartRef.current.x) * 4) / scale;
      const deltaY = ((e.clientY - dragStartRef.current.y) * 4) / scale;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanDragging) {
      setIsPanDragging(false);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      if (scale > 1) {
        setIsPanDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          posX: position.x,
          posY: position.y
        };
      } else {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          dist: 0,
          time: Date.now()
        };
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setIsPanDragging(false);
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
      return;
    }

    if (e.touches.length === 1) {
      if (scale > 1 && isPanDragging) {
        const deltaX = ((e.touches[0].clientX - dragStartRef.current.x) * 4) / scale;
        const deltaY = ((e.touches[0].clientY - dragStartRef.current.y) * 4) / scale;
        setPosition({
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY
        });
      } else if (scale === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - touchStartRef.current.x;
        const deltaY = e.touches[0].clientY - touchStartRef.current.y;

        if (Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
          setDragOffsetX(deltaX);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPanDragging(false);
    if (scale === 1) {
      const threshold = 60;
      if (dragOffsetX < -threshold) {
        handleNext();
      } else if (dragOffsetX > threshold) {
        handlePrev();
      } else {
        setDragOffsetX(0);
      }
    } else {
      setDragOffsetX(0);
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

      {/* Main Image Stage Slider Track */}
      <div 
        className="fullscreen-image-stage"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isPanDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div 
          className="fullscreen-slider-track"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffsetX}px))`,
            transition: isDragging || isPanDragging ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {images.map((imgUrl, idx) => (
            <div key={idx} className="fullscreen-slide-item">
              <img
                src={imgUrl}
                alt={`full-${idx}`}
                className="fullscreen-image"
                style={idx === currentIndex ? {
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isPanDragging || isDragging ? 'none' : 'transform 0.2s ease-out'
                } : {}}
                draggable={false}
              />
            </div>
          ))}
        </div>
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
