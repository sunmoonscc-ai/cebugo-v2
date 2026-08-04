import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import './TopNoticeTickerBanner.css';

export default function TopNoticeTickerBanner() {
  const [tickerItems, setTickerItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let noticeItems = [];
    let newsItems = [];

    const updateCombined = () => {
      const combined = [...noticeItems, ...newsItems];
      setTickerItems(combined);
    };

    const unsubNotices = onSnapshot(
      collection(db, 'cebugo_notices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const todayStr = new Date().toISOString().split('T')[0];
          noticeItems = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .filter((item) => {
              const isTicker = item.isTicker === true || item.isTicker === 'true';
              if (!isTicker) return false;
              if (item.startDate && todayStr < item.startDate) return false;
              if (item.endDate && todayStr > item.endDate) return false;
              return true;
            })
            .map((item) => ({
              id: item.id,
              type: 'notice',
              tagLabel: '📢 공지',
              title: item.title,
              content: item.content
            }));
        } else {
          noticeItems = [];
        }
        updateCombined();
      },
      (err) => console.error('Notice ticker sync error:', err)
    );

    const unsubNews = onSnapshot(
      collection(db, 'cebugo_ph_news'),
      (snapshot) => {
        if (!snapshot.empty) {
          newsItems = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .filter((item) => item.isTicker === true || item.isTicker === 'true')
            .map((item) => ({
              id: item.id,
              type: 'news',
              tagLabel: '📰 뉴스',
              title: item.title,
              content: item.summary || item.content
            }));
        } else {
          newsItems = [];
        }
        updateCombined();
      },
      (err) => console.error('News ticker sync error:', err)
    );

    return () => {
      unsubNotices();
      unsubNews();
    };
  }, []);

  if (tickerItems.length === 0) return null;

  // Duplicate 2 identical sets for seamless continuous marquee loop
  const displayItems = [...tickerItems, ...tickerItems];

  // Constant speed calibrated to 1 item selected (18s per item)
  const durationSeconds = tickerItems.length * 18;

  return (
    <div className="top-notice-ticker-bar">
      <div className="top-notice-ticker-inner">
        <div className="top-notice-ticker-track-wrap">
          <div 
            className="top-notice-ticker-track" 
            onClick={() => navigate('/daily-info')}
            style={{ animationDuration: `${durationSeconds}s` }}
          >
            {displayItems.map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="top-ticker-item">
                <span className="top-ticker-item-tag">{item.tagLabel}</span>
                <span className="top-ticker-item-title">{item.title}</span>
                <span className="top-ticker-item-desc">- {item.content}</span>
                <span className="top-ticker-divider">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
