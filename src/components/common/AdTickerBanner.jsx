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
          // Filter strictly admin-selected ticker items (isTicker === true)
          const selected = list.filter((p) => p.isTicker === true || p.isTicker === 'true');
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
