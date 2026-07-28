import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { RiMegaphoneFill } from 'react-icons/ri';
import './AdTickerBanner.css';

export default function AdTickerBanner() {
  const [tickerPosts, setTickerPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_ads'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          // Filter admin-selected ticker items (isTicker === true)
          const selected = list.filter((p) => p.isTicker === true || p.isTicker === 'true');
          
          if (selected.length > 0) {
            setTickerPosts(selected);
          } else {
            // Fallback: If no explicit selection, pick all items
            setTickerPosts(list);
          }
        } else {
          setTickerPosts([
            {
              id: 'ad_1',
              category: 'ad',
              authorName: '점보씨푸드 막탄',
              title: '당일 수급 신선 알리망오 크랩 입고 안내',
              content: '오늘 아침 현지 어시장에서 갓 수급한 A급 세부 알리망오 크랩 50kg 입고!'
            },
            {
              id: 'event_1',
              category: 'event',
              authorName: '트리쉐이드 스파 막탄점',
              title: '여름 시즌 한정 오가닉 코코넛 스파 20% 할인 이벤트',
              content: '7월 한 달간 90분 스파 이용 시 시그니처 코코넛 페이셜 수면팩 무료 서비스!'
            }
          ]);
        }
      },
      (err) => {
        console.error('Ticker sync error:', err);
      }
    );
    return () => unsub();
  }, []);

  if (tickerPosts.length === 0) return null;

  // Duplicate for seamless infinite marquee loop
  const displayItems = tickerPosts.length < 4 ? [...tickerPosts, ...tickerPosts, ...tickerPosts] : [...tickerPosts, ...tickerPosts];

  return (
    <div className="ad-ticker-bar">
      <div className="ad-ticker-inner">
        <div className="ad-ticker-badge" onClick={() => navigate('/feed')} style={{ cursor: 'pointer' }}>
          <RiMegaphoneFill className="pulse-icon" />
          <span>전광판</span>
        </div>

        <div className="ad-ticker-track-wrap">
          <div className="ad-ticker-track" onClick={() => navigate('/feed')}>
            {displayItems.map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="ticker-item">
                <span className="ticker-item-tag">
                  {item.category === 'ad' ? '📣 광고' : '🎉 이벤트'} | {item.authorName || 'CEBUGO'}
                </span>
                <span className="ticker-item-title">{item.title}</span>
                <span className="ticker-item-desc">- {item.content}</span>
                <span className="ticker-divider">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
