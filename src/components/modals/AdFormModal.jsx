import React, { useState, useEffect } from 'react';
import { RiCloseLine, RiCheckLine, RiImageAddLine } from 'react-icons/ri';

export default function AdFormModal({ editingPost, initialCategory, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: initialCategory || 'ad',
    title: '',
    authorName: '',
    date: new Date().toISOString().split('T')[0],
    linkUrl: '',
    content: '',
    images: [],
    isTicker: true
  });

  useEffect(() => {
    if (editingPost) {
      setFormData({
        category: editingPost.category || 'ad',
        title: editingPost.title || '',
        authorName: editingPost.authorName || editingPost.placeName || '',
        date: editingPost.date || new Date().toISOString().split('T')[0],
        linkUrl: editingPost.linkUrl || '',
        content: editingPost.content || '',
        images: editingPost.images || (editingPost.image ? [editingPost.image] : []),
        isTicker: editingPost.isTicker !== undefined ? editingPost.isTicker : true
      });
    }
  }, [editingPost, initialCategory]);

  const handleImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.images.length + files.length > 20) {
      alert('이미지는 최대 20개까지 첨부할 수 있습니다.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => {
          if (prev.images.length >= 20) return prev;
          return {
            ...prev,
            images: [...prev.images, reader.result]
          };
        });
      };
      reader.readAsDataURL(file);
    });
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

    onSave(formData);
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content glass-card notice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%' }}>
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

            <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">작성 업체명 / 출처 *</label>
                <input
                  type="text"
                  placeholder="예: 점보씨푸드 막탄 / 세부고 파트너"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">연결 링크 / 전화 (선택)</label>
                <input
                  type="text"
                  placeholder="예: https://... 또는 09171234567"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="form-input"
                />
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
