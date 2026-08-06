import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import ImageCarousel from '../components/places/ImageCarousel';
import AdFormModal from '../components/modals/AdFormModal';
import AdReorderModal from '../components/modals/AdReorderModal';
import { 
  RiMegaphoneLine, 
  RiCalendarEventLine, 
  RiAddLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiArrowUpLine, 
  RiArrowDownLine, 
  RiDragMove2Line,
  RiExternalLinkLine,
  RiVolumeUpLine
} from 'react-icons/ri';
import './PlaceFeedPage.css';

// Initial Mock Ad & Event Posts
const DEFAULT_POSTS = [
  {
    id: 'ad_1',
    category: 'ad',
    authorName: '점보씨푸드 막탄',
    date: '2026-07-28',
    title: '당일 수급 신선 알리망오 크랩 입고 안내',
    content: '오늘 아침 현지 어시장에서 갓 수급한 A급 세부 알리망오 크랩 50kg이 입고되었습니다! 수량이 한정되어 있으니 카카오톡으로 사전 예약해 주세요.',
    location: 'Lapu-Lapu',
    linkUrl: 'k_jumboseafood',
    images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'],
    order: 0,
    isTicker: true
  },
  {
    id: 'event_1',
    category: 'event',
    authorName: '트리쉐이드 스파 막탄점',
    date: '2026-07-27',
    title: '여름 시즌 한정 오가닉 코코넛 아로마 오일 스파 20% 할인 이벤트',
    content: '7월 한 달간 90분 스파 이용 시 시그니처 코코넛 페이셜 수면팩 무료 제공 및 전체 20% 할인 혜택을 드립니다.',
    location: 'Lapu-Lapu',
    linkUrl: 'k_treeshade',
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80'],
    order: 0,
    isTicker: true
  }
];

