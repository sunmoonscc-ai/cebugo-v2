import React, { useState } from 'react';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import PhoneAuthModal from '../components/modals/PhoneAuthModal';
import { LevelBadge, PhoneVerifiedBadge, KakaoVerifiedBadge } from '../components/common/Badge';
import { parseSnsEntry } from '../utils/phoneSnsClassifier';
import { 
  RiAddLine, 
  RiShoppingBagLine, 
  RiShieldUserLine, 
  RiLock2Line,
  RiFlag2Line,
  RiHeart3Line,
  RiHeart3Fill,
  RiSearchLine,
  RiDeleteBinLine,
  RiEditLine,
  RiArrowUpCircleLine,
  RiImageAddLine,
  RiCloseCircleLine
} from 'react-icons/ri';
import ZoomableImage from '../components/common/ZoomableImage';
import './MarketplacePage.css';

export default function MarketplacePage() {
  const { 
    marketplace, 
    addMarketplaceListing, 
    updateMarketplaceListing, 
    deleteMarketplaceListing, 
    updateMarketplaceStatus, 
    bumpMarketplaceListing, 
    toggleMarketplaceFavorite,
    addSubmission
  } = usePlaces();
  const { userProfile, updateUserProfile, appConfig } = useAuth();
  const maxImages = userProfile?.isAdmin ? appConfig?.imageUploadLimits?.admin ?? 30 : appConfig?.imageUploadLimits?.user ?? 30;
  const [showPhoneAuthModal, setShowPhoneAuthModal] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [expandedListingId, setExpandedListingId] = useState(null);

  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // New Listing Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('furniture');
  const [images, setImages] = useState([]);
  const [agreeContact, setAgreeContact] = useState(true);

  const [inputKakaoId, setInputKakaoId] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputPhoneKr, setInputPhoneKr] = useState('');

  const [rules, setRules] = useState({
    readLevel: 1, reqPhoneRead: false, reqKakaoRead: false,
    writeLevel: 4, reqPhoneWrite: true, reqKakaoWrite: true
  });
  
  const [siteRules, setSiteRules] = useState({ locationPolicy: 'manual' });

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cebugo_config', 'marketplace_rules'), (docSnap) => {
      if (docSnap.exists()) {
        setRules(docSnap.data());
      }
    });
    const unsubSite = onSnapshot(doc(db, 'cebugo_config', 'site_rules'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteRules(docSnap.data());
      }
    });
    return () => { unsub(); unsubSite(); };
  }, []);

  const isValidUser = userProfile && !userProfile.isGuest;

  const userCanRead = isValidUser && (
    userProfile.isAdmin || (
      userProfile.level >= rules.readLevel &&
      (!rules.reqPhoneRead || userProfile.phoneVerified) &&
      (!rules.reqKakaoRead || userProfile.kakaoVerified)
    )
  );
  
  const userCanWrite = isValidUser && (
    userProfile.isAdmin || (
      userProfile.level >= rules.writeLevel &&
      (!rules.reqPhoneWrite || userProfile.phoneVerified) &&
      (!rules.reqKakaoWrite || userProfile.kakaoVerified)
    )
  );

  const checkWriteAccess = () => {
    if (userCanWrite) {
      setShowWriteForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    let msg = `새 매물을 등록하려면 다음 조건을 충족해야 합니다.\n\n- 최소 레벨: Lv.${rules.writeLevel}\n`;
    if (rules.reqPhoneWrite) msg += `- 전화번호 인증 완료\n`;
    if (rules.reqKakaoWrite) msg += `- 카카오톡 인증 완료\n`;
    alert(msg);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > maxImages) {
      alert(`이미지는 최대 ${maxImages}장까지 업로드 가능합니다.`);
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => prev.length < maxImages ? [...prev, reader.result] : prev);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const openEditForm = (item) => {
    setEditingListingId(item.id);
    setTitle(item.title);
    setPrice(item.price.replace(/[^0-9.]/g, ''));
    setDescription(item.description);
    setCategory(item.category);
    setImages(item.images || []);
    setShowWriteForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingListingId(null);
    setTitle('');
    setPrice('');
    setDescription('');
    setImages([]);
    setShowWriteForm(false);
  };

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;

    if (editingListingId) {
      updateMarketplaceListing(editingListingId, {
        title,
        price: `${price} PHP`,
        description,
        category,
        images
      });
    } else {
      addMarketplaceListing({
        sellerUid: userProfile.uid,
        sellerName: userProfile.displayName,
        sellerLevel: userProfile.level,
        title,
        price: `${price} PHP`,
        description,
        category,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'],
        phone: userProfile.phoneNumber || '09171234567',
        sns: `k_${userProfile.kakaoId || 'cebuseller'}`
      });
    }

    cancelEdit();
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 이 매물을 삭제하시겠습니까?')) {
      deleteMarketplaceListing(id);
    }
  };

  const handleBump = (item) => {
    const lastUpdate = new Date(item.updatedAt || item.createdAt || 0);
    const hoursDiff = (new Date() - lastUpdate) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      alert('끌어올리기는 1일에 1번만 가능합니다.');
      return;
    }
    bumpMarketplaceListing(item.id);
    alert('끌어올리기가 완료되었습니다!');
  };

  const filteredMarketplace = marketplace.filter(item => {
    if (filterCategory === 'favorites') {
      const isFavorited = item.favoritesUsers?.includes(userProfile?.uid);
      if (!isFavorited) return false;
    } else {
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      if (!matchCategory) return false;
    }

    const matchSearch = item.title.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchSearch;
  });

  const handleReqKakaoVerif = async (e) => {
    e.preventDefault();
    if (!inputKakaoId.trim()) return;
    
    // 1. Save unverified kakaoId to profile
    await updateUserProfile({ kakaoId: inputKakaoId });
    
    // 2. Submit verification request to admin
    addSubmission({
      type: 'verification',
      field: 'kakao',
      oldValue: '미인증',
      newValue: inputKakaoId,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '카카오톡 인증 요청'
    });
    
    alert('카카오톡 ID 등록 및 관리자 인증 신청이 완료되었습니다.');
  };

  const handleReqPhoneVerif = async (e) => {
    e.preventDefault();
    if (!inputPhone.trim()) return;
    
    await updateUserProfile({ phoneNumber: inputPhone });
    
    addSubmission({
      type: 'verification',
      field: 'phone',
      oldValue: '미인증',
      newValue: inputPhone,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '현지 휴대폰 인증 요청'
    });
    
    alert('필리핀 현지폰 번호 등록 및 관리자 인증 신청이 완료되었습니다.');
  };

  const handleReqPhoneKrVerif = async (e) => {
    e.preventDefault();
    if (!inputPhoneKr.trim()) return;
    
    await updateUserProfile({ phoneKr: inputPhoneKr });
    
    addSubmission({
      type: 'verification',
      field: 'phoneKr',
      oldValue: '미인증',
      newValue: inputPhoneKr,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '한국 휴대폰 인증 요청'
    });
    
    alert('한국 휴대폰 번호 등록 및 관리자 인증 신청이 완료되었습니다.');
  };

  return (
    <div className="page-content fade-in">
      <div className="marketplace-header glass-card">
        <div className="header-info">
          <h2>
            <RiShoppingBagLine /> 중고거래
            <span className="header-info-sub"> - 세부 현지 중고물품 거래 (열람은 Lv.{rules.readLevel} 이상, 작성은 Lv.{rules.writeLevel} 이상 및 설정된 필수인증 필요)</span>
          </h2>
        </div>

        {isValidUser && (
          <div className="user-eligibility-box">
            <div className="eligibility-status">
              <span>내 인증 상태:</span>
              <LevelBadge level={userProfile.level || 1} />
              <PhoneVerifiedBadge isVerified={userProfile.phoneVerified} />
              <KakaoVerifiedBadge isVerified={userProfile.kakaoVerified} />
            </div>

            <div className="verification-request-actions">
              {!userProfile.phoneVerified && (
                <form onSubmit={handleReqPhoneVerif} className="kakao-verif-form">
                  <input
                    type="text"
                    placeholder="현지폰 입력"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="form-input"
                    style={{ width: '120px', padding: '4px 8px', fontSize: '0.8rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-secondary phone-auth-btn">
                    현지폰 인증 신청
                  </button>
                </form>
              )}
              
              {!userProfile.phoneKrVerified && (
                <form onSubmit={handleReqPhoneKrVerif} className="kakao-verif-form">
                  <input
                    type="text"
                    placeholder="한국폰 입력"
                    value={inputPhoneKr}
                    onChange={(e) => setInputPhoneKr(e.target.value)}
                    className="form-input"
                    style={{ width: '120px', padding: '4px 8px', fontSize: '0.8rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-secondary phone-auth-btn">
                    한국폰 인증 신청
                  </button>
                </form>
              )}

              {!userProfile.kakaoVerified && (
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
        )}

        {isValidUser && (
          userCanWrite ? (
            <button className="btn btn-primary create-listing-btn" onClick={() => {
              if (showWriteForm) cancelEdit();
              else setShowWriteForm(true);
            }}>
              <RiAddLine /> {showWriteForm ? '작성 취소' : '중고 물품 등록하기'}
            </button>
          ) : (
            <div className="lock-notice" onClick={checkWriteAccess} style={{ cursor: 'pointer' }}>
              <RiLock2Line />
              <span>등록 조건 미충족 (클릭하여 조건 확인)</span>
            </div>
          )
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
              <option value="furniture">가구</option>
              <option value="etc">기타</option>
              <option value="books">도서</option>
              <option value="electronics">디지털·가전</option>
              <option value="leisure">레저</option>
              <option value="life">생활용품</option>
              <option value="kids">유아</option>
              <option value="vehicles">차량</option>
            </select>

            <label className="form-label">이미지 첨부 (최대 {maxImages}장)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'white', borderRadius: '50%', border: 'none', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <RiCloseCircleLine size={20} />
                  </button>
                  {idx === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px' }}>대표</span>}
                </div>
              ))}
              {images.length < maxImages && (
                <label className="image-upload-dropzone">
                  <RiImageAddLine className="upload-icon" />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>{images.length}/{maxImages}</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

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

      {/* Search & Filter Bar */}
      {userCanRead && (
        <>
          <div className="glass-card" style={{ marginBottom: '12px', padding: '16px', display: 'flex' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '0 12px' }}>
              <RiSearchLine style={{ color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="매물 검색..." 
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', outline: 'none' }}
              />
            </div>
          </div>
          
          <div className="category-tabs glass-card" style={{ marginBottom: '20px', display: 'flex', overflowX: 'auto', gap: '8px', padding: '8px 16px', whiteSpace: 'nowrap' }}>
            <button className={`btn ${filterCategory === 'favorites' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('favorites')}>관심상품</button>
            <button className={`btn ${filterCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('all')}>전체</button>
            <button className={`btn ${filterCategory === 'furniture' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('furniture')}>가구</button>
            <button className={`btn ${filterCategory === 'etc' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('etc')}>기타</button>
            <button className={`btn ${filterCategory === 'books' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('books')}>도서</button>
            <button className={`btn ${filterCategory === 'electronics' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('electronics')}>디지털·가전</button>
            <button className={`btn ${filterCategory === 'leisure' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('leisure')}>레저</button>
            <button className={`btn ${filterCategory === 'life' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('life')}>생활용품</button>
            <button className={`btn ${filterCategory === 'kids' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('kids')}>유아</button>
            <button className={`btn ${filterCategory === 'vehicles' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }} onClick={() => setFilterCategory('vehicles')}>차량</button>
          </div>
        </>
      )}

      {/* Listings List */}
      {!userCanRead ? (
        <div className="glass-card flex-center" style={{ padding: '60px 20px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <RiLock2Line style={{ fontSize: '4rem', color: '#94a3b8' }} />
          <h2 style={{ margin: 0, color: '#334155', textAlign: 'center' }}>중고장터 접근 제한</h2>
          <p style={{ color: '#64748b', textAlign: 'center', lineHeight: '1.6' }}>
            {!isValidUser && (
              <>
                <strong style={{ color: '#ef4444' }}>회원가입 및 로그인이 필요합니다.</strong><br/><br/>
              </>
            )}
            중고장터 매물을 열람하려면 다음 조건이 필요합니다.<br/>
            <strong>최소 레벨: Lv.{rules.readLevel}</strong>
            {rules.reqPhoneRead && <span> / <strong>전화번호 인증</strong></span>}
            {rules.reqKakaoRead && <span> / <strong>카카오톡 인증</strong></span>}
          </p>
        </div>
      ) : (
        <div className="listings-grid">
          {filteredMarketplace.map((item) => {
            const snsInfo = parseSnsEntry(item.sns);
            const isOwner = userProfile?.uid === item.sellerUid || userProfile?.isAdmin;
            const isFavorited = item.favoritesUsers?.includes(userProfile?.uid);
            const isSold = item.status === 'sold';
            const isExpanded = expandedListingId === item.id;
            
            return (
              <div key={item.id} className="glass-card listing-card fade-in" style={{ opacity: isSold ? 0.7 : 1, cursor: 'pointer', padding: 0 }} onClick={() => setExpandedListingId(isExpanded ? null : item.id)}>
                <div className="listing-top" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                  <h3 className="listing-title" style={{ margin: 0, fontSize: '1.1rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span className="listing-price" style={{ fontWeight: 'bold', color: '#10b981' }}>{item.price}</span>
                    <span className="listing-status" style={{ background: isSold ? '#64748b' : (item.status === 'reserved' ? '#f59e0b' : '#3b82f6'), color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {item.status === 'sold' ? '거래완료' : (item.status === 'reserved' ? '예약중' : '판매중')}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: 'relative' }}>
                      <ZoomableImage
                        src={item.images && item.images.length > 0 ? item.images[0] : '/default_cafe.png'}
                        images={item.images || []}
                        alt={item.title}
                        className="listing-img"
                        style={{ filter: isSold ? 'grayscale(100%) brightness(50%)' : 'none', borderRadius: 0, height: '200px', objectFit: 'cover' }}
                      />
                      {isSold && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          거래 완료
                        </div>
                      )}
                    </div>
                    <div className="listing-body" style={{ padding: '16px' }}>
                      <p className="listing-desc" style={{ marginTop: 0 }}>{item.description}</p>
                      
                      <div className="seller-info" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        <div className="seller-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>판매자: {item.sellerName}</span>
                          <LevelBadge level={item.sellerLevel} />
                        </div>
                        <div className="contact-row" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                          <span>TEL: {item.phone}</span>
                          {snsInfo && <span style={{ marginLeft: '12px' }}>{snsInfo.name}: {snsInfo.handle}</span>}
                        </div>
                      </div>

                      <div className="listing-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            onClick={(e) => { e.stopPropagation(); toggleMarketplaceFavorite(item.id, userProfile?.uid); }}
                            style={{ padding: '6px', color: isFavorited ? '#ef4444' : '#64748b' }}
                          >
                            {isFavorited ? <RiHeart3Fill size={20} /> : <RiHeart3Line size={20} />}
                            <span style={{ marginLeft: '4px' }}>{item.favoritesCount || 0}</span>
                          </button>
                        </div>

                        {isOwner ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <select 
                              className="form-select" 
                              value={item.status || 'available'} 
                              onChange={(e) => { e.stopPropagation(); updateMarketplaceStatus(item.id, e.target.value); }}
                              style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                            >
                              <option value="available">판매중</option>
                              <option value="reserved">예약중</option>
                              <option value="sold">거래완료</option>
                            </select>
                            <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleBump(item); }} style={{ padding: '4px 8px', fontSize: '0.8rem' }} title="끌어올리기 (1일 1회)">
                              <RiArrowUpCircleLine />
                            </button>
                            <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); openEditForm(item); }} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                              <RiEditLine />
                            </button>
                            <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444' }}>
                              <RiDeleteBinLine />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-secondary report-btn" onClick={(e) => { 
                            e.stopPropagation(); 
                            if (window.confirm('이 게시물을 신고하시겠습니까?')) {
                              addSubmission({
                                type: 'report',
                                field: '게시물 신고',
                                oldValue: item.title,
                                newValue: '신고 접수',
                                uid: userProfile?.uid || 'guest',
                                userName: userProfile?.displayName || '방문자',
                                placeId: item.id,
                                placeName: '중고거래 게시물'
                              });
                              alert('신고가 접수되었습니다.'); 
                            }
                          }}>
                            <RiFlag2Line /> 신고
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showPhoneAuthModal && (
        <PhoneAuthModal onClose={() => setShowPhoneAuthModal(false)} />
      )}
    </div>
  );
}
