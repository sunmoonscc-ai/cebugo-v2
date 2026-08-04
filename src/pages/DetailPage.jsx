import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/places/ImageCarousel';
import SuggestEditModal from '../components/modals/SuggestEditModal';
import { LevelBadge, CarrierBadge } from '../components/common/Badge';
import { classifyPhoneCarrier, parseSnsEntry, getSnsLinkUrl } from '../utils/phoneSnsClassifier';
import { 
  RiStarFill, 
  RiMapPinLine, 
  RiTimeLine, 
  RiPhoneLine, 
  RiEditBoxLine, 
  RiChat1Line,
  RiCheckDoubleLine,
  RiNavigationFill
} from 'react-icons/ri';
import './DetailPage.css';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { places, reviews, addReview } = usePlaces();
  const { userProfile } = useAuth();

  const fromView = location.state?.fromView || 'list';

  const place = places.find((p) => String(p.id) === String(id)) || places.find((p) => (p.name || '').toLowerCase().includes((id || '').toLowerCase())) || places[0];

  const [activeTab, setActiveTab] = useState('cover'); // cover, facility, product, menu
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  if (!place) {
    return (
      <div className="page-content fade-in" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>업체 정보를 읽어오는 중이거나 찾을 수 없습니다.</h2>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/', { state: { fromView } }); }} className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>
          ← 목록으로 돌아가기
        </a>
      </div>
    );
  }

  const placeReviews = reviews.filter((r) => r.placeId === place.id);

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
    if (!place.images) return [getDefaultImageForCategory(place)];
    const tabImgs = place.images[activeTab] || [];
    if (tabImgs.length > 0) return tabImgs;
    
    // Check if cover images exist
    if (place.images.cover && place.images.cover.length > 0) return place.images.cover;

    // Check if any other category images exist
    const all = [
      ...(place.images.cover || []),
      ...(place.images.facility || []),
      ...(place.images.product || []),
      ...(place.images.menu || [])
    ].filter(Boolean);

    if (all.length > 0) return all;

    return [getDefaultImageForCategory(place)];
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate('/', { state: { fromView } });
  };

  const hasBreakTime = place.breakTime && place.breakTime.trim() !== '' && place.breakTime !== '없음';

  return (
    <div className="page-content fade-in">
      <a href="/" onClick={handleBack} className="back-link">
        ← {fromView === 'map' ? '지도로 돌아가기' : '목록으로 돌아가기'}
      </a>

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
            <div style={{ width: '100%' }}>
              <strong>주소</strong>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                <p style={{ margin: 0, flex: 1, minWidth: '180px' }}>{place.addr}</p>
                {place.addr && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=10.324581378196822,124.01394151354162&destination=${place.lat && place.lng ? `${place.lat},${place.lng}` : encodeURIComponent(place.addr)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-directions-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <RiNavigationFill /> 길찾기
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="info-row">
            <RiTimeLine className="info-icon" />
            <div>
              <strong>영업시간 & 휴무</strong>
              <p>
                {place.open}
                {hasBreakTime && ` (브레이크타임: ${place.breakTime})`}
              </p>
            </div>
          </div>

          <div className="info-row">
            <RiPhoneLine className="info-icon" />
            <div>
              <strong>연락처</strong>
              <div className="phone-line" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
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
              </div>
            </div>
          </div>

          <div className="info-row">
            <RiCheckDoubleLine className="info-icon" />
            <div>
              <strong>SNS</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {(() => {
                  const snsArray = place.snsList && Array.isArray(place.snsList) && place.snsList.length > 0
                    ? place.snsList
                    : (place.sns ? [place.sns] : []);

                  return snsArray.map((snsItem, sIdx) => {
                    const rawStr = typeof snsItem === 'object'
                      ? (snsItem.platform === 'custom' ? snsItem.handle : `${snsItem.platform}${snsItem.handle}`)
                      : snsItem;
                    const parsed = parseSnsEntry(rawStr);
                    if (!parsed) {
                      if (!rawStr) return null;
                      return (
                        <span key={sIdx} className="sns-tag" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                          {rawStr}
                        </span>
                      );
                    }
                    const linkUrl = getSnsLinkUrl(parsed);
                    const tagElement = (
                      <span className="sns-tag" style={{ backgroundColor: `${parsed.color}20`, color: '#1e293b', cursor: linkUrl ? 'pointer' : 'default' }}>
                        {parsed.name}: {parsed.handle}
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
                          title={`${parsed.name} ${parsed.handle} 페이지 이동`}
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
          </div>

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
