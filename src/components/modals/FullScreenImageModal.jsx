import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiZoomInLine, RiZoomOutLine, RiRefreshLine, RiDownload2Line } from 'react-icons/ri';
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

  // Disable body scroll while fullscreen modal is active & listen for ESC key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Intercept smartphone / browser back button so back gesture closes modal first
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    };

    // Only push state if we are not already in modal state
    if (window.history.state !== 'fullscreen_modal_open') {
      try {
        window.history.pushState('fullscreen_modal_open', '');
      } catch (e) {
        // Ignore if restricted
      }
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state === 'fullscreen_modal_open') {
        window.history.back();
      }
    };
  }, []);

  const validImages = Array.isArray(images)
    ? images.filter(Boolean)
    : (typeof images === 'string' && images.trim() ? [images.trim()] : []);

  if (!validImages || validImages.length === 0) return null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setDragOffsetX(0);
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setDragOffsetX(0);
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
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

  const handleDownload = async (e) => {
    e?.stopPropagation();
    const url = validImages[currentIndex];
    const defaultFilename = `cebugohub_image_${Date.now()}.jpg`;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // If browser supports File System Access API (Chrome/Edge)
      if (window.showSaveFilePicker) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [{
              description: 'JPEG Image',
              accept: { 'image/jpeg': ['.jpg', '.jpeg'] },
            }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err) {
          // If user aborted, do nothing
          if (err.name === 'AbortError') return;
          console.error('File picker failed:', err);
        }
      }

      // Fallback
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
      window.open(url, '_blank');
    }
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
        <span className="fullscreen-counter">{currentIndex + 1} / {validImages.length}</span>

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
          <button type="button" onClick={handleDownload} title="현재 사진 저장하기" className="download-btn" style={{ marginLeft: '8px' }}>
            <RiDownload2Line />
          </button>
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
          {validImages.map((imgUrl, idx) => (
            <div key={idx} className="fullscreen-slide-item">
              <img
                src={imgUrl}
                alt={`full-${idx}`}
                className="fullscreen-image"
                onError={(e) => {
                  if (e.target.src !== '/default_cafe.png') {
                    e.target.src = '/default_cafe.png';
                  }
                }}
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
      {validImages.length > 1 && (
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
        {extractDateFromImageUrl(validImages[currentIndex])}
      </div>
    </div>,
    document.body
  );
}
