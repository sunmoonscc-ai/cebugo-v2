import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { getLocalTodayString } from '../../utils/dateHelper';
import './TopNoticeTickerBanner.css';

export default function TopNoticeTickerBanner() {
  const [tickerItems, setTickerItems] = useState([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(25);
  const [isHovered, setIsHovered] = useState(false);
  const [isClickPaused, setIsClickPaused] = useState(false);
  const clickPauseTimeoutRef = useRef(null);
  const trackRef = useRef(null);
  const navigate = useNavigate();

  // Sync speed multiplier from Firestore
  useEffect(() => {
    const unsubSpeed = onSnapshot(doc(db, 'cebugo_config', 'ticker_speed'), (docSnap) => {
      if (docSnap.exists()) {
        setSpeedMultiplier(docSnap.data().noticeSpeedMultiplier || 1);
      }
    });
    return () => unsubSpeed();
  }, []);

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
          const todayStr = getLocalTodayString();
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

  const displayItems = [...tickerItems, ...tickerItems];

  // Calculate duration based on actual rendered pixel width (Constant physical speed of ~50 px/sec at 1x)
  useEffect(() => {
    if (trackRef.current && displayItems.length > 0) {
      const fullWidth = trackRef.current.scrollWidth;
      const halfWidth = fullWidth / 2;
      const baseSpeedPxPerSec = 45; // 1x constant physical reading speed (45px/sec)
      const calculatedDuration = Math.max(6, halfWidth / (baseSpeedPxPerSec * speedMultiplier));
      setDurationSeconds(calculatedDuration);
    }
  }, [tickerItems, speedMultiplier]);

  if (tickerItems.length === 0) return null;

  return (
    <div className="top-notice-ticker-bar">
      <div className="top-notice-ticker-inner">
        <div className="top-notice-ticker-track-wrap">
          <div 
            ref={trackRef}
            className="top-notice-ticker-track" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
              animationDuration: `${durationSeconds}s`,
              animationPlayState: (isHovered || isClickPaused) ? 'paused' : 'running'
            }}
          >
            {displayItems.map((item, idx) => (
              <span 
                key={`${item.id}-${idx}`} 
                className="top-ticker-item"
                onClick={(e) => {
                  e.stopPropagation();
                  if (clickPauseTimeoutRef.current) clearTimeout(clickPauseTimeoutRef.current);
                  setIsClickPaused(true);
                  setIsHovered(false);
                  clickPauseTimeoutRef.current = setTimeout(() => setIsClickPaused(false), 3000);
                  navigate('/daily-info', { state: { tab: item.type === 'news' ? 'phnews' : 'notice', targetId: item.id } });
                }}
                style={{ cursor: 'pointer' }}
              >
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
