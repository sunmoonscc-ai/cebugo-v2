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
          const todayStr = new Date().toISOString().split('T')[0];
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

  if (tickerPosts.length === 0) return null;

  // Duplicate 2 identical sets for seamless continuous marquee loop
  const displayItems = [...tickerPosts, ...tickerPosts];

  // Constant speed calibrated to 18s per item (exactly matching top notice ticker speed)
  const durationSeconds = tickerPosts.length * 18;

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
