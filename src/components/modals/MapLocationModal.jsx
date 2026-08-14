import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RiCloseLine, RiMapPinLine, RiCheckLine } from 'react-icons/ri';
import './MapLocationModal.css';

// Fix for default marker icon in leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapLocationModal({ onClose, onSave, initialLocation }) {
  // Default to Cebu City IT Park if no initial location
  const [position, setPosition] = useState(
    initialLocation || { lat: 10.3298, lng: 123.9065 }
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content glass-card fade-in" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', padding: '0', overflow: 'hidden' }}>
        
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: '#1e293b' }}>
            <RiMapPinLine style={{ color: 'var(--primary)' }} />
            내 동네 위치 설정
          </h3>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>
            <RiCloseLine />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0', height: '400px', width: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', pointerEvents: 'none' }}>
            지도를 클릭하여 위치를 선택하세요
          </div>
          <MapContainer 
            center={position} 
            zoom={14} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            onClick={onClose}
          >
            취소
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            onClick={() => onSave({ lat: position.lat, lng: position.lng })}
          >
            <RiCheckLine />
            이 위치로 설정하기
          </button>
        </div>
      </div>
    </div>
  );
}
