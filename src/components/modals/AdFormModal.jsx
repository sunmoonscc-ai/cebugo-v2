import React, { useState, useEffect } from 'react';
import { RiCloseLine, RiCheckLine, RiImageAddLine } from 'react-icons/ri';
import { usePlaces } from '../../context/PlacesContext';

const LOCATION_OPTIONS = ['전체', 'Cebu', 'Cordova', 'Lapu-Lapu', 'Mandaue', '기타'];

function parseLocationOption(locStr) {
  if (!locStr) return null;
  const str = String(locStr).trim();
  if (!str) return null;

  const exact = LOCATION_OPTIONS.find((opt) => opt.toLowerCase() === str.toLowerCase());
  if (exact) return exact;

  if (/lapu-lapu|lapulapu|막탄/i.test(str)) return 'Lapu-Lapu';
  if (/cordova|코르도바/i.test(str)) return 'Cordova';
  if (/mandaue|만다우에/i.test(str)) return 'Mandaue';
  if (/cebu|세부/i.test(str)) return 'Cebu';
  if (/기타/i.test(str)) return '기타';

  return null;
}

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

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function AdFormModal({ editingPost, initialCategory, onClose, onSave }) {
  const { places = [] } = usePlaces() || {};

  const [formData, setFormData] = useState({
    category: initialCategory || 'ad',
    title: '',
    authorName: '',
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    location: '전체',
    content: '',
    images: [],
    isTicker: true
  });

  useEffect(() => {
    if (editingPost) {
      let initLoc = editingPost.location || '전체';

      if (!editingPost.location && (editingPost.authorName || editingPost.placeName) && places.length > 0) {
        const author = (editingPost.authorName || editingPost.placeName || '').trim().toLowerCase();
        const matched = places.find((p) => p.name && (p.name.toLowerCase().includes(author) || author.includes(p.name.toLowerCase())));
        if (matched) {
          const rawLoc = matched.location || matched.addr || matched.region;
          const autoLoc = parseLocationOption(rawLoc);
          if (autoLoc) initLoc = autoLoc;
        }
      }

      setFormData({
        category: editingPost.category || 'ad',
        title: editingPost.title || '',
        authorName: editingPost.authorName || editingPost.placeName || '',
        date: editingPost.date || new Date().toISOString().split('T')[0],
        startDate: editingPost.startDate || '',
        endDate: editingPost.endDate || '',
        location: initLoc,
        content: editingPost.content || '',
        images: editingPost.images || (editingPost.image ? [editingPost.image] : []),
        isTicker: editingPost.isTicker !== undefined ? editingPost.isTicker : true
      });
    }
  }, [editingPost, initialCategory, places]);

  const handleAuthorNameChange = (e) => {
    const val = e.target.value;
    let autoLoc = null;

    if (val.trim() && places && places.length > 0) {
      const searchKey = val.trim().toLowerCase();
      const matched = places.find((p) => {
        if (!p.name) return false;
        const pName = p.name.toLowerCase();
        return pName.includes(searchKey) || searchKey.includes(pName);
      });

      if (matched) {
        const rawLoc = matched.location || matched.addr || matched.region;
        const parsed = parseLocationOption(rawLoc);
        if (parsed) autoLoc = parsed;
      }
    }

    setFormData((prev) => ({
      ...prev,
      authorName: val,
      ...(autoLoc ? { location: autoLoc } : {})
    }));
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.images.length + files.length > 20) {
      alert('이미지는 최대 20개까지 첨부할 수 있습니다.');
      return;
    }

    for (const file of files) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        if (compressed) {
          setFormData((prev) => {
            if (prev.images.length >= 20) return prev;
            return {
              ...prev,
              images: [...prev.images, compressed]
            };
          });
        }
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }
    if (!formData.authorName.trim()) {
      alert('작성 업체명/출처를 입력해 주세요.');
      return;
    }
    if (!formData.content.trim()) {
      alert('본문 내용을 입력해 주세요.');
      return;
    }

    onSave({
      category: formData.category || 'ad',
      title: formData.title.trim(),
      authorName: formData.authorName.trim(),
      date: formData.date || new Date().toISOString().split('T')[0],
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      location: formData.location || '전체',
      content: formData.content.trim(),
      images: formData.images || [],
      isTicker: formData.isTicker !== undefined ? formData.isTicker : true
    });
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content glass-card notice-modal" style={{ maxWidth: '600px', width: '92%' }}>
        <div className="modal-header">
          <h2>{editingPost ? (formData.category === 'ad' ? '광고 수정' : '이벤트 수정') : (formData.category === 'ad' ? '신규 광고 작성' : '신규 이벤트 작성')}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="notice-form">
          <div className="modal-body-scroll">
            <div className="form-group">
              <label className="form-label">분류 선택 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                <option value="ad">📣 광고</option>
                <option value="event">🎉 이벤트</option>
              </select>
            </div>

            <div className="form-group" style={{ background: '#f0f9ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isTicker || false}
                  onChange={(e) => setFormData({ ...formData, isTicker: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                />
                <span>📢 하단 전광판(광고판) 텍스트 스크롤에 게재하기</span>
              </label>
            </div>

            <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">제목 *</label>
                <input
                  type="text"
                  placeholder="예: 당일 수급 신선 알리망오 크랩 입고 안내"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">작성일</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group-row" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">게시 시작일 (선택)</label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">게시 종료일 (선택)</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">작성 업체명 / 출처 *</label>
                <input
                  type="text"
                  placeholder="예: 점보씨푸드 막탄 / 세부고 파트너"
                  value={formData.authorName}
                  onChange={handleAuthorNameChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">위치 (지역)</label>
                <select
                  value={formData.location || '전체'}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-select"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">본문 내용 *</label>
              <textarea
                rows="5"
                placeholder="상세 내용을 입력하세요."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="form-textarea"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">이미지 첨부 ({formData.images.length} / 20개)</label>
                <span className="field-hint">최대 20개 파일 첨부 가능</span>
              </div>

              <div className="image-upload-wrapper">
                {formData.images.length < 20 && (
                  <label className="image-upload-dropzone">
                    <RiImageAddLine className="upload-icon" />
                    <span>이미지 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {formData.images.map((imgUrl, idx) => (
                  <div key={idx} className="uploaded-img-preview">
                    <img src={imgUrl} alt={`preview-${idx}`} />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => handleRemoveImage(idx)}
                      title="이미지 삭제"
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
              <RiCheckLine /> {editingPost ? '수정 완료' : '등록 하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
