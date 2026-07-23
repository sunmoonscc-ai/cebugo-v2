import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RiMapPinFill, RiNavigationFill, RiStarFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';

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
  html: `<div style="background:#0284c7; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(2,132,199,0.8); animation: pulse 2s infinite;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

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

export default function PlacesMapView({ places }) {
  // Default center: Cebu Mactan center coordinates (10.29, 123.99)
  const [mapCenter, setMapCenter] = useState([10.29, 123.99]);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    handleFindLocation();
  }, []);

  const handleFindLocation = () => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setLocating(false);
        },
        (error) => {
          console.warn('Geolocation fallback to default Cebu center:', error);
          // Fallback to Mactan Cebu center
          setUserLocation([10.2921, 123.9890]);
          setMapCenter([10.2921, 123.9890]);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
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
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Popup>
              <div style={{ padding: '4px', maxWidth: '200px' }}>
                <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                  <Link to={`/place/${place.id}`} style={{ color: '#0284c7' }}>{place.name}</Link>
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
