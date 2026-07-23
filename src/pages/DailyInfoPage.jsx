import React, { useState } from 'react';
import { 
  RiExchangeDollarLine, 
  RiNewspaperLine, 
  RiCalendarCheckLine,
  RiMoneyDollarCircleLine
} from 'react-icons/ri';
import './DailyInfoPage.css';

export default function DailyInfoPage() {
  // Base exchange rates against USD (Base 1 USD = 1,385 KRW = 58.2 PHP)
  const USD_TO_KRW = 1385;
  const USD_TO_PHP = 58.2;
  const PHP_TO_KRW = USD_TO_KRW / USD_TO_PHP; // ~ 23.797 KRW

  // Selected base currency: 'USD', 'PHP', 'KRW'
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [amount, setAmount] = useState(1);

  const calculateConverted = () => {
    const numAmount = parseFloat(amount) || 0;
    if (baseCurrency === 'USD') {
      return {
        c1Label: '필리핀 페소 (PHP)',
        c1Value: (numAmount * USD_TO_PHP).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' PHP',
        c2Label: '대한민국 원 (KRW)',
        c2Value: (numAmount * USD_TO_KRW).toLocaleString() + ' 원'
      };
    } else if (baseCurrency === 'PHP') {
      return {
        c1Label: '미국 달러 (USD)',
        c1Value: (numAmount / USD_TO_PHP).toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' USD',
        c2Label: '대한민국 원 (KRW)',
        c2Value: (numAmount * PHP_TO_KRW).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' 원'
      };
    } else { // KRW
      return {
        c1Label: '미국 달러 (USD)',
        c1Value: (numAmount / USD_TO_KRW).toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' USD',
        c2Label: '필리핀 페소 (PHP)',
        c2Value: (numAmount / PHP_TO_KRW).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' PHP'
      };
    }
  };

  const converted = calculateConverted();

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
        <p>달러 / 페소 / 원 3종 매매기준율 환율 계산기 및 현지 주요 소식</p>
      </div>

      {/* Official Exchange Announcement Card */}
      <div className="glass-card exchange-card">
        <div className="announcement-banner">
          <RiCalendarCheckLine className="notice-icon" />
          <span>2026년 7월 23일 08시 59분 한국기준환율 발표 기준</span>
        </div>

        <div className="card-title-row" style={{ marginTop: '12px' }}>
          <RiExchangeDollarLine className="calc-icon" />
          <h3>3대 통화 (달러 / 페소 / 원) 실시간 비교 계산기</h3>
        </div>

        {/* Currency Switcher Tabs */}
        <div className="currency-tab-switcher">
          <button
            className={`currency-tab ${baseCurrency === 'USD' ? 'active' : ''}`}
            onClick={() => { setBaseCurrency('USD'); setAmount(1); }}
          >
            🇺🇸 미국 달러 (USD)
          </button>
          <button
            className={`currency-tab ${baseCurrency === 'PHP' ? 'active' : ''}`}
            onClick={() => { setBaseCurrency('PHP'); setAmount(100); }}
          >
            🇵🇭 필리핀 페소 (PHP)
          </button>
          <button
            className={`currency-tab ${baseCurrency === 'KRW' ? 'active' : ''}`}
            onClick={() => { setBaseCurrency('KRW'); setAmount(10000); }}
          >
            🇰🇷 대한민국 원 (KRW)
          </button>
        </div>

        {/* Dynamic Calculator Display */}
        <div className="triple-calc-container">
          <div className="base-input-box">
            <label>기준 입력 ({baseCurrency})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="calc-input base-input"
            />
          </div>

          <div className="equals-divider">➔</div>

          <div className="converted-results-grid">
            <div className="result-card">
              <span className="result-label">{converted.c1Label}</span>
              <span className="result-value">{converted.c1Value}</span>
            </div>
            <div className="result-card">
              <span className="result-label">{converted.c2Label}</span>
              <span className="result-value">{converted.c2Value}</span>
            </div>
          </div>
        </div>

        {/* Exchange Rate Summary Table */}
        <div className="rate-summary-table">
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
