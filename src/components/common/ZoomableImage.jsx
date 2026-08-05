import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageHelper';
import FullScreenImageModal from '../modals/FullScreenImageModal';
import { RiZoomInLine } from 'react-icons/ri';
import './ZoomableImage.css';

export default function ZoomableImage({
  src,
  images,
  initialIndex = 0,
  alt = 'image',
  className = '',
  style = {},
  width = 800,
  fallback = '/default_cafe.png',
  showZoomHint = true,
  onClick,
  stopClickPropagation = true,
  ...props
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallback);

  // Normalize image list for full screen modal navigation
  const safeImagesArray = Array.isArray(images)
    ? images.filter(Boolean)
    : (typeof images === 'string' && images.trim() ? [images.trim()] : []);
  const imageList = safeImagesArray.length > 0 ? safeImagesArray : [src || fallback];

  const handleClick = (e) => {
    if (stopClickPropagation) {
      e.stopPropagation();
    }
    if (onClick) {
      onClick(e);
    }
    setIsModalOpen(true);
  };

  const handleError = (e) => {
    if (e.target.src !== fallback) {
      setImgSrc(fallback);
    }
  };

  const optimizedSrc = getOptimizedImageUrl(imgSrc, width);

  return (
    <>
      <div
        className={`zoomable-image-wrapper ${className}`}
        style={style}
        onClick={handleClick}
        title="클릭하여 전체 화면으로 확대보기"
      >
        <img
          src={optimizedSrc}
          alt={alt}
          className="zoomable-image-img"
          onError={handleError}
          loading="lazy"
          {...props}
        />
        {showZoomHint && (
          <div className="zoomable-image-hint">
            <RiZoomInLine />
          </div>
        )}
      </div>

      {isModalOpen && (
        <FullScreenImageModal
          images={imageList}
          initialIndex={initialIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
