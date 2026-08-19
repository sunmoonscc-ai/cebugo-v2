import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlaces } from '../context/PlacesContext';
import { useAuth } from '../context/AuthContext';
import PlaceCard from '../components/places/PlaceCard';
import PlacesMapView from '../components/places/PlacesMapView';
import PlaceFormModal from '../components/modals/PlaceFormModal';
import PlaceReorderModal from '../components/modals/PlaceReorderModal';
import { useCategories } from '../context/CategoriesContext';
import { calculateDistanceKm, isOpenNow } from '../utils/placeFilterHelpers';
import { 
  RiSearchLine, 
  RiMapPin2Fill, 
  RiFilter3Line, 
  RiListCheck2, 
  RiMap2Line,
  RiAddLine,
  RiDragMove2Line,
  RiStore2Line,
  RiHeartFill,
  RiHeartLine,
  RiMapPinLine
} from 'react-icons/ri';
import './ListPage.css';

export default function ListPage() {
  const location = useLocation();
  const { places, addPlace, updatePlace, deletePlace, movePlace, reorderPlaces } = usePlaces();
  const { categories } = useCategories();
  const { userProfile, appConfig } = useAuth();

  const [viewMode, setViewModeState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_view_mode') || location.state?.fromView || 'list';
    } catch (e) {
      return location.state?.fromView || 'list';
    }
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    try {
      sessionStorage.setItem('cebugo_view_mode', mode);
    } catch (e) {}
  };

  const [selectedCategory, setSelectedCategoryState] = useState(() => {
    try {
      return location.state?.fromCategory || sessionStorage.getItem('cebugo_selected_category') || 'all';
    } catch (e) {
      return location.state?.fromCategory || 'all';
    }
  });

  const setSelectedCategory = (cat) => {
    setSelectedCategoryState(cat);
    try {
      sessionStorage.setItem('cebugo_selected_category', cat);
    } catch (e) {}
  };
  const [selectedCity, setSelectedCityState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_list_city') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  const setSelectedCity = (city) => {
    setSelectedCityState(city);
    try {
      sessionStorage.setItem('cebugo_list_city', city);
    } catch (e) {}
  };

  const [searchQuery, setSearchQueryState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_list_search') || '';
    } catch (e) {
      return '';
    }
  });

  const setSearchQuery = (q) => {
    setSearchQueryState(q);
    try {
      sessionStorage.setItem('cebugo_list_search', q);
    } catch (e) {}
  };

  const [sortOption, setSortOptionState] = useState(() => {
    try {
      return sessionStorage.getItem('cebugo_list_sort') || 'name';
    } catch (e) {
      return 'name';
    }
  });

  const setSortOption = (opt) => {
    setSortOptionState(opt);
    try {
      sessionStorage.setItem('cebugo_list_sort', opt);
    } catch (e) {}
  };

  const [userCoords, setUserCoords] = useState({ lat: 10.324581378196822, lng: 124.01394151354162 }); // Default fallback location

  // Load default sort option from config
  useEffect(() => {
    if (appConfig?.listSettings?.defaultSortOption && !sessionStorage.getItem('cebugo_list_sort')) {
      setSortOption(appConfig.listSettings.defaultSortOption);
    }
  }, [appConfig?.listSettings?.defaultSortOption]);

  useEffect(() => {
    const isManual = appConfig?.siteRules?.locationPolicy === 'manual';
    const defaultLoc = appConfig?.siteRules?.defaultLocation;

    if (isManual && defaultLoc) {
      setUserCoords({ lat: defaultLoc.lat, lng: defaultLoc.lng });
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.warn("Could not get location, using default:", error);
          }
        );
      }
    }
  }, [appConfig?.siteRules]);

  // Helper function for matching city locations
  const matchesCityFilter = (place, city) => {
    if (!city || city === 'all') return true;

    const addrStr = `${place.addr || ''} ${place.location || ''}`.toLowerCase();
    const cityKey = city.toLowerCase();

    if (cityKey === 'cebu') {
      if (
        addrStr.includes('lapu-lapu') ||
        addrStr.includes('lapulapu') ||
        addrStr.includes('mactan') ||
        addrStr.includes('막탄') ||
        addrStr.includes('mandaue') ||
        addrStr.includes('만다우에') ||
        addrStr.includes('cordova') ||
        addrStr.includes('코르도바')
      ) {
        return false;
      }
      return addrStr.includes('cebu') || addrStr.includes('세부');
    }

    if (cityKey === 'lapu-lapu') {
      return (
        addrStr.includes('lapu-lapu') ||
        addrStr.includes('lapulapu') ||
        addrStr.includes('mactan') ||
        addrStr.includes('막탄') ||
        addrStr.includes('라푸라푸')
      );
    }

    if (cityKey === 'mandaue') {
      return addrStr.includes('mandaue') || addrStr.includes('만다우에');
    }

    if (cityKey === 'cordova') {
      return addrStr.includes('cordova') || addrStr.includes('코르도바');
    }

    if (cityKey === 'other') {
      const isKnownMain4 = (
        (addrStr.includes('cebu') && !addrStr.includes('oslob') && !addrStr.includes('consolacion') && !addrStr.includes('liloan') && !addrStr.includes('minglanilla') && !addrStr.includes('talisay') && !addrStr.includes('naga') && !addrStr.includes('moalboal')) ||
        addrStr.includes('lapu-lapu') ||
        addrStr.includes('lapulapu') ||
        addrStr.includes('mactan') ||
        addrStr.includes('막탄') ||
        addrStr.includes('mandaue') ||
        addrStr.includes('만다우에') ||
        addrStr.includes('cordova') ||
        addrStr.includes('코르도바')
      );
      return !isKnownMain4 || addrStr.includes('oslob') || addrStr.includes('consolacion') || addrStr.includes('liloan') || addrStr.includes('minglanilla') || addrStr.includes('talisay') || addrStr.includes('naga') || addrStr.includes('moalboal') || addrStr.includes('badian') || addrStr.includes('오스롭') || addrStr.includes('콘솔라시온');
    }

    return true;
  };

  // Admin Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Auto-scroll selected category pill to center of scroll container
  const categoryScrollRef = React.useRef(null);
  const pillRefs = React.useRef({});

  useEffect(() => {
    if (!selectedCategory) return;
    const container = categoryScrollRef.current;
    const pill = pillRefs.current[selectedCategory];

    if (container && pill) {
      const containerWidth = container.clientWidth;
      const pillLeft = pill.offsetLeft;
      const pillWidth = pill.clientWidth;

      const targetScrollLeft = pillLeft - (containerWidth / 2) + (pillWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }
  }, [selectedCategory]);

  const filteredPlaces = places.filter((place) => {
    const userFavs = userProfile?.favorites || [];
    const matchesCat = selectedCategory === 'favorite'
      ? userFavs.includes(place.id)
      : (selectedCategory === 'all' || place.category === selectedCategory);

    const matchesCity = matchesCityFilter(place, selectedCity);

    const matchesSearch =
      (place.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.addr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.explaination || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (sortOption === 'open') {
      return matchesCat && matchesCity && matchesSearch && isOpenNow(place.open);
    }
    return matchesCat && matchesCity && matchesSearch;
  });

  const sortedPlaces = [...filteredPlaces].sort((a, b) => {
    if (sortOption === 'name') {
      return (a.name || '').localeCompare(b.name || '', 'ko');
    }
    if (sortOption === 'latest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    // Default is distance sort ('distance' or 'open')
    const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
    const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
    return distA - distB;
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
      <div className="daily-header">
        <h1>
          <RiStore2Line style={{ color: '#2563eb' }} /> 업체정보
          <span className="daily-header-sub"> - 세부 현지의 분야별 업체 정보</span>
        </h1>
      </div>

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

        <div className="category-scroll" ref={categoryScrollRef}>
          <button
            ref={(el) => (pillRefs.current['favorite'] = el)}
            className={`cat-pill cat-pill-fav ${selectedCategory === 'favorite' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('favorite')}
          >
            {selectedCategory === 'favorite' ? (
              <RiHeartFill className="heart-icon" style={{ color: '#ffffff' }} />
            ) : (
              <RiHeartLine className="heart-icon" style={{ color: '#ef4444' }} />
            )}
            <span>즐겨찾기</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => (pillRefs.current[cat.id] = el)}
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
        <PlacesMapView places={sortedPlaces} userCoords={userCoords} selectedCategory={selectedCategory} />
      ) : (
        <>
          <div className="list-meta-header">
            <h2>업체 목록 <span>({sortedPlaces.length})</span></h2>
            <div className="list-meta-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div className="sort-filter-select-wrap">
                <RiMapPinLine className="filter-icon" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="sort-select"
                  title="지역 선택"
                >
                  <option value="all">전체 지역</option>
                  <option value="Cebu">Cebu</option>
                  <option value="Cordova">Cordova</option>
                  <option value="Lapu-Lapu">Lapu-Lapu</option>
                  <option value="Mandaue">Mandaue</option>
                  <option value="Other">그 외</option>
                </select>
              </div>

              <div className="sort-filter-select-wrap">
                <RiFilter3Line className="filter-icon" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="sort-select"
                  title="정렬 기준"
                >
                  <option value="name">이름순 (가나다, 기본)</option>
                  <option value="distance">거리순</option>
                  <option value="latest">최신순</option>
                  <option value="open">영업중만 보기</option>
                </select>
              </div>
            </div>
          </div>

          {sortedPlaces.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '36px 16px', textAlign: 'center' }}>
              {selectedCategory === 'favorite' ? (
                <>
                  <RiHeartLine style={{ fontSize: '2.6rem', color: '#ef4444', marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                    즐겨찾기한 업체가 없습니다.
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    관심 있는 업체의 하트(♥) 아이콘을 눌러 나만의 즐겨찾기를 만들어보세요!
                  </p>
                </>
              ) : (
                <p>검색 조건에 일치하는 업체가 없습니다.</p>
              )}
            </div>
          ) : (
            sortedPlaces.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                index={index}
                totalCount={sortedPlaces.length}
                selectedCategory={selectedCategory}
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
          defaultCategory={selectedCategory}
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
