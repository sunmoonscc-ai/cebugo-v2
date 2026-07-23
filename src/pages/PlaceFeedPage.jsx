import React, { useState } from 'react';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import { RiCalendarEventLine, RiAddLine, RiStore2Line } from 'react-icons/ri';
import './PlaceFeedPage.css';

export default function PlaceFeedPage() {
  const { places } = usePlaces();
  const { userProfile } = useAuth();
  const [selectedPlaceId, setSelectedPlaceId] = useState('all');

  const posts = [
    {
      id: 'post_1',
      placeId: 'place_1',
      placeName: '점보씨푸드 막탄',
      date: '2026-07-23',
      title: '당일 수급 신선 알리망오 크랩 입고 안내',
      content: '오늘 아침 현지 어시장에서 갓 수급한 A급 세부 알리망오 크랩 50kg이 입고되었습니다! 수량이 한정되어 있으니 카카오톡으로 사전 예약해 주세요.',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
    },
    {
      id: 'post_2',
      placeId: 'place_2',
      placeName: '트리쉐이드 스파 막탄점',
      date: '2026-07-22',
      title: '여름 시즌 한정 오가닉 코코넛 아로마 오일 스파 프로모션',
      content: '7월 한 달간 90분 마사지 이용 시 시그니처 코코넛 페이셜 수면팩을 무료 서비스로 제공해 드립니다.',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80'
    }
  ];

  const filteredPosts = posts.filter(
    (p) => selectedPlaceId === 'all' || p.placeId === selectedPlaceId
  );

  return (
    <div className="page-content fade-in">
      <div className="feed-header">
        <h1><RiCalendarEventLine /> 업체 소식 및 갤러리 피드</h1>
        <p>세부 검증 업체들이 직접 작성하는 날짜별 최신 소식 및 혜택</p>
      </div>

      {/* Place Filter Bar */}
      <div className="feed-filter-bar glass-card">
        <RiStore2Line className="filter-icon" />
        <select
          value={selectedPlaceId}
          onChange={(e) => setSelectedPlaceId(e.target.value)}
          className="place-select"
        >
          <option value="all">전체 업체 소식 보기</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Posts List */}
      <div className="feed-list">
        {filteredPosts.map((post) => (
          <div key={post.id} className="glass-card post-card fade-in">
            <div className="post-header-row">
              <span className="post-place-name">{post.placeName}</span>
              <span className="post-date">{post.date}</span>
            </div>

            <h3 className="post-title">{post.title}</h3>
            <p className="post-content">{post.content}</p>

            {post.image && (
              <img src={post.image} alt={post.title} className="post-img" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
