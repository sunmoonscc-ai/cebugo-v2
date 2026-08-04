import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CarrierBadge } from '../common/Badge';
import { classifyPhoneCarrier, parseSnsEntry, getSnsLinkUrl } from '../../utils/phoneSnsClassifier';
import { getOptimizedImageUrl, getDefaultImageForCategory } from '../../utils/imageHelper';
import { useAuth } from '../../context/AuthContext';
import FullScreenImageModal from '../modals/FullScreenImageModal';
import { 
  RiStarFill, 
  RiMapPinLine, 
  RiTimeLine, 
  RiHeartFill, 
  RiHeartLine,
  RiEditLine,
  RiDeleteBinLine,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri';
import './PlaceCard.css';

export default function PlaceCard({ place, index, totalCount, onMove, onEdit, onDelete }) {
  const { userProfile, toggleFavorite } = useAuth();
  const [zoomImgIndex, setZoomImgIndex] = useState(null);
  const isFavorite = userProfile?.favorites?.includes(place.id);

  // Gather all images from cover, facility, product, menu
  const allImages = [
    ...(place.images?.cover || []),
    ...(place.images?.facility || []),
    ...(place.images?.product || []),
    ...(place.images?.menu || [])
  ].filter(Boolean);

  const imagesToDisplay = allImages.length > 0
    ? allImages
    : [getDefaultImageForCategory(place)];

  const count = imagesToDisplay.length;
  let layoutClass = 'multi';
  if (count === 1) layoutClass = 'single';
  else if (count === 2) layoutClass = 'dual';

  return (
    <div className="glass-card place-card fade-in">
      <div className="card-image-wrap">
        <div className={`card-image-scroll-container ${layoutClass}`}>
          {imagesToDisplay.map((imgSrc, imgIdx) => (
            <img
              key={imgIdx}
              src={getOptimizedImageUrl(imgSrc, 500)}
              alt={`${place.name} - ${imgIdx + 1}`}
              className="card-item-img"
              onClick={() => setZoomImgIndex(imgIdx)}
              onError={(e) => {
                if (e.target.src !== imgSrc) {
                  e.target.src = imgSrc;
                }
              }}
            />
          ))}
        </div>

        <span className="category-chip">{place.categoryName}</span>
        
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(place.id);
          }}
          title="즐겨찾기"
        >
          {isFavorite ? <RiHeartFill /> : <RiHeartLine />}
        </button>
      </div>

      <div className="card-body">
        <div className="card-header-row">
          <h3 className="place-title" style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/place/${place.id}`}>{place.name}</Link>
          </h3>
          <div className="rating-badge">
            <RiStarFill className="star-icon" />
            <span>{place.rating}</span>
            <span className="reviews-cnt">({place.reviewsCount})</span>
          </div>
        </div>

        {userProfile?.isAdmin && (
          <div className="admin-card-actions" style={{ marginTop: '4px', marginBottom: '8px' }}>
            {onMove && (
              <>
                <button
                  type="button"
                  className="btn-icon-action move"
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                  title="위로 이동"
                >
                  <RiArrowUpLine />
                </button>
                <button
                  type="button"
                  className="btn-icon-action move"
                  onClick={() => onMove(index, 'down')}
                  disabled={index === totalCount - 1}
                  title="아래로 이동"
                >
                  <RiArrowDownLine />
                </button>
              </>
            )}
            {onEdit && (
              <button
                type="button"
                className="btn-icon-action edit"
                onClick={() => onEdit(place)}
                title="업체 정보 수정"
              >
                <RiEditLine /> 수정
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn-icon-action delete"
                onClick={() => onDelete(place.id)}
                title="업체 삭제"
              >
                <RiDeleteBinLine /> 삭제
              </button>
            )}
          </div>
        )}

        <p className="place-addr">
          <RiMapPinLine className="info-icon" />
          {place.addr}
        </p>

        <p className="place-hours">
          <RiTimeLine className="info-icon" />
          {place.open}
        </p>

        {(() => {
          const text = (place.explaination || '').replace(/\r?\n+/g, ' ').trim();
          const MAX_LENGTH = 70;
          const isLong = text.length > MAX_LENGTH;

          return (
            <p className="place-desc">
              {isLong ? text.slice(0, MAX_LENGTH) : text}
              {isLong && (
                <Link to={`/place/${place.id}`} className="desc-more-link" title="상세페이지 이동">
                  <strong className="desc-dots">...</strong>
                  <span className="more-btn-text">(더보기)</span>
                </Link>
              )}
            </p>
          );
        })()}

        <div className="card-footer-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(() => {
            const phonesList = place.phones && Array.isArray(place.phones) && place.phones.length > 0
              ? place.phones
              : (place.phone ? [{ number: place.phone, type: place.phoneType || 'none' }] : []);

            return phonesList.map((ph, pIdx) => {
              const num = typeof ph === 'object' ? ph.number : ph;
              const pType = typeof ph === 'object' ? ph.type : 'none';
              const c = classifyPhoneCarrier(num);
              return <CarrierBadge key={pIdx} carrier={c} phone={num} type={pType} />;
            });
          })()}

          {(() => {
            const snsArray = place.snsList && Array.isArray(place.snsList) && place.snsList.length > 0
              ? place.snsList
              : (place.sns ? [place.sns] : []);

            return snsArray.map((snsItem, sIdx) => {
              const rawStr = typeof snsItem === 'object'
                ? (snsItem.platform === 'custom' ? snsItem.handle : `${snsItem.platform}${snsItem.handle}`)
                : snsItem;
              const snsInfo = parseSnsEntry(rawStr);
              if (!snsInfo) {
                if (!rawStr) return null;
                return (
                  <span key={sIdx} className="sns-tag" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                    {rawStr}
                  </span>
                );
              }
              const linkUrl = getSnsLinkUrl(snsInfo);
              const tagElement = (
                <span className="sns-tag" style={{ backgroundColor: `${snsInfo.color}20`, color: '#1e293b', cursor: linkUrl ? 'pointer' : 'default' }}>
                  {snsInfo.name}: {snsInfo.handle}
                </span>
              );

              if (linkUrl) {
                return (
                  <a
                    key={sIdx}
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ textDecoration: 'none' }}
                    title={`${snsInfo.name} ${snsInfo.handle} 페이지 이동`}
                  >
                    {tagElement}
                  </a>
                );
              }

              return <React.Fragment key={sIdx}>{tagElement}</React.Fragment>;
            });
          })()}
        </div>
      </div>

      {/* True Full-Screen Viewport Zoom Modal using Portal */}
      {zoomImgIndex !== null && (
        <FullScreenImageModal
          images={imagesToDisplay}
          initialIndex={zoomImgIndex}
          onClose={() => setZoomImgIndex(null)}
        />
      )}
    </div>
  );
}
