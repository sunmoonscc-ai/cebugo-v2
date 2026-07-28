import React from 'react';
import { Link } from 'react-router-dom';
import { CarrierBadge } from '../common/Badge';
import { classifyPhoneCarrier, parseSnsEntry } from '../../utils/phoneSnsClassifier';
import { getOptimizedImageUrl } from '../../utils/imageHelper';
import { useAuth } from '../../context/AuthContext';
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
  const carrier = classifyPhoneCarrier(place.phone);
  const snsInfo = parseSnsEntry(place.sns);
  const isFavorite = userProfile?.favorites?.includes(place.id);

  const coverImg = place.images?.cover?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80';

  return (
    <div className="glass-card place-card fade-in">
      <div className="card-image-wrap">
        <img src={getOptimizedImageUrl(coverImg, 500)} alt={place.name} className="card-cover-img" />
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

        <p className="place-desc">{place.explaination}</p>

        <div className="card-footer-tags">
          <CarrierBadge carrier={carrier} />
          {snsInfo && (
            <span className="sns-tag" style={{ backgroundColor: `${snsInfo.color}20`, color: '#1e293b' }}>
              {snsInfo.name}: {snsInfo.handle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
