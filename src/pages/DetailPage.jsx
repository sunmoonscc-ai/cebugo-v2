import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import ImageCarousel from '../components/places/ImageCarousel';
import SuggestEditModal from '../components/modals/SuggestEditModal';
import PlaceFormModal from '../components/modals/PlaceFormModal';
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
  RiNavigationFill,
  RiEditLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiHeartFill,
  RiHeartLine
} from 'react-icons/ri';
import { getDefaultImageForCategory, formatBreakAndOffTime } from '../utils/imageHelper';
import './DetailPage.css';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { places, reviews, addReview, updatePlace, deletePlace, updateReview, deleteReview, hideReview } = usePlaces();
  const { userProfile, toggleFavorite } = useAuth();

  const fromView = location.state?.fromView || 'list';
  const fromCategory = location.state?.fromCategory || 'all';

  const [siteRules, setSiteRules] = useState({ reviewWriteLevel: 1 });

  // Automatically scroll to very top when Detail Page is loaded or ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, 'cebugo_config', 'site_rules'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteRules(docSnap.data());
      }
    });
    return () => unsubSite();
  }, []);

  const place = places.find((p) => String(p.id) === String(id)) || places.find((p) => (p.name || '').toLowerCase().includes((id || '').toLowerCase())) || places[0];

  const [activeTab, setActiveTab] = useState('cover'); // cover, facility, product, menu
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);

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

  const placeReviews = reviews.filter((r) => r.placeId === place.id && (userProfile?.isAdmin || !r.isHidden));

  const carrier = classifyPhoneCarrier(place.phone);
  const snsInfo = parseSnsEntry(place.sns);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;

    addReview(place.id, {
      userName: userProfile?.displayName || '세부여행자',
      userLevel: userProfile?.level || 1,
      uid: userProfile?.uid || 'guest',
      rating,
      content: reviewContent
    });

    setReviewContent('');
  };

  const getActiveTabImages = () => {
    const defaultImg = getDefaultImageForCategory(place) || '/default_cafe.png';
    if (!place || !place.images) return activeTab === 'cover' ? [defaultImg] : [];

    const currentTabImgs = (place.images[activeTab] || []).filter(Boolean);
    if (currentTabImgs.length > 0) return currentTabImgs;

    if (activeTab !== 'cover') return [];

    const allImgs = Array.isArray(place.images)
      ? place.images.filter(Boolean)
      : [
          ...(place.images.cover || []),
          ...(place.images.facility || []),
          ...(place.images.product || []),
          ...(place.images.menu || [])
        ].filter(Boolean);

    if (allImgs.length > 0) return allImgs;

    return [defaultImg];
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate('/', { state: { fromView, fromCategory } });
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="category-chip" style={{ margin: 0 }}>{place.categoryName}</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(place.id);
                }}
                title="즐겨찾기"
                style={{
                  background: 'none',
                  border: 'none',
                  color: userProfile?.favorites?.includes(place.id) ? '#ef4444' : '#94a3b8',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  transition: 'color 0.2s'
                }}
              >
                {userProfile?.favorites?.includes(place.id) ? <RiHeartFill /> : <RiHeartLine />}
              </button>
            </div>
            {userProfile?.isAdmin && (
              <div className="admin-actions" style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '3px 9px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '6px' }}
                  onClick={() => setIsFormModalOpen(true)}
                  title="업체 정보 수정"
                >
                  <RiEditLine /> 수정
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '3px 9px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => {
                    if (window.confirm('정말로 이 업체 정보를 삭제하시겠습니까?')) {
                      deletePlace(place.id);
                      navigate('/', { state: { fromView } });
                    }
                  }}
                  title="업체 삭제"
                >
                  <RiDeleteBinLine /> 삭제
                </button>
              </div>
            )}
          </div>
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

        {(() => {
          const activeImages = getActiveTabImages();
          if (activeImages.length > 0) {
            return <ImageCarousel images={activeImages} />;
          }
          return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '12px', color: '#94a3b8', margin: '0 16px', fontSize: '0.95rem' }}>
              해당 항목에 등록된 사진이 없습니다.
            </div>
          );
        })()}

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
                {formatBreakAndOffTime(place.breakTime)}
              </p>
            </div>
          </div>

          <div className="info-row">
            <RiPhoneLine className="info-icon" />
            <div>
              <strong>연락처</strong>
              <div className="phone-line" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {(() => {
                  const phonesList = (place.phones && Array.isArray(place.phones) && place.phones.length > 0
                    ? place.phones
                    : (place.phone ? [{ number: place.phone, type: place.phoneType || 'none' }] : [])).filter(Boolean);

                  return phonesList.map((ph, pIdx) => {
                    const num = ph && typeof ph === 'object' ? (ph.number || '') : (ph || '');
                    const pType = ph && typeof ph === 'object' ? (ph.type || 'none') : 'none';
                    if (!num) return null;
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
                  const snsArray = (place.snsList && Array.isArray(place.snsList) && place.snsList.length > 0
                    ? place.snsList
                    : (place.sns ? [place.sns] : [])).filter(Boolean);

                  return snsArray.map((snsItem, sIdx) => {
                    const rawStr = snsItem && typeof snsItem === 'object'
                      ? (snsItem.platform === 'custom' ? (snsItem.handle || '') : `${snsItem.platform || ''}${snsItem.handle || ''}`)
                      : (snsItem || '');
                    if (!rawStr) return null;
                    const parsed = parseSnsEntry(rawStr);
                    if (!parsed) {
                      return (
                        <span key={sIdx} className="sns-tag" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                          {rawStr}
                        </span>
                      );
                    }
                    const linkUrl = getSnsLinkUrl(parsed);
                    const isKakaoOrWechat = !linkUrl && (
                      parsed.key === 'kakao' || parsed.key === 'k_' || (parsed.name || '').includes('카카오톡') ||
                      parsed.key === 'wechat' || parsed.key === 'w_' || (parsed.name || '').includes('위챗')
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
                      return (
                        <span
                          key={sIdx}
                          className="sns-tag kakao-copy-badge"
                          onClick={(e) => handleCopyText(e, parsed.handle, parsed.name || '카카오톡')}
                          style={{
                            backgroundColor: `${parsed.color}25`,
                            color: '#1e293b',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            userSelect: 'all'
                          }}
                          title={`클릭하여 ${parsed.name} ID (${parsed.handle}) 복사`}
                        >
                          <RiFileCopyLine style={{ fontSize: '0.85rem', color: '#475569' }} />
                          {parsed.name}: {parsed.handle}
                          <small style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '2px' }}>(복사)</small>
                        </span>
                      );
                    }

                    const tagElement = (
                      <span className="sns-tag" style={{ backgroundColor: `${parsed.color}20`, color: '#1e293b', cursor: 'pointer' }}>
                        {parsed.name}: {parsed.handle}
                      </span>
                    );

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
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="desc-box">
            <h4>업체 소개</h4>
            <p>{place.explaination}</p>
          </div>

          <button
            className="btn btn-secondary suggest-btn"
            onClick={() => {
              if (!userProfile) {
                if (window.confirm('회원가입 후 로그인 하시겠습니까?')) {
                  navigate('/profile');
                }
                return;
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setShowSuggestModal(true);
            }}
          >
            <RiEditBoxLine /> 사진 제공 및 정보수정 제안
          </button>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <section className="reviews-section glass-card">
        <h3><RiChat1Line /> 방문자 리뷰 ({placeReviews.length})</h3>

        {/* Review Form */}
        {userProfile ? (
          userProfile.level >= (siteRules?.reviewWriteLevel || 1) ? (
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
          ) : (
            <div className="review-form" style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              리뷰(댓글) 작성 권한이 없습니다.<br/>
              <span style={{ fontSize: '0.85rem' }}>현재 내 레벨: Lv.{userProfile.level} / 필요 레벨: Lv.{siteRules?.reviewWriteLevel || 1}</span>
            </div>
          )
        ) : (
          <div className="review-form" style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            리뷰를 작성하시려면 로그인이 필요합니다.<br/>
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '10px', fontSize: '0.85rem' }}
              onClick={() => navigate('/profile')}
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {placeReviews.map((rev) => {
            const isAuthor = userProfile && (userProfile.displayName === rev.userName || userProfile.uid === rev.uid);
            const isEditing = editingReviewId === rev.id;

            return (
              <div key={rev.id} className="review-item" style={{ opacity: rev.isHidden ? 0.5 : 1 }}>
                <div className="review-user-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong>{rev.userName ? `${rev.userName.charAt(0)}****` : '****'}</strong>
                    <LevelBadge level={rev.userLevel} />
                    <span className="review-date">{rev.createdAt}</span>
                    {rev.isHidden && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '4px', fontWeight: 'bold' }}>[숨김 처리됨]</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isAuthor && !isEditing && (
                      <>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px' }} onClick={() => {
                          setEditingReviewId(rev.id);
                          setEditContent(rev.content);
                          setEditRating(rev.rating || 5);
                        }}>수정</button>
                        <button type="button" className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => {
                          if (window.confirm('리뷰를 정말 삭제하시겠습니까?')) {
                            deleteReview(rev.id);
                          }
                        }}>삭제</button>
                      </>
                    )}
                    {userProfile?.isAdmin && (
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: rev.isHidden ? '#10b981' : '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => hideReview(rev.id, !rev.isHidden)}>
                        {rev.isHidden ? '감추기 해제' : '감추기'}
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div className="star-rating-select" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.9rem', marginRight: '8px', color: '#64748b' }}>평점 수정:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <RiStarFill
                          key={star}
                          className={`star-select-icon ${star <= editRating ? 'active' : ''}`}
                          onClick={() => setEditRating(star)}
                        />
                      ))}
                    </div>
                    <textarea
                      rows="3"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="form-textarea"
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => {
                        updateReview(rev.id, editContent, editRating);
                        setEditingReviewId(null);
                      }}>저장</button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setEditingReviewId(null)}>취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="review-stars" style={{ marginTop: '6px' }}>
                      {[...Array(Math.max(1, Math.min(5, Math.floor(rev.rating || 5))))].map((_, i) => (
                        <RiStarFill key={i} className="star-icon" />
                      ))}
                    </div>
                    <p className="review-text">{rev.content}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {showSuggestModal && <SuggestEditModal place={place} onClose={() => setShowSuggestModal(false)} />}
      {isFormModalOpen && (
        <PlaceFormModal
          editingPlace={place}
          onClose={() => setIsFormModalOpen(false)}
          onSave={(formData) => {
            updatePlace(place.id, formData);
            setIsFormModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
