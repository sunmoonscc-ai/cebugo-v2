import React, { useState, useEffect } from 'react';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
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
  RiCloseCircleLine,
  RiChat1Line,
  RiMapPinLine,
  RiGiftLine,
  RiNotification3Line
} from 'react-icons/ri';
import ZoomableImage from '../components/common/ZoomableImage';
import { getRelativeTimeString } from '../utils/dateHelper';
import { 
  getOrCreateChatRoom, 
  subscribeUserChatRooms 
} from '../services/chatService';
import MarketChatModal from '../components/marketplace/MarketChatModal';
import MarketChatListModal from '../components/marketplace/MarketChatListModal';
import KeywordWatchModal from '../components/marketplace/KeywordWatchModal';
import './MarketplacePage.css';

// 5 Regions
export const MARKET_REGIONS = [
  { id: 'all', label: '전체 지역' },
  { id: 'Cebu City', label: 'Cebu City' },
  { id: 'Mandaue City', label: 'Mandaue City' },
  { id: 'Lapu-Lapu City', label: 'Lapu-Lapu City' },
  { id: 'Cordova City', label: 'Cordova City' },
  { id: 'etc', label: 'etc (기타)' }
];

// Product conditions
export const ITEM_CONDITIONS = [
  { id: 'new', label: '새상품 (미개봉)' },
  { id: 'like_new', label: '거의 새것 (사용감 없음)' },
  { id: 'used_good', label: '사용감 적음 (양호)' },
  { id: 'used_fair', label: '사용감 많음' }
];

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
  const [selectedListing, setSelectedListing] = useState(null);
  const [sellerMannerTemp, setSellerMannerTemp] = useState(36.5);

  // Chat States
  const [chatRooms, setChatRooms] = useState([]);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [showChatListModal, setShowChatListModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);

  // Subscribe to user chat rooms for unread counts
  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsubscribe = subscribeUserChatRooms(userProfile.uid, (rooms) => {
      setChatRooms(rooms);
    });
    return () => unsubscribe();
  }, [userProfile?.uid]);

  const totalUnreadCount = chatRooms.reduce((acc, room) => {
    return acc + (room.unreadCount?.[userProfile?.uid] || 0);
  }, 0);

  // Handle browser back button for modal
  useEffect(() => {
    const handlePopState = () => {
      if (activeChatRoom) {
        setActiveChatRoom(null);
        return;
      }
      if (showChatListModal) {
        setShowChatListModal(false);
        return;
      }
      if (showKeywordModal) {
        setShowKeywordModal(false);
        return;
      }
      if (selectedListing) {
        setSelectedListing(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedListing, activeChatRoom, showChatListModal, showKeywordModal]);

  const handleOpenListing = async (item) => {
    setSelectedListing(item);
    window.history.pushState({ modal: 'marketplace_detail' }, '');

    // Fetch seller's real manner temperature
    if (item.sellerUid) {
      try {
        const snap = await getDoc(doc(db, 'cebugo_users', item.sellerUid));
        if (snap.exists() && snap.data()?.mannerTemp !== undefined) {
          setSellerMannerTemp(snap.data().mannerTemp);
        } else {
          setSellerMannerTemp(36.5);
        }
      } catch (e) {
        setSellerMannerTemp(36.5);
      }
    }
  };

  const handleCloseListing = () => {
    setSelectedListing(null);
    if (window.history.state?.modal === 'marketplace_detail') {
      window.history.back();
    }
  };

  // Search & Filter
  const [searchKeyword, setSearchKeywordState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_market_search') || '';
    } catch (e) {
      return '';
    }
  });

  const setSearchKeyword = (keyword) => {
    setSearchKeywordState(keyword);
    try {
      sessionStorage.setItem('cebugo_market_search', keyword);
    } catch (e) {}
  };

  const [filterRegion, setFilterRegionState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_market_region') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  const setFilterRegion = (region) => {
    setFilterRegionState(region);
    try {
      sessionStorage.setItem('cebugo_market_region', region);
    } catch (e) {}
  };

  const [filterCategory, setFilterCategoryState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_market_category') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  const setFilterCategory = (category) => {
    setFilterCategoryState(category);
    try {
      sessionStorage.setItem('cebugo_market_category', category);
    } catch (e) {}
  };

  // New Listing Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isGiveaway, setIsGiveaway] = useState(false);
  const [region, setRegion] = useState('Cebu City');
  const [condition, setCondition] = useState('used_good');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('furniture');
  const [images, setImages] = useState([]);
  const [agreeContact, setAgreeContact] = useState(true);
  const [contactList, setContactList] = useState([{ type: 'phone', value: '' }]);

  const handleAddContact = () => {
    setContactList([...contactList, { type: 'phone', value: '' }]);
  };

  const handleContactChange = (index, field, value) => {
    const newList = [...contactList];
    newList[index][field] = value;
    setContactList(newList);
  };

  const handleRemoveContact = (index) => {
    const newList = contactList.filter((_, i) => i !== index);
    setContactList(newList.length > 0 ? newList : [{ type: 'phone', value: '' }]);
  };

  const [inputKakaoId, setInputKakaoId] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputPhoneKr, setInputPhoneKr] = useState('');

  const [rules, setRules] = useState({
    readLevel: 1, reqPhoneRead: false, reqKakaoRead: false,
    writeLevel: 4, reqPhoneWrite: true, reqKakaoWrite: true,
    contactExposureLevel: 1
  });
  
  const [siteRules, setSiteRules] = useState({ locationPolicy: 'manual' });

  useEffect(() => {
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

  const userCanViewContact = isValidUser && (
    userProfile.isAdmin || userProfile.level >= (rules.contactExposureLevel || 1)
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
    setPrice(item.price ? item.price.replace(/[^0-9.]/g, '') : '');
    setIsNegotiable(!!item.isNegotiable);
    setIsGiveaway(item.isGiveaway || item.category === 'share');
    setRegion(item.region || 'Cebu City');
    setCondition(item.condition || 'used_good');
    setDescription(item.description);
    setCategory(item.category);
    setImages(item.images || []);
    
    if (item.contactList && item.contactList.length > 0) {
      setContactList(item.contactList);
    } else {
      const snsInfo = parseSnsEntry(item.sns);
      const defaultContacts = [];
      if (item.phone) defaultContacts.push({ type: 'phone', value: item.phone });
      if (snsInfo) defaultContacts.push({ type: 'kakao', value: snsInfo.handle });
      setContactList(defaultContacts.length > 0 ? defaultContacts : [{ type: 'phone', value: '' }]);
    }
    
    setShowWriteForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingListingId(null);
    setTitle('');
    setPrice('');
    setIsNegotiable(false);
    setIsGiveaway(false);
    setRegion('Cebu City');
    setCondition('used_good');
    setDescription('');
    setImages([]);
    setContactList([{ type: 'phone', value: '' }]);
    setShowWriteForm(false);
  };

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validContacts = contactList.filter(c => c.value.trim());
    
    let priceToSave = '';
    if (isGiveaway || category === 'share') {
      priceToSave = '0 PHP';
    } else {
      const cleanPrice = price.replace(/[^0-9.]/g, '');
      priceToSave = cleanPrice ? `${cleanPrice} PHP` : '';
    }

    const listingPayload = {
      title,
      price: priceToSave,
      isNegotiable: isGiveaway ? false : isNegotiable,
      isGiveaway: isGiveaway || category === 'share',
      region: region || 'Cebu City',
      condition: condition || 'used_good',
      description,
      category: isGiveaway ? 'share' : category,
      images,
      contactList: validContacts
    };

    if (editingListingId) {
      updateMarketplaceListing(editingListingId, listingPayload);
    } else {
      addMarketplaceListing({
        ...listingPayload,
        sellerUid: userProfile.uid,
        sellerName: userProfile.displayName,
        sellerEmail: userProfile.email || '',
        sellerLevel: userProfile.level,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'],
        contactList: validContacts.length > 0 ? validContacts : [
          { type: 'phone', value: userProfile.phoneNumber || '09171234567' },
          { type: 'kakao', value: userProfile.kakaoId || 'cebuseller' }
        ],
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

  // Start chat with seller
  const handleStartChat = async (item) => {
    if (!isValidUser) {
      alert('채팅을 이용하시려면 로그인이 필요합니다.');
      return;
    }
    if (userProfile.uid === item.sellerUid) {
      alert('자신이 등록한 물품입니다.');
      return;
    }

    try {
      const roomId = await getOrCreateChatRoom({
        listing: item,
        currentUser: userProfile
      });

      const existing = chatRooms.find(r => r.id === roomId);
      const targetRoom = existing || {
        id: roomId,
        listingId: item.id,
        listingTitle: item.title,
        listingPrice: item.price,
        listingImage: item.images?.[0] || '',
        sellerUid: item.sellerUid,
        sellerName: item.sellerName,
        buyerUid: userProfile.uid,
        buyerName: userProfile.displayName
      };

      setActiveChatRoom(targetRoom);
      handleCloseListing();
    } catch (err) {
      console.error('Chat error:', err);
      alert(err.message || '채팅방을 여는 중 오류가 발생했습니다.');
    }
  };

  // Filter listings
  const filteredMarketplace = marketplace.filter(item => {
    // 1. Favorites tab
    if (filterCategory === 'favorites') {
      const isFavorited = item.favoritesUsers?.includes(userProfile?.uid);
      if (!isFavorited) return false;
    } else {
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      if (!matchCategory) return false;
    }

    // 2. Region filter
    if (filterRegion !== 'all') {
      const itemRegion = item.region || 'Cebu City';
      if (itemRegion !== filterRegion) return false;
    }

    // 3. Search keyword
    const matchSearch = item.title.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchSearch;
  });

  const handleReqKakaoVerif = async (e) => {
    e.preventDefault();
    if (!inputKakaoId.trim()) return;
    await updateUserProfile({ kakaoId: inputKakaoId });
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
    <div className="page-content">
      {/* Top Header Bar */}
      <div className="marketplace-header glass-card">
        <div className="header-info">
          <h2>
            <RiShoppingBagLine /> 세부 중고거래
            <span className="header-info-sub"> - 당근처럼 쉽고 빠른 세부 한인 이웃 직거래</span>
          </h2>
          {isValidUser && (
            <div className="header-quick-btns">
              <button 
                className="keyword-watch-trigger-btn"
                onClick={() => setShowKeywordModal(true)}
                title="키워드 알림 설정"
              >
                <RiNotification3Line size={18} />
                <span>키워드</span>
              </button>
              <button 
                className="chat-list-trigger-btn"
                onClick={() => setShowChatListModal(true)}
                title="내가 참여 중인 채팅방 목록"
              >
                <RiChat1Line size={20} />
                <span>내 채팅목록</span>
                {totalUnreadCount > 0 && (
                  <span className="chat-badge-count">{totalUnreadCount}</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Verification status box for authenticated users */}
        {isValidUser && (
          <div className="user-eligibility-box">
            <div className="eligibility-status">
              <span>내 인증:</span>
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
                    style={{ width: '110px', padding: '4px 8px', fontSize: '0.8rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-secondary phone-auth-btn">
                    현지폰 인증
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
                    style={{ width: '110px', padding: '4px 8px', fontSize: '0.8rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-secondary phone-auth-btn">
                    한국폰 인증
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
                    style={{ width: '110px', padding: '4px 8px', fontSize: '0.8rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-secondary phone-auth-btn">
                    카톡 인증
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Lock notice if cannot write */}
        {isValidUser && !userCanWrite && (
          <div className="lock-notice" onClick={checkWriteAccess} style={{ cursor: 'pointer' }}>
            <RiLock2Line />
            <span>등록 조건 미충족 (클릭하여 조건 확인 - Lv.{rules.writeLevel} 이상 필요)</span>
          </div>
        )}
      </div>

      {/* Write Listing Form (Collapse / Expand) */}
      {showWriteForm && (
        <div className="glass-card write-form-card">
          <div className="form-card-header">
            <h3>{editingListingId ? '중고 매물 수정' : '신규 중고 매물 등록'}</h3>
            <button className="btn-text-close" onClick={cancelEdit}>취소</button>
          </div>

          <form onSubmit={handleCreateListing} className="modal-form">
            {/* Title */}
            <label className="form-label">매물 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 스노클링 장비 세트, 아이키아 서랍장"
              className="form-input"
              required
            />

            {/* Region selection */}
            <label className="form-label">거래 지역 (세부 5개 지역)</label>
            <div className="region-selector-grid">
              {MARKET_REGIONS.filter(r => r.id !== 'all').map((reg) => (
                <button
                  type="button"
                  key={reg.id}
                  className={`region-chip ${region === reg.id ? 'active' : ''}`}
                  onClick={() => setRegion(reg.id)}
                >
                  <RiMapPinLine size={14} />
                  {reg.label}
                </button>
              ))}
            </div>

            {/* Category & Condition */}
            <div className="form-row-2">
              <div>
                <label className="form-label">카테고리</label>
                <select 
                  value={category} 
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value === 'share') setIsGiveaway(true);
                  }} 
                  className="form-select"
                >
                  <option value="furniture">가구</option>
                  <option value="electronics">디지털·가전</option>
                  <option value="life">생활용품</option>
                  <option value="leisure">레저·스포츠</option>
                  <option value="kids">유아·아동</option>
                  <option value="books">도서</option>
                  <option value="vehicles">차량·오토바이</option>
                  <option value="share">나눔 (무료)</option>
                  <option value="etc">기타</option>
                </select>
              </div>

              <div>
                <label className="form-label">상품 상태 (컨디션)</label>
                <select 
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value)} 
                  className="form-select"
                >
                  {ITEM_CONDITIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price & Giveaway Toggle */}
            <div className="price-input-section">
              <label className="form-label">판매 가격 (PHP)</label>
              <div className="price-input-row">
                <input
                  type="text"
                  value={isGiveaway ? '0' : price}
                  disabled={isGiveaway}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={isGiveaway ? '무료 나눔' : '예: 1500 (숫자만)'}
                  className="form-input"
                />
                <button
                  type="button"
                  className={`giveaway-toggle-btn ${isGiveaway ? 'active' : ''}`}
                  onClick={() => {
                    const next = !isGiveaway;
                    setIsGiveaway(next);
                    if (next) {
                      setCategory('share');
                    }
                  }}
                >
                  <RiGiftLine size={16} />
                  <span>나눔🧡</span>
                </button>
              </div>

              {!isGiveaway && (
                <label className="negotiable-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                  />
                  <span>가격 제안(네고) 받기</span>
                </label>
              )}
            </div>

            {/* Images */}
            <label className="form-label">이미지 첨부 (최대 {maxImages}장)</label>
            <div className="image-upload-wrapper">
              {images.map((img, idx) => (
                <div key={idx} className="image-preview-box">
                  <img src={img} alt="preview" />
                  <button type="button" onClick={() => removeImage(idx)} className="btn-remove-img">
                    <RiCloseCircleLine size={18} />
                  </button>
                  {idx === 0 && <span className="badge-thumb">대표</span>}
                </div>
              ))}
              {images.length < maxImages && (
                <label className="image-upload-dropzone">
                  <RiImageAddLine className="upload-icon" />
                  <span className="upload-counter">{images.length}/{maxImages}</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Description */}
            <label className="form-label">상세 설명</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="제품의 구매 시기, 상태, 직거래 희망 장소(예: 막탄 제이파크 정문, 아얄라몰 등)를 자세히 적어주세요."
              className="form-textarea"
              required
            />

            {/* Contacts & SNS */}
            <label className="form-label">연락처 및 외부 메신저 (선택)</label>
            {contactList.map((contact, idx) => (
              <div key={idx} className="contact-input-row">
                <select 
                  value={contact.type} 
                  onChange={(e) => handleContactChange(idx, 'type', e.target.value)}
                  className="form-select contact-type-select"
                >
                  <option value="phone">전화번호</option>
                  <option value="kakao">카카오톡</option>
                  <option value="line">라인</option>
                  <option value="facebook">페이스북</option>
                  <option value="instagram">인스타</option>
                  <option value="other">기타</option>
                </select>
                <input
                  type="text"
                  value={contact.value}
                  onChange={(e) => handleContactChange(idx, 'value', e.target.value)}
                  placeholder="연락처/ID 입력"
                  className="form-input"
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveContact(idx)} 
                  className="btn btn-secondary btn-del-contact"
                >
                  삭제
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddContact} 
              className="btn btn-secondary btn-add-contact"
            >
              <RiAddLine /> 연락처 추가
            </button>

            <div className="checkbox-wrap">
              <input
                type="checkbox"
                id="agree"
                checked={agreeContact}
                onChange={(e) => setAgreeContact(e.target.checked)}
                required
              />
              <label htmlFor="agree">프로필에 등록된 기본 연락처 공개에 동의합니다.</label>
            </div>

            <button type="submit" className="btn btn-primary form-submit-btn">
              {editingListingId ? '수정 완료' : '매물 등록 완료'}
            </button>
          </form>
        </div>
      )}

      {/* Region Selector Bar */}
      <div className="market-region-bar glass-card">
        <div className="region-bar-title">
          <RiMapPinLine size={18} color="#ea580c" />
          <span>지역 선택</span>
        </div>
        <div className="region-tabs-scroll">
          {MARKET_REGIONS.map((reg) => (
            <button
              key={reg.id}
              className={`region-pill-btn ${filterRegion === reg.id ? 'active' : ''}`}
              onClick={() => setFilterRegion(reg.id)}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="glass-card search-card">
        <div className="market-search-box">
          <RiSearchLine className="search-icon" />
          <input 
            type="text" 
            placeholder="어떤 중고물품을 찾고 계신가요?" 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="category-tabs glass-card">
        <button className={`category-tab-btn ${filterCategory === 'all' ? 'active' : ''}`} onClick={() => setFilterCategory('all')}>전체</button>
        <button className={`category-tab-btn ${filterCategory === 'share' ? 'active share-tab' : ''}`} onClick={() => setFilterCategory('share')}>🧡 나눔</button>
        <button className={`category-tab-btn ${filterCategory === 'favorites' ? 'active' : ''}`} onClick={() => setFilterCategory('favorites')}>관심상품</button>
        <button className={`category-tab-btn ${filterCategory === 'furniture' ? 'active' : ''}`} onClick={() => setFilterCategory('furniture')}>가구</button>
        <button className={`category-tab-btn ${filterCategory === 'electronics' ? 'active' : ''}`} onClick={() => setFilterCategory('electronics')}>디지털·가전</button>
        <button className={`category-tab-btn ${filterCategory === 'life' ? 'active' : ''}`} onClick={() => setFilterCategory('life')}>생활용품</button>
        <button className={`category-tab-btn ${filterCategory === 'leisure' ? 'active' : ''}`} onClick={() => setFilterCategory('leisure')}>레저</button>
        <button className={`category-tab-btn ${filterCategory === 'kids' ? 'active' : ''}`} onClick={() => setFilterCategory('kids')}>유아</button>
        <button className={`category-tab-btn ${filterCategory === 'vehicles' ? 'active' : ''}`} onClick={() => setFilterCategory('vehicles')}>차량</button>
        <button className={`category-tab-btn ${filterCategory === 'books' ? 'active' : ''}`} onClick={() => setFilterCategory('books')}>도서</button>
        <button className={`category-tab-btn ${filterCategory === 'etc' ? 'active' : ''}`} onClick={() => setFilterCategory('etc')}>기타</button>
      </div>

      {/* Listings Count Bar */}
      <div className="listings-count-bar">
        <span>총 <strong>{filteredMarketplace.length}</strong>개의 매물</span>
        {filterRegion !== 'all' && <span className="active-region-tag">📍 {filterRegion}</span>}
      </div>

      {/* Listings List */}
      <div className="listings-grid">
        {filteredMarketplace.length === 0 ? (
          <div className="no-listings-card glass-card">
            <RiShoppingBagLine size={48} color="#cbd5e1" />
            <p>등록된 중고 매물이 없습니다.</p>
            <span>가장 먼저 이웃에게 필요한 물품을 올려보세요!</span>
          </div>
        ) : (
          filteredMarketplace.map((item) => {
            const isSold = item.status === 'sold';
            const timeAgo = item.createdAt ? getRelativeTimeString(item.createdAt) : (item.updatedAt ? getRelativeTimeString(item.updatedAt) : '');
            
            let displayPrice = '';
            const isGiveawayItem = item.isGiveaway || item.category === 'share';
            if (isGiveawayItem) {
              displayPrice = '나눔🧡';
            } else {
              const numPrice = (item.price || '').replace(/[^0-9.]/g, '');
              displayPrice = numPrice ? `${Number(numPrice).toLocaleString()} PHP` : '가격협의';
            }

            const itemRegion = item.region || 'Cebu City';
            const conditionLabel = ITEM_CONDITIONS.find(c => c.id === item.condition)?.label;
            
            return (
              <div key={item.id} className="listing-card" style={{ opacity: isSold ? 0.75 : 1 }} onClick={() => handleOpenListing(item)}>
                {item.images && item.images.length > 0 ? (
                  <div className="listing-img-thumb-wrap">
                    <img src={item.images[0]} alt="thumbnail" className="listing-img-thumb" style={{ filter: isSold ? 'grayscale(80%)' : 'none' }} />
                    {isSold && <span className="thumb-status-overlay">거래완료</span>}
                    {item.images.length > 1 && <span className="multi-img-count">+{item.images.length - 1}</span>}
                  </div>
                ) : (
                  <div className="listing-img-thumb no-image">
                    <RiImageAddLine size={32} />
                  </div>
                )}
                
                <div className="listing-card-body">
                  <div className="listing-main-content">
                    <div className="listing-title-row">
                      <h3 className="listing-title">{item.title}</h3>
                    </div>

                    <div className="listing-meta-row">
                      <span className="listing-region-badge">{itemRegion}</span>
                      <span className="listing-dot">·</span>
                      <span className="listing-category-text">
                        {item.category === 'furniture' ? '가구' : 
                         item.category === 'etc' ? '기타' :
                         item.category === 'books' ? '도서' :
                         item.category === 'electronics' ? '디지털·가전' :
                         item.category === 'leisure' ? '레저' :
                         item.category === 'life' ? '생활용품' :
                         item.category === 'kids' ? '유아' :
                         item.category === 'vehicles' ? '차량' :
                         item.category === 'share' ? '나눔' : item.category}
                      </span>
                      {timeAgo && (
                        <>
                          <span className="listing-dot">·</span>
                          <span className="listing-time">{timeAgo}</span>
                        </>
                      )}
                    </div>

                    {conditionLabel && (
                      <div className="listing-condition-tag">
                        {conditionLabel}
                      </div>
                    )}
                  </div>
                  
                  <div className="listing-price-row">
                    <div className="price-wrap">
                      {item.status && item.status !== 'available' && (
                        <span className={`listing-status ${item.status}`}>
                          {item.status === 'sold' ? '거래완료' : '예약중'}
                        </span>
                      )}
                      <span className={`listing-price ${isGiveawayItem ? 'giveaway' : ''}`}>
                        {displayPrice}
                      </span>
                      {item.isNegotiable && !isGiveawayItem && (
                        <span className="negotiable-pill">제안가능</span>
                      )}
                    </div>

                    <div className="listing-icons-stats">
                      {item.favoritesCount > 0 && (
                        <span className="stat-item">
                          <RiHeart3Line size={15} /> {item.favoritesCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) for Creating Listing */}
      {isValidUser && userCanWrite && (
        <button 
          className="floating-write-fab"
          onClick={() => {
            if (showWriteForm) {
              cancelEdit();
            } else {
              setShowWriteForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          title="중고물품 등록"
        >
          <RiAddLine size={24} />
          <span>글쓰기</span>
        </button>
      )}

      {/* Detail Modal */}
      {selectedListing && (() => {
        const item = selectedListing;
        const snsInfo = parseSnsEntry(item.sns);
        // Distinguish whether viewer is the actual seller who posted this item
        const isRealSeller = userProfile?.uid === item.sellerUid;
        const isAdminUser = !!userProfile?.isAdmin;
        const isFavorited = item.favoritesUsers?.includes(userProfile?.uid);
        const isSold = item.status === 'sold';
        const maskedName = item.sellerEmail ? (item.sellerEmail.substring(0, 3) + '***') : (item.sellerName ? (item.sellerName.substring(0, 3) + '***') : '이웃***');
        const timeAgo = item.createdAt ? getRelativeTimeString(item.createdAt) : '';

        const isGiveawayItem = item.isGiveaway || item.category === 'share';
        let displayPrice = '';
        if (isGiveawayItem) {
          displayPrice = '나눔🧡';
        } else {
          const numPrice = (item.price || '').replace(/[^0-9.]/g, '');
          displayPrice = numPrice ? `${Number(numPrice).toLocaleString()} PHP` : '가격협의';
        }

        const conditionLabel = ITEM_CONDITIONS.find(c => c.id === item.condition)?.label;
        const itemRegion = item.region || 'Cebu City';

        return (
          <div className="detail-modal-overlay" onClick={handleCloseListing}>
            <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h3>매물 상세</h3>
                <button className="close-modal-btn" onClick={handleCloseListing}>
                  <RiCloseCircleLine size={24} />
                </button>
              </div>
              
              <div className="detail-modal-body">
                {!userCanRead ? (
                  <div className="restricted-notice">
                    <div className="restricted-icon-box">
                      <RiLock2Line size={36} />
                    </div>
                    <h3 className="restricted-title">상세 내용 접근 제한</h3>
                    
                    {!isValidUser ? (
                      <div className="restricted-badge-login">
                        로그인이 필요한 서비스입니다
                      </div>
                    ) : null}

                    <div className="restricted-card">
                      <p className="restricted-desc">
                        중고거래 매물 상세 내용은 <strong>회원 전용</strong> 공간입니다.<br />
                        {!isValidUser ? '로그인 후 안전하고 편리하게 이웃과 거래해보세요!' : '아래 조건을 만족하시면 상세 내용을 열람하실 수 있습니다.'}
                      </p>
                      
                      <div className="restricted-requirements">
                        <div className="req-item">
                          <span className="req-label">열람 최소 등급</span>
                          <span className="req-val">Lv.{rules.readLevel} 이상</span>
                        </div>
                        {rules.reqPhoneRead && (
                          <div className="req-item">
                            <span className="req-label">전화번호 인증</span>
                            <span className="req-val req-highlight">필수</span>
                          </div>
                        )}
                        {rules.reqKakaoRead && (
                          <div className="req-item">
                            <span className="req-label">카카오톡 인증</span>
                            <span className="req-val req-highlight">필수</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isValidUser && (
                      <button 
                        type="button" 
                        className="btn-restricted-login" 
                        onClick={() => window.location.href = '/profile'}
                      >
                        로그인 / 회원가입 하러가기
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="detail-image-wrap">
                      <ZoomableImage
                        src={item.images && item.images.length > 0 ? item.images[0] : '/default_cafe.png'}
                        images={item.images || []}
                        alt={item.title}
                        style={{ filter: isSold ? 'grayscale(80%)' : 'none' }}
                      />
                    </div>
                    
                    <div className="detail-info">
                      {/* Seller Profile row (Karrot style) */}
                      <div className="detail-seller-row">
                        <div className="seller-avatar-placeholder">
                          <RiShieldUserLine size={24} color="#ea580c" />
                        </div>
                        <div className="seller-meta-details">
                          <div className="seller-name-line">
                            <span className="seller-name">{maskedName}</span>
                            <LevelBadge level={item.sellerLevel || 1} />
                          </div>
                          <span className="seller-region-text">📍 {itemRegion} 이웃</span>
                        </div>
                        
                        {/* Karrot style manner temperature badge with real data */}
                        <div className="manner-temp-box">
                          <span className="temp-val">{sellerMannerTemp.toFixed(1)}℃</span>
                          <span className="temp-label">매너온도</span>
                        </div>
                      </div>

                      <h2 className="detail-title">{item.title}</h2>
                      
                      <div className="detail-meta">
                        <span className="meta-category">
                          {item.category === 'furniture' ? '가구' : 
                           item.category === 'etc' ? '기타' :
                           item.category === 'books' ? '도서' :
                           item.category === 'electronics' ? '디지털·가전' :
                           item.category === 'leisure' ? '레저' :
                           item.category === 'life' ? '생활용품' :
                           item.category === 'kids' ? '유아' :
                           item.category === 'vehicles' ? '차량' :
                           item.category === 'share' ? '나눔' : item.category}
                        </span>
                        {conditionLabel && <span className="meta-condition">· 상태: {conditionLabel}</span>}
                        {timeAgo && <span className="meta-time">· {timeAgo}</span>}
                      </div>

                      <div className="detail-desc">{item.description}</div>

                      {/* Trade location & Contact Box */}
                      <div className="detail-contact-box">
                        <h4>📍 직거래 희망 지역 & 판매자 연락처</h4>
                        <div className="trade-region-banner">
                          <strong>거래 지역:</strong> {itemRegion}
                        </div>
                        <div className="contact-row">
                          {userCanViewContact || isRealSeller || isAdminUser ? (
                            item.contactList && item.contactList.length > 0 ? (
                              item.contactList.map((contact, idx) => (
                                <span key={idx} className="contact-chip">
                                  <strong>{contact.type === 'phone' ? 'TEL' : (contact.type === 'kakao' ? '카톡' : contact.type.toUpperCase())}:</strong> {contact.value}
                                </span>
                              ))
                            ) : (
                              <>
                                <span className="contact-chip"><strong>TEL:</strong> {item.phone}</span>
                                {snsInfo && <span className="contact-chip"><strong>{snsInfo.name}:</strong> {snsInfo.handle}</span>}
                              </>
                            )
                          ) : (
                            <span style={{ color: '#ef4444' }}>연락처를 보려면 레벨 {rules.contactExposureLevel || 1} 이상이 필요합니다.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {userCanRead && (
                <div className="detail-footer">
                  <div className="footer-left-wrap">
                    <button 
                      className="btn-detail-fav" 
                      onClick={(e) => { e.stopPropagation(); toggleMarketplaceFavorite(item.id, userProfile?.uid); }}
                    >
                      {isFavorited ? <RiHeart3Fill size={26} color="#ef4444" /> : <RiHeart3Line size={26} color="#94a3b8" />}
                      <span className="fav-count">{item.favoritesCount || 0}</span>
                    </button>
                    
                    <div className="footer-price-col">
                      <div className="footer-price-main">
                        <span className={`detail-footer-price ${isGiveawayItem ? 'giveaway' : ''}`}>
                          {displayPrice}
                        </span>
                        {item.isNegotiable && !isGiveawayItem && (
                          <span className="negotiable-pill">제안가능</span>
                        )}
                      </div>
                      {item.status && item.status !== 'available' && (
                        <span className={`status-badge-footer ${item.status}`}>
                          {item.status === 'sold' ? '거래완료' : '예약중'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="detail-actions">
                    {/* If user is the seller who posted this item */}
                    {isRealSeller ? (
                      <div className="owner-action-group">
                        <select 
                          className="form-select status-select-footer" 
                          value={item.status || 'available'} 
                          onChange={(e) => { 
                            e.stopPropagation(); 
                            updateMarketplaceStatus(item.id, e.target.value); 
                            setSelectedListing({...item, status: e.target.value}); 
                          }}
                        >
                          <option value="available">판매중</option>
                          <option value="reserved">예약중</option>
                          <option value="sold">거래완료</option>
                        </select>
                        <button className="btn btn-secondary icon-btn-footer" onClick={(e) => { e.stopPropagation(); handleBump(item); }} title="끌어올리기">
                          <RiArrowUpCircleLine size={18} />
                        </button>
                        <button className="btn btn-secondary icon-btn-footer" onClick={(e) => { e.stopPropagation(); handleCloseListing(); openEditForm(item); }} title="수정">
                          <RiEditLine size={18} />
                        </button>
                        <button className="btn btn-secondary icon-btn-footer btn-del" onClick={(e) => { e.stopPropagation(); handleCloseListing(); handleDelete(item.id); }} title="삭제">
                          <RiDeleteBinLine size={18} />
                        </button>
                      </div>
                    ) : (
                      /* Buyer or Admin viewing other seller's item */
                      <div className="buyer-action-group">
                        <button 
                          className="btn btn-primary start-chat-btn" 
                          onClick={() => handleStartChat(item)}
                          disabled={isSold}
                        >
                          <RiChat1Line size={18} />
                          <span>채팅으로 거래하기</span>
                        </button>
                        {isAdminUser && (
                          <button className="btn btn-secondary icon-btn-footer btn-del" onClick={(e) => { e.stopPropagation(); handleCloseListing(); handleDelete(item.id); }} title="관리자 삭제">
                            <RiDeleteBinLine size={18} />
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary report-btn-footer" 
                          onClick={(e) => { 
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
                          }}
                          title="신고"
                        >
                          <RiFlag2Line size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 1:1 Live Chat Window */}
      {activeChatRoom && (
        <MarketChatModal
          room={activeChatRoom}
          currentUser={userProfile}
          onClose={() => setActiveChatRoom(null)}
          onBackToList={() => {
            setActiveChatRoom(null);
            setShowChatListModal(true);
          }}
        />
      )}

      {/* Chat Rooms List Modal */}
      {showChatListModal && (
        <MarketChatListModal
          rooms={chatRooms}
          currentUser={userProfile}
          onClose={() => setShowChatListModal(false)}
          onSelectRoom={(room) => {
            setShowChatListModal(false);
            setActiveChatRoom(room);
          }}
        />
      )}

      {/* Keyword Watch Modal (Item 3) */}
      {showKeywordModal && (
        <KeywordWatchModal
          currentUser={userProfile}
          onClose={() => setShowKeywordModal(false)}
        />
      )}

      {showPhoneAuthModal && (
        <PhoneAuthModal onClose={() => setShowPhoneAuthModal(false)} />
      )}
    </div>
  );
}
