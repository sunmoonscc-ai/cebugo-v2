import React, { useState, useEffect } from 'react';
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
    linkUrl: 'k_treeshade',
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80'],
    order: 0,
    isTicker: true
  }
];

export default function PlaceFeedPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('ad'); // 'ad' (광고) or 'event' (이벤트)
  const [posts, setPosts] = useState([]);
  
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
    return () => unsub();
  }, []);

  const tabPosts = posts
    .filter((p) => p.category === activeTab)
    .sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));

  // Can user post: Admin or Level >= 5 (future extension ready)
  const canPost = userProfile?.isAdmin || (userProfile?.level && userProfile.level >= 5);

  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditPost = (post) => {
    setEditingPost(post);
    setIsFormModalOpen(true);
  };

  const handleToggleTicker = async (post) => {
    const nextStatus = !post.isTicker;
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
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'cebugo_ads', docId), postToSave, { merge: true });
    } catch (err) {
      console.error('Failed to save post to Firestore:', err);
    }
    setIsFormModalOpen(false);
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
            const imagesList = post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []);
            return (
              <div key={post.id} className="glass-card post-card fade-in">
                <div className="post-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`post-cat-badge ${post.category}`}>
                      {post.category === 'ad' ? '📣 광고' : '🎉 이벤트'}
                    </span>
                    <span className="post-place-name">{post.authorName || post.placeName}</span>
                    {post.isTicker && (
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
                          className={`btn-icon-action move ${post.isTicker ? 'active' : ''}`}
                          onClick={() => handleToggleTicker(post)}
                          title={post.isTicker ? '하단 전광판 게시 해제' : '하단 전광판에 게시하기'}
                          style={{
                            background: post.isTicker ? '#dcfce7' : '#f1f5f9',
                            color: post.isTicker ? '#15803d' : '#64748b',
                            borderColor: post.isTicker ? '#86efac' : '#cbd5e1',
                            fontWeight: 700
                          }}
                        >
                          <RiVolumeUpLine /> {post.isTicker ? '전광판 게시중' : '전광판 게시'}
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

                <h3 className="post-title">{post.title}</h3>
                <p className="post-content">{post.content}</p>

                {/* Optional Attached Link */}
                {post.linkUrl && (
                  <div style={{ marginBottom: '12px' }}>
                    <a
                      href={post.linkUrl.startsWith('http') ? post.linkUrl : `tel:${post.linkUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link-badge website"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RiExternalLinkLine /> {post.linkUrl}
                    </a>
                  </div>
                )}

                {/* Attached Images Carousel */}
                {imagesList.length > 0 && (
                  <div className="notice-card-images" style={{ margin: '12px 0' }}>
                    <ImageCarousel images={imagesList} />
                  </div>
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
