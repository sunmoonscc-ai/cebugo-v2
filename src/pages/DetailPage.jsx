import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/places/ImageCarousel';
import SuggestEditModal from '../components/modals/SuggestEditModal';
import { LevelBadge, CarrierBadge } from '../components/common/Badge';
import { classifyPhoneCarrier, parseSnsEntry } from '../utils/phoneSnsClassifier';
import { 
  RiStarFill, 
  RiMapPinLine, 
  RiTimeLine, 
  RiPhoneLine, 
  RiEditBoxLine, 
  RiChat1Line,
  RiCheckDoubleLine
} from 'react-icons/ri';
import './DetailPage.css';

export default function DetailPage() {
  const { id } = useParams();
  const { places, reviews, addReview } = usePlaces();
  const { userProfile } = useAuth();

  const place = places.find((p) => p.id === id) || places[0];
  const placeReviews = reviews.filter((r) => r.placeId === place.id);

  const [activeTab, setActiveTab] = useState('cover'); // cover, facility, product, menu
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  const carrier = classifyPhoneCarrier(place.phone);
  const snsInfo = parseSnsEntry(place.sns);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;

    addReview(place.id, {
      userName: userProfile?.displayName || '세부여행자',
      userLevel: userProfile?.level || 1,
      rating,
      content: reviewContent
    });

    setReviewContent('');
  };

  const getActiveTabImages = () => {
    if (!place.images) return [];
    return place.images[activeTab] || place.images.cover || [];
  };

  return (
    <div className="page-content fade-in">
      <Link to="/" className="back-link">← 목록으로 돌아가기</Link>

      {/* Main Place Overview Card */}
      <div className="glass-card detail-header-card">
        <div className="detail-title-wrap">
          <span className="category-chip">{place.categoryName}</span>
          <h1 className="detail-title">{place.name}</h1>
          
          <div className="rating-row">
            <RiStarFill className="star-icon" />
            <span className="rating-score">{place.rating}</span>
            <span className="rating-count">({place.reviewsCount}개의 리뷰)</span>
          </div>
        </div>

        {/* 4 Image Category Tab Bar */}
        <div className="image-cat-tabs">
          <button className={activeTab === 'cover' ? 'active' : ''} onClick={() => setActiveTab('cover')}>대표사진</button>
          <button className={activeTab === 'facility' ? 'active' : ''} onClick={() => setActiveTab('facility')}>시설사진</button>
          <button className={activeTab === 'product' ? 'active' : ''} onClick={() => setActiveTab('product')}>제품사진</button>
          <button className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')}>메뉴판</button>
        </div>

        <ImageCarousel images={getActiveTabImages()} />

        <div className="detail-info-section">
          <div className="info-row">
            <RiMapPinLine className="info-icon" />
            <div>
              <strong>주소</strong>
              <p>{place.addr}</p>
            </div>
          </div>

          <div className="info-row">
            <RiTimeLine className="info-icon" />
            <div>
              <strong>영업시간 & 휴무</strong>
              <p>{place.open} (브레이크타임: {place.breakTime})</p>
            </div>
          </div>

          <div className="info-row">
            <RiPhoneLine className="info-icon" />
            <div>
              <strong>연락처 / 통신사</strong>
              <p className="phone-line">
                <a href={`tel:${place.phone}`}>{place.phone}</a>
                <CarrierBadge carrier={carrier} />
              </p>
            </div>
          </div>

          {snsInfo && (
            <div className="info-row">
              <RiCheckDoubleLine className="info-icon" />
              <div>
                <strong>SNS / 카카오톡</strong>
                <p>{snsInfo.name}: <strong>{snsInfo.handle}</strong></p>
              </div>
            </div>
          )}

          <div className="desc-box">
            <h4>업체 소개</h4>
            <p>{place.explaination}</p>
          </div>

          <button className="btn btn-secondary suggest-btn" onClick={() => setShowSuggestModal(true)}>
            <RiEditBoxLine /> 정보 수정 제안하기 (+50p)
          </button>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <section className="reviews-section glass-card">
        <h3><RiChat1Line /> 방문자 리뷰 ({placeReviews.length})</h3>

        {/* Review Form */}
        <form onSubmit={handleReviewSubmit} className="review-form">
          <div className="star-rating-select">
            <span>평점 선택:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <RiStarFill
                key={star}
                className={`star-select-icon ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          <textarea
            rows="3"
            placeholder="실제 방문 경험을 후기로 남겨주세요."
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            className="form-textarea"
            required
          />

          <button type="submit" className="btn btn-primary review-submit-btn">
            리뷰 등록하기
          </button>
        </form>

        {/* Reviews List */}
        <div className="reviews-list">
          {placeReviews.map((rev) => (
            <div key={rev.id} className="review-item">
              <div className="review-user-row">
                <strong>{rev.userName}</strong>
                <LevelBadge level={rev.userLevel} />
                <span className="review-date">{rev.createdAt}</span>
              </div>
              <div className="review-stars">
                {[...Array(rev.rating)].map((_, i) => (
                  <RiStarFill key={i} className="star-icon" />
                ))}
              </div>
              <p className="review-text">{rev.content}</p>
            </div>
          ))}
        </div>
      </section>

      {showSuggestModal && <SuggestEditModal place={place} onClose={() => setShowSuggestModal(false)} />}
    </div>
  );
}
