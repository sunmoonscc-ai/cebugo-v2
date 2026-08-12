import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiCheckLine, RiImageAddLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { usePlaces } from '../../context/PlacesContext';
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import ZoomableImage from '../common/ZoomableImage';

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
  const { userProfile, appConfig } = useAuth();
  const maxImages = userProfile?.isAdmin ? appConfig?.imageUploadLimits?.admin ?? 30 : appConfig?.imageUploadLimits?.user ?? 30;

  const [formData, setFormData] = useState({
    category: initialCategory || 'ad',
    title: '',
    advertiserId: '',
    authorName: '',
    placeId: '',
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    location: '전체',
    content: '',
    images: [],
    isTicker: true
  });

  const [advertisers, setAdvertisers] = useState([]);
  const [selectableAdvertisers, setSelectableAdvertisers] = useState([]);
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cebugo_advertisers'), (snapshot) => {
      const advs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setAdvertisers(advs);
      
      if (userProfile?.isAdmin) {
        setSelectableAdvertisers(advs);
      } else {
        const myAdvs = advs.filter(a => a.googleEmail && a.googleEmail === userProfile?.email);
        setSelectableAdvertisers(myAdvs);
        
        // Auto-select if they only have one and no advertiser is selected yet
        if (myAdvs.length === 1 && !formData.advertiserId) {
          setFormData(prev => ({
            ...prev,
            advertiserId: myAdvs[0].id,
            authorName: myAdvs[0].name,
            placeId: myAdvs[0].placeId || ''
          }));
        }
      }
    });
    return () => unsub();
  }, [userProfile, formData.advertiserId]);

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
        advertiserId: editingPost.advertiserId || '',
        authorName: editingPost.authorName || editingPost.placeName || '',
        placeId: editingPost.placeId || '',
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

  const handleAdvertiserChange = (e) => {
    const advId = e.target.value;
    if (advId === 'manual') {
      setFormData(prev => ({
        ...prev,
        advertiserId: 'manual',
        authorName: '',
        placeId: ''
      }));
      return;
    }

    const selectedAdv = advertisers.find(a => a.id === advId);
    
    setFormData(prev => ({
      ...prev,
      advertiserId: advId,
      authorName: selectedAdv ? selectedAdv.name : '',
      placeId: selectedAdv ? (selectedAdv.placeId || '') : ''
    }));
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressCount, setUploadProgressCount] = useState(0);
  const isPendingSubmitRef = React.useRef(false);

  const doFinalSave = (currentFormData = formData) => {
    onSave({
      category: currentFormData.category || 'ad',
      title: currentFormData.title.trim(),
      advertiserId: currentFormData.advertiserId || '',
      authorName: currentFormData.authorName.trim(),
      date: currentFormData.date || new Date().toISOString().split('T')[0],
      startDate: currentFormData.startDate || '',
      endDate: currentFormData.endDate || '',
      location: currentFormData.location || '전체',
      content: currentFormData.content.trim(),
      images: currentFormData.images || [],
      isTicker: currentFormData.isTicker !== undefined ? currentFormData.isTicker : true
    });
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.images.length + files.length > maxImages) {
      alert(`이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다.`);
      return;
    }

    setIsUploading(true);
    setUploadProgressCount((prev) => prev + files.length);

    for (const file of files) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        if (compressed) {
          setFormData((prev) => {
            if (prev.images.length >= maxImages) return prev;
            const updatedImages = [...prev.images, compressed];
            const updated = { ...prev, images: updatedImages };
            
            if (isPendingSubmitRef.current) {
              setTimeout(() => {
                if (isPendingSubmitRef.current) {
                  isPendingSubmitRef.current = false;
                  alert('✅ 사진 업로드가 완료되어 게시물 저장을 완료했습니다!');
                  doFinalSave(updated);
                }
              }, 300);
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('Image compression error:', err);
      } finally {
        setUploadProgressCount((prev) => Math.max(0, prev - 1));
      }
    }
    setIsUploading(false);
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
    if (!formData.advertiserId) {
      alert('광고주(업체)를 선택해 주세요.');
      return;
    }
    if (formData.advertiserId === 'manual' && !formData.authorName.trim()) {
      alert('직접 입력할 업체명을 입력해 주세요.');
      return;
    }
    if (!formData.content.trim()) {
      alert('본문 내용을 입력해 주세요.');
      return;
    }

    if (isUploading || uploadProgressCount > 0) {
      isPendingSubmitRef.current = true;
      alert(`📷 사진을 백그라운드로 업로드 중입니다 (${uploadProgressCount > 0 ? uploadProgressCount + '개 남아있음' : '처리 중'}).\n업로드가 완료되면 자동으로 저장 및 반영됩니다!`);
      return;
    }

    doFinalSave(formData);
  };

  return createPortal(
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
                <label className="form-label">광고주(업체) 선택 *</label>
                <select
                  value={formData.advertiserId || ''}
                  onChange={handleAdvertiserChange}
                  className="form-select"
                  required
                >
                  <option value="">광고주 선택</option>
                  {userProfile?.isAdmin && <option value="manual">미등록 업체 (직접 입력)</option>}
                  {selectableAdvertisers.map(adv => (
                    <option key={adv.id} value={adv.id}>{adv.name}</option>
                  ))}
                </select>
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

            {formData.advertiserId === 'manual' && (
              <div className="form-group-row" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">업체명 직접 입력 *</label>
                  <input
                    type="text"
                    placeholder="업체명을 입력해주세요"
                    value={formData.authorName || ''}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '12px' }}>
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
                <label className="form-label">이미지 첨부 ({formData.images.length} / {maxImages}개)</label>
                <span className="field-hint">최대 {maxImages}개 파일 첨부 가능</span>
              </div>

              <div className="image-upload-wrapper">
                {formData.images.length < maxImages && (
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
                    <ZoomableImage
                      src={imgUrl}
                      images={formData.images}
                      initialIndex={idx}
                      alt={`preview-${idx}`}
                      showZoomHint={false}
                    />
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
    </div>,
    document.body
  );
}
