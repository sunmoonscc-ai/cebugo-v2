import React, { useState, useEffect, useRef } from 'react';
import { renderTextWithLinks } from '../utils/textHelper';
import { getLocalTodayString } from '../utils/dateHelper';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/places/ImageCarousel';

import ZoomableImage from '../components/common/ZoomableImage';
import { fetchGoogleNews } from '../services/googleNewsService';
import { fetchExchangeRates } from '../services/exchangeRateService';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  RiExchangeDollarLine, 
  RiNewspaperLine, 
  RiCalendarCheckLine,
  RiNotification3Line,
  RiContactsBook2Line,
  RiInformationLine,
  RiGlobalLine,
  RiPhoneFill,
  RiShieldCrossLine,
  RiHospitalLine,
  RiFlightTakeoffLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiCheckLine,
  RiPriceTag3Line,
  RiImageAddLine,
  RiHashtag,
  RiRefreshLine,
  RiTimeLine,
  RiFileCopyLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiDragMove2Line,
  RiVolumeUpLine
} from 'react-icons/ri';
import './DailyInfoPage.css';

// Helper to format number string with 3-digit commas (e.g. 23797 -> 23,797)
function formatNumberWithCommas(valStr) {
  if (!valStr && valStr !== '0') return '';
  const parts = valStr.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function cleanNumberInput(valStr) {
  if (!valStr) return '';
  const cleaned = valStr.toString().replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

const DEFAULT_TAGS = ['중요공지', '안전공지', '입국안내', '행사/이벤트', '일반공지'];

const DEFAULT_TRAVEL_INFO = [
  {
    id: 'i1',
    title: '필리핀 세관 입국 면세 한도 및 반입 규정',
    badge: '면세/입국',
    desc: '필리핀 면세 한도는 1인당 10,000 페소(PHP)입니다. 담배 2보루, 주류 2병(총 1.5L 이하)까지 면세 반입이 허용됩니다.',
    images: []
  },
  {
    id: 'i2',
    title: '세부 현지 팁(Tip) 문화 & 매너 가이드',
    badge: '여행팁',
    desc: '식당 및 마사지샵 이용 시 50~100 페소 정도의 매너 팁이 일반적입니다. 택시는 거스름돈을 팁으로 전달하기도 합니다.',
    images: []
  },
  {
    id: 'i3',
    title: '전압 및 어댑터 사용 안내',
    badge: '생활정보',
    desc: '필리핀은 220V, 60Hz를 사용하며, 대부분 한국과 동일한 2구 플러그를 그대로 사용하실 수 있습니다.',
    images: []
  },
  {
    id: 'i4',
    title: '세부 현지 대중교통 이용 팁 (그랩/트라이시클)',
    badge: '교통정보',
    desc: '그랩(Grab) 앱을 사전에 설치하면 이동 시 바가지 요금 없이 안전하게 정찰제로 이동하실 수 있습니다.',
    images: []
  }
];

const DEFAULT_NOTICES = [
  {
    id: 'n1',
    title: '세부 여행객을 위한 2026년 하반기 CebugoHub 통합 가이드',
    date: '2026-07-24',
    badge: '중요공지',
    content: 'CebugoHub를 이용해 세부 현지 검증 업체 정보, 중고거래, 입국 정보 및 비상 연락망을 손쉽게 확인하세요.',
    isTicker: true,
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop',
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&fit=crop'
    ]
  },
  {
    id: 'n2',
    title: '7월 세부 우기철 안전한 호핑투어 및 다이빙 수칙 안내',
    date: '2026-07-21',
    badge: '안전공지',
    content: '해양경찰청(PCG) 기상 주의보 발행 시 호핑 출항이 통제될 수 있으니 미리 예약 업체 연락처를 확인하세요.',
    images: []
  },
  {
    id: 'n3',
    title: '세부 국제공항 출국 수속 및 E-Travel 작성 필수 안내',
    date: '2026-07-15',
    badge: '입국안내',
    content: '필리핀 입/출국 시 e-Travel 작성 등록이 필수입니다. 출국 전 공식 웹사이트에서 사전 등록 상태를 점검하시기 바랍니다.',
    images: []
  }
];

const DEFAULT_CONTACTS = [
  {
    id: 'c1',
    category: '공관 / 영사',
    name: '주세부 대한민국 분공관',
    phones: ['+63-32-340-9900', '+63-917-808-3904 (24시간 사건사고)'],
    hours: '월~금 08:00 - 17:00 (점심시간 12:00 - 13:00)',
    desc: '세부시티 아얄라 센트럴 블록 타워 12층',
    website: 'https://overseas.mofa.go.kr/ph-cebu-ko/index.do',
    facebook: 'https://facebook.com/mofa.cebu',
    snsList: [{ type: 'kakao', value: 'cebugongwan' }]
  },
  {
    id: 'c2',
    category: '영사콜센터',
    name: '외교부 영사콜센터 (한국)',
    phones: ['+82-2-3210-0404'],
    hours: '24시간 365일 연중무휴',
    desc: '해외 긴급 상황 및 통역 서비스 지원',
    website: 'https://www.0404.go.kr',
    facebook: '',
    snsList: []
  },
  {
    id: 'c3',
    category: '한인회',
    name: '세부 한인회 비상연락처',
    phones: ['+63-917-319-3838', '+63-32-343-4100'],
    hours: '월~토 09:00 - 18:00',
    desc: '세부 거주 한인 및 관광객 긴급 구조 지원',
    website: 'https://cebukorean.org',
    facebook: 'https://facebook.com/cebukorean',
    snsList: [{ type: 'kakao', value: 'cebukorean' }]
  },
  {
    id: 'c4',
    category: '긴급신고',
    name: '필리핀 긴급합동신고센터',
    phones: ['911 (경찰/소방/구급 통합)'],
    hours: '24시간 연중무휴',
    desc: '필리핀 전역 통합 긴급 구조 번호',
    website: '',
    facebook: '',
    snsList: []
  },
  {
    id: 'c5',
    category: '공항 / 교통',
    name: '막탄-세부 국제공항 (MCIA)',
    phones: ['+63-32-494-7000'],
    hours: '24시간 운항 및 고객 상담',
    desc: '항공편 운항 상태 및 수하물 관련 문의',
    website: 'https://mactancebuairport.com',
    facebook: 'https://facebook.com/mactancebuairport',
    snsList: []
  },
  {
    id: 'c6',
    category: '의료 / 병원',
    name: '세부 닥터스 종합병원 (Cebu Doctors Hospital)',
    phones: ['+63-32-255-5555'],
    hours: '24시간 응급센터 (외래 08:00 - 17:00)',
    desc: '세부시티 위치 메이저 종합병원',
    website: 'https://cebudoctorshospital.com',
    facebook: '',
    snsList: []
  }
];

const DEFAULT_PH_NEWS = [];

const getEmergencyTel = (emergencyStr) => {
  if (!emergencyStr) return null;
  const match = emergencyStr.match(/(\+?[0-9]{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/) || emergencyStr.match(/[0-9+]{3,}/);
  if (!match) return null;
  const cleaned = match[0].replace(/[^0-9+]/g, '');
  return cleaned.length >= 3 ? cleaned : null;
};

export default function DailyInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, appConfig } = useAuth();
  const maxImages = userProfile?.isAdmin ? appConfig?.imageUploadLimits?.admin ?? 30 : appConfig?.imageUploadLimits?.user ?? 30;
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_daily_tab') || 'notice';
    } catch (e) {
      return 'notice';
    }
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('cebugo_daily_tab', tab);
    } catch (e) {}
  };

  const processedLocationKey = useRef(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
    
    if (location.state?.targetId) {
      if (processedLocationKey.current !== location.key) {
        processedLocationKey.current = location.key;
        setTimeout(() => {
          const el = document.getElementById(`daily-item-${location.state.targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-flash');
            setTimeout(() => el.classList.remove('highlight-flash'), 2500);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 500);
      }
    } else {
      if (processedLocationKey.current !== location.key) {
        processedLocationKey.current = location.key;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [location.state, location.key]);

  const [activeCurrency, setActiveCurrency] = useState('USD');
  const [usdVal, setUsdVal] = useState('1');
  const [phpVal, setPhpVal] = useState('58.20');
  const [krwVal, setKrwVal] = useState('1,385');
  const [exchangeRates, setExchangeRates] = useState({
    usdToKrw: 1385,
    usdToPhp: 58.2,
    phpToKrw: 1385 / 58.2,
    lastUpdatedText: '환율 정보 로딩 중...',
    isFallback: false
  });
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const loadExchangeRates = async () => {
    setIsFetchingRates(true);
    const ratesData = await fetchExchangeRates();
    setExchangeRates(ratesData);
    setPhpVal((1 * ratesData.usdToPhp).toFixed(2));
    setKrwVal(Math.round(1 * ratesData.usdToKrw).toString());
    setIsFetchingRates(false);
  };

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const handleSelectCurrency = (cur) => {
    setActiveCurrency(cur);
    const { usdToKrw, usdToPhp, phpToKrw } = exchangeRates;
    if (cur === 'USD') {
      setUsdVal('1');
      setPhpVal(usdToPhp.toFixed(2));
      setKrwVal(Math.round(usdToKrw).toString());
    } else if (cur === 'PHP') {
      setPhpVal('1');
      setUsdVal((1 / usdToPhp).toFixed(4));
      setKrwVal(phpToKrw.toFixed(2));
    } else if (cur === 'KRW') {
      setKrwVal('1');
      setUsdVal((1 / usdToKrw).toFixed(4));
      setPhpVal((1 / phpToKrw).toFixed(4));
    }
  };

  const handleUsdChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('USD');
    setUsdVal(clean);
    if (!clean || isNaN(parseFloat(clean))) {
      setPhpVal('');
      setKrwVal('');
      return;
    }
    const num = parseFloat(clean);
    setPhpVal((num * exchangeRates.usdToPhp).toFixed(2));
    setKrwVal(Math.round(num * exchangeRates.usdToKrw).toString());
  };

  const handlePhpChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('PHP');
    setPhpVal(clean);
    if (!clean || isNaN(parseFloat(clean))) {
      setUsdVal('');
      setKrwVal('');
      return;
    }
    const num = parseFloat(clean);
    setUsdVal((num / exchangeRates.usdToPhp).toFixed(4));
    setKrwVal(Math.round(num * exchangeRates.phpToKrw).toString());
  };

  const handleKrwChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('KRW');
    setKrwVal(clean);
    if (!clean || isNaN(parseFloat(clean))) {
      setUsdVal('');
      setPhpVal('');
      return;
    }
    const num = parseFloat(clean);
    setUsdVal((num / exchangeRates.usdToKrw).toFixed(4));
    setPhpVal((num / exchangeRates.phpToKrw).toFixed(2));
  };

  // Tags state backed by Firebase Firestore
  const [tags, setTags] = useState(DEFAULT_TAGS);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'cebugo_config', 'notice_tags'),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.tags) {
          setTags(docSnap.data().tags);
        } else {
          setDoc(doc(db, 'cebugo_config', 'notice_tags'), { tags: DEFAULT_TAGS });
          setTags(DEFAULT_TAGS);
        }
      },
      (err) => console.error('Firestore tags sync error:', err)
    );
    return () => unsub();
  }, []);

  // Notice CRUD state backed by Firebase Firestore
  const [notices, setNotices] = useState(DEFAULT_NOTICES);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_notices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          list.sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));
          setNotices(list);
        } else {
          DEFAULT_NOTICES.forEach(async (n, idx) => {
            await setDoc(doc(db, 'cebugo_notices', n.id), { ...n, order: idx });
          });
          setNotices(DEFAULT_NOTICES.map((n, idx) => ({ ...n, order: idx })));
        }
      },
      (err) => console.error('Firestore notices sync error:', err)
    );
    return () => unsub();
  }, []);

  // Contacts CRUD state backed by Firebase Firestore
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_contacts'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          list.sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));
          setContacts(list);
        } else {
          DEFAULT_CONTACTS.forEach(async (c, idx) => {
            await setDoc(doc(db, 'cebugo_contacts', c.id), { ...c, order: idx });
          });
          setContacts(DEFAULT_CONTACTS.map((c, idx) => ({ ...c, order: idx })));
        }
      },
      (err) => console.error('Firestore contacts sync error:', err)
    );
    return () => unsub();
  }, []);

  // PH News CRUD state backed by Firebase Firestore + Google News RSS
  const [phNews, setPhNews] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_ph_news'),
      (snapshot) => {
        if (!snapshot.empty) {
          const manualItems = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          setPhNews((prev) => {
            const liveItems = prev.filter((n) => n.isAutoFetched);
            return [...manualItems, ...liveItems];
          });
        }
      },
      (err) => console.error('Firestore phNews sync error:', err)
    );
    return () => unsub();
  }, []);

  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [lastNewsRefreshedAt, setLastNewsRefreshedAt] = useState(() => {
    try {
      const savedTime = localStorage.getItem('cebugo_ph_news_last_fetched_time');
      if (savedTime) {
        const dateObj = new Date(parseInt(savedTime, 10));
        return `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      }
      return null;
    } catch {
      return null;
    }
  });

  const handleRefreshGoogleNews = async () => {
    setIsFetchingNews(true);
    const liveItems = await fetchGoogleNews();
    if (liveItems && liveItems.length > 0) {
      setPhNews((prev) => {
        const manualItems = prev.filter((n) => !n.isAutoFetched);
        return [...manualItems, ...liveItems];
      });
      const now = Date.now();
      try {
        localStorage.setItem('cebugo_ph_news_last_fetched_time', now.toString());
      } catch (e) {
        console.error('Failed to save last fetched timestamp', e);
      }
      const dateObj = new Date(now);
      setLastNewsRefreshedAt(`${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`);
    }
    setIsFetchingNews(false);
  };

  useEffect(() => {
    // 6-hour auto update policy or if empty
    if (activeTab === 'phnews') {
      try {
        const savedTimestamp = localStorage.getItem('cebugo_ph_news_last_fetched_time');
        const sixHoursMs = 6 * 60 * 60 * 1000;
        const isExpired = !savedTimestamp || Date.now() - parseInt(savedTimestamp, 10) > sixHoursMs;

        if (phNews.length === 0 || isExpired) {
          handleRefreshGoogleNews();
        }
      } catch {
        if (phNews.length === 0) handleRefreshGoogleNews();
      }
    }
  }, [activeTab]);

  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all'); // all, cebu, ph

  // News Modal / Form state
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    category: '세부소식 / 현지',
    date: getLocalTodayString(),
    summary: '',
    url: '',
    moreUrl: '',
    images: []
  });

  const handleOpenCreateNews = () => {
    setEditingNews(null);
    setNewsFormData({
      title: '',
      category: '세부소식 / 현지',
      date: getLocalTodayString(),
      summary: '',
      url: '',
      moreUrl: '',
      images: [],
      isTicker: true
    });
    setIsNewsModalOpen(true);
  };

  const handleOpenEditNews = (item) => {
    setEditingNews(item);
    setNewsFormData({
      title: item.title,
      category: item.category || '세부소식 / 현지',
      date: item.date || getLocalTodayString(),
      summary: item.summary,
      url: item.url || '',
      moreUrl: item.moreUrl || '',
      images: item.images || [],
      isTicker: item.isTicker !== undefined ? item.isTicker : true
    });
    setIsNewsModalOpen(true);
  };

  const handleDeleteNews = async (id) => {
    if (window.confirm('정말로 이 뉴스 항목을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'cebugo_ph_news', id));
      } catch (err) {
        console.error('Failed to delete news from Firestore:', err);
      }
      setPhNews((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleNewsImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = newsFormData.images.length;
    if (currentCount + files.length > maxImages) {
      alert(`이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다. (현재: ${currentCount}개)`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsFormData((prev) => {
          if (prev.images.length >= maxImages) return prev;
          return {
            ...prev,
            images: [...prev.images, reader.result]
          };
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveNewsImage = (index) => {
    setNewsFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!newsFormData.title.trim() || !newsFormData.summary.trim()) {
      alert('뉴스 제목과 요약 내용을 입력해 주세요.');
      return;
    }

    const docId = editingNews ? editingNews.id : `p_${Date.now()}`;
    const newsToSave = {
      id: docId,
      ...newsFormData,
      isAutoFetched: false,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'cebugo_ph_news', docId), newsToSave);
    } catch (err) {
      console.error('Failed to save news to Firestore:', err);
      setPhNews((prev) =>
        editingNews ? prev.map((item) => (item.id === docId ? newsToSave : item)) : [newsToSave, ...prev]
      );
    }

    setIsNewsModalOpen(false);
  };

  // Travel Info CRUD state backed by Firebase Firestore
  const [travelInfos, setTravelInfos] = useState(DEFAULT_TRAVEL_INFO);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_travel_info'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          list.sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));
          setTravelInfos(list);
        } else {
          DEFAULT_TRAVEL_INFO.forEach(async (t, idx) => {
            await setDoc(doc(db, 'cebugo_travel_info', t.id), { ...t, order: idx });
          });
          setTravelInfos(DEFAULT_TRAVEL_INFO.map((t, idx) => ({ ...t, order: idx })));
        }
      },
      (err) => console.error('Firestore travel_info sync error:', err)
    );
    return () => unsub();
  }, []);

  // Info Modal / Form state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState(null);
  const [infoFormData, setInfoFormData] = useState({
    title: '',
    badge: '여행팁',
    desc: '',
    images: []
  });

  const handleOpenCreateInfo = () => {
    setEditingInfo(null);
    setInfoFormData({
      title: '',
      badge: '여행팁',
      desc: '',
      images: []
    });
    setIsInfoModalOpen(true);
  };

  const handleOpenEditInfo = (item) => {
    setEditingInfo(item);
    setInfoFormData({
      title: item.title,
      badge: item.badge || '여행팁',
      desc: item.desc,
      images: item.images || []
    });
    setIsInfoModalOpen(true);
  };

  const handleDeleteInfo = async (id) => {
    if (window.confirm('정말로 이 정보 항목을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'cebugo_travel_info', id));
      } catch (err) {
        console.error('Failed to delete info from Firestore:', err);
      }
      setTravelInfos((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleInfoImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = infoFormData.images.length;
    if (currentCount + files.length > maxImages) {
      alert(`이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다. (현재: ${currentCount}개)`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfoFormData((prev) => {
          if (prev.images.length >= maxImages) return prev;
          return {
            ...prev,
            images: [...prev.images, reader.result]
          };
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveInfoImage = (index) => {
    setInfoFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!infoFormData.title.trim() || !infoFormData.desc.trim()) {
      alert('제목과 상세 내용을 입력해 주세요.');
      return;
    }

    const minOrder = travelInfos.length > 0 ? Math.min(...travelInfos.map((t) => t.order !== undefined ? t.order : 0)) : 0;
    const docId = editingInfo ? editingInfo.id : `i_${Date.now()}`;
    const infoToSave = {
      id: docId,
      ...infoFormData,
      order: editingInfo && editingInfo.order !== undefined ? editingInfo.order : minOrder - 1,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'cebugo_travel_info', docId), infoToSave);
    } catch (err) {
      console.error('Failed to save travel info to Firestore:', err);
      setTravelInfos((prev) =>
        editingInfo ? prev.map((item) => (item.id === docId ? infoToSave : item)) : [infoToSave, ...prev]
      );
    }

    setIsInfoModalOpen(false);
  };

  // Contact Modal / Form state
  const PRESET_CONTACT_CATEGORIES = [
    '공관 / 영사',
    '영사콜센터',
    '한인회',
    '긴급신고',
    '공항 / 교통',
    '의료 / 병원',
    '유틸리티',
    '기타 비상연락'
  ];

  const [copiedBadgeKey, setCopiedBadgeKey] = useState(null);

  const handleCopySns = (key, text, typeLabel) => {
    if (!text) return;
    const cleanVal = text.trim();

    const onCopySuccess = () => {
      setCopiedBadgeKey(key);
      setTimeout(() => {
        setCopiedBadgeKey(null);
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanVal)
        .then(onCopySuccess)
        .catch(() => {
          fallbackCopyText(cleanVal);
          onCopySuccess();
        });
    } else {
      fallbackCopyText(cleanVal);
      onCopySuccess();
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactFormData, setContactFormData] = useState({
    category: '공관 / 영사',
    customCategory: '',
    name: '',
    desc: '',
    hours: '',
    phones: [''],
    emergency: '',
    website: '',
    facebook: '',
    snsList: [{ type: 'kakao', value: '' }]
  });

  const handleOpenCreateContact = () => {
    setEditingContact(null);
    setContactFormData({
      category: '공관 / 영사',
      customCategory: '',
      name: '',
      desc: '',
      hours: '',
      phones: [''],
      emergency: '',
      website: '',
      facebook: '',
      snsList: [{ type: 'kakao', value: '' }]
    });
    setIsContactModalOpen(true);
  };

  const handleOpenEditContact = (item) => {
    setEditingContact(item);
    const cat = item.category || '공관 / 영사';
    const isPreset = PRESET_CONTACT_CATEGORIES.includes(cat);
    
    setContactFormData({
      category: isPreset ? cat : '직접입력',
      customCategory: isPreset ? '' : cat,
      name: item.name || '',
      desc: item.desc || '',
      hours: item.hours || '',
      phones: item.phones && item.phones.length > 0 ? [...item.phones] : [item.phone || ''],
      emergency: item.emergency || '',
      website: item.website || '',
      facebook: item.facebook || '',
      snsList: item.snsList && item.snsList.length > 0 ? [...item.snsList] : [{ type: 'kakao', value: '' }]
    });
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm('정말로 이 연락처 항목을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'cebugo_contacts', id));
      } catch (err) {
        console.error('Failed to delete contact from Firestore:', err);
      }
      setContacts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Move Contact Up / Down (Direct action on card)
  const handleMoveContact = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= contacts.length) return;

    const newContacts = [...contacts];
    const temp = newContacts[index];
    newContacts[index] = newContacts[targetIndex];
    newContacts[targetIndex] = temp;

    const updatedList = newContacts.map((item, idx) => ({
      ...item,
      order: idx
    }));

    setContacts(updatedList);

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        const docRef = doc(db, 'cebugo_contacts', item.id);
        batch.set(docRef, item, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to update contact order in Firestore:', err);
    }
  };

  // Reorder Modal State & Handlers
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [tempReorderContacts, setTempReorderContacts] = useState([]);

  const handleOpenReorderModal = () => {
    setTempReorderContacts([...contacts]);
    setIsReorderModalOpen(true);
  };

  const handleMoveTempContact = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempReorderContacts.length) return;

    const updated = [...tempReorderContacts];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTempReorderContacts(updated);
  };

  const handleSaveReorder = async () => {
    const updatedList = tempReorderContacts.map((item, idx) => ({
      ...item,
      order: idx
    }));

    setContacts(updatedList);
    setIsReorderModalOpen(false);

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        const docRef = doc(db, 'cebugo_contacts', item.id);
        batch.set(docRef, item, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to save reordered contacts to Firestore:', err);
    }
  };

  // Notice Reordering Handlers
  const handleMoveNotice = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= notices.length) return;

    const newList = [...notices];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const updatedList = newList.map((item, idx) => ({ ...item, order: idx }));
    setNotices(updatedList);

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        batch.set(doc(db, 'cebugo_notices', item.id), item, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to update notice order in Firestore:', err);
    }
  };

  const [isNoticeReorderModalOpen, setIsNoticeReorderModalOpen] = useState(false);
  const [tempReorderNotices, setTempReorderNotices] = useState([]);

  const handleOpenNoticeReorderModal = () => {
    setTempReorderNotices([...notices]);
    setIsNoticeReorderModalOpen(true);
  };

  const handleMoveTempNotice = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempReorderNotices.length) return;

    const updated = [...tempReorderNotices];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTempReorderNotices(updated);
  };

  const handleSaveNoticeReorder = async () => {
    const updatedList = tempReorderNotices.map((item, idx) => ({ ...item, order: idx }));
    setNotices(updatedList);
    setIsNoticeReorderModalOpen(false);

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        batch.set(doc(db, 'cebugo_notices', item.id), item, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to save reordered notices to Firestore:', err);
    }
  };

  // Travel Info Reordering Handlers
  const handleMoveInfo = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= travelInfos.length) return;

    const newList = [...travelInfos];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const updatedList = newList.map((item, idx) => ({ ...item, order: idx }));
    setTravelInfos(updatedList);

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        batch.set(doc(db, 'cebugo_travel_info', item.id), item, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to update travel info order in Firestore:', err);
    }
  };

  const [isInfoReorderModalOpen, setIsInfoReorderModalOpen] = useState(false);
  const [tempReorderInfos, setTempReorderInfos] = useState([]);

  const handleOpenInfoReorderModal = () => {
    setTempReorderInfos([...travelInfos]);
    setIsInfoReorderModalOpen(true);
  };

  const handleMoveTempInfo = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempReorderInfos.length) return;

    const updated = [...tempReorderInfos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTempReorderInfos(updated);
  };

  const handleSaveInfoReorder = async () => {
    const updatedList = tempReorderInfos.map((item, idx) => ({ ...item, order: idx }));
    setTravelInfos(updatedList);
    setIsInfoReorderModalOpen(false);

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        batch.set(doc(db, 'cebugo_travel_info', item.id), item, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to save reordered travel info to Firestore:', err);
    }
  };

  // Phone list handlers inside form
  const handleAddPhoneField = () => {
    setContactFormData((prev) => ({
      ...prev,
      phones: [...prev.phones, '']
    }));
  };

  const handlePhoneChange = (index, value) => {
    setContactFormData((prev) => {
      const updated = [...prev.phones];
      updated[index] = value;
      return { ...prev, phones: updated };
    });
  };

  const handleRemovePhoneField = (index) => {
    setContactFormData((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, idx) => idx !== index)
    }));
  };

  // SNS list handlers inside form
  const handleAddSnsField = () => {
    setContactFormData((prev) => ({
      ...prev,
      snsList: [...prev.snsList, { type: 'kakao', value: '' }]
    }));
  };

  const handleSnsChange = (index, field, value) => {
    setContactFormData((prev) => {
      const updated = [...prev.snsList];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, snsList: updated };
    });
  };

  const handleRemoveSnsField = (index) => {
    setContactFormData((prev) => ({
      ...prev,
      snsList: prev.snsList.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactFormData.name.trim()) {
      alert('기관 및 연락처 이름을 입력해 주세요.');
      return;
    }

    if (contactFormData.category === '직접입력' && !contactFormData.customCategory.trim()) {
      alert('직접 입력 카테고리명을 입력해 주세요.');
      return;
    }

    const cleanPhones = contactFormData.phones.map((p) => p.trim()).filter(Boolean);
    const cleanSns = contactFormData.snsList.filter((s) => s.value.trim() !== '');

    const finalCategory = contactFormData.category === '직접입력'
      ? contactFormData.customCategory.trim()
      : contactFormData.category;

    const minOrder = contacts.length > 0 ? Math.min(...contacts.map((c) => c.order !== undefined ? c.order : 0)) : 0;
    const docId = editingContact ? editingContact.id : `c_${Date.now()}`;

    const contactToSave = {
      id: docId,
      ...contactFormData,
      category: finalCategory,
      phones: cleanPhones.length > 0 ? cleanPhones : ['미등록'],
      snsList: cleanSns,
      order: editingContact && editingContact.order !== undefined ? editingContact.order : minOrder - 1,
      updatedAt: new Date().toISOString()
    };
    delete contactToSave.customCategory;

    try {
      await setDoc(doc(db, 'cebugo_contacts', docId), contactToSave);
    } catch (err) {
      console.error('Failed to save contact to Firestore:', err);
      setContacts((prev) =>
        editingContact ? prev.map((item) => (item.id === docId ? contactToSave : item)) : [...prev, contactToSave]
      );
    }

    setIsContactModalOpen(false);
  };

  // Tag Manager Modal state
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      alert('이미 존재하는 구분 태그입니다.');
      return;
    }
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setNewTagInput('');
    try {
      await setDoc(doc(db, 'cebugo_config', 'notice_tags'), { tags: newTags });
    } catch (err) {
      console.error('Failed to save tag to Firestore:', err);
    }
  };

  const handleStartEditTag = (index, val) => {
    setEditingTagIndex(index);
    setEditingTagValue(val);
  };

  const handleSaveEditTag = async (index) => {
    const trimmed = editingTagValue.trim();
    if (!trimmed) return;
    if (tags.some((t, idx) => t === trimmed && idx !== index)) {
      alert('이미 같은 이름의 구분 태그가 존재합니다.');
      return;
    }
    const newTags = tags.map((t, idx) => (idx === index ? trimmed : t));
    setTags(newTags);
    try {
      await setDoc(doc(db, 'cebugo_config', 'notice_tags'), { tags: newTags });
    } catch (err) {
      console.error('Failed to save edited tag to Firestore:', err);
    }
    setEditingTagIndex(null);
  };

  const handleDeleteTag = async (index) => {
    const tagToDelete = tags[index];
    if (tags.length <= 1) {
      alert('최소 하나 이상의 구분 태그가 존재해야 합니다.');
      return;
    }
    if (window.confirm(`'${tagToDelete}' 태그를 삭제하시겠습니까?`)) {
      const newTags = tags.filter((_, idx) => idx !== index);
      setTags(newTags);
      try {
        await setDoc(doc(db, 'cebugo_config', 'notice_tags'), { tags: newTags });
      } catch (err) {
        console.error('Failed to delete tag from Firestore:', err);
      }
    }
  };

  // Notice Modal / Form state
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null); // null for create, item for edit
  const [noticeFormData, setNoticeFormData] = useState({
    title: '',
    badge: tags[0] || '중요공지',
    date: getLocalTodayString(),
    startDate: getLocalTodayString(),
    endDate: '',
    content: '',
    images: [],
    isTicker: true
  });

  const handleOpenCreateNotice = () => {
    setEditingNotice(null);
    setNoticeFormData({
      title: '',
      badge: tags[0] || '중요공지',
      date: getLocalTodayString(),
      startDate: getLocalTodayString(),
      endDate: '',
      content: '',
      images: [],
      isTicker: true
    });
    setIsNoticeModalOpen(true);
  };

  const handleOpenEditNotice = (item) => {
    setEditingNotice(item);
    setNoticeFormData({
      title: item.title || '',
      badge: item.badge || tags[0] || '중요공지',
      date: item.date || getLocalTodayString(),
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      content: item.content || '',
      images: item.images || [],
      isTicker: item.isTicker !== undefined ? item.isTicker : true
    });
    setIsNoticeModalOpen(true);
  };

  const handleToggleNoticeTicker = async (item) => {
    const isCurrentlyTicker = item.isTicker === true || item.isTicker === 'true';
    const nextStatus = !isCurrentlyTicker;
    try {
      await setDoc(doc(db, 'cebugo_notices', item.id), { isTicker: nextStatus }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle notice ticker:', err);
    }
  };

  const handleToggleNewsTicker = async (item) => {
    const isCurrentlyTicker = item.isTicker === true || item.isTicker === 'true';
    const nextStatus = !isCurrentlyTicker;
    try {
      await setDoc(doc(db, 'cebugo_ph_news', item.id), { isTicker: nextStatus }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle news ticker:', err);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'cebugo_notices', id));
      } catch (err) {
        console.error('Failed to delete notice from Firestore:', err);
        setNotices((prev) => prev.filter((item) => item.id !== id));
      }
    }
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = noticeFormData.images.length;
    if (currentCount + files.length > maxImages) {
      alert(`이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다. (현재: ${currentCount}개)`);
      return;
    }

    for (const file of files) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        if (compressed) {
          setNoticeFormData((prev) => {
            if (prev.images.length >= maxImages) return prev;
            return {
              ...prev,
              images: [...prev.images, compressed]
            };
          });
        }
      } catch (err) {
        console.error('Notice image compression error:', err);
      }
    }

    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setNoticeFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveNotice = async (e) => {
    e.preventDefault();
    if (!noticeFormData.title.trim() || !noticeFormData.content.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    const minOrder = notices.length > 0 ? Math.min(...notices.map((n) => n.order !== undefined ? n.order : 0)) : 0;
    const docId = editingNotice ? editingNotice.id : `n_${Date.now()}`;
    const noticeToSave = {
      id: docId,
      title: noticeFormData.title.trim(),
      badge: noticeFormData.badge || '중요공지',
      date: noticeFormData.date || getLocalTodayString(),
      startDate: noticeFormData.startDate || '',
      endDate: noticeFormData.endDate || '',
      content: noticeFormData.content.trim(),
      images: noticeFormData.images || [],
      isTicker: noticeFormData.isTicker !== undefined ? noticeFormData.isTicker : true,
      order: editingNotice && editingNotice.order !== undefined ? editingNotice.order : minOrder - 1,
      updatedAt: new Date().toISOString()
    };

    setNotices((prev) => {
      const idx = prev.findIndex((n) => n.id === docId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...noticeToSave };
        return copy;
      }
      return [noticeToSave, ...prev];
    });

    setIsNoticeModalOpen(false);

    try {
      await setDoc(doc(db, 'cebugo_notices', docId), noticeToSave);
    } catch (err) {
      console.error('Failed to save notice to Firestore:', err);
      alert('공지사항 저장 중 오류가 발생했습니다: ' + (err.message || '다시 시도해주세요.'));
    }
  };

  return (
    <div className="page-content">
      <div className="daily-header">
        <h1>
          <RiNewspaperLine /> News
          <span className="daily-header-sub"> - 공지사항, 비상 연락처, 여행 정보, 실시간 필리핀 뉴스 및 환율 정보를 한눈에 확인하세요.</span>
        </h1>
      </div>

      {/* 5 News Sub-Tabs */}
      <div className="news-nav-tabs glass-card">
        <button 
          className={`news-tab-btn ${activeTab === 'notice' ? 'active' : ''}`}
          onClick={() => setActiveTab('notice')}
        >
          <RiNotification3Line className="tab-icon" />
          <span>공지</span>
        </button>

        <button 
          className={`news-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <RiContactsBook2Line className="tab-icon" />
          <span>연락처</span>
        </button>

        <button 
          className={`news-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <RiInformationLine className="tab-icon" />
          <span>정보</span>
        </button>

        <button 
          className={`news-tab-btn ${activeTab === 'phnews' ? 'active' : ''}`}
          onClick={() => setActiveTab('phnews')}
        >
          <RiGlobalLine className="tab-icon" />
          <span>뉴스</span>
        </button>

        <button 
          className={`news-tab-btn ${activeTab === 'exchange' ? 'active' : ''}`}
          onClick={() => setActiveTab('exchange')}
        >
          <RiExchangeDollarLine className="tab-icon" />
          <span>환율</span>
        </button>
      </div>

      {/* TAB 1: 공지 (Announcements) */}
      {activeTab === 'notice' && (
        <div className="tab-content-section">
          {userProfile?.isAdmin && (
            <div className="admin-notice-actions">
              <button 
                type="button" 
                className="btn btn-secondary add-notice-btn"
                onClick={handleOpenNoticeReorderModal}
              >
                <RiDragMove2Line /> 순서 변경
              </button>
              <button 
                type="button" 
                className="btn btn-secondary tag-manage-btn"
                onClick={() => setIsTagModalOpen(true)}
              >
                <RiPriceTag3Line /> 구분 태그 관리
              </button>
              <button 
                type="button" 
                className="btn btn-primary add-notice-btn"
                onClick={handleOpenCreateNotice}
              >
                <RiAddLine /> 신규 공지사항 작성
              </button>
            </div>
          )}

          <div className="news-list">
            {notices
              .filter((item) => userProfile?.isAdmin || (() => {
                const todayStr = getLocalTodayString();
                if (item.startDate && todayStr < item.startDate) return false;
                if (item.endDate && todayStr > item.endDate) return false;
                return true;
              })())
              .map((item, index) => {
                const todayStr = getLocalTodayString();
                const isScheduled = item.startDate && todayStr < item.startDate;
                const isExpired = item.endDate && todayStr > item.endDate;
                const hasPeriod = Boolean(item.startDate || item.endDate);
                const periodRange = item.startDate && item.endDate ? `${item.startDate} ~ ${item.endDate}` : (item.startDate ? `${item.startDate}~` : `~${item.endDate}`);

                return (
                  <div key={item.id} id={`daily-item-${item.id}`} className="glass-card notice-item-card">
                    <div className="notice-header">
                      <div className="notice-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="notice-badge-tag">{item.badge}</span>
                        <span className="news-date">{item.date}</span>
                        {userProfile?.isAdmin && (
                          <>
                            {isScheduled && (
                              <span className="post-cat-badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                ⏳ 게시 예정 ({item.startDate}~)
                              </span>
                            )}
                            {isExpired && (
                              <span className="post-cat-badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                🔴 게시 종료 (~{item.endDate})
                              </span>
                            )}
                            {!isScheduled && !isExpired && hasPeriod && (
                              <span className="post-cat-badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                🟢 게시 중 ({periodRange})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                  {userProfile?.isAdmin && (
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className={`btn-icon-action move ${item.isTicker ? 'active' : ''}`}
                        onClick={() => handleToggleNoticeTicker(item)}
                        title={item.isTicker ? '상단 전광판 게시 해제' : '상단 전광판에 게시하기'}
                        style={{
                          background: (item.isTicker === true || item.isTicker === 'true') ? '#dbeafe' : '#f1f5f9',
                          color: (item.isTicker === true || item.isTicker === 'true') ? '#1d4ed8' : '#64748b',
                          borderColor: (item.isTicker === true || item.isTicker === 'true') ? '#93c5fd' : '#cbd5e1',
                          fontWeight: 700
                        }}
                      >
                        <RiVolumeUpLine /> {(item.isTicker === true || item.isTicker === 'true') ? '상단전광판 게시중' : '상단전광판 게시'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action move"
                        onClick={() => handleMoveNotice(index, 'up')}
                        disabled={index === 0}
                        title="위로 이동"
                      >
                        <RiArrowUpLine />
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action move"
                        onClick={() => handleMoveNotice(index, 'down')}
                        disabled={index === notices.length - 1}
                        title="아래로 이동"
                      >
                        <RiArrowDownLine />
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action edit"
                        onClick={() => handleOpenEditNotice(item)}
                        title="공지 수정"
                      >
                        <RiEditLine /> 수정
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action delete"
                        onClick={() => handleDeleteNotice(item.id)}
                        title="공지 삭제"
                      >
                        <RiDeleteBinLine /> 삭제
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="notice-title-text">{item.title}</h3>

                {/* Attached Images Carousel / Preview */}
                {item.images && item.images.length > 0 && (
                  <div className="notice-card-images" style={{ margin: '12px 0' }}>
                    <ImageCarousel images={item.images} />
                  </div>
                )}

                <p className="notice-content-text" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(item.content)}</p>
              </div>
            );
          })}
      </div>

          {/* Admin Notice Create / Edit Modal */}
          {isNoticeModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card notice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%' }}>
                <div className="modal-header">
                  <h2>{editingNotice ? '공지사항 수정' : '신규 공지사항 작성'}</h2>
                  <button className="modal-close-btn" onClick={() => setIsNoticeModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <form onSubmit={handleSaveNotice} className="notice-form">
                  <div className="modal-body-scroll">
                    <div className="form-group" style={{ background: '#f0f9ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={noticeFormData.isTicker || false}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, isTicker: e.target.checked })}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                        />
                        <span>📢 상단 전광판(공지판) 텍스트 스크롤에 게재하기</span>
                      </label>
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">구분 태그 *</label>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => setIsTagModalOpen(true)}
                        >
                          <RiPriceTag3Line /> 태그 관리
                        </button>
                      </div>
                      <select
                        value={noticeFormData.badge}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, badge: e.target.value })}
                        className="form-select"
                      >
                        {tags.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">공지 제목 *</label>
                        <input
                          type="text"
                          placeholder="공지사항 제목을 입력하세요"
                          value={noticeFormData.title}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">작성일자</label>
                        <input
                          type="date"
                          value={noticeFormData.date}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, date: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group-row" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">게시 시작일 (선택)</label>
                        <input
                          type="date"
                          value={noticeFormData.startDate || ''}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, startDate: e.target.value })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">게시 종료일 (선택)</label>
                        <input
                          type="date"
                          value={noticeFormData.endDate || ''}
                          onChange={(e) => setNoticeFormData({ ...noticeFormData, endDate: e.target.value })}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">공지 상세 내용 *</label>
                      <textarea
                        rows="5"
                        placeholder="상세 공지 내용을 입력하세요"
                        value={noticeFormData.content}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, content: e.target.value })}
                        className="form-textarea"
                        required
                      />
                    </div>

                  {/* Image Attachment (Max 10) */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">이미지 첨부 ({noticeFormData.images.length} / {maxImages}개)</label>
                      <span className="field-hint">최대 {maxImages}개 파일 첨부 가능</span>
                    </div>

                    <div className="image-upload-wrapper">
                      {noticeFormData.images.length < maxImages && (
                        <label className="image-upload-dropzone">
                          <RiImageAddLine className="upload-icon" />
                          <span>이미지 추가</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}

                      {noticeFormData.images.map((imgUrl, idx) => (
                        <div key={idx} className="uploaded-img-preview">
                          <ZoomableImage
                            src={imgUrl}
                            images={noticeFormData.images}
                            initialIndex={idx}
                            alt={`preview-${idx}`}
                            showZoomHint={false}
                          />
                          <button
                            type="button"
                            className="remove-img-btn"
                            onClick={() => handleRemoveImage(idx)}
                            title="이미지 삭제"
                          >
                            <RiCloseLine />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setIsNoticeModalOpen(false)}
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <RiCheckLine /> {editingNotice ? '수정 완료' : '등록 하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Admin Tag Manager Modal (Rendered on top with zIndex: 1100) */}
          {isTagModalOpen && (
            <div className="modal-overlay fade-in" style={{ zIndex: 1100 }}>
              <div className="modal-content glass-card tag-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><RiPriceTag3Line /> 공지사항 구분 태그 관리</h2>
                  <button className="modal-close-btn" onClick={() => setIsTagModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>

                <div className="tag-manager-body">
                  <div className="add-tag-row">
                    <input
                      type="text"
                      placeholder="신규 태그명 입력 (예: 이벤트)"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="form-input"
                    />
                    <button type="button" className="btn btn-primary" onClick={handleAddTag}>
                      <RiAddLine /> 추가
                    </button>
                  </div>

                  <div className="tag-list-box">
                    <span className="field-hint" style={{ marginBottom: '8px', display: 'block' }}>
                      ※ 태그 이름을 클릭하거나 수정/삭제 버튼으로 태그를 관리할 수 있습니다.
                    </span>
                    {tags.map((tag, idx) => (
                      <div key={idx} className="tag-list-item">
                        {editingTagIndex === idx ? (
                          <div className="tag-edit-inline">
                            <input
                              type="text"
                              value={editingTagValue}
                              onChange={(e) => setEditingTagValue(e.target.value)}
                              className="form-input tag-edit-input"
                            />
                            <button type="button" className="btn-icon-action edit" onClick={() => handleSaveEditTag(idx)}>
                              <RiCheckLine />
                            </button>
                            <button type="button" className="btn-icon-action" onClick={() => setEditingTagIndex(null)}>
                              <RiCloseLine />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="tag-badge-display">
                              <RiHashtag /> {tag}
                            </span>
                            <div className="tag-item-actions">
                              <button type="button" className="btn-icon-action edit" onClick={() => handleStartEditTag(idx, tag)}>
                                <RiEditLine /> 수정
                              </button>
                              <button type="button" className="btn-icon-action delete" onClick={() => handleDeleteTag(idx)}>
                                <RiDeleteBinLine /> 삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsTagModalOpen(false)}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reorder Notices Modal */}
          {isNoticeReorderModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card reorder-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><RiDragMove2Line /> 공지사항 표시 순서 변경</h2>
                  <button className="modal-close-btn" onClick={() => setIsNoticeReorderModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <div className="modal-body-scroll" style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                    공지사항 항목의 위/아래 버튼을 눌러 목록 표시 순서를 조정하세요.
                  </p>
                  <div className="reorder-list">
                    {tempReorderNotices.map((item, idx) => (
                      <div key={item.id} className="reorder-item-card">
                        <div className="reorder-item-left">
                          <span className="reorder-index-badge">{idx + 1}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span className="notice-badge-tag" style={{ fontSize: '0.7rem' }}>{item.badge}</span>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginTop: '2px' }}>
                              {item.title}
                            </div>
                          </div>
                        </div>
                        <div className="reorder-item-actions">
                          <button
                            type="button"
                            className="btn-icon-action move"
                            onClick={() => handleMoveTempNotice(idx, 'up')}
                            disabled={idx === 0}
                            title="위로 이동"
                          >
                            <RiArrowUpLine /> 위로
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action move"
                            onClick={() => handleMoveTempNotice(idx, 'down')}
                            disabled={idx === tempReorderNotices.length - 1}
                            title="아래로 이동"
                          >
                            <RiArrowDownLine /> 아래로
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsNoticeReorderModalOpen(false)}>
                    취소
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveNoticeReorder}>
                    <RiCheckLine /> 순서 저장하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 연락처 (Emergency Directory) */}
      {activeTab === 'contacts' && (
        <div className="tab-content-section">
          {userProfile?.isAdmin && (
            <div className="admin-notice-actions">
              <button 
                type="button" 
                className="btn btn-secondary add-notice-btn"
                onClick={handleOpenReorderModal}
              >
                <RiDragMove2Line /> 순서 변경
              </button>
              <button 
                type="button" 
                className="btn btn-primary add-notice-btn"
                onClick={handleOpenCreateContact}
              >
                <RiAddLine /> 신규 비상연락처 추가
              </button>
            </div>
          )}

          <div className="contacts-grid">
            {contacts.map((item, index) => {
              const IconComp = item.icon || RiPhoneFill;
              const phonesList = item.phones && item.phones.length > 0 ? item.phones : (item.phone ? [item.phone] : []);
              return (
                <div key={item.id} id={`daily-item-${item.id}`} className="glass-card contact-card">
                  <div className="contact-top">
                    <div className="contact-top-left">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="contact-cat-badge">{item.category}</span>
                        <h3 
                          className="contact-name"
                          style={{ fontSize: item.name && item.name.length >= 14 ? '0.82rem' : '0.9rem' }}
                        >
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    {userProfile?.isAdmin && (
                      <div className="admin-card-actions">
                        <button 
                          type="button" 
                          className="btn-icon-action move"
                          onClick={() => handleMoveContact(index, 'up')}
                          disabled={index === 0}
                          title="위로 이동"
                        >
                          <RiArrowUpLine />
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action move"
                          onClick={() => handleMoveContact(index, 'down')}
                          disabled={index === contacts.length - 1}
                          title="아래로 이동"
                        >
                          <RiArrowDownLine />
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action edit"
                          onClick={() => handleOpenEditContact(item)}
                          title="연락처 수정"
                        >
                          <RiEditLine /> 수정
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action delete"
                          onClick={() => handleDeleteContact(item.id)}
                          title="연락처 삭제"
                        >
                          <RiDeleteBinLine /> 삭제
                        </button>
                      </div>
                    )}
                  </div>

                  {item.desc && <p className="contact-desc" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(item.desc)}</p>}

                  {/* Multiple Call Buttons */}
                  <div className="contact-phones-column">
                    {phonesList.map((ph, pIdx) => (
                      <a 
                        key={pIdx}
                        href={`tel:${ph.replace(/[^0-9+]/g, '')}`} 
                        className="btn-call-action"
                      >
                        <RiPhoneFill /> {ph}
                      </a>
                    ))}
                  </div>

                  {/* Business Hours */}
                  {item.hours && (
                    <div className="contact-hours-badge">
                      <RiTimeLine className="hours-icon" />
                      <span>근무시간: {item.hours}</span>
                    </div>
                  )}

                  {/* Emergency line without prepended '비상:' prefix */}
                  {item.emergency && (() => {
                    const emergencyTel = getEmergencyTel(item.emergency);
                    return emergencyTel ? (
                      <a
                        href={`tel:${emergencyTel}`}
                        className="contact-emergency-line clickable"
                        title="긴급 전화 걸기"
                      >
                        <RiPhoneFill style={{ verticalAlign: '-1px', marginRight: '4px' }} /> {item.emergency}
                      </a>
                    ) : (
                      <div className="contact-emergency-line">
                        <span>{item.emergency}</span>
                      </div>
                    );
                  })()}

                  {/* Links Row: Website & Facebook & SNS */}
                  {(item.website || item.facebook || (item.snsList && item.snsList.length > 0)) && (
                    <div className="contact-links-row">
                      {item.website && (
                        <a href={item.website} target="_blank" rel="noopener noreferrer" className="contact-link-badge website">
                          <RiGlobalLine /> 홈페이지
                        </a>
                      )}
                      {item.facebook && (
                        <a href={item.facebook} target="_blank" rel="noopener noreferrer" className="contact-link-badge facebook">
                          페이스북
                        </a>
                      )}
                      {item.snsList && item.snsList.map((sns, sIdx) => {
                        const badgeKey = `${item.id}_sns_${sIdx}`;
                        const isCopied = copiedBadgeKey === badgeKey;
                        const label = sns.type === 'kakao' ? '카톡' : (sns.type === 'line' ? '라인' : (sns.type === 'insta' ? '인스타' : 'SNS'));
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            className={`contact-link-badge sns ${isCopied ? 'copied' : ''}`}
                            onClick={() => handleCopySns(badgeKey, sns.value, label)}
                            title={`${label} 아이디 복사 (${sns.value})`}
                          >
                            <RiFileCopyLine style={{ verticalAlign: '-1px', marginRight: '2px' }} />
                            {isCopied ? '✓ 복사완료!' : `${label}: ${sns.value}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Admin Contact Create / Edit Modal */}
          {isContactModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card contact-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingContact ? '비상연락처 수정' : '신규 비상연락처 추가'}</h2>
                  <button className="modal-close-btn" onClick={() => setIsContactModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <form onSubmit={handleSaveContact} className="notice-form">
                  <div className="modal-body-scroll">
                    <div className="form-group">
                    <label className="form-label">구분 카테고리</label>
                    <select
                      value={contactFormData.category}
                      onChange={(e) => setContactFormData({ ...contactFormData, category: e.target.value })}
                      className="form-input"
                    >
                      <option value="공관 / 영사">공관 / 영사</option>
                      <option value="영사콜센터">영사콜센터</option>
                      <option value="한인회">한인회</option>
                      <option value="긴급신고">긴급신고</option>
                      <option value="공항 / 교통">공항 / 교통</option>
                      <option value="의료 / 병원">의료 / 병원</option>
                      <option value="유틸리티">유틸리티</option>
                      <option value="기타 비상연락">기타 비상연락</option>
                      <option value="직접입력">직접입력</option>
                    </select>
                    {contactFormData.category === '직접입력' && (
                      <input
                        type="text"
                        placeholder="카테고리를 직접 입력해 주세요 (예: 렌트카 / 기사)"
                        value={contactFormData.customCategory}
                        onChange={(e) => setContactFormData({ ...contactFormData, customCategory: e.target.value })}
                        className="form-input"
                        style={{ marginTop: '8px' }}
                        required
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">기관 / 연락처 이름 *</label>
                    <input
                      type="text"
                      placeholder="예: 세부 한국 영사관 분공관"
                      value={contactFormData.name}
                      onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">설명 / 위치</label>
                    <input
                      type="text"
                      placeholder="예: 세부시티 아얄라 센트럴 블록 타워 12층"
                      value={contactFormData.desc}
                      onChange={(e) => setContactFormData({ ...contactFormData, desc: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">근무시간 / 운영시간 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 월~금 08:00 - 17:00 (점심시간 12:00 - 13:00)"
                      value={contactFormData.hours}
                      onChange={(e) => setContactFormData({ ...contactFormData, hours: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  {/* Multiple Phone Numbers Field */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">전화번호 (여러 개 입력 가능)</label>
                      <button
                        type="button"
                        className="btn-text-link"
                        onClick={handleAddPhoneField}
                      >
                        + 전화번호 추가
                      </button>
                    </div>

                    {contactFormData.phones.map((phoneVal, pIdx) => (
                      <div key={pIdx} className="dynamic-input-row">
                        <input
                          type="text"
                          placeholder="예: +63-32-340-9900"
                          value={phoneVal}
                          onChange={(e) => handlePhoneChange(pIdx, e.target.value)}
                          className="form-input"
                        />
                        {contactFormData.phones.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon-action delete"
                            onClick={() => handleRemovePhoneField(pIdx)}
                          >
                            <RiCloseLine />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">비상 / 긴급 연락처 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 긴급당직번호 +63-917-817-5703"
                      value={contactFormData.emergency || ''}
                      onChange={(e) => setContactFormData({ ...contactFormData, emergency: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">홈페이지 URL (선택)</label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={contactFormData.website}
                      onChange={(e) => setContactFormData({ ...contactFormData, website: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">페이스북 URL (선택)</label>
                    <input
                      type="url"
                      placeholder="https://facebook.com/page"
                      value={contactFormData.facebook}
                      onChange={(e) => setContactFormData({ ...contactFormData, facebook: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  {/* Multiple SNS Field */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">SNS 아이디 (카카오/라인 등 여러 개 가능)</label>
                      <button
                        type="button"
                        className="btn-text-link"
                        onClick={handleAddSnsField}
                      >
                        + SNS 추가
                      </button>
                    </div>

                    {contactFormData.snsList.map((snsObj, sIdx) => (
                      <div key={sIdx} className="dynamic-input-row">
                        <select
                          value={snsObj.type}
                          onChange={(e) => handleSnsChange(sIdx, 'type', e.target.value)}
                          className="form-input"
                          style={{ width: '110px' }}
                        >
                          <option value="kakao">카카오톡</option>
                          <option value="line">라인</option>
                          <option value="insta">인스타그램</option>
                          <option value="other">기타</option>
                        </select>
                        <input
                          type="text"
                          placeholder="아이디 또는 핸들 입력"
                          value={snsObj.value}
                          onChange={(e) => handleSnsChange(sIdx, 'value', e.target.value)}
                          className="form-input"
                          style={{ flex: 1 }}
                        />
                        {contactFormData.snsList.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon-action delete"
                            onClick={() => handleRemoveSnsField(sIdx)}
                          >
                            <RiCloseLine />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsContactModalOpen(false)}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <RiCheckLine /> {editingContact ? '수정 완료' : '등록 하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          {/* Reorder Contacts Modal */}
          {isReorderModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card reorder-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><RiDragMove2Line /> 비상연락처 표시 순서 변경</h2>
                  <button className="modal-close-btn" onClick={() => setIsReorderModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <div className="modal-body-scroll" style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                    비상연락처 항목의 위/아래 버튼을 눌러 목록 표시 순서를 조정하세요.
                  </p>
                  <div className="reorder-list">
                    {tempReorderContacts.map((item, idx) => (
                      <div key={item.id} className="reorder-item-card">
                        <div className="reorder-item-left">
                          <span className="reorder-index-badge">{idx + 1}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span className="contact-cat-badge" style={{ fontSize: '0.7rem' }}>{item.category}</span>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginTop: '2px' }}>
                              {item.name}
                            </div>
                          </div>
                        </div>
                        <div className="reorder-item-actions">
                          <button
                            type="button"
                            className="btn-icon-action move"
                            onClick={() => handleMoveTempContact(idx, 'up')}
                            disabled={idx === 0}
                            title="위로 이동"
                          >
                            <RiArrowUpLine /> 위로
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action move"
                            onClick={() => handleMoveTempContact(idx, 'down')}
                            disabled={idx === tempReorderContacts.length - 1}
                            title="아래로 이동"
                          >
                            <RiArrowDownLine /> 아래로
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsReorderModalOpen(false)}>
                    취소
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveReorder}>
                    <RiCheckLine /> 순서 저장하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 정보 (Travel & Living Info) */}
      {activeTab === 'info' && (
        <div className="tab-content-section">
          {userProfile?.isAdmin && (
            <div className="admin-notice-actions">
              <button 
                type="button" 
                className="btn btn-secondary add-notice-btn"
                onClick={handleOpenInfoReorderModal}
              >
                <RiDragMove2Line /> 순서 변경
              </button>
              <button 
                type="button" 
                className="btn btn-primary add-notice-btn"
                onClick={handleOpenCreateInfo}
              >
                <RiAddLine /> 신규 정보 작성
              </button>
            </div>
          )}

          <div className="news-list">
            {travelInfos.map((item, index) => (
              <div key={item.id} id={`daily-item-${item.id}`} className="glass-card notice-item-card">
                <div className="notice-header">
                  <div className="notice-header-left">
                    <span className="notice-badge-tag" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: 'rgba(3, 105, 161, 0.2)' }}>
                      {item.badge}
                    </span>
                  </div>
                  {userProfile?.isAdmin && (
                    <div className="admin-card-actions">
                      <button 
                        type="button" 
                        className="btn-icon-action move"
                        onClick={() => handleMoveInfo(index, 'up')}
                        disabled={index === 0}
                        title="위로 이동"
                      >
                        <RiArrowUpLine />
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action move"
                        onClick={() => handleMoveInfo(index, 'down')}
                        disabled={index === travelInfos.length - 1}
                        title="아래로 이동"
                      >
                        <RiArrowDownLine />
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action edit"
                        onClick={() => handleOpenEditInfo(item)}
                        title="정보 수정"
                      >
                        <RiEditLine /> 수정
                      </button>
                      <button 
                        type="button" 
                        className="btn-icon-action delete"
                        onClick={() => handleDeleteInfo(item.id)}
                        title="정보 삭제"
                      >
                        <RiDeleteBinLine /> 삭제
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="notice-title-text">{item.title}</h3>

                {/* Attached Images Carousel / Preview */}
                {item.images && item.images.length > 0 && (
                  <div className="notice-card-images" style={{ margin: '12px 0' }}>
                    <ImageCarousel images={item.images} />
                  </div>
                )}

                <p className="notice-content-text" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(item.desc)}</p>
              </div>
            ))}
          </div>

          {/* Admin Info Create / Edit Modal */}
          {isInfoModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingInfo ? '여행/생활 정보 수정' : '신규 여행/생활 정보 작성'}</h2>
                  <button className="modal-close-btn" onClick={() => setIsInfoModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <form onSubmit={handleSaveInfo} className="notice-form">
                  <div className="modal-body-scroll">
                    <div className="form-group">
                    <label className="form-label">구분 태그</label>
                    <input
                      type="text"
                      placeholder="예: 여행팁, 면세/입국, 생활정보, 교통정보"
                      value={infoFormData.badge}
                      onChange={(e) => setInfoFormData({ ...infoFormData, badge: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">정보 제목 *</label>
                    <input
                      type="text"
                      placeholder="정보 제목을 입력하세요"
                      value={infoFormData.title}
                      onChange={(e) => setInfoFormData({ ...infoFormData, title: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">정보 상세 내용 *</label>
                    <textarea
                      rows="5"
                      placeholder="상세 정보를 입력하세요"
                      value={infoFormData.desc}
                      onChange={(e) => setInfoFormData({ ...infoFormData, desc: e.target.value })}
                      className="form-textarea"
                      required
                    />
                  </div>

                  {/* Image Attachment (Max 10) */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">이미지 첨부 ({infoFormData.images.length} / {maxImages}개)</label>
                      <span className="field-hint">최대 {maxImages}개 파일 첨부 가능</span>
                    </div>

                    <div className="image-upload-wrapper">
                      {infoFormData.images.length < maxImages && (
                        <label className="image-upload-dropzone">
                          <RiImageAddLine className="upload-icon" />
                          <span>이미지 추가</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleInfoImageFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}

                      {infoFormData.images.map((imgUrl, idx) => (
                        <div key={idx} className="uploaded-img-preview">
                          <ZoomableImage
                            src={imgUrl}
                            images={infoFormData.images}
                            initialIndex={idx}
                            alt={`preview-${idx}`}
                            showZoomHint={false}
                          />
                          <button
                            type="button"
                            className="remove-img-btn"
                            onClick={() => handleRemoveInfoImage(idx)}
                            title="이미지 삭제"
                          >
                            <RiCloseLine />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setIsInfoModalOpen(false)}
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <RiCheckLine /> {editingInfo ? '수정 완료' : '등록 하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reorder Travel Info Modal */}
          {isInfoReorderModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card reorder-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><RiDragMove2Line /> 여행/생활 정보 표시 순서 변경</h2>
                  <button className="modal-close-btn" onClick={() => setIsInfoReorderModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <div className="modal-body-scroll" style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                    정보 항목의 위/아래 버튼을 눌러 목록 표시 순서를 조정하세요.
                  </p>
                  <div className="reorder-list">
                    {tempReorderInfos.map((item, idx) => (
                      <div key={item.id} className="reorder-item-card">
                        <div className="reorder-item-left">
                          <span className="reorder-index-badge">{idx + 1}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span className="notice-badge-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>{item.badge}</span>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginTop: '2px' }}>
                              {item.title}
                            </div>
                          </div>
                        </div>
                        <div className="reorder-item-actions">
                          <button
                            type="button"
                            className="btn-icon-action move"
                            onClick={() => handleMoveTempInfo(idx, 'up')}
                            disabled={idx === 0}
                            title="위로 이동"
                          >
                            <RiArrowUpLine /> 위로
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action move"
                            onClick={() => handleMoveTempInfo(idx, 'down')}
                            disabled={idx === tempReorderInfos.length - 1}
                            title="아래로 이동"
                          >
                            <RiArrowDownLine /> 아래로
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsInfoReorderModalOpen(false)}>
                    취소
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveInfoReorder}>
                    <RiCheckLine /> 순서 저장하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 필리핀뉴스 (PH News) */}
      {activeTab === 'phnews' && (
        <div className="tab-content-section">
          <div className="news-filter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div className="news-cat-pills">
              <button
                type="button"
                className={`pill-btn ${newsCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setNewsCategoryFilter('all')}
              >
                전체 소식 ({phNews.length})
              </button>
              <button
                type="button"
                className={`pill-btn ${newsCategoryFilter === 'cebu' ? 'active' : ''}`}
                onClick={() => setNewsCategoryFilter('cebu')}
              >
                🏝️ 세부 소식 ({phNews.filter((n) => n.category.includes('세부')).length})
              </button>
              <button
                type="button"
                className={`pill-btn ${newsCategoryFilter === 'ph' ? 'active' : ''}`}
                onClick={() => setNewsCategoryFilter('ph')}
              >
                🇵🇭 필리핀 이슈 ({phNews.filter((n) => n.category.includes('필리핀')).length})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-secondary ${isFetchingNews ? 'rotating' : ''}`}
                onClick={handleRefreshGoogleNews}
                disabled={isFetchingNews}
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="구글 실시간 뉴스 수집"
              >
                <RiRefreshLine /> {isFetchingNews ? '뉴스 수집 중...' : '구글 뉴스 새로고침'}
              </button>

              {userProfile?.isAdmin && (
                <button 
                  type="button" 
                  className="btn btn-primary add-notice-btn"
                  onClick={handleOpenCreateNews}
                >
                  <RiAddLine /> 신규 뉴스 작성
                </button>
              )}
            </div>
          </div>

          {lastNewsRefreshedAt && (
            <div className="field-hint" style={{ marginBottom: '10px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
              ※ 구글 실시간 한글 뉴스 ({lastNewsRefreshedAt} 기준 | 6시간 주기 자동 갱신)
            </div>
          )}

          {isFetchingNews && phNews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <RiRefreshLine className="rotating" style={{ fontSize: '2.4rem', color: '#2563eb', marginBottom: '12px' }} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>최신 필리핀/세부 실시간 한글 뉴스를 가져오는 중입니다...</p>
            </div>
          )}

          {!isFetchingNews && phNews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <p style={{ marginBottom: '12px', fontWeight: 600 }}>수집된 최신 뉴스가 없습니다.</p>
              <button type="button" className="btn btn-primary" onClick={handleRefreshGoogleNews}>
                <RiRefreshLine /> 구글 실시간 뉴스 수집하기
              </button>
            </div>
          )}

          <div className="news-list">
            {phNews
              .filter((item) => {
                if (newsCategoryFilter === 'cebu') return item.category.includes('세부');
                if (newsCategoryFilter === 'ph') return item.category.includes('필리핀');
                return true;
              })
              .sort((a, b) => {
                const timeA = a.pubTimestamp || (a.date ? new Date(a.date).getTime() : 0);
                const timeB = b.pubTimestamp || (b.date ? new Date(b.date).getTime() : 0);
                return timeB - timeA;
              })
              .map((item) => (
                <div key={item.id} id={`daily-item-${item.id}`} className="glass-card news-card fade-in">
                  <div className="news-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="news-cat">{item.category}</span>
                      <span className="news-date">{item.date}</span>
                    </div>

                    {userProfile?.isAdmin && (
                      <div className="admin-card-actions">
                        <button
                          type="button"
                          className={`btn-icon-action move ${(item.isTicker === true || item.isTicker === 'true') ? 'active' : ''}`}
                          onClick={() => handleToggleNewsTicker(item)}
                          title={(item.isTicker === true || item.isTicker === 'true') ? '상단 전광판 게시 해제' : '상단 전광판에 게시하기'}
                          style={{
                            background: (item.isTicker === true || item.isTicker === 'true') ? '#dbeafe' : '#f1f5f9',
                            color: (item.isTicker === true || item.isTicker === 'true') ? '#1d4ed8' : '#64748b',
                            borderColor: (item.isTicker === true || item.isTicker === 'true') ? '#93c5fd' : '#cbd5e1',
                            fontWeight: 700
                          }}
                        >
                          <RiVolumeUpLine /> {(item.isTicker === true || item.isTicker === 'true') ? '상단전광판 게시중' : '상단전광판 게시'}
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action edit"
                          onClick={() => handleOpenEditNews(item)}
                          title="뉴스 수정"
                        >
                          <RiEditLine /> 수정
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action delete"
                          onClick={() => handleDeleteNews(item.id)}
                          title="뉴스 삭제"
                        >
                          <RiDeleteBinLine /> 삭제
                        </button>
                      </div>
                    )}
                  </div>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-title-link"
                      title="클릭하여 해당 뉴스 본문 바로보기"
                    >
                      <h3 className="news-title">{item.title}</h3>
                    </a>
                  ) : (
                    <h3 className="news-title">{item.title}</h3>
                  )}

                  {/* Attached Images Carousel */}
                  {item.images && item.images.length > 0 && (
                    <div className="notice-card-images" style={{ margin: '10px 0' }}>
                      <ImageCarousel images={item.images} />
                    </div>
                  )}

                  <p className="news-summary">{item.summary}</p>

                  {item.url && (
                    <div className="news-url-row" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-news-read"
                        title="해당 기사 본문 전체 바로보기"
                      >
                        <RiNewspaperLine /> 기사 자세히 보기 ↗
                      </a>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Admin PH News Create / Edit Modal */}
          {isNewsModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingNews ? '필리핀/세부 뉴스 수정' : '신규 필리핀/세부 뉴스 작성'}</h2>
                  <button className="modal-close-btn" onClick={() => setIsNewsModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <form onSubmit={handleSaveNews} className="notice-form">
                  <div className="modal-body-scroll">
                    <div className="form-group">
                    <label className="form-label">구분 카테고리</label>
                    <select
                      value={newsFormData.category}
                      onChange={(e) => setNewsFormData({ ...newsFormData, category: e.target.value })}
                      className="form-input"
                    >
                      <option value="세부소식 / 현지">세부소식 / 현지</option>
                      <option value="세부소식 / 입국">세부소식 / 입국</option>
                      <option value="세부소식 / 교통">세부소식 / 교통</option>
                      <option value="세부소식 / 관광">세부소식 / 관광</option>
                      <option value="필리핀 이슈 / 사회">필리핀 이슈 / 사회</option>
                      <option value="필리핀 이슈 / 경제">필리핀 이슈 / 경제</option>
                      <option value="필리핀 이슈 / 기상통제">필리핀 이슈 / 기상통제</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">보도일자 *</label>
                    <input
                      type="date"
                      value={newsFormData.date}
                      onChange={(e) => setNewsFormData({ ...newsFormData, date: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">뉴스 제목 *</label>
                    <input
                      type="text"
                      placeholder="뉴스 헤드라인 제목을 입력하세요"
                      value={newsFormData.title}
                      onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">뉴스 요약 내용 *</label>
                    <textarea
                      rows="4"
                      placeholder="뉴스 주요 요약 내용을 입력하세요"
                      value={newsFormData.summary}
                      onChange={(e) => setNewsFormData({ ...newsFormData, summary: e.target.value })}
                      className="form-textarea"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">뉴스 기사 원문 링크 (선택)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/..."
                      value={newsFormData.url}
                      onChange={(e) => setNewsFormData({ ...newsFormData, url: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">구글 뉴스 / 상세 더보기 링크 (선택 - 미입력 시 제목 자동검색)</label>
                    <input
                      type="url"
                      placeholder="https://news.google.com/..."
                      value={newsFormData.moreUrl}
                      onChange={(e) => setNewsFormData({ ...newsFormData, moreUrl: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  {/* Image Attachment (Max 10) */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">이미지 첨부 ({newsFormData.images.length} / {maxImages}개)</label>
                      <span className="field-hint">최대 {maxImages}개 파일 첨부 가능</span>
                    </div>

                    <div className="image-upload-wrapper">
                      {newsFormData.images.length < maxImages && (
                        <label className="image-upload-dropzone">
                          <RiImageAddLine className="upload-icon" />
                          <span>이미지 추가</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleNewsImageFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}

                      {newsFormData.images.map((imgUrl, idx) => (
                        <div key={idx} className="uploaded-img-preview">
                          <ZoomableImage
                            src={imgUrl}
                            images={newsFormData.images}
                            initialIndex={idx}
                            alt={`preview-${idx}`}
                            showZoomHint={false}
                          />
                          <button
                            type="button"
                            className="remove-img-btn"
                            onClick={() => handleRemoveNewsImage(idx)}
                            title="이미지 삭제"
                          >
                            <RiCloseLine />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setIsNewsModalOpen(false)}
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <RiCheckLine /> {editingNews ? '수정 완료' : '등록 하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 환율 (Exchange Rate Calculator) */}
      {activeTab === 'exchange' && (
        <div className="tab-content-section">
          <div className="glass-card exchange-card">
            <div 
              className="announcement-banner" 
              style={{ 
                justifyContent: 'space-between', 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: exchangeRates.hasError ? 'rgba(239, 68, 68, 0.1)' : undefined,
                borderColor: exchangeRates.hasError ? 'rgba(239, 68, 68, 0.3)' : undefined,
                color: exchangeRates.hasError ? '#dc2626' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiCalendarCheckLine className="notice-icon" />
                <span>{exchangeRates.lastUpdatedText}</span>
              </div>
              <button 
                onClick={loadExchangeRates} 
                disabled={isFetchingRates}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  opacity: isFetchingRates ? 0.6 : 1
                }}
                title="환율 정보 새로고침"
              >
                <RiRefreshLine style={{ animation: isFetchingRates ? 'spin 1s linear infinite' : 'none' }} />
                새로고침
              </button>
            </div>

            <div className="card-title-row" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiExchangeDollarLine className="calc-icon" />
                <h3>3대 통화 (달러 / 페소 / 원화) 실시간 환율 계산기</h3>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ fontSize: '0.8rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                onClick={() => navigate('/', { state: { fromCategory: 'exchange' } })}
              >
                환전소 바로가기..
              </button>
            </div>

            <p className="currency-click-hint">
              ※ 화폐 이름을 클릭하면 해당 화폐 <strong>'1'</strong> 기준 환율로 바로 전환되며, 숫자를 수정하면 자동 계산됩니다.
            </p>

            {/* 3 Columns Aligned Layout: USD | PHP | KRW */}
            <div className="aligned-currency-grid">
              {/* USD Column */}
              <div 
                className={`currency-column ${activeCurrency === 'USD' ? 'active-col' : ''}`}
                onClick={() => handleSelectCurrency('USD')}
              >
                <div className="column-header">
                  <span className="flag">🇺🇸</span>
                  <span className="cur-name">미국 달러 (USD)</span>
                </div>
                <div className="input-wrap">
                  <input
                    type="text"
                    value={formatNumberWithCommas(usdVal)}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    onFocus={(e) => {
                      setActiveCurrency('USD');
                      e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="currency-column-input"
                    placeholder="0"
                  />
                  <span className="unit-label">USD</span>
                </div>
              </div>

              {/* PHP Column */}
              <div 
                className={`currency-column ${activeCurrency === 'PHP' ? 'active-col' : ''}`}
                onClick={() => handleSelectCurrency('PHP')}
              >
                <div className="column-header">
                  <span className="flag">🇵🇭</span>
                  <span className="cur-name">필리핀 페소 (PHP)</span>
                </div>
                <div className="input-wrap">
                  <input
                    type="text"
                    value={formatNumberWithCommas(phpVal)}
                    onChange={(e) => handlePhpChange(e.target.value)}
                    onFocus={(e) => {
                      setActiveCurrency('PHP');
                      e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="currency-column-input"
                    placeholder="0"
                  />
                  <span className="unit-label">PHP</span>
                </div>
              </div>

              {/* KRW Column */}
              <div 
                className={`currency-column ${activeCurrency === 'KRW' ? 'active-col' : ''}`}
                onClick={() => handleSelectCurrency('KRW')}
              >
                <div className="column-header">
                  <span className="flag">🇰🇷</span>
                  <span className="cur-name">대한민국 원 (KRW)</span>
                </div>
                <div className="input-wrap">
                  <input
                    type="text"
                    value={formatNumberWithCommas(krwVal)}
                    onChange={(e) => handleKrwChange(e.target.value)}
                    onFocus={(e) => {
                      setActiveCurrency('KRW');
                      e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="currency-column-input"
                    placeholder="0"
                  />
                  <span className="unit-label">원</span>
                </div>
              </div>
            </div>

            {/* Exchange Rate Summary Footer */}
            <div className="rate-summary-table" style={{ marginTop: '16px' }}>
              <div className="summary-col">1 USD = <strong>{formatNumberWithCommas(exchangeRates.usdToKrw.toFixed(2))} 원</strong></div>
              <div className="summary-col">1 USD = <strong>{exchangeRates.usdToPhp.toFixed(2)} PHP</strong></div>
              <div className="summary-col">1 PHP = <strong>{exchangeRates.phpToKrw.toFixed(2)} 원</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
