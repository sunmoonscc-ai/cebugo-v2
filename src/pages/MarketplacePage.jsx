import React, { useState } from 'react';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import PhoneAuthModal from '../components/modals/PhoneAuthModal';
import { LevelBadge, PhoneVerifiedBadge, KakaoVerifiedBadge } from '../components/common/Badge';
import { parseSnsEntry } from '../utils/phoneSnsClassifier';
import { 
  RiAddLine, 
  RiShoppingBagLine, 
  RiShieldUserLine, 
  RiLock2Line,
  RiFlag2Line
} from 'react-icons/ri';
import './MarketplacePage.css';

export default function MarketplacePage() {
  const { marketplace, addMarketplaceListing } = usePlaces();
  const { userProfile, requestManualVerification } = useAuth();
  const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);

  // New Listing Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('electronics');
  const [agreeContact, setAgreeContact] = useState(true);

  const [inputKakaoId, setInputKakaoId] = useState('');

  const writeLevelRequired = 4;
  const readLevelRequired = 3;

  const userCanRead = userProfile?.level >= readLevelRequired;
  // Requires both Phone Verified and Kakao Verified
  const userCanWrite = userProfile?.level >= writeLevelRequired && userProfile?.phoneVerified && userProfile?.kakaoVerified;

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;

    addMarketplaceListing({
      sellerUid: userProfile.uid,
      sellerName: userProfile.displayName,
      sellerLevel: userProfile.level,
      title,
      price: `${price} PHP`,
      description,
      category,
      images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'],
      phone: userProfile.phoneNumber || '09171234567',
      sns: `k_${userProfile.kakaoId || 'cebuseller'}`
    });

    setTitle('');
    setPrice('');
    setDescription('');
    setShowWriteForm(false);
  };

  const handleReqKakaoVerif = (e) => {
    e.preventDefault();
    if (!inputKakaoId.trim()) return;
    requestManualVerification('kakao', inputKakaoId);
    alert('카카오톡 ID 등록/인증 신청이 완료되었습니다.');
  };

  return (
    <div className="page-content fade-in">
      <div className="marketplace-header glass-card">
        <div className="header-info">
          <h2>
            <RiShoppingBagLine /> 중고거래
            <span className="header-info-sub"> - 세부 현지 중고물품 거래 (열람은 레벨3 이상, 작성은 레벨4 이상 & 현지 휴대전화 및 카카오톡 인증 시 가능)</span>
          </h2>
        </div>

        <div className="user-eligibility-box">
          <div className="eligibility-status">
            <span>내 인증 상태:</span>
            <LevelBadge level={userProfile?.level || 1} />
            <PhoneVerifiedBadge isVerified={userProfile?.phoneVerified} />
            <KakaoVerifiedBadge isVerified={userProfile?.kakaoVerified} />
          </div>

          <div className="verification-request-actions">
            {!userProfile?.phoneVerified && (
              <button className="btn btn-secondary phone-auth-btn" onClick={() => setShowPhoneAuthModal(true)}>
                현지폰 인증 신청
              </button>
            )}

            {!userProfile?.kakaoVerified && (
              <form onSubmit={handleReqKakaoVerif} className="kakao-verif-form">
                <input
                  type="text"
                  placeholder="카톡 ID 입력"
                  value={inputKakaoId}
                  onChange={(e) => setInputKakaoId(e.target.value)}
                  className="form-input"
                  style={{ width: '120px', padding: '4px 8px', fontSize: '0.8rem' }}
                  required
                />
                <button type="submit" className="btn btn-secondary phone-auth-btn">
                  카톡 인증 신청
                </button>
              </form>
            )}
          </div>
        </div>

        {userCanWrite ? (
          <button className="btn btn-primary create-listing-btn" onClick={() => setShowWriteForm(!showWriteForm)}>
            <RiAddLine /> {showWriteForm ? '작성 취소' : '중고 물품 등록하기'}
          </button>
        ) : (
          <div className="lock-notice">
            <RiLock2Line />
            <span>등록 조건 미충족 (Lv.4 이상 + [현지폰 & 카톡 수동인증] 필요)</span>
          </div>
        )}
      </div>

      {/* Write Listing Form */}
      {showWriteForm && (
        <div className="glass-card write-form-card fade-in">
          <h3>신규 중고 매물 등록</h3>
          <form onSubmit={handleCreateListing} className="modal-form">
            <label className="form-label">매물 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 스노클링 장비 세트"
              className="form-input"
              required
            />

            <label className="form-label">판매 가격 (PHP)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 1500"
              className="form-input"
              required
            />

            <label className="form-label">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
              <option value="electronics">전자기기/변압기</option>
              <option value="sports">수상레저/스노클링</option>
              <option value="life">생활/귀국처분</option>
              <option value="fashion">의류/잡화</option>
            </select>

            <label className="form-label">상세 설명</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="제품 상태, 거래 희망 장소(예: 막탄 제이파크 정문) 등을 작성해주세요."
              className="form-textarea"
              required
            />

            <div className="checkbox-wrap">
              <input
                type="checkbox"
                id="agree"
                checked={agreeContact}
                onChange={(e) => setAgreeContact(e.target.checked)}
                required
              />
              <label htmlFor="agree">프로필에 등록된 연락처(전화번호/카톡 ID) 공개에 동의합니다.</label>
            </div>

            <button type="submit" className="btn btn-primary form-submit-btn">
              매물 등록 완료
            </button>
          </form>
        </div>
      )}

      {/* Listings List */}
      {!userCanRead ? (
        <div className="glass-card empty-state">
          <RiShieldUserLine style={{ fontSize: '2.5rem', color: '#cbd5e1' }} />
          <h3>열람 권한 제한</h3>
          <p>중고 매물 열람은 **레벨 3 이상** 여행자부터 가능합니다.</p>
        </div>
      ) : (
        <div className="listings-grid">
          {marketplace.map((item) => {
            const snsInfo = parseSnsEntry(item.sns);
            return (
              <div key={item.id} className="glass-card listing-card fade-in">
                <img src={item.images[0]} alt={item.title} className="listing-img" />
                <div className="listing-body">
                  <div className="listing-top">
                    <span className="listing-price">{item.price}</span>
                    <span className="listing-status">{item.status === 'available' ? '판매중' : '거래완료'}</span>
                  </div>
                  <h3 className="listing-title">{item.title}</h3>
                  <p className="listing-desc">{item.description}</p>
                  
                  <div className="seller-info">
                    <div className="seller-row">
                      <span>판매자: {item.sellerName}</span>
                      <LevelBadge level={item.sellerLevel} />
                    </div>
                    <div className="contact-row">
                      <span>TEL: {item.phone}</span>
                      {snsInfo && <span>{snsInfo.name}: {snsInfo.handle}</span>}
                    </div>
                  </div>

                  <div className="listing-actions">
                    <button className="btn btn-secondary report-btn" onClick={() => alert('신고가 접수되었습니다.')}>
                      <RiFlag2Line /> 신고
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPhoneAuthModal && <PhoneAuthModal onClose={() => setShowPhoneAuthModal(false)} />}
    </div>
  );
}
