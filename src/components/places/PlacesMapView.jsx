import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RiNavigationFill, RiStarFill } from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';

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
  html: `<div style="background:#0284c7; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(2,132,199,0.8); animation: pulse 2s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
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

const createCustomCircleMarker = (place) => {
  // Vibrant blue circle marker for clear map location distinction
  const circleBg = '#2563eb';
  const circleSize = '12px';

  return L.divIcon({
    className: 'custom-circle-place-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
        <div style="width: ${circleSize}; height: ${circleSize}; border-radius: 50%; background-color: ${circleBg}; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.35); flex-shrink: 0;"></div>
        <span style="font-size: 11.5px; font-weight: 700; color: #000000; text-shadow: -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 0 4px #ffffff; line-height: 1;">
          ${place.name}
        </span>
      </div>
    `,
    iconSize: [160, 20],
    iconAnchor: [6, 10]
  });
};

// Component to dynamically recenter map view
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

const FIXED_USER_LOCATION = [10.324581378196822, 124.01394151354162];

export default function PlacesMapView({ places }) {
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState(FIXED_USER_LOCATION);
  const [userLocation, setUserLocation] = useState(FIXED_USER_LOCATION);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    handleFindLocation();
  }, []);

  const handleFindLocation = () => {
    setUserLocation(FIXED_USER_LOCATION);
    setMapCenter(FIXED_USER_LOCATION);
  };

  return (
    <div className="map-view-container glass-card fade-in" style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
      <button 
        onClick={handleFindLocation}
        className="btn btn-secondary locate-btn"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          background: 'white',
          fontSize: '0.85rem'
        }}
      >
        <RiNavigationFill style={{ color: '#0284c7' }} />
        {locating ? '위치 찾는 중...' : '내 위치로 중심 이동'}
      </button>

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%' }}
      >
        <RecenterMap center={mapCenter} />
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
        {places.map((place) => (
          <Marker 
            key={place.id} 
            position={[place.lat, place.lng]}
            icon={createCustomCircleMarker(place)}
            eventHandlers={{
              click: () => {
                navigate(`/place/${place.id}`, { state: { fromView: 'map' } });
              }
            }}
          >
            <Popup>
              <div style={{ padding: '4px', maxWidth: '200px' }}>
                <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                  <Link to={`/place/${place.id}`} state={{ fromView: 'map' }} style={{ color: '#0284c7' }}>{place.name}</Link>
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
