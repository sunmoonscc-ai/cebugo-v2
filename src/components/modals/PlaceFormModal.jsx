import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../constants/categories';
import { RiCloseLine, RiCheckLine, RiImageAddLine, RiMapPinLine } from 'react-icons/ri';
import './PlaceFormModal.css';

const LOCATION_PRESETS = [
  { label: '막탄 마리바고', lat: 10.2858, lng: 123.9922 },
  { label: '막탄 제이파크 부근', lat: 10.2831, lng: 123.9911 },
  { label: '세부시티 아얄라', lat: 10.3173, lng: 123.9048 },
  { label: '세부시티 IT파크', lat: 10.3298, lng: 123.9060 },
  { label: '막탄 공항 부근', lat: 10.3120, lng: 123.9790 }
];

export default function PlaceFormModal({ editingPlace, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant',
    addr: '',
    lat: 10.2858,
    lng: 123.9922,
    open: '',
    breakTime: '',
    phone: '',
    sns: '',
    explaination: '',
    images: {
      cover: [],
      facility: [],
      product: [],
      menu: []
    }
  });

  const [activeImageTab, setActiveImageTab] = useState('cover'); // cover, facility, product, menu

  useEffect(() => {
    if (editingPlace) {
      setFormData({
        name: editingPlace.name || '',
        category: editingPlace.category || 'restaurant',
        addr: editingPlace.addr || '',
        lat: editingPlace.lat || 10.2858,
        lng: editingPlace.lng || 123.9922,
        open: editingPlace.open || '',
        breakTime: editingPlace.breakTime || '',
        phone: editingPlace.phone || '',
        sns: editingPlace.sns || '',
        explaination: editingPlace.explaination || '',
        images: {
          cover: editingPlace.images?.cover || [],
          facility: editingPlace.images?.facility || [],
          product: editingPlace.images?.product || [],
          menu: editingPlace.images?.menu || []
        }
      });
    }
  }, [editingPlace]);

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      lat: preset.lat,
      lng: preset.lng
    }));
  };

  const handleImageFileUpload = (e, imgType) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => {
          const currentTypeImgs = prev.images[imgType] || [];
          if (currentTypeImgs.length >= 20) {
            alert('각 분류당 최대 20개까지 첨부 가능합니다.');
            return prev;
          }
          return {
            ...prev,
            images: {
              ...prev.images,
              [imgType]: [...currentTypeImgs, reader.result]
            }
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (imgType, index) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [imgType]: (prev.images[imgType] || []).filter((_, idx) => idx !== index)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('업체명을 입력해 주세요.');
      return;
    }
    if (!formData.addr.trim()) {
      alert('업체 주소를 입력해 주세요.');
      return;
    }
    if (!formData.explaination.trim()) {
      alert('업체 소개글을 입력해 주세요.');
      return;
    }

    onSave({
      ...formData,
      lat: Number(formData.lat) || 10.2858,
      lng: Number(formData.lng) || 123.9922
    });
  };

  const selectableCategories = CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content glass-card place-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingPlace ? '업체 정보 수정' : '신규 업체 등록'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="place-form">
          <div className="modal-body-scroll">
            {/* 기본 정보 */}
            <div className="form-group-row">
              <div className="form-group flex-2">
                <label className="form-label">업체명 *</label>
                <input
                  type="text"
                  placeholder="예: 점보씨푸드 막탄 (Jumbo Seafood Mactan)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">카테고리 *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  {selectableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 주소 및 좌표 */}
            <div className="form-group">
              <label className="form-label">주소 / 위치 *</label>
              <input
                type="text"
                placeholder="예: Maribago, Lapu-Lapu City, Cebu"
                value={formData.addr}
                onChange={(e) => setFormData({ ...formData, addr: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>지도 좌표 (위도 lat, 경도 lng)</label>
                <span className="field-hint"><RiMapPinLine /> 빠른 좌표 선택</span>
              </div>

              <div className="location-presets-row">
                {LOCATION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-btn"
                    onClick={() => handleApplyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="form-group-row" style={{ marginTop: '8px' }}>
                <div className="form-group flex-1">
                  <span className="sub-label">위도 (Lat)</span>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group flex-1">
                  <span className="sub-label">경도 (Lng)</span>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* 영업시간 및 휴무일 */}
            <div className="form-group-row">
              <div className="form-group flex-1">
                <label className="form-label">영업시간</label>
                <input
                  type="text"
                  placeholder="예: 11:00 AM - 10:00 PM"
                  value={formData.open}
                  onChange={(e) => setFormData({ ...formData, open: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">브레이크타임 / 휴무일</label>
                <input
                  type="text"
                  placeholder="예: 연중무휴 / 15:00 - 17:00"
                  value={formData.breakTime}
                  onChange={(e) => setFormData({ ...formData, breakTime: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {/* 연락처 및 카톡/SNS */}
            <div className="form-group-row">
              <div className="form-group flex-1">
                <label className="form-label">전화번호 (현지번호)</label>
                <input
                  type="text"
                  placeholder="예: 09171234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">카톡 / SNS 아이디</label>
                <input
                  type="text"
                  placeholder="예: k_jumboseafood (k_=카톡, l_=라인)"
                  value={formData.sns}
                  onChange={(e) => setFormData({ ...formData, sns: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {/* 상세 소개글 */}
            <div className="form-group">
              <label className="form-label">업체 상세 소개글 *</label>
              <textarea
                rows="4"
                placeholder="업체에 대한 상세한 안내 및 주요 서비스 내용을 입력하세요."
                value={formData.explaination}
                onChange={(e) => setFormData({ ...formData, explaination: e.target.value })}
                className="form-textarea"
                required
              />
            </div>

            {/* 4종 분류 이미지 관리 */}
            <div className="form-group">
              <label className="form-label">업체 사진 첨부 (4가지 분류별 관리)</label>
              
              <div className="img-type-subtabs">
                <button
                  type="button"
                  className={activeImageTab === 'cover' ? 'active' : ''}
                  onClick={() => setActiveImageTab('cover')}
                >
                  대표사진 ({formData.images.cover?.length || 0})
                </button>
                <button
                  type="button"
                  className={activeImageTab === 'facility' ? 'active' : ''}
                  onClick={() => setActiveImageTab('facility')}
                >
                  시설사진 ({formData.images.facility?.length || 0})
                </button>
                <button
                  type="button"
                  className={activeImageTab === 'product' ? 'active' : ''}
                  onClick={() => setActiveImageTab('product')}
                >
                  제품사진 ({formData.images.product?.length || 0})
                </button>
                <button
                  type="button"
                  className={activeImageTab === 'menu' ? 'active' : ''}
                  onClick={() => setActiveImageTab('menu')}
                >
                  메뉴판 ({formData.images.menu?.length || 0})
                </button>
              </div>

              <div className="image-upload-wrapper" style={{ marginTop: '10px' }}>
                {(formData.images[activeImageTab]?.length || 0) < 20 && (
                  <label className="image-upload-dropzone">
                    <RiImageAddLine className="upload-icon" />
                    <span>이미지 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageFileUpload(e, activeImageTab)}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {(formData.images[activeImageTab] || []).map((imgUrl, idx) => (
                  <div key={idx} className="uploaded-img-preview">
                    <img src={imgUrl} alt={`preview-${idx}`} />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => handleRemoveImage(activeImageTab, idx)}
                      title="삭제"
                    >
                      <RiCloseLine />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              <RiCheckLine /> {editingPlace ? '수정 완료' : '등록 하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
