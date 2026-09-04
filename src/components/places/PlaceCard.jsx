import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CarrierBadge } from '../common/Badge';
import { classifyPhoneCarrier, parseSnsEntry, getSnsLinkUrl } from '../../utils/phoneSnsClassifier';
import { getOptimizedImageUrl, getDefaultImageForCategory } from '../../utils/imageHelper';
import { getCategoryColor } from '../../utils/categoryColors';
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
  RiArrowDownLine,
  RiFileCopyLine
} from 'react-icons/ri';
import './PlaceCard.css';

export default function PlaceCard({ place, index, totalCount, selectedCategory, onMove, onEdit, onDelete }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, toggleFavorite } = useAuth();
  const [zoomImgIndex, setZoomImgIndex] = React.useState(null);
  const isFavorite = userProfile?.favorites?.includes(place.id);

  // Close zoom if hash changes (e.g. back button)
  React.useEffect(() => {
    if (zoomImgIndex !== null && location.hash !== '#zoom') {
      setZoomImgIndex(null);
    }
  }, [location.hash, zoomImgIndex]);

  const handleOpenZoom = (idx, e) => {
    e.stopPropagation();
    navigate(location.pathname + location.search + '#zoom', { replace: false });
    setZoomImgIndex(idx);
  };

  const handleCloseZoom = () => {
    if (location.hash === '#zoom') {
      navigate(-1);
    } else {
      setZoomImgIndex(null);
    }
  };

  const goToDetail = () => {
    navigate(`/place/${place.id}`, { state: { fromCategory: selectedCategory } });
  };

  // Gather all images from cover, facility, product, menu
  const allImages = Array.isArray(place.images) 
    ? place.images.filter(Boolean)
    : [
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
    <div className="glass-card place-card">
      <div className="card-image-wrap" onClick={goToDetail} style={{ cursor: 'pointer' }} title="클릭하여 업체 세부 페이지로 이동">
        <div className={`card-image-scroll-container ${layoutClass}`}>
          {imagesToDisplay.map((imgSrc, imgIdx) => (
            <img
              key={imgIdx}
              src={getOptimizedImageUrl(imgSrc, 500)}
              alt={`${place.name} - ${imgIdx + 1}`}
              className="card-item-img"
              onClick={(e) => handleOpenZoom(imgIdx, e)}
              title="클릭하여 전체 화면으로 확대보기"
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

        <span className="category-chip" style={{ backgroundColor: getCategoryColor(place.category) }}>{place.categoryName}</span>
        
        <button 
          type="button"
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
          <div className="rating-badge" onClick={goToDetail} style={{ cursor: 'pointer' }}>
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

        <p className="place-addr" onClick={goToDetail} style={{ cursor: 'pointer' }}>
          <RiMapPinLine className="info-icon" />
          {place.addr}
        </p>

        <p className="place-hours" onClick={goToDetail} style={{ cursor: 'pointer' }}>
          <RiTimeLine className="info-icon" />
          {place.open}
        </p>

        {(() => {
          const text = (place.explaination || '').replace(/\r?\n+/g, ' ').trim();
          const MAX_LENGTH = 70;
          const isLong = text.length > MAX_LENGTH;

          return (
            <p className="place-desc" onClick={goToDetail} style={{ cursor: 'pointer' }} title="클릭하여 상세 정보 보기">
              {isLong ? text.slice(0, MAX_LENGTH) : text}
              {isLong && (
                <span className="desc-more-link" title="상세페이지 이동">
                  <strong className="desc-dots">...</strong>
                  <span className="more-btn-text">(더보기)</span>
                </span>
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
              const isKakaoOrWechat = !linkUrl && (
                snsInfo.key === 'kakao' || snsInfo.key === 'k_' || (snsInfo.name || '').includes('카카오톡') ||
                snsInfo.key === 'wechat' || snsInfo.key === 'w_' || (snsInfo.name || '').includes('위챗')
              );

              const handleCopyText = (e, text, label) => {
                e.preventDefault();
                e.stopPropagation();
                if (!text) return;
                const cleanText = text.trim();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(cleanText).then(() => {
                    alert(`${label} ID가 복사되었습니다: ${cleanText}`);
                  }).catch(() => {
                    prompt(`${label} ID를 복사하세요:`, cleanText);
                  });
                } else {
                  prompt(`${label} ID를 복사하세요:`, cleanText);
                }
              };

              if (isKakaoOrWechat || !linkUrl) {
                const tagLabel = snsInfo.key === 'kakao' || snsInfo.key === 'k_' || (snsInfo.name || '').includes('카카오톡') ? '카카오톡' : (snsInfo.name || 'SNS');
                return (
                  <span
                    key={sIdx}
                    className="sns-tag copyable"
                    onClick={(e) => handleCopyText(e, snsInfo.handle, tagLabel)}
                    style={{
                      backgroundColor: `${snsInfo.color}20`,
                      color: '#1e293b',
                      cursor: 'pointer'
                    }}
                    title="클릭하여 ID 복사"
                  >
                    <RiFileCopyLine style={{ fontSize: '0.85rem', color: '#475569', marginRight: '4px' }} />
                    {tagLabel}: {snsInfo.handle}
                  </span>
                );
              }

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
                  <span className="sns-tag" style={{ backgroundColor: `${snsInfo.color}20`, color: '#1e293b', cursor: 'pointer' }}>
                    {snsInfo.name}: {snsInfo.handle}
                  </span>
                </a>
              );
            });
          })()}
        </div>
      </div>

      {zoomImgIndex !== null && (
        <FullScreenImageModal
          images={imagesToDisplay}
          initialIndex={zoomImgIndex}
          onClose={handleCloseZoom}
        />
      )}
    </div>
  );
}
