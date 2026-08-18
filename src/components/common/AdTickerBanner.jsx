import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { RiMegaphoneFill } from 'react-icons/ri';
import { getLocalTodayString } from '../../utils/dateHelper';
import './AdTickerBanner.css';

export default function AdTickerBanner() {
  const [tickerPosts, setTickerPosts] = useState([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(25);
  const trackRef = useRef(null);
  const navigate = useNavigate();

  // Sync speed multiplier from Firestore
  useEffect(() => {
    const unsubSpeed = onSnapshot(doc(db, 'cebugo_config', 'ticker_speed'), (docSnap) => {
      if (docSnap.exists()) {
        setSpeedMultiplier(docSnap.data().adSpeedMultiplier || 1);
      }
    });
    return () => unsubSpeed();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_ads'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          const todayStr = getLocalTodayString();
          // Filter strictly admin-selected ticker items (isTicker === true) and active date period
          const selected = list.filter((p) => {
            const isTicker = p.isTicker === true || p.isTicker === 'true';
            if (!isTicker) return false;
            if (p.startDate && todayStr < p.startDate) return false;
            if (p.endDate && todayStr > p.endDate) return false;
            return true;
          });
          setTickerPosts(selected);
        } else {
          setTickerPosts([]);
        }
      },
      (err) => {
        console.error('Ticker sync error:', err);
      }
    );
    return () => unsub();
  }, []);

  const displayItems = [...tickerPosts, ...tickerPosts];

  // Calculate duration based on actual rendered pixel width (Constant physical speed of ~50 px/sec at 1x)
  useEffect(() => {
    if (trackRef.current && displayItems.length > 0) {
      const fullWidth = trackRef.current.scrollWidth;
      const halfWidth = fullWidth / 2;
      const baseSpeedPxPerSec = 45; // 1x constant physical reading speed (45px/sec)
      const calculatedDuration = Math.max(6, halfWidth / (baseSpeedPxPerSec * speedMultiplier));
      setDurationSeconds(calculatedDuration);
    }
  }, [tickerPosts, speedMultiplier]);

  if (tickerPosts.length === 0) return null;

  return (
    <div className="ad-ticker-bar">
      <div className="ad-ticker-inner">
        <div 
          className="ad-ticker-badge" 
          onClick={(e) => {
            e.stopPropagation();
            navigate('/feed', { state: { category: 'ad' } });
          }} 
          style={{ cursor: 'pointer' }}
        >
          <RiMegaphoneFill className="pulse-icon" />
          <span>전광판</span>
        </div>

        <div className="ad-ticker-track-wrap">
          <div 
            ref={trackRef}
            className="ad-ticker-track" 
            onClick={() => navigate('/feed')}
            style={{ animationDuration: `${durationSeconds}s` }}
          >
            {displayItems.map((item, idx) => (
              <span 
                key={`${item.id}-${idx}`} 
                className="ticker-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/feed', { state: { category: item.category || 'ad', postId: item.id } });
                }}
              >
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
