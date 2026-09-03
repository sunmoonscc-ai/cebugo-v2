import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RiNavigationFill, RiStarFill } from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';
import { getCategoryColor } from '../../utils/categoryColors';

// Fix default marker icon issues in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user location pin icon
const userIcon = L.divIcon({
  className: 'user-custom-pin',
  html: `<div style="background:#ef4444; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px rgba(239,68,68,1); animation: pulse 1.5s infinite;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const isFoodOrCafeOrBar = (place) => {
  const cat = (place.category || '').toLowerCase();
  const catName = (place.categoryName || '').toLowerCase();
  const name = (place.name || '').toLowerCase();

  return (
    cat === 'restaurant' ||
    cat === 'cafe' ||
    catName.includes('먹을거리') ||
    catName.includes('마실거리') ||
    catName.includes('음식') ||
    catName.includes('카페') ||
    catName.includes('바') ||
    name.includes('카페') ||
    name.includes('cafe') ||
    name.includes('베이커리') ||
    name.includes('bakery') ||
    name.includes('bar') ||
    name.includes('pub') ||
    name.includes('식당')
  );
};

const createCustomCircleMarker = (place, alignLeft = false) => {
  const circleBg = getCategoryColor(place.category);
  const circleSize = '9px'; // 9px로 증가

  let displayName = place.name;
  if (displayName.length > 15) {
    displayName = displayName.substring(0, 15) + '...';
  }

  if (alignLeft) {
    return L.divIcon({
      className: 'custom-circle-place-marker',
      html: `
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; cursor: pointer; white-space: nowrap; transform: translateX(calc(-100% + 9px));">
          <span class="place-name-label" style="font-size: 11.5px; font-weight: 700; color: #000000; text-shadow: -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 0 4px #ffffff; line-height: 1; text-align: right;">
            ${displayName}
          </span>
          <div style="width: ${circleSize}; height: ${circleSize}; border-radius: 50%; background-color: ${circleBg}; border: 1.5px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
        </div>
      `,
      iconSize: [160, 20],
      iconAnchor: [4.5, 10]
    });
  }

  return L.divIcon({
    className: 'custom-circle-place-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
        <div style="width: ${circleSize}; height: ${circleSize}; border-radius: 50%; background-color: ${circleBg}; border: 1.5px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
        <span class="place-name-label" style="font-size: 11.5px; font-weight: 700; color: #000000; text-shadow: -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 0 4px #ffffff; line-height: 1;">
          ${displayName}
        </span>
      </div>
    `,
    iconSize: [160, 20],
    iconAnchor: [4.5, 10]
  });
};

const FIXED_USER_LOCATION = [10.324581378196822, 124.01394151354162];

const getSavedMapCenter = (defaultCenter) => {
  try {
    const saved = sessionStorage.getItem('cebugo_map_center');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaultCenter;
};

const getSavedMapZoom = () => {
  try {
    const saved = sessionStorage.getItem('cebugo_map_zoom');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return 13;
};

// Component to dynamically track and save map center & zoom
function MapStateTracker() {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      const z = map.getZoom();
      sessionStorage.setItem('cebugo_map_center', JSON.stringify([c.lat, c.lng]));
      sessionStorage.setItem('cebugo_map_zoom', JSON.stringify(z));
    },
    zoomend: () => {
      const c = map.getCenter();
      const z = map.getZoom();
      sessionStorage.setItem('cebugo_map_center', JSON.stringify([c.lat, c.lng]));
      sessionStorage.setItem('cebugo_map_zoom', JSON.stringify(z));
    }
  });
  return null;
}

// Component to dynamically recenter map view
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function PlacesMapView({ places, userCoords, selectedCategory }) {
  const navigate = useNavigate();
  const defaultCenter = userCoords ? [userCoords.lat, userCoords.lng] : FIXED_USER_LOCATION;
  const [mapCenter, setMapCenter] = useState(() => getSavedMapCenter(defaultCenter));
  const [mapZoom, setMapZoom] = useState(getSavedMapZoom);
  const userLocation = userCoords ? [userCoords.lat, userCoords.lng] : null;
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    // If userCoords just resolved (e.g., GPS returned), recenter map to their location
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (userCoords) {
      setMapCenter([userCoords.lat, userCoords.lng]);
    }
  }, [userCoords]);

  const handleFindLocation = () => {
    const targetLoc = userLocation || FIXED_USER_LOCATION;
    setMapCenter(targetLoc);
    setMapZoom(18); // 최대로 확대
    sessionStorage.setItem('cebugo_map_center', JSON.stringify(targetLoc));
    sessionStorage.setItem('cebugo_map_zoom', JSON.stringify(18));
  };

  // Pre-calculate alignments to prevent overlapping text for close markers
  const validPlaces = useMemo(() => {
    return places.filter(place => 
      place.lat && place.lng && 
      String(place.lat).trim() !== '' && String(place.lng).trim() !== '' &&
      place.addr && String(place.addr).trim() !== ''
    );
  }, [places]);

  const markerAlignments = useMemo(() => {
    const alignments = {};
    const positions = [];
    
    validPlaces.forEach(p => {
      let conflict = false;
      for (const pos of positions) {
        // ~1mm distance at max zoom is approx 1-3 meters
        // 0.00005 degrees is ~5.5 meters, enough to detect overlap
        const dLat = Math.abs(p.lat - pos.lat);
        const dLng = Math.abs(p.lng - pos.lng);
        if (dLat < 0.00005 && dLng < 0.00005) {
          conflict = true;
          break;
        }
      }
      
      if (conflict) {
        alignments[p.id] = true; // align left
      } else {
        alignments[p.id] = false; // align right
        positions.push({ lat: p.lat, lng: p.lng });
      }
    });
    
    return alignments;
  }, [validPlaces]);

  return (
    <div className="map-container-wrapper" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 180px)', minHeight: '400px', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Current Location Button */}
      <button 
        type="button"
        onClick={handleFindLocation}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '600',
          color: '#0f172a',
          fontSize: '0.85rem'
        }}
      >
        <RiNavigationFill style={{ color: '#0284c7' }} />
        내 위치로 중심 이동
      </button>

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%' }}
      >
        <RecenterMap center={mapCenter} zoom={mapZoom} />
        <MapStateTracker />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>내 현재 위치</strong>
            </Popup>
          </Marker>
        )}

        {/* Places Markers */}
        {validPlaces.map((place) => (
          <Marker 
            key={place.id} 
            position={[place.lat, place.lng]}
            icon={createCustomCircleMarker(place, markerAlignments[place.id])}
            eventHandlers={{
              click: () => {
                navigate(`/place/${place.id}`, { state: { fromView: 'map', fromCategory: selectedCategory } });
              }
            }}
          >
            <Popup>
              <div style={{ padding: '4px', maxWidth: '200px' }}>
                <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                  <Link to={`/place/${place.id}`} state={{ fromView: 'map', fromCategory: selectedCategory }} style={{ color: '#0284c7' }}>{place.name}</Link>
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0' }}>{place.addr}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ca8a04', fontSize: '0.8rem', marginTop: '4px' }}>
                  <RiStarFill /> {place.rating} ({place.reviewsCount})
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
