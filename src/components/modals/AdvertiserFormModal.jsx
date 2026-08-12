import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiCheckLine, RiImageAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { uploadImageToFirebaseStorage } from '../../utils/imageHelper';
import { usePlaces } from '../../context/PlacesContext';
import './PlaceFormModal.css'; // Reuse form modal styles

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function AdvertiserFormModal({ editingAdvertiser, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    placeId: '',
    logoUrl: '',
    googleEmail: ''
  });
  
  const { places = [] } = usePlaces() || {};
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingAdvertiser) {
      setFormData({
        name: editingAdvertiser.name || '',
        description: editingAdvertiser.description || '',
        placeId: editingAdvertiser.placeId || '',
        logoUrl: editingAdvertiser.logoUrl || '',
        googleEmail: editingAdvertiser.googleEmail || ''
      });
    }
  }, [editingAdvertiser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 400, 400); // logos can be smaller
      if (compressed) {
        const cloudUrl = await uploadImageToFirebaseStorage(compressed, 'advertisers');
        setFormData(prev => ({ ...prev, logoUrl: cloudUrl || compressed }));
      }
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('업체명을 입력해 주세요.');
      return;
    }
    onSave(formData);
  };

  return createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content glass-card notice-modal" style={{ maxWidth: '500px', width: '92%' }}>
        <div className="modal-header">
          <h2>{editingAdvertiser ? '고정 업체 수정' : '신규 고정 업체 등록'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="notice-form">
          <div className="modal-body-scroll">
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">업체명 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="예: 점보씨푸드 막탄"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">소개글</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="업체에 대한 짧은 소개글을 입력하세요."
                rows={3}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">광고주 구글 계정 (사용자 연결용)</label>
              <input
                type="email"
                name="googleEmail"
                value={formData.googleEmail}
                onChange={handleChange}
                placeholder="예: advertiser@gmail.com"
                className="form-input"
              />
              <span className="field-hint" style={{ marginTop: '4px', display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                ※ 구글 계정을 입력하면 해당 사용자가 연결된 업체의 정보를 수정할 수 있습니다.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">연결할 업체 (세부페이지 이동용)</label>
              <select
                name="placeId"
                value={formData.placeId}
                onChange={handleChange}
                className="form-select"
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- 업체 선택 (선택 안함) --</option>
                {places.map(place => (
                  <option key={place.id} value={place.id}>
                    {place.name} ({place.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">프로필 / 로고 이미지</label>
              <div className="image-upload-area">
                {!formData.logoUrl && (
                  <label className="upload-btn">
                    <RiImageAddLine size={24} />
                    <span>{isUploading ? '업로드 중...' : '사진 선택'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
                {formData.logoUrl && (
                  <div className="preview-img-wrap" style={{position: 'relative', width:'100px', height:'100px'}}>
                    <img src={formData.logoUrl} alt="Logo" className="preview-img" style={{borderRadius:'50%', width:'100%', height:'100%', objectFit: 'cover'}} />
                    <button type="button" className="remove-img-btn" onClick={handleRemoveImage}>
                      <RiDeleteBinLine />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={isUploading}>
              <RiCheckLine /> {editingAdvertiser ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
