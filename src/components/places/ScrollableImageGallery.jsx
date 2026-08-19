import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageHelper';
import FullScreenImageModal from '../modals/FullScreenImageModal';
import './ScrollableImageGallery.css';

export default function ScrollableImageGallery({ images = [], maxWidth = '100%' }) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const safeImagesArray = Array.isArray(images)
    ? images.filter(Boolean)
    : (typeof images === 'string' && images.trim() ? [images.trim()] : []);
  const displayImages = safeImagesArray.length > 0 ? safeImagesArray : [];

  if (displayImages.length === 0) return null;

  const count = displayImages.length;
  let layoutClass = 'multi';
  if (count === 1) layoutClass = 'single';
  else if (count === 2) layoutClass = 'dual';

  return (
    <>
      <div 
        className="scrollable-gallery-container" 
        style={{ maxWidth: maxWidth || '100%' }}
      >
        <div className={`gallery-scroll-wrap ${layoutClass}`}>
          {displayImages.map((imgSrc, imgIdx) => (
            <img
              key={imgIdx}
              src={getOptimizedImageUrl(imgSrc, 500)}
              alt={`gallery-img-${imgIdx}`}
              className="gallery-item-img"
              onClick={(e) => {
                e.stopPropagation();
                setZoomIndex(imgIdx);
                setIsZoomOpen(true);
              }}
              title="클릭하여 전체 화면으로 크게보기"
              onError={(e) => {
                if (e.target.src !== imgSrc) {
                  e.target.src = imgSrc;
                }
              }}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>

      {isZoomOpen && (
        <FullScreenImageModal
          images={displayImages}
          initialIndex={zoomIndex}
          onClose={() => setIsZoomOpen(false)}
        />
      )}
    </>
  );
}