export default function PlaceFeedPage() {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.category || 'ad'); // 'ad' (광고) or 'event' (이벤트)
  const [posts, setPosts] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState(null);
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [expandedEndedPosts, setExpandedEndedPosts] = useState({});

  useEffect(() => {
    if (location.state?.category) {
      setActiveTab(location.state.category);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.state]);
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Firestore real-time synchronization
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'cebugo_ads'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          list.sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));
          setPosts(list);
        } else {
          DEFAULT_POSTS.forEach(async (p, idx) => {
            await setDoc(doc(db, 'cebugo_ads', p.id), { ...p, order: idx });
          });
          setPosts(DEFAULT_POSTS);
        }
      },
      (err) => {
        console.error('Firestore cebugo_ads sync error:', err);
        setPosts(DEFAULT_POSTS);
      }
    );
    
    const unsubAdv = onSnapshot(collection(db, 'cebugo_advertisers'), (snapshot) => {
      const advs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setAdvertisers(advs);
    });

    return () => {
      unsub();
      unsubAdv();
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const getPostStatus = (p) => {
    if (p.startDate && todayStr < p.startDate) {
      return { active: false, status: 'scheduled', label: `게시 예정 (${p.startDate}~)` };
    }
    if (p.endDate && todayStr > p.endDate) {
      return { active: false, status: 'expired', label: `게시 종료 (~${p.endDate})` };
    }
    if (p.startDate || p.endDate) {
      const range = p.startDate && p.endDate ? `${p.startDate} ~ ${p.endDate}` : (p.startDate ? `${p.startDate}~` : `~${p.endDate}`);
      return { active: true, status: 'active', label: `게시 중 (${range})` };
    }
    return { active: true, status: 'active', label: '게시 중' };
  };

  const isPostActiveInMonth = (p, monthPrefix) => {
    if (monthPrefix === 'all') return true;
    const monthStart = `${monthPrefix}-01`;
    const [year, month] = monthPrefix.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${monthPrefix}-${lastDay}`;
    
    // If it has no start/end date, assume its "date" is its only active date.
    // If it has startDate but no endDate, it's active indefinitely.
    // If it has endDate but no startDate, it was active from beginning to endDate.
    const sDate = p.startDate || p.date || '0000-00-00';
    const eDate = p.endDate || (p.startDate ? '9999-99-99' : (p.date || '9999-99-99'));
    return sDate <= monthEnd && eDate >= monthStart;
  };

  const isPostActiveInDate = (p, targetDate) => {
    if (targetDate === 'all') return true;
    const sDate = p.startDate || p.date || '0000-00-00';
    const eDate = p.endDate || (p.startDate ? '9999-99-99' : (p.date || '9999-99-99'));
    return sDate <= targetDate && eDate >= targetDate;
  };

  const canPost = userProfile?.isAdmin || (userProfile?.level && userProfile.level >= 5);

  let minDate = todayStr;
  let maxDate = todayStr;
  posts.forEach(p => {
    if (p.date && p.date < minDate) minDate = p.date;
    if (p.startDate && p.startDate < minDate) minDate = p.startDate;
    if (p.endDate && p.endDate > maxDate && p.endDate < '9999-99-99') maxDate = p.endDate;
  });

  const allMonths = [];
  const startMonthDate = new Date(minDate.substring(0, 7) + '-01');
  const endMonthDate = new Date(maxDate.substring(0, 7) + '-01');
  let currentMonthDate = new Date(startMonthDate);
  while (currentMonthDate <= endMonthDate) {
    allMonths.push(currentMonthDate.toISOString().substring(0, 7));
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
  }
  allMonths.reverse();

  const availableMonths = allMonths.filter(m => 
    posts.some(p => p.category === activeTab && (!selectedAdvertiserId || p.advertiserId === selectedAdvertiserId) && isPostActiveInMonth(p, m))
  );
  if (filterMonth !== 'all' && !availableMonths.includes(filterMonth)) {
    availableMonths.unshift(filterMonth);
  }

  let availableDatesInMonth = [];
  if (filterMonth !== 'all') {
    const [year, month] = filterMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      const dayStr = i.toString().padStart(2, '0');
      const targetDate = `${filterMonth}-${dayStr}`;
      const hasActivePost = posts.some(p => 
        p.category === activeTab && (!selectedAdvertiserId || p.advertiserId === selectedAdvertiserId) && isPostActiveInDate(p, targetDate)
      );
      if (hasActivePost) {
        availableDatesInMonth.push(targetDate);
      }
    }
    availableDatesInMonth.reverse();
    if (filterDate !== 'all' && !availableDatesInMonth.includes(filterDate)) {
      availableDatesInMonth.unshift(filterDate);
    }
  }

  const rawTabPosts = posts
    .filter((p) => p.category === activeTab)
    .filter((p) => canPost || getPostStatus(p).status !== 'scheduled')
    .filter((p) => !selectedAdvertiserId || p.advertiserId === selectedAdvertiserId)
    .filter((p) => isPostActiveInMonth(p, filterMonth))
    .filter((p) => isPostActiveInDate(p, filterDate))
    .sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 0;
      const orderB = b.order !== undefined ? b.order : 0;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.date || '0000-00-00';
      const dateB = b.date || '0000-00-00';
      return dateA > dateB ? -1 : (dateA < dateB ? 1 : 0);
    });

  const targetPostId = location.state?.postId;
  const tabPosts = targetPostId
    ? [...rawTabPosts].sort((a, b) => (a.id === targetPostId ? -1 : b.id === targetPostId ? 1 : 0))
    : rawTabPosts;

  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditPost = (post) => {
    setEditingPost(post);
    setIsFormModalOpen(true);
  };

  const handleToggleTicker = async (post) => {
    const isCurrentlyTicker = post.isTicker === true || post.isTicker === 'true';
    const nextStatus = !isCurrentlyTicker;
    try {
      await setDoc(doc(db, 'cebugo_ads', post.id), { isTicker: nextStatus }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle ticker status:', err);
    }
  };

  const handleSavePost = async (formData) => {
    const docId = editingPost ? editingPost.id : `a_${Date.now()}`;
    const postToSave = {
      id: docId,
      ...formData,
      order: editingPost && editingPost.order !== undefined ? editingPost.order : 0,
      updatedAt: new Date().toISOString()
    };

    if (formData.category) {
      setActiveTab(formData.category);
    }

    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === docId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...postToSave };
        return copy;
      }
      return [postToSave, ...prev];
    });

    setIsFormModalOpen(false);

    try {
      await setDoc(doc(db, 'cebugo_ads', docId), postToSave, { merge: true });
    } catch (err) {
      console.error('Failed to save post to Firestore:', err);
      alert('게시물 저장 중 오류가 발생했습니다: ' + (err.message || '다시 시도해주세요.'));
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'cebugo_ads', id));
      } catch (err) {
        console.error('Failed to delete post from Firestore:', err);
      }
    }
  };

  const handleMovePost = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabPosts.length) return;

    const newList = [...tabPosts];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const updatedList = newList.map((item, idx) => ({ ...item, order: idx }));

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        batch.set(doc(db, 'cebugo_ads', item.id), { order: item.order }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to update post order in Firestore:', err);
    }
  };

  const handleSaveReorder = async (updatedList) => {
    setIsReorderModalOpen(false);
    try {
      const batch = writeBatch(db);
      updatedList.forEach((item, idx) => {
        batch.set(doc(db, 'cebugo_ads', item.id), { order: idx }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to reorder posts in Firestore:', err);
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="feed-header">
        <h1>
          <RiMegaphoneLine /> 광고 & 이벤트
          <span className="feed-header-sub"> - 세부 검증 업체 및 소식이 전하는 최신 정보와 혜택</span>
        </h1>
      </div>

      {/* Advertisers Story Style Filter */}
      {advertisers.length > 0 && (
        <div className="advertisers-story-container glass-card" style={{ marginBottom: '16px', padding: '16px', display: 'flex', gap: '16px', overflowX: 'auto', alignItems: 'flex-start' }}>
          <div 
            className="advertiser-story-item"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: selectedAdvertiserId === null ? 1 : 0.5 }}
            onClick={() => setSelectedAdvertiserId(null)}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: selectedAdvertiserId === null ? 'var(--primary)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px' }}>
              All
            </div>
            <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: selectedAdvertiserId === null ? 'bold' : 'normal' }}>전체 보기</span>
          </div>
          
          {advertisers.map(adv => (
            <div 
              key={adv.id} 
              className="advertiser-story-item"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: selectedAdvertiserId === adv.id ? 1 : 0.6, transition: 'opacity 0.2s' }}
              onClick={() => setSelectedAdvertiserId(adv.id)}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f8fafc', padding: '2px', border: selectedAdvertiserId === adv.id ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '6px', overflow: 'hidden' }}>
                {adv.logoUrl ? (
                  <img src={adv.logoUrl} alt={adv.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                    {adv.name.substring(0, 1)}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#1e293b', whiteSpace: 'nowrap', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: selectedAdvertiserId === adv.id ? 'bold' : 'normal' }}>
                {adv.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '16px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>게시일 필터:</span>
        <select 
          className="form-select" 
          style={{ width: 'auto', minWidth: '120px', padding: '6px 12px', fontSize: '0.9rem' }}
          value={filterMonth}
          onChange={(e) => {
            setFilterMonth(e.target.value);
            setFilterDate('all');
          }}
        >
          <option value="all">전체 월</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {filterMonth !== 'all' && availableDatesInMonth.length > 0 && (
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '120px', padding: '6px 12px', fontSize: '0.9rem' }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="all">전체 일</option>
            {availableDatesInMonth.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        <button 
          className="btn-secondary" 
          style={{ padding: '6px 12px', fontSize: '0.85rem', marginLeft: 'auto' }}
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setFilterMonth(today.substring(0, 7));
            setTimeout(() => setFilterDate(today), 0);
          }}
        >
          오늘 유효한 게시글
        </button>
      </div>

      {/* 2 Sub-Tabs Bar: 광고 vs 이벤트 */}
      <div className="feed-nav-tabs glass-card">
        <button
          className={`feed-tab-btn ${activeTab === 'ad' ? 'active' : ''}`}
          onClick={() => setActiveTab('ad')}
        >
          <RiMegaphoneLine className="tab-icon" />
          <span>광고 ({posts.filter((p) => p.category === 'ad').length})</span>
        </button>

        <button
          className={`feed-tab-btn ${activeTab === 'event' ? 'active' : ''}`}
          onClick={() => setActiveTab('event')}
        >
          <RiCalendarEventLine className="tab-icon" />
          <span>이벤트 ({posts.filter((p) => p.category === 'event').length})</span>
        </button>
      </div>

      {/* Admin Action Bar */}
      {canPost && (
        <div className="admin-notice-actions" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary add-notice-btn"
            onClick={() => setIsReorderModalOpen(true)}
          >
            <RiDragMove2Line /> 순서 변경
          </button>
          <button
            type="button"
            className="btn btn-primary add-notice-btn"
            onClick={handleOpenCreatePost}
          >
            <RiAddLine /> {activeTab === 'ad' ? '신규 광고 작성' : '신규 이벤트 작성'}
          </button>
        </div>
      )}

      {/* Posts List */}
      <div className="feed-list">
        {tabPosts.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <p>등록된 {activeTab === 'ad' ? '광고' : '이벤트'} 게시물이 없습니다.</p>
          </div>
        ) : (
          tabPosts.map((post, index) => {
            const imagesList = (() => {
              if (Array.isArray(post.images) && post.images.length > 0) return post.images.filter(Boolean);
              if (typeof post.images === 'string' && post.images.trim()) return [post.images.trim()];
              if (post.image) return Array.isArray(post.image) ? post.image.filter(Boolean) : [post.image];
              if (post.imgUrl) return Array.isArray(post.imgUrl) ? post.imgUrl.filter(Boolean) : [post.imgUrl];
              if (post.imageUrl) return Array.isArray(post.imageUrl) ? post.imageUrl.filter(Boolean) : [post.imageUrl];
              if (post.photo) return Array.isArray(post.photo) ? post.photo.filter(Boolean) : [post.photo];
              if (post.cover) return Array.isArray(post.cover) ? post.cover.filter(Boolean) : [post.cover];
              return [];
            })();
            const statusInfo = getPostStatus(post);
            const isExpired = statusInfo.status === 'expired';
            const isTickerActive = (post.isTicker === true || post.isTicker === 'true') && !isExpired;
            const isExpanded = !!expandedEndedPosts[post.id];
            
            const is24HoursPassed = (() => {
              if (post.category !== 'event') return false;
              const postTime = post.createdAt || post.updatedAt || (post.date ? `${post.date}T00:00:00Z` : null);
              if (!postTime) return false;
              const postDate = new Date(postTime);
              if (isNaN(postDate.getTime())) return false;
              const diffHours = (new Date() - postDate) / (1000 * 60 * 60);
              return diffHours >= 24;
            })();

            const isCollapsible = isExpired || is24HoursPassed;
            const shouldCollapse = isCollapsible && !isExpanded;

            const toggleExpand = () => {
              if (isCollapsible) {
                setExpandedEndedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }));
              }
            };

            return (
              <div 
                key={post.id} 
                className="glass-card post-card fade-in"
                style={{ 
                  color: isExpired ? 'rgba(30, 41, 59, 0.5)' : undefined, 
                  transition: 'color 0.3s' 
                }}
              >
                <div 
                  className="post-header-row"
                  style={{ cursor: isCollapsible ? 'pointer' : 'default' }}
                  onClick={isCollapsible ? toggleExpand : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`post-cat-badge ${post.category}`} style={{ opacity: isExpired ? 0.5 : 1 }}>
                      {post.category === 'ad' ? '📣 광고' : '🎉 이벤트'}
                    </span>
                    {post.advertiserId && advertisers.find(a => a.id === post.advertiserId) ? (() => {
                      const adv = advertisers.find(a => a.id === post.advertiserId);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setSelectedAdvertiserId(adv.id)}>
                          {adv.logoUrl && <img src={adv.logoUrl} alt={adv.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', opacity: isExpired ? 0.5 : 1 }} />}
                          <span className="post-place-name" style={{ fontWeight: 'bold', color: isExpired ? 'rgba(30, 41, 59, 0.5)' : undefined }}>{adv.name}</span>
                        </div>
                      );
                    })() : (
                      <span className="post-place-name" style={{ color: isExpired ? 'rgba(30, 41, 59, 0.5)' : undefined }}>{post.authorName || post.placeName}</span>
                    )}
                    {post.location && (
                      <span className="post-cat-badge" style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 600 }}>
                        📍 {post.location}
                      </span>
                    )}
                    {canPost && (() => {
                      const statusInfo = getPostStatus(post);
                      if (statusInfo.status === 'scheduled') {
                        return (
                          <span className="post-cat-badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>
                            ⏳ {statusInfo.label}
                          </span>
                        );
                      }
                      if (statusInfo.status === 'expired') {
                        return (
                          <span className="post-cat-badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600 }}>
                            🔴 {statusInfo.label}
                          </span>
                        );
                      }
                      if (post.startDate || post.endDate) {
                        return (
                          <span className="post-cat-badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 600 }}>
                            🟢 {statusInfo.label}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {isTickerActive && (
                      <span className="post-cat-badge" style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #fde047' }}>
                        📢 전광판 게시 중
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="post-date">{post.date}</span>
                    {canPost && (
                      <div className="admin-card-actions">
                        <button
                          type="button"
                          className={`btn-icon-action move ${isTickerActive ? 'active' : ''}`}
                          onClick={() => {
                            if (isExpired) {
                              alert('종료된 이벤트는 전광판에 게시할 수 없습니다.');
                              return;
                            }
                            handleToggleTicker(post);
                          }}
                          title={isExpired ? '종료된 이벤트는 전광판에 게시할 수 없습니다' : (isTickerActive ? '하단 전광판 게시 해제' : '하단 전광판에 게시하기')}
                          style={{
                            background: isExpired ? '#f1f5f9' : (isTickerActive ? '#dcfce7' : '#f1f5f9'),
                            color: isExpired ? '#94a3b8' : (isTickerActive ? '#15803d' : '#64748b'),
                            borderColor: isExpired ? '#e2e8f0' : (isTickerActive ? '#86efac' : '#cbd5e1'),
                            fontWeight: 700,
                            cursor: isExpired ? 'not-allowed' : 'pointer'
                          }}
                          disabled={isExpired}
                        >
                          <RiVolumeUpLine /> {isTickerActive ? '전광판 게시중' : '전광판 게시'}
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action move"
                          onClick={() => handleMovePost(index, 'up')}
                          disabled={index === 0}
                          title="위로 이동"
                        >
                          <RiArrowUpLine />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action move"
                          onClick={() => handleMovePost(index, 'down')}
                          disabled={index === tabPosts.length - 1}
                          title="아래로 이동"
                        >
                          <RiArrowDownLine />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action edit"
                          onClick={() => handleOpenEditPost(post)}
                          title="수정"
                        >
                          <RiEditLine /> 수정
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          onClick={() => handleDeletePost(post.id)}
                          title="삭제"
                        >
                          <RiDeleteBinLine /> 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 
                  className="post-title"
                  style={{ 
                    cursor: isCollapsible ? 'pointer' : 'default',
                    color: isExpired ? 'rgba(15, 23, 42, 0.5)' : undefined
                  }}
                  onClick={isCollapsible ? toggleExpand : undefined}
                >
                  {post.title}
                  {isCollapsible && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '8px', fontWeight: 'normal', opacity: isExpired ? 0.5 : 1 }}>
                      {isExpanded ? '▲ 접기' : '▼ 펼쳐보기'}
                    </span>
                  )}
                </h3>

                {!shouldCollapse && (
                  <>
                    <p className="post-content">{post.content}</p>

                {/* Linked Place Badge */}
                {post.placeId && (
                  <div style={{ marginBottom: '12px' }}>
                    <Link
                      to={`/place/${post.placeId}`}
                      className="contact-link-badge website"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <RiExternalLinkLine /> 해당 업체 상세보기
                    </Link>
                  </div>
                )}

                {/* Attached Images Carousel */}
                {imagesList.length > 0 && (
                    <div className="notice-card-images" style={{ margin: '12px 0' }}>
                      <ImageCarousel images={imagesList} />
                    </div>
                  )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <AdFormModal
          editingPost={editingPost}
          initialCategory={activeTab}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSavePost}
        />
      )}

      {/* Reorder Modal */}
      {isReorderModalOpen && (
        <AdReorderModal
          posts={tabPosts}
          activeCategory={activeTab}
          onClose={() => setIsReorderModalOpen(false)}
          onSave={handleSaveReorder}
        />
      )}
    </div>
  );
}
