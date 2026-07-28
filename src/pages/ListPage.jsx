import React, { useState, useEffect } from 'react';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import PlaceCard from '../components/places/PlaceCard';
import PlacesMapView from '../components/places/PlacesMapView';
import PlaceFormModal from '../components/modals/PlaceFormModal';
import PlaceReorderModal from '../components/modals/PlaceReorderModal';
import { CATEGORIES } from '../constants/categories';
import { calculateDistanceKm, isOpenNow } from '../utils/placeFilterHelpers';
import { 
  RiSearchLine, 
  RiMapPin2Fill, 
  RiFilter3Line, 
  RiListCheck2, 
  RiMap2Line,
  RiAddLine,
  RiDragMove2Line
} from 'react-icons/ri';
import './ListPage.css';

export default function ListPage() {
  const { places, addPlace, updatePlace, deletePlace, movePlace, reorderPlaces } = usePlaces();
  const { userProfile } = useAuth();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default'); // 'default', 'name', 'latest', 'distance', 'open'
  const [userCoords, setUserCoords] = useState({ lat: 10.2858, lng: 123.9922 }); // Default Cebu Mactan center

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  // Admin Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const filteredPlaces = places.filter((place) => {
    const matchesCat = selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch =
      (place.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.addr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.explaination || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (sortOption === 'open') {
      return matchesCat && matchesSearch && isOpenNow(place.open);
    }
    return matchesCat && matchesSearch;
  });

  const sortedPlaces = [...filteredPlaces].sort((a, b) => {
    if (sortOption === 'name') {
      return (a.name || '').localeCompare(b.name || '', 'ko');
    }
    if (sortOption === 'latest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortOption === 'distance') {
      const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
      const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
      return distA - distB;
    }
    return 0;
  });

  const handleOpenCreatePlace = () => {
    setEditingPlace(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditPlace = (place) => {
    setEditingPlace(place);
    setIsFormModalOpen(true);
  };

  const handleSavePlace = (formData) => {
    if (editingPlace) {
      updatePlace(editingPlace.id, formData);
    } else {
      addPlace(formData);
    }
    setIsFormModalOpen(false);
  };

  const handleDeletePlace = (id) => {
    if (window.confirm('정말로 이 업체 정보를 삭제하시겠습니까?')) {
      deletePlace(id);
    }
  };

  const handleSaveReorder = (updatedList) => {
    reorderPlaces(updatedList);
    setIsReorderModalOpen(false);
  };

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

      {/* Admin Actions Header */}
      {userProfile?.isAdmin && (
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
            onClick={handleOpenCreatePlace}
          >
            <RiAddLine /> 신규 업체 등록
          </button>
        </div>
      )}

      {/* Main View: List or Map */}
      {viewMode === 'map' ? (
        <PlacesMapView places={sortedPlaces} />
      ) : (
        <>
          <div className="list-meta-header">
            <h2>업체 목록 <span>({sortedPlaces.length})</span></h2>
            <div className="sort-filter-select-wrap">
              <RiFilter3Line className="filter-icon" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="sort-select"
              >
                <option value="default">기본순 (관리자 추천 / 가나다)</option>
                <option value="name">이름순 (가나다)</option>
                <option value="latest">최신순</option>
                <option value="distance">거리순 (현위치/세부중심)</option>
                <option value="open">영업중만 보기</option>
              </select>
            </div>
          </div>

          {sortedPlaces.length === 0 ? (
            <div className="empty-state glass-card">
              <p>검색 조건에 일치하는 업체가 없습니다.</p>
            </div>
          ) : (
            sortedPlaces.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                index={index}
                totalCount={sortedPlaces.length}
                onMove={movePlace}
                onEdit={handleOpenEditPlace}
                onDelete={handleDeletePlace}
              />
            ))
          )}
        </>
      )}

      {/* Admin Place Create / Edit Modal */}
      {isFormModalOpen && (
        <PlaceFormModal
          editingPlace={editingPlace}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSavePlace}
        />
      )}

      {/* Admin Place Reorder Modal */}
      {isReorderModalOpen && (
        <PlaceReorderModal
          places={places}
          onClose={() => setIsReorderModalOpen(false)}
          onSave={handleSaveReorder}
        />
      )}
    </div>
  );
}
