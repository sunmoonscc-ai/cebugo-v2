import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/places/ImageCarousel';
import { fetchGoogleNews } from '../services/googleNewsService';
import { fetchExchangeRates } from '../services/exchangeRateService';
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
  RiFileCopyLine
} from 'react-icons/ri';
import './DailyInfoPage.css';

// Helper to format number string with 3-digit commas (e.g. 23797 -> 23,797)
function formatNumberWithCommas(valStr) {
  if (!valStr && valStr !== '0') return '';
  const parts = valStr.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Helper to parse input back to clean numeric string
function cleanNumberInput(valStr) {
  return valStr.replace(/,/g, '');
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
    phones: ['+63-32-340-9900'],
    emergency: '+63-917-808-3904 (24시간 사건사고)',
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
    emergency: '24시간 연중무휴 긴급 상담',
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
    emergency: '+63-917-319-3838',
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
    phones: ['911'],
    emergency: '경찰 / 소방 / 구급 통합 911',
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
    emergency: '터미널 안내센터',
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
    emergency: '응급실 (Emergency Room)',
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
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('notice'); // notice, contacts, info, phnews, exchange

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
    const num = parseFloat(clean) || 0;
    setPhpVal((num * exchangeRates.usdToPhp).toFixed(2));
    setKrwVal(Math.round(num * exchangeRates.usdToKrw).toString());
  };

  const handlePhpChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('PHP');
    setPhpVal(clean);
    const num = parseFloat(clean) || 0;
    setUsdVal((num / exchangeRates.usdToPhp).toFixed(4));
    setKrwVal(Math.round(num * exchangeRates.phpToKrw).toString());
  };

  const handleKrwChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('KRW');
    setKrwVal(clean);
    const num = parseFloat(clean) || 0;
    setUsdVal((num / exchangeRates.usdToKrw).toFixed(4));
    setPhpVal((num / exchangeRates.phpToKrw).toFixed(2));
  };

  // Tags state backed by localStorage
  const [tags, setTags] = useState(() => {
    try {
      const saved = localStorage.getItem('cebugo_notice_tags');
      return saved ? JSON.parse(saved) : DEFAULT_TAGS;
    } catch {
      return DEFAULT_TAGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cebugo_notice_tags', JSON.stringify(tags));
    } catch (err) {
      console.error('Failed to save tags to localStorage', err);
    }
  }, [tags]);

  // Notice CRUD state backed by localStorage
  const [notices, setNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('cebugo_notices');
      return saved ? JSON.parse(saved) : DEFAULT_NOTICES;
    } catch {
      return DEFAULT_NOTICES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cebugo_notices', JSON.stringify(notices));
    } catch (err) {
      console.error('Failed to save notices to localStorage', err);
    }
  }, [notices]);

  // Contacts CRUD state backed by localStorage
  const [contacts, setContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('cebugo_contacts');
      return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cebugo_contacts', JSON.stringify(contacts));
    } catch (err) {
      console.error('Failed to save contacts to localStorage', err);
    }
  }, [contacts]);

  // PH News CRUD state backed by localStorage
  const [phNews, setPhNews] = useState(() => {
    try {
      localStorage.removeItem('cebugo_ph_news');
      localStorage.removeItem('cebugo_ph_news_v2');
      localStorage.removeItem('cebugo_ph_news_v3');
      localStorage.removeItem('cebugo_ph_news_v4');
      const saved = localStorage.getItem('cebugo_ph_news_live_v1');
      if (!saved) return [];
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cebugo_ph_news_live_v1', JSON.stringify(phNews));
    } catch (err) {
      console.error('Failed to save phNews to localStorage', err);
    }
  }, [phNews]);

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
    date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
      summary: '',
      url: '',
      moreUrl: '',
      images: []
    });
    setIsNewsModalOpen(true);
  };

  const handleOpenEditNews = (item) => {
    setEditingNews(item);
    setNewsFormData({
      title: item.title,
      category: item.category || '세부소식 / 현지',
      date: item.date || new Date().toISOString().split('T')[0],
      summary: item.summary,
      url: item.url || '',
      moreUrl: item.moreUrl || '',
      images: item.images || []
    });
    setIsNewsModalOpen(true);
  };

  const handleDeleteNews = (id) => {
    if (window.confirm('정말로 이 뉴스 항목을 삭제하시겠습니까?')) {
      setPhNews((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleNewsImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = newsFormData.images.length;
    if (currentCount + files.length > 10) {
      alert(`이미지는 최대 10개까지 첨부할 수 있습니다. (현재: ${currentCount}개)`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsFormData((prev) => {
          if (prev.images.length >= 10) return prev;
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

  const handleSaveNews = (e) => {
    e.preventDefault();
    if (!newsFormData.title.trim() || !newsFormData.summary.trim()) {
      alert('뉴스 제목과 요약 내용을 입력해 주세요.');
      return;
    }

    if (editingNews) {
      setPhNews((prev) =>
        prev.map((item) => (item.id === editingNews.id ? { ...item, ...newsFormData } : item))
      );
    } else {
      const newNews = {
        id: `p_${Date.now()}`,
        ...newsFormData
      };
      setPhNews((prev) => [newNews, ...prev]);
    }

    setIsNewsModalOpen(false);
  };

  // Travel Info CRUD state backed by localStorage
  const [travelInfos, setTravelInfos] = useState(() => {
    try {
      const saved = localStorage.getItem('cebugo_travel_info');
      return saved ? JSON.parse(saved) : DEFAULT_TRAVEL_INFO;
    } catch {
      return DEFAULT_TRAVEL_INFO;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cebugo_travel_info', JSON.stringify(travelInfos));
    } catch (err) {
      console.error('Failed to save travel info to localStorage', err);
    }
  }, [travelInfos]);

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

  const handleDeleteInfo = (id) => {
    if (window.confirm('정말로 이 정보 항목을 삭제하시겠습니까?')) {
      setTravelInfos((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleInfoImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = infoFormData.images.length;
    if (currentCount + files.length > 10) {
      alert(`이미지는 최대 10개까지 첨부할 수 있습니다. (현재: ${currentCount}개)`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfoFormData((prev) => {
          if (prev.images.length >= 10) return prev;
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

  const handleSaveInfo = (e) => {
    e.preventDefault();
    if (!infoFormData.title.trim() || !infoFormData.desc.trim()) {
      alert('제목과 상세 내용을 입력해 주세요.');
      return;
    }

    if (editingInfo) {
      setTravelInfos((prev) =>
        prev.map((item) => (item.id === editingInfo.id ? { ...item, ...infoFormData } : item))
      );
    } else {
      const newInfo = {
        id: `i_${Date.now()}`,
        ...infoFormData
      };
      setTravelInfos((prev) => [newInfo, ...prev]);
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

  const handleDeleteContact = (id) => {
    if (window.confirm('정말로 이 연락처 항목을 삭제하시겠습니까?')) {
      setContacts((prev) => prev.filter((item) => item.id !== id));
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

  const handleSaveContact = (e) => {
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

    const contactToSave = {
      ...contactFormData,
      category: finalCategory,
      phones: cleanPhones.length > 0 ? cleanPhones : ['미등록'],
      snsList: cleanSns
    };
    delete contactToSave.customCategory;

    if (editingContact) {
      setContacts((prev) =>
        prev.map((item) => (item.id === editingContact.id ? { ...item, ...contactToSave } : item))
      );
    } else {
      const newContact = {
        id: `c_${Date.now()}`,
        ...contactToSave
      };
      setContacts((prev) => [...prev, newContact]);
    }

    setIsContactModalOpen(false);
  };

  // Tag Manager Modal state
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      alert('이미 존재하는 구분 태그입니다.');
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setNewTagInput('');
  };

  const handleStartEditTag = (index, val) => {
    setEditingTagIndex(index);
    setEditingTagValue(val);
  };

  const handleSaveEditTag = (index) => {
    const trimmed = editingTagValue.trim();
    if (!trimmed) return;
    if (tags.some((t, idx) => t === trimmed && idx !== index)) {
      alert('이미 같은 이름의 구분 태그가 존재합니다.');
      return;
    }
    const oldTag = tags[index];
    setTags((prev) => prev.map((t, idx) => (idx === index ? trimmed : t)));
    // Also update any notice using oldTag
    setNotices((prev) => prev.map((n) => (n.badge === oldTag ? { ...n, badge: trimmed } : n)));
    setEditingTagIndex(null);
  };

  const handleDeleteTag = (index) => {
    const tagToDelete = tags[index];
    if (tags.length <= 1) {
      alert('최소 하나 이상의 구분 태그가 존재해야 합니다.');
      return;
    }
    if (window.confirm(`'${tagToDelete}' 태그를 삭제하시겠습니까?`)) {
      setTags((prev) => prev.filter((_, idx) => idx !== index));
      // Re-assign default tag for affected notices
      const fallbackTag = tags.find((_, idx) => idx !== index) || '일반공지';
      setNotices((prev) => prev.map((n) => (n.badge === tagToDelete ? { ...n, badge: fallbackTag } : n)));
    }
  };

  // Notice Modal / Form state
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null); // null for create, item for edit
  const [noticeFormData, setNoticeFormData] = useState({
    title: '',
    badge: tags[0] || '중요공지',
    date: new Date().toISOString().split('T')[0],
    content: '',
    images: []
  });

  const handleOpenCreateNotice = () => {
    setEditingNotice(null);
    setNoticeFormData({
      title: '',
      badge: tags[0] || '중요공지',
      date: new Date().toISOString().split('T')[0],
      content: '',
      images: []
    });
    setIsNoticeModalOpen(true);
  };

  const handleOpenEditNotice = (item) => {
    setEditingNotice(item);
    setNoticeFormData({
      title: item.title,
      badge: item.badge || tags[0] || '중요공지',
      date: item.date,
      content: item.content,
      images: item.images || []
    });
    setIsNoticeModalOpen(true);
  };

  const handleDeleteNotice = (id) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      setNotices((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = noticeFormData.images.length;
    if (currentCount + files.length > 10) {
      alert(`이미지는 최대 10개까지 첨부할 수 있습니다. (현재: ${currentCount}개)`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNoticeFormData((prev) => {
          if (prev.images.length >= 10) return prev;
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

  const handleRemoveImage = (index) => {
    setNoticeFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveNotice = (e) => {
    e.preventDefault();
    if (!noticeFormData.title.trim() || !noticeFormData.content.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    if (editingNotice) {
      // Edit existing
      setNotices((prev) =>
        prev.map((item) =>
          item.id === editingNotice.id
            ? { ...item, ...noticeFormData }
            : item
        )
      );
    } else {
      // Create new
      const newNotice = {
        id: `n_${Date.now()}`,
        ...noticeFormData
      };
      setNotices((prev) => [newNotice, ...prev]);
    }

    setIsNoticeModalOpen(false);
  };

  return (
    <div className="page-content fade-in">
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
          <span>필리핀뉴스</span>
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
        <div className="tab-content-section fade-in">
          {userProfile?.isAdmin && (
            <div className="admin-notice-actions">
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
            {notices.map((item) => (
              <div key={item.id} className="glass-card notice-item-card">
                <div className="notice-header">
                  <div className="notice-header-left">
                    <span className="notice-badge-tag">{item.badge}</span>
                    <span className="news-date">{item.date}</span>
                  </div>
                  {userProfile?.isAdmin && (
                    <div className="admin-card-actions">
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

                <p className="notice-content-text">{item.content}</p>
              </div>
            ))}
          </div>

          {/* Admin Tag Manager Modal */}
          {isTagModalOpen && (
            <div className="modal-overlay fade-in">
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

          {/* Admin Notice Create / Edit Modal */}
          {isNoticeModalOpen && (
            <div className="modal-overlay fade-in">
              <div className="modal-content glass-card notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingNotice ? '공지사항 수정' : '신규 공지사항 작성'}</h2>
                  <button className="modal-close-btn" onClick={() => setIsNoticeModalOpen(false)}>
                    <RiCloseLine />
                  </button>
                </div>
                <form onSubmit={handleSaveNotice} className="notice-form">
                  <div className="modal-body-scroll">
                    <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">구분 태그</label>
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
                      className="form-input"
                    >
                      {tags.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">작성일자</label>
                    <input
                      type="date"
                      value={noticeFormData.date}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, date: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">공지 제목</label>
                    <input
                      type="text"
                      placeholder="공지사항 제목을 입력하세요"
                      value={noticeFormData.title}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">공지 상세 내용</label>
                    <textarea
                      rows="4"
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
                      <label className="form-label">이미지 첨부 ({noticeFormData.images.length} / 10개)</label>
                      <span className="field-hint">최대 10개 파일 첨부 가능</span>
                    </div>

                    <div className="image-upload-wrapper">
                      {noticeFormData.images.length < 10 && (
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
                          <img src={imgUrl} alt={`preview-${idx}`} />
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
        </div>
      )}

      {/* TAB 2: 연락처 (Emergency Directory) */}
      {activeTab === 'contacts' && (
        <div className="tab-content-section fade-in">
          {userProfile?.isAdmin && (
            <div className="admin-notice-actions">
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
            {contacts.map((item) => {
              const IconComp = item.icon || RiPhoneFill;
              const phonesList = item.phones && item.phones.length > 0 ? item.phones : (item.phone ? [item.phone] : []);
              return (
                <div key={item.id} className="glass-card contact-card">
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

                  {item.desc && <p className="contact-desc">{item.desc}</p>}

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

                  {/* Emergency line */}
                  {item.emergency && (() => {
                    const emergencyTel = getEmergencyTel(item.emergency);
                    return emergencyTel ? (
                      <a
                        href={`tel:${emergencyTel}`}
                        className="contact-emergency-line clickable"
                        title="비상 전화 걸기"
                      >
                        <RiPhoneFill style={{ verticalAlign: '-1px', marginRight: '4px' }} /> 비상: {item.emergency}
                      </a>
                    ) : (
                      <div className="contact-emergency-line">
                        <span>비상: {item.emergency}</span>
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
                      placeholder="예: +63-917-808-3904 (24시간 사건사고)"
                      value={contactFormData.emergency}
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
        </div>
      )}

      {/* TAB 3: 정보 (Travel & Living Info) */}
      {activeTab === 'info' && (
        <div className="tab-content-section fade-in">
          {userProfile?.isAdmin && (
            <div className="admin-notice-actions">
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
            {travelInfos.map((item) => (
              <div key={item.id} className="glass-card notice-item-card">
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

                <p className="notice-content-text">{item.desc}</p>
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
                      <label className="form-label">이미지 첨부 ({infoFormData.images.length} / 10개)</label>
                      <span className="field-hint">최대 10개 파일 첨부 가능</span>
                    </div>

                    <div className="image-upload-wrapper">
                      {infoFormData.images.length < 10 && (
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
                          <img src={imgUrl} alt={`preview-${idx}`} />
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
        </div>
      )}

      {/* TAB 4: 필리핀뉴스 (PH News) */}
      {activeTab === 'phnews' && (
        <div className="tab-content-section fade-in">
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
                <div key={item.id} className="glass-card news-card fade-in">
                  <div className="news-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="news-cat">{item.category}</span>
                      <span className="news-date">{item.date}</span>
                    </div>

                    {userProfile?.isAdmin && (
                      <div className="admin-card-actions">
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
                      <label className="form-label">이미지 첨부 ({newsFormData.images.length} / 10개)</label>
                      <span className="field-hint">최대 10개 파일 첨부 가능</span>
                    </div>

                    <div className="image-upload-wrapper">
                      {newsFormData.images.length < 10 && (
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
                          <img src={imgUrl} alt={`preview-${idx}`} />
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
        <div className="tab-content-section fade-in">
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

            <div className="card-title-row" style={{ marginTop: '12px' }}>
              <RiExchangeDollarLine className="calc-icon" />
              <h3>3대 통화 (달러 / 페소 / 원화) 실시간 환율 계산기</h3>
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
                    onClick={(e) => e.stopPropagation()}
                    className="currency-column-input"
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
                    onClick={(e) => e.stopPropagation()}
                    className="currency-column-input"
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
                    onClick={(e) => e.stopPropagation()}
                    className="currency-column-input"
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
