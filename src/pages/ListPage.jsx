import React, { useState } from 'react';
import { usePlaces } from '../context/PlacesContext';
import PlaceCard from '../components/places/PlaceCard';
import PlacesMapView from '../components/places/PlacesMapView';
import { 
  RiSearchLine, 
  RiMapPin2Fill, 
  RiFilter3Line, 
  RiListCheck2, 
  RiMap2Line 
} from 'react-icons/ri';
import './ListPage.css';

// Reordered categories based on exact user specification
const CATEGORIES = [
  { id: 'all', name: '전체' },
  { id: 'education', name: '교육' },
  { id: 'public', name: '기관' },
  { id: 'hospital', name: '병원' },
  { id: 'massage', name: '뷰티·마사지' },
  { id: 'stay', name: '숙박' },
  { id: 'service', name: '서비스' },
  { id: 'attraction', name: '볼거리' },
  { id: 'shopping', name: '살거리' },
  { id: 'restaurant', name: '먹을거리' },
  { id: 'vehicle', name: '탈거리' },
  { id: 'cafe', name: '마실거리' },
  { id: 'activity', name: '즐길거리' }
];

export default function ListPage() {
  const { places } = usePlaces();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = places.filter((place) => {
    const matchesCat = selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.addr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.explaination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="page-content fade-in">
      <section className="hero-banner">
        <div className="hero-badge">
          <RiMapPin2Fill /> 세부(Cebu) 현지 정보 허브
        </div>
        <h1 className="hero-title">믿을 수 있는 세부 업체 & 커뮤니티</h1>
        <p className="hero-desc">실시간 리뷰, 혜택 정보 및 검증된 현지 중고거래</p>
      </section>

      {/* Mode Switcher & Category Filter */}
      <div className="search-filter-box glass-card">
        {/* List / Map Switcher Tabs */}
        <div className="view-mode-switcher">
          <button
            className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <RiListCheck2 /> 목록보기
          </button>
          <button
            className={`view-tab ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <RiMap2Line /> 지도보기
          </button>
        </div>

        <div className="search-input-wrap">
          <RiSearchLine className="search-icon" />
          <input
            type="text"
            placeholder="업체명, 지역, 키워드로 검색 (예: 막탄, 마사지, 병원)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main View: List or Map */}
      {viewMode === 'map' ? (
        <PlacesMapView places={filteredPlaces} />
      ) : (
        <>
          <div className="list-meta-header">
            <h2>업체 목록 <span>({filteredPlaces.length})</span></h2>
            <span className="filter-summary"><RiFilter3Line /> 최신순</span>
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="empty-state glass-card">
              <p>검색 조건에 일치하는 업체가 없습니다.</p>
            </div>
          ) : (
            filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} />)
          )}
        </>
      )}
    </div>
  );
}
