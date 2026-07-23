import React, { useState } from 'react';
import { 
  RiExchangeDollarLine, 
  RiNewspaperLine, 
  RiCalendarCheckLine
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
  // Exchange rates against USD (Base 1 USD = 1,385 KRW = 58.2 PHP)
  const USD_TO_KRW = 1385;
  const USD_TO_PHP = 58.2;
  const PHP_TO_KRW = USD_TO_KRW / USD_TO_PHP; // ~ 23.797 KRW

  // Selected base currency: 'USD', 'PHP', 'KRW'
  const [activeCurrency, setActiveCurrency] = useState('USD');

  // Raw numeric string values
  const [usdVal, setUsdVal] = useState('1');
  const [phpVal, setPhpVal] = useState('58.2');
  const [krwVal, setKrwVal] = useState('1385');

  // Handle currency click: Set as active base 1
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

  // Handle direct value edits for USD
  const handleUsdChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('USD');
    setUsdVal(clean);
    const num = parseFloat(clean) || 0;
    setPhpVal((num * USD_TO_PHP).toFixed(2));
    setKrwVal(Math.round(num * USD_TO_KRW).toString());
  };

  // Handle direct value edits for PHP
  const handlePhpChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('PHP');
    setPhpVal(clean);
    const num = parseFloat(clean) || 0;
    setUsdVal((num / USD_TO_PHP).toFixed(4));
    setKrwVal(Math.round(num * PHP_TO_KRW).toString());
  };

  // Handle direct value edits for KRW
  const handleKrwChange = (valStr) => {
    const clean = cleanNumberInput(valStr);
    setActiveCurrency('KRW');
    setKrwVal(clean);
    const num = parseFloat(clean) || 0;
    setUsdVal((num / USD_TO_KRW).toFixed(4));
    setPhpVal((num / PHP_TO_KRW).toFixed(2));
  };

  const newsItems = [
    {
      id: 1,
      title: '세부 막탄-세부 국제공항(MCIA) 신규 스마트 입국 심사대 도입',
      date: '2026-07-23',
      category: '현지뉴스',
      summary: '막탄 공항 터미널2에 자동 입국 심사 게이트가 확충되어 한국인 관광객의 입국 대기 시간이 대폭 단축되었습니다.'
    },
    {
      id: 2,
      title: '7월 세부 우기철 안전한 호핑투어 및 다이빙 수칙 안내',
      date: '2026-07-21',
      category: '안전공지',
      summary: '해양경찰청(PCG) 기상 주의보 발행 시 호핑 출항이 통제될 수 있으니 미리 예약 업체 연락처를 확인하세요.'
    }
  ];

  return (
    <div className="page-content fade-in">
      <div className="daily-header">
        <h1>오늘의 세부 정보</h1>
        <p>달러 / 페소 / 원화 3종 정밀 실시간 교차 환율 계산기</p>
      </div>

      {/* Official Exchange Announcement Card */}
      <div className="glass-card exchange-card">
        <div className="announcement-banner">
          <RiCalendarCheckLine className="notice-icon" />
          <span>2026년 7월 23일 08시 59분 한국기준환율 발표 기준</span>
        </div>

        <div className="card-title-row" style={{ marginTop: '12px' }}>
          <RiExchangeDollarLine className="calc-icon" />
          <h3>3대 통화 (달러 / 페소 / 원화) 수직 정렬 계산기</h3>
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

      {/* Local News & Notices */}
      <section className="news-section">
        <div className="section-title">
          <h2><RiNewspaperLine /> 현지 뉴스 & 공지사항</h2>
        </div>

        <div className="news-list">
          {newsItems.map((item) => (
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
      </section>
    </div>
  );
}
