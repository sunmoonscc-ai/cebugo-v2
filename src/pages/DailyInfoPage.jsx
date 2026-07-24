import React, { useState } from 'react';
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
  RiFlightTakeoffLine
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

export default function DailyInfoPage() {
  const [activeTab, setActiveTab] = useState('notice'); // notice, contacts, info, phnews, exchange

  // Exchange rates against USD (Base 1 USD = 1,385 KRW = 58.2 PHP)
  const USD_TO_KRW = 1385;
  const USD_TO_PHP = 58.2;
  const PHP_TO_KRW = USD_TO_KRW / USD_TO_PHP;

  const [activeCurrency, setActiveCurrency] = useState('USD');
  const [usdVal, setUsdVal] = useState('1');
  const [phpVal, setPhpVal] = useState('58.2');
  const [krwVal, setKrwVal] = useState('1385');

  const handleSelectCurrency = (cur) => {
    setActiveCurrency(cur);
    if (cur === 'USD') {
      setUsdVal('1');
      setPhpVal(USD_TO_PHP.toFixed(2));
      setKrwVal(USD_TO_KRW.toString());
    } else if (cur === 'PHP') {
      setPhpVal('1');
      setUsdVal((1 / USD_TO_PHP).toFixed(4));
      setKrwVal(PHP_TO_KRW.toFixed(2));
    } else if (cur === 'KRW') {
      setKrwVal('1');
      setUsdVal((1 / USD_TO_KRW).toFixed(4));
      setPhpVal((1 / PHP_TO_KRW).toFixed(4));
    }
  };

  const handleUsdChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('USD');
    setUsdVal(clean);
    const num = parseFloat(clean) || 0;
    setPhpVal((num * USD_TO_PHP).toFixed(2));
    setKrwVal(Math.round(num * USD_TO_KRW).toString());
  };

  const handlePhpChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('PHP');
    setPhpVal(clean);
    const num = parseFloat(clean) || 0;
    setUsdVal((num / USD_TO_PHP).toFixed(4));
    setKrwVal(Math.round(num * PHP_TO_KRW).toString());
  };

  const handleKrwChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('KRW');
    setKrwVal(clean);
    const num = parseFloat(clean) || 0;
    setUsdVal((num / USD_TO_KRW).toFixed(4));
    setPhpVal((num / PHP_TO_KRW).toFixed(2));
  };

  const noticeItems = [
    {
      id: 'n1',
      title: '세부 여행객을 위한 2026년 하반기 CebugoHub 통합 가이드',
      date: '2026-07-24',
      badge: '중요공지',
      content: 'CebugoHub를 이용해 세부 현지 검증 업체 정보, 중고거래, 입국 정보 및 비상 연락망을 손쉽게 확인하세요.'
    },
    {
      id: 'n2',
      title: '7월 세부 우기철 안전한 호핑투어 및 다이빙 수칙 안내',
      date: '2026-07-21',
      badge: '안전공지',
      content: '해양경찰청(PCG) 기상 주의보 발행 시 호핑 출항이 통제될 수 있으니 미리 예약 업체 연락처를 확인하세요.'
    },
    {
      id: 'n3',
      title: '세부 국제공항 출국 수속 및 E-Travel 작성 필수 안내',
      date: '2026-07-15',
      badge: '입국안내',
      content: '필리핀 입/출국 시 e-Travel 작성 등록이 필수입니다. 출국 전 공식 웹사이트에서 사전 등록 상태를 점검하시기 바랍니다.'
    }
  ];

  const contactItems = [
    {
      id: 'c1',
      category: '공관 / 영사',
      name: '주세부 대한민국 분공관',
      phone: '+63-32-340-9900',
      emergency: '+63-917-808-3904 (24시간 사건사고)',
      icon: RiShieldCrossLine,
      desc: '세부시티 아얄라 센트럴 블록 타워 12층'
    },
    {
      id: 'c2',
      category: '영사콜센터',
      name: '외교부 영사콜센터 (한국)',
      phone: '+82-2-3210-0404',
      emergency: '24시간 연중무휴 긴급 상담',
      icon: RiPhoneFill,
      desc: '해외 긴급 상황 및 통역 서비스 지원'
    },
    {
      id: 'c3',
      category: '한인회',
      name: '세부 한인회 비상연락처',
      phone: '+63-917-319-3838',
      emergency: '+63-32-343-4100',
      icon: RiContactsBook2Line,
      desc: '세부 거주 한인 및 관광객 긴급 구조 지원'
    },
    {
      id: 'c4',
      category: '긴급신고',
      name: '필리핀 긴급합동신고센터',
      phone: '911',
      emergency: '경찰 / 소방 / 구급 통합 911',
      icon: RiPhoneFill,
      desc: '필리핀 전역 통합 긴급 구조 번호'
    },
    {
      id: 'c5',
      category: '공항 / 교통',
      name: '막탄-세부 국제공항 (MCIA)',
      phone: '+63-32-494-7000',
      emergency: '터미널 안내센터',
      icon: RiFlightTakeoffLine,
      desc: '항공편 운항 상태 및 수하물 관련 문의'
    },
    {
      id: 'c6',
      category: '의료 / 병원',
      name: '세부 닥터스 종합병원 (Cebu Doctors Hospital)',
      phone: '+63-32-255-5555',
      emergency: '응급실 (Emergency Room)',
      icon: RiHospitalLine,
      desc: '세부시티 위치 메이저 종합병원'
    }
  ];

  const infoItems = [
    {
      id: 'i1',
      title: '필리핀 세관 입국 면세 한도 및 반입 규정',
      badge: '면세/입국',
      desc: '필리핀 면세 한도는 1인당 10,000 페소(PHP)입니다. 담배 2보루, 주류 2병(총 1.5L 이하)까지 면세 반입이 허용됩니다.'
    },
    {
      id: 'i2',
      title: '세부 현지 팁(Tip) 문화 & 매너 가이드',
      badge: '여행팁',
      desc: '식당 및 마사지샵 이용 시 50~100 페소 정도의 매너 팁이 일반적입니다. 택시는 거스름돈을 팁으로 전달하기도 합니다.'
    },
    {
      id: 'i3',
      title: '전압 및 어댑터 사용 안내',
      badge: '생활정보',
      desc: '필리핀은 220V, 60Hz를 사용하며, 대부분 한국과 동일한 2구 플러그를 그대로 사용하실 수 있습니다.'
    },
    {
      id: 'i4',
      title: '세부 현지 대중교통 이용 팁 (그랩/트라이시클)',
      badge: '교통정보',
      desc: '그랩(Grab) 앱을 사전에 설치하면 이동 시 바가지 요금 없이 안전하게 정찰제로 이동하실 수 있습니다.'
    }
  ];

  const phNewsItems = [
    {
      id: 'p1',
      title: '막탄-세부 국제공항(MCIA) 신규 스마트 입국 심사대 도입',
      date: '2026-07-23',
      category: '교통/입국',
      summary: '막탄 공항 터미널2에 자동 입국 심사 게이트가 확충되어 한국인 관광객의 입국 대기 시간이 대폭 단축되었습니다.'
    },
    {
      id: 'p2',
      title: '세부 아얄라 몰 & IT파크 간 신규 스마트 셔틀 노선 개통',
      date: '2026-07-20',
      category: '현지소식',
      summary: '주요 관광 및 비즈니스 거점을 잇는 프리미엄 스마트 버스가 운영을 시작하여 이동 편의성이 향상되었습니다.'
    },
    {
      id: 'p3',
      title: '필리핀 관광부, 2026년 하반기 외국인 방문객 케어 서비스 강화',
      date: '2026-07-18',
      category: '관광/행정',
      summary: '관광 주요 지역의 안심 케어 센터 및 24시간 한국어 핫라인 서비스 운영이 더욱 활성화됩니다.'
    }
  ];

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
          <div className="news-list">
            {noticeItems.map((item) => (
              <div key={item.id} className="glass-card notice-item-card">
                <div className="notice-header">
                  <span className="notice-badge-tag">{item.badge}</span>
                  <span className="news-date">{item.date}</span>
                </div>
                <h3 className="notice-title-text">{item.title}</h3>
                <p className="notice-content-text">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: 연락처 (Emergency Directory) */}
      {activeTab === 'contacts' && (
        <div className="tab-content-section fade-in">
          <div className="contacts-grid">
            {contactItems.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.id} className="glass-card contact-card">
                  <div className="contact-top">
                    <div className="icon-wrapper">
                      <IconComp />
                    </div>
                    <div>
                      <span className="contact-cat-badge">{item.category}</span>
                      <h3 className="contact-name">{item.name}</h3>
                    </div>
                  </div>

                  <p className="contact-desc">{item.desc}</p>

                  <div className="contact-action-row">
                    <a href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`} className="btn-call-action">
                      <RiPhoneFill /> {item.phone}
                    </a>
                  </div>
                  {item.emergency && (
                    <div className="contact-emergency-line">
                      <span>비상: {item.emergency}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 정보 (Travel & Living Info) */}
      {activeTab === 'info' && (
        <div className="tab-content-section fade-in">
          <div className="news-list">
            {infoItems.map((item) => (
              <div key={item.id} className="glass-card notice-item-card">
                <div className="notice-header">
                  <span className="notice-badge-tag" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: 'rgba(3, 105, 161, 0.2)' }}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="notice-title-text">{item.title}</h3>
                <p className="notice-content-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 필리핀뉴스 (PH News) */}
      {activeTab === 'phnews' && (
        <div className="tab-content-section fade-in">
          <div className="news-list">
            {phNewsItems.map((item) => (
              <div key={item.id} className="glass-card news-card fade-in">
                <div className="news-top">
                  <span className="news-cat">{item.category}</span>
                  <span className="news-date">{item.date}</span>
                </div>
                <h3 className="news-title">{item.title}</h3>
                <p className="news-summary">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 환율 (Exchange Rate Calculator) */}
      {activeTab === 'exchange' && (
        <div className="tab-content-section fade-in">
          <div className="glass-card exchange-card">
            <div className="announcement-banner">
              <RiCalendarCheckLine className="notice-icon" />
              <span>2026년 7월 24일 09시 00분 기준 실시간 교차 환율</span>
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
              <div className="summary-col">1 USD = <strong>1,385.00 원</strong></div>
              <div className="summary-col">1 USD = <strong>58.20 PHP</strong></div>
              <div className="summary-col">1 PHP = <strong>23.80 원</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
