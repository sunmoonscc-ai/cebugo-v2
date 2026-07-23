import React, { useState } from 'react';
import { 
  RiExchangeDollarLine, 
  RiNewspaperLine, 
  RiNotificationBadgeLine,
  RiArrowRightUpLine
} from 'react-icons/ri';
import './DailyInfoPage.css';

export default function DailyInfoPage() {
  const [phpAmount, setPhpAmount] = useState(1000);
  const exchangeRate = 23.85; // 1 PHP = 23.85 KRW

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
        <p>실시간 필리핀 페소(PHP) 환율 계산기 및 현지 주요 소식</p>
      </div>

      {/* Exchange Rate Calculator Card */}
      <div className="glass-card exchange-card">
        <div className="card-title-row">
          <RiExchangeDollarLine className="calc-icon" />
          <h3>필리핀 페소 ↔ 원화 환율 계산기</h3>
        </div>

        <div className="calc-grid">
          <div className="calc-field">
            <label>필리핀 페소 (PHP)</label>
            <input
              type="number"
              value={phpAmount}
              onChange={(e) => setPhpAmount(e.target.value)}
              className="calc-input"
            />
          </div>

          <div className="calc-equals">=</div>

          <div className="calc-field">
            <label>대한민국 원 (KRW)</label>
            <div className="calc-result">
              {(phpAmount * exchangeRate).toLocaleString()} 원
            </div>
          </div>
        </div>

        <span className="rate-notice">※ 기준 환율: 1 PHP = {exchangeRate} KRW (실시간 파이낸스 고시 기준)</span>
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
